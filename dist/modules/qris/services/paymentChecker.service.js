"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopChecker = exports.startChecker = exports.getCheckerStatus = exports.runPaymentCheckerOnce = void 0;
const orderkuota_service_1 = require("./orderkuota.service");
const orderStore_1 = require("../store/orderStore");
const CHECKER_INTERVAL_MS = 10000;
let checkerInterval = null;
let checkerInProgress = false;
const normalizeCreditAmount = (value) => {
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
const getTransactionStatus = (transaction) => {
    if (!transaction || typeof transaction !== "object") {
        return undefined;
    }
    const candidate = transaction;
    const status = candidate.status ?? candidate.type ?? candidate.mutation;
    return typeof status === "string" ? status.toUpperCase() : undefined;
};
const getTransactionCredit = (transaction) => {
    if (!transaction || typeof transaction !== "object") {
        return undefined;
    }
    const candidate = transaction;
    return normalizeCreditAmount(candidate.kredit ??
        candidate.credit ??
        candidate.amount ??
        candidate.nominal);
};
const isMatchingTransaction = (order, transaction) => {
    const status = getTransactionStatus(transaction);
    const credit = getTransactionCredit(transaction);
    return status === "IN" && credit === order.amount;
};
const isOrderExpired = (order, now) => {
    if (typeof order.expired_at !== "number") {
        return false;
    }
    return now >= order.expired_at * 1000;
};
const expirePendingOrders = async (orders, now) => {
    const expiredOrders = [];
    for (const order of orders) {
        if (!isOrderExpired(order, now)) {
            continue;
        }
        order.status = "EXPIRED";
        expiredOrders.push(await (0, orderStore_1.updateOrder)(order));
        console.log(`order expired: ${order.order_id}`);
    }
    return expiredOrders;
};
const runPaymentCheckerOnce = async () => {
    const pendingOrders = (0, orderStore_1.getAllOrders)().filter((order) => order.status === "PENDING");
    const expiredOrders = await expirePendingOrders(pendingOrders, Date.now());
    const activePendingOrders = pendingOrders.filter((order) => order.status === "PENDING");
    const paidOrders = [];
    if (activePendingOrders.length === 0) {
        return {
            success: true,
            checked_orders: pendingOrders.length,
            paid_orders: paidOrders,
            expired_orders: expiredOrders,
        };
    }
    const history = await (0, orderkuota_service_1.getHistory)();
    const transactions = (0, orderkuota_service_1.getHistoryResults)(history.data);
    for (const order of activePendingOrders) {
        const transaction = transactions.find((item) => isMatchingTransaction(order, item));
        if (!transaction) {
            continue;
        }
        order.status = "PAID";
        order.paid_at = Date.now();
        order.transaction = transaction;
        paidOrders.push(await (0, orderStore_1.updateOrder)(order));
        console.log(`order paid: ${order.order_id}`);
    }
    return {
        success: true,
        checked_orders: pendingOrders.length,
        paid_orders: paidOrders,
        expired_orders: expiredOrders,
    };
};
exports.runPaymentCheckerOnce = runPaymentCheckerOnce;
const getCheckerStatus = () => {
    const orders = (0, orderStore_1.getAllOrders)();
    return {
        running: checkerInterval !== null,
        interval_ms: CHECKER_INTERVAL_MS,
        pending_orders: orders.filter((order) => order.status === "PENDING").length,
        paid_orders: orders.filter((order) => order.status === "PAID").length,
        expired_orders: orders.filter((order) => order.status === "EXPIRED").length,
    };
};
exports.getCheckerStatus = getCheckerStatus;
const startChecker = () => {
    if (checkerInterval) {
        return {
            success: true,
            status: (0, exports.getCheckerStatus)(),
        };
    }
    checkerInterval = setInterval(() => {
        if (checkerInProgress) {
            return;
        }
        checkerInProgress = true;
        (0, exports.runPaymentCheckerOnce)()
            .catch((error) => {
            console.error("checker error:", error);
        })
            .finally(() => {
            checkerInProgress = false;
        });
    }, CHECKER_INTERVAL_MS);
    console.log("checker started");
    return {
        success: true,
        status: (0, exports.getCheckerStatus)(),
    };
};
exports.startChecker = startChecker;
const stopChecker = () => {
    if (checkerInterval) {
        clearInterval(checkerInterval);
        checkerInterval = null;
        console.log("checker stopped");
    }
    return {
        success: true,
        status: (0, exports.getCheckerStatus)(),
    };
};
exports.stopChecker = stopChecker;
