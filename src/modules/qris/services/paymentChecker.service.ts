import { getHistory, getHistoryResults } from "./orderkuota.service";
import {
  getAllOrders,
  Order,
  updateOrder,
} from "../store/orderStore";

export interface CheckerRunOnceResponse {
  success: true;
  checked_orders: number;
  paid_orders: Order[];
  expired_orders: Order[];
}

export interface CheckerStatusResponse {
  running: boolean;
  interval_ms: number;
  pending_orders: number;
  paid_orders: number;
  expired_orders: number;
}

export interface CheckerControlResponse {
  success: true;
  status: CheckerStatusResponse;
}

const CHECKER_INTERVAL_MS = 10_000;
let checkerInterval: ReturnType<typeof setInterval> | null = null;
let checkerInProgress = false;

const normalizeCreditAmount = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .trim()
    .replace(/\./g, "")
    .replace(/,/g, "");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : undefined;
};

const getTransactionStatus = (transaction: unknown): string | undefined => {
  if (!transaction || typeof transaction !== "object") {
    return undefined;
  }

  const candidate = transaction as {
    status?: unknown;
    type?: unknown;
    mutation?: unknown;
  };
  const status = candidate.status ?? candidate.type ?? candidate.mutation;

  return typeof status === "string" ? status.toUpperCase() : undefined;
};

const getTransactionCredit = (transaction: unknown): number | undefined => {
  if (!transaction || typeof transaction !== "object") {
    return undefined;
  }

  const candidate = transaction as {
    kredit?: unknown;
    credit?: unknown;
    amount?: unknown;
    nominal?: unknown;
  };

  return normalizeCreditAmount(
    candidate.kredit ??
      candidate.credit ??
      candidate.amount ??
      candidate.nominal,
  );
};

const isMatchingTransaction = (order: Order, transaction: unknown): boolean => {
  const status = getTransactionStatus(transaction);
  const credit = getTransactionCredit(transaction);

  return status === "IN" && credit === order.amount;
};

const isOrderExpired = (order: Order, now: number): boolean => {
  if (typeof order.expired_at !== "number") {
    return false;
  }

  return now >= order.expired_at * 1000;
};

const expirePendingOrders = async (orders: Order[], now: number): Promise<Order[]> => {
  const expiredOrders: Order[] = [];

  for (const order of orders) {
    if (!isOrderExpired(order, now)) {
      continue;
    }

    order.status = "EXPIRED";
    expiredOrders.push(await updateOrder(order));
    console.log(`order expired: ${order.order_id}`);
  }

  return expiredOrders;
};

export const runPaymentCheckerOnce = async (): Promise<CheckerRunOnceResponse> => {
  const pendingOrders = getAllOrders().filter((order) => order.status === "PENDING");
  const expiredOrders = await expirePendingOrders(pendingOrders, Date.now());
  const activePendingOrders = pendingOrders.filter((order) => order.status === "PENDING");
  const paidOrders: Order[] = [];

  if (activePendingOrders.length === 0) {
    return {
      success: true,
      checked_orders: pendingOrders.length,
      paid_orders: paidOrders,
      expired_orders: expiredOrders,
    };
  }

  const history = await getHistory();
  const transactions = getHistoryResults(history.data);

  for (const order of activePendingOrders) {
    const transaction = transactions.find((item) => isMatchingTransaction(order, item));

    if (!transaction) {
      continue;
    }

    order.status = "PAID";
    order.paid_at = Date.now();
    order.transaction = transaction;
    paidOrders.push(await updateOrder(order));
    console.log(`order paid: ${order.order_id}`);
  }

  return {
    success: true,
    checked_orders: pendingOrders.length,
    paid_orders: paidOrders,
    expired_orders: expiredOrders,
  };
};

export const getCheckerStatus = (): CheckerStatusResponse => {
  const orders = getAllOrders();

  return {
    running: checkerInterval !== null,
    interval_ms: CHECKER_INTERVAL_MS,
    pending_orders: orders.filter((order) => order.status === "PENDING").length,
    paid_orders: orders.filter((order) => order.status === "PAID").length,
    expired_orders: orders.filter((order) => order.status === "EXPIRED").length,
  };
};

export const startChecker = (): CheckerControlResponse => {
  if (checkerInterval) {
    return {
      success: true,
      status: getCheckerStatus(),
    };
  }

  checkerInterval = setInterval(() => {
    if (checkerInProgress) {
      return;
    }

    checkerInProgress = true;
    runPaymentCheckerOnce()
      .catch((error: unknown) => {
        console.error("checker error:", error);
      })
      .finally(() => {
        checkerInProgress = false;
      });
  }, CHECKER_INTERVAL_MS);

  console.log("checker started");

  return {
    success: true,
    status: getCheckerStatus(),
  };
};

export const stopChecker = (): CheckerControlResponse => {
  if (checkerInterval) {
    clearInterval(checkerInterval);
    checkerInterval = null;
    console.log("checker stopped");
  }

  return {
    success: true,
    status: getCheckerStatus(),
  };
};
