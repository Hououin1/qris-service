import axios from "axios";
import qs from "qs";
import { join } from "node:path";

import {
  AuthStatusResponse,
  FailedOrderKuotaResponse,
  RequestOtpResponse,
  SuccessfulTokenResponse,
  VerifyOtpResponse,
} from "../types/auth";
import {
  CreatePaymentData,
  CreatePaymentResponse,
  PaymentBalanceResponse,
  PaymentDetails,
  PaymentHistoryResponse,
} from "../types/payment";
import { getAllOrders, Order, saveOrder, updateOrder } from "../store/orderStore";
import { AppError } from "../utils/appError";
import { env } from "../utils/env";
import { loadJson, saveJson } from "../utils/jsonStorage";

const OK_LOGIN_ENDPOINT = "https://app.orderkuota.com/api/v2/login";
const OK_GET_ENDPOINT = "https://app.orderkuota.com/api/v2/get";
const OK_HEADERS = {
  "User-Agent": "okhttp/4.12.0",
  Host: "app.orderkuota.com",
  "Content-Type": "application/x-www-form-urlencoded",
};
const OK_CONSTANTS = {
  app_reg_id: "e5aCENGrQOWvhQWYnv-uNc:APA91bFj3O_mv5Nf_2SM4Duz4Z8Ug3nBNaHlgodlY92CBuNIA9xmc0Dahev5xxqssPmnTdcie4mlhiG9ZAE1iCe1QbyhxcUyGXlenJxiUaXdfm1rklOEo9k",
  phone_uuid: "e5aCENGrQOWvhQWYnv-uNc",
  phone_model: "sdk_gphone64_x86_64",
  phone_android_version: "16",
  app_version_code: "250811",
  app_version_name: "25.08.11",
  ui_mode: "light",
};
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const EXPIRY_SECONDS = 10 * 60;
const AUTH_FILE_PATH = join(process.cwd(), "src", "data", "auth.json");

interface StoredAuth {
  token?: string;
}

let savedToken = env.orderKuotaToken;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < MAX_RETRIES - 1) {
        await sleep(2 ** attempt * 1000);
      }
    }
  }

  throw lastError;
};

const getUsername = (): string => {
  if (!env.orderKuotaUsername) {
    throw new AppError("ORDERKUOTA_USERNAME or OK_USERNAME is required", 500);
  }

  return env.orderKuotaUsername;
};

const getToken = (): string => {
  if (!savedToken) {
    throw new AppError("ORDERKUOTA_TOKEN or OK_TOKEN is required", 500);
  }

  return savedToken;
};

const getStaticQris = (): string | null => env.qrisStatic || null;

const postForm = async <T>(url: string, payload: Record<string, string | number>): Promise<T> => {
  return requestWithRetry(async () => {
    const response = await axios.post<T>(url, qs.stringify(payload), {
      headers: OK_HEADERS,
      timeout: TIMEOUT_MS,
    });

    return response.data;
  });
};

const crc16ccitt = (value: string): string => {
  let crc = 0xffff;

  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }

    crc &= 0xffff;
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
};

const parseTlv = (qris: string): Map<string, string> => {
  const result = new Map<string, string>();
  const withoutCrc = qris.endsWith("6304") ? qris : qris.slice(0, -8);
  let index = 0;

  while (index + 4 <= withoutCrc.length) {
    const tag = withoutCrc.slice(index, index + 2);
    const length = Number(withoutCrc.slice(index + 2, index + 4));

    if (!Number.isFinite(length) || length < 0) {
      break;
    }

    const valueStart = index + 4;
    const valueEnd = valueStart + length;

    if (valueEnd > withoutCrc.length) {
      break;
    }

    result.set(tag, withoutCrc.slice(valueStart, valueEnd));
    index = valueEnd;
  }

  return result;
};

const buildTlv = (tlv: Map<string, string>): string => {
  const tagOrder = ["00", "01", "26", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62"];
  const orderedEntries = tagOrder
    .filter((tag) => tlv.has(tag))
    .map((tag): [string, string] => [tag, tlv.get(tag) ?? ""]);
  const extraEntries = Array.from(tlv.entries()).filter(
    ([tag]) => tag !== "63" && !tagOrder.includes(tag),
  );

  return [...orderedEntries, ...extraEntries]
    .map(([tag, value]) => `${tag}${value.length.toString().padStart(2, "0")}${value}`)
    .join("");
};

const generateDynamicQris = (staticQris: string, amount: number): string => {
  const tlv = parseTlv(staticQris);

  tlv.set("01", "12");
  tlv.set("54", amount.toString());

  const withoutCrc = `${buildTlv(tlv)}6304`;
  return `${withoutCrc}${crc16ccitt(withoutCrc)}`;
};

const generateFallbackDynamicQris = (amount: number, cause?: unknown): string => {
  const staticQris = getStaticQris();

  if (!staticQris) {
    if (cause) {
      throw cause;
    }

    throw new AppError("QRIS data was not returned by OrderKuota", 502);
  }

  return generateDynamicQris(staticQris, amount);
};

const normalizeAmount = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const amount = Number(value.trim().replace(/\./g, "").replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : undefined;
};

const getTransactionStatus = (transaction: unknown): string | undefined => {
  if (!transaction || typeof transaction !== "object") {
    return undefined;
  }

  const candidate = transaction as { status?: unknown; type?: unknown; mutation?: unknown };
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

  return normalizeAmount(candidate.kredit ?? candidate.credit ?? candidate.amount ?? candidate.nominal);
};

const getObjectValue = (
  value: Record<string, unknown> | undefined,
  keys: string[],
): unknown => {
  if (!value) {
    return undefined;
  }

  for (const key of keys) {
    const candidate = value[key];

    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }

  return undefined;
};

const getNestedObject = (value: unknown): Record<string, unknown> | undefined => {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
};

const getQrisAjaibResult = (value: unknown): Record<string, unknown> | undefined => {
  const root = getNestedObject(value);
  const data = getNestedObject(root?.data);
  const qrisAjaib = getNestedObject(root?.qris_ajaib) ?? getNestedObject(data?.qris_ajaib);
  const qrisAjaibResult = getNestedObject(qrisAjaib?.results);

  return (
    qrisAjaibResult ??
    getNestedObject(root?.results) ??
    data ??
    root
  );
};

const extractQrString = (value: unknown): string | null => {
  const root = getNestedObject(value);
  const data = getNestedObject(root?.data);
  const result = getQrisAjaibResult(value);
  const qrValue =
    getObjectValue(result, ["qris_string", "qr_string", "qr_data", "qrcode", "qrcode_string"]) ??
    getObjectValue(data, ["qris_string", "qr_string", "qr_data", "qrcode", "qrcode_string"]) ??
    getObjectValue(root, ["qris_string", "qr_string", "qr_data", "qrcode", "qrcode_string"]);

  return typeof qrValue === "string" && qrValue.length > 0 ? qrValue : null;
};

const extractProviderPaymentDetails = (value: unknown): Partial<PaymentDetails> => {
  const result = getQrisAjaibResult(value);

  if (!result) {
    return {};
  }

  return {
    id: getObjectValue(result, ["id", "transaction_id", "trx_id"]) as string | number | undefined,
    qrcode_url: getObjectValue(result, ["qrcode_url", "qr_url", "qr_image"]) as string | undefined,
    name: getObjectValue(result, ["name", "merchant_name"]) as string | undefined,
    status: getObjectValue(result, ["status"]) as string | undefined,
    info: getObjectValue(result, ["info", "message"]) as string | undefined,
    date: getObjectValue(result, ["date", "created_at"]) as string | undefined,
    expired: getObjectValue(result, ["expired", "expired_at", "expires_at"]) as string | number | undefined,
  };
};

export const getHistoryResults = (history: unknown): unknown[] => {
  if (!history || typeof history !== "object") {
    return [];
  }

  const candidate = history as {
    qris_ajaib_history?: { results?: unknown };
    qris_history?: { results?: unknown };
    results?: unknown;
    data?: {
      qris_ajaib_history?: { results?: unknown };
      qris_history?: { results?: unknown };
      results?: unknown;
    };
  };
  const results =
    candidate.qris_ajaib_history?.results ??
    candidate.qris_history?.results ??
    candidate.data?.qris_ajaib_history?.results ??
    candidate.data?.qris_history?.results ??
    candidate.results ??
    candidate.data?.results;

  return Array.isArray(results) ? results : [];
};

const isMatchingTransaction = (order: Order, transaction: unknown): boolean => {
  return getTransactionStatus(transaction) === "IN" && getTransactionCredit(transaction) === order.amount;
};

const getAvailableUniqueAmount = (baseAmount: number): { uniqueSuffix: number; finalAmount: number } => {
  const pendingAmounts = new Set(
    getAllOrders()
      .filter((order) => order.status === "PENDING")
      .map((order) => order.amount),
  );

  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const finalAmount = baseAmount + suffix;

    if (!pendingAmounts.has(finalAmount)) {
      return { uniqueSuffix: suffix, finalAmount };
    }
  }

  throw new AppError("No available unique QRIS amount suffix", 409);
};

const buildPaymentDetails = (
  order: Order,
  qrisString: string,
  providerPayment: Partial<PaymentDetails> = {},
): PaymentDetails => {
  return {
    ...providerPayment,
    id: providerPayment.id ?? order.order_id,
    amount: order.amount,
    qrcode_url:
      providerPayment.qrcode_url ??
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrisString)}`,
    qr_string: qrisString,
    status: providerPayment.status ?? order.status,
    expired: providerPayment.expired ?? order.expired_at,
  };
};

const buildCreatePaymentData = (
  order: Order,
  qrisString: string,
  qrcodeUrl?: string,
): CreatePaymentData => {
  const baseAmount = order.base_amount ?? order.amount;
  const finalAmount = order.final_amount ?? order.amount;

  return {
    transaction_id: order.order_id,
    merchant_ref: order.order_id,
    amount: baseAmount,
    final_amount: finalAmount,
    qris_string: qrisString,
    qr_string: qrisString,
    status: "UNPAID",
    expired_at: order.expired_at ?? Math.floor(Date.now() / 1000) + EXPIRY_SECONDS,
    unique_suffix: order.unique_suffix,
    qrcode_url: qrcodeUrl,
  };
};

export const loadSavedAuthToken = async (): Promise<void> => {
  if (savedToken) {
    return;
  }

  const savedAuth = await loadJson<StoredAuth>(AUTH_FILE_PATH, {});
  savedToken = savedAuth.token ?? "";
};

export const hasSavedAuthToken = async (): Promise<boolean> => {
  if (savedToken) {
    return true;
  }

  const savedAuth = await loadJson<StoredAuth>(AUTH_FILE_PATH, {});
  return typeof savedAuth.token === "string" && savedAuth.token.length > 0;
};

export const requestOtp = async (): Promise<RequestOtpResponse> => {
  if (!env.orderKuotaPassword) {
    throw new AppError("ORDERKUOTA_PASSWORD or OK_PASSWORD is required", 500);
  }

  const result = await postForm<unknown>(OK_LOGIN_ENDPOINT, {
    username: getUsername(),
    password: env.orderKuotaPassword,
    ...OK_CONSTANTS,
  });

  return {
    success: true,
    data: result,
  };
};

export const verifyOtp = async (otp: string): Promise<VerifyOtpResponse> => {
  if (!otp.trim()) {
    throw new AppError("OTP is required", 400);
  }

  const result = await postForm<SuccessfulTokenResponse | FailedOrderKuotaResponse>(OK_LOGIN_ENDPOINT, {
    username: getUsername(),
    password: otp.trim(),
    ...OK_CONSTANTS,
  });

  if ("success" in result && result.success === false) {
    throw new AppError(result.message, 400, result);
  }

  if (!("token" in result) || typeof result.token !== "string" || !result.token) {
    throw new AppError("Token was not returned by OrderKuota", 502, result);
  }

  savedToken = result.token;
  await saveJson(AUTH_FILE_PATH, { token: result.token });

  return {
    success: true,
    token: result.token,
    user: {
      id: result.id,
      name: result.name,
      username: result.username,
      balance: result.balance,
    },
  };
};

export const getAuthStatus = async (): Promise<AuthStatusResponse> => {
  return {
    hasToken: await hasSavedAuthToken(),
    token: savedToken || null,
  };
};

export const generateQrisAjaib = async (
  username: string,
  token: string,
  amount: number,
): Promise<unknown> => {
  return postForm<unknown>(OK_GET_ENDPOINT, {
    ...OK_CONSTANTS,
    auth_username: username,
    auth_token: token,
    request_time: Date.now().toString(),
    "requests[qris_ajaib][amount]": amount.toString(),
  });
};

interface GeneratePaymentOptions {
  orderId?: string;
  persist?: boolean;
}

export const generatePayment = async (
  amount: number,
  options: GeneratePaymentOptions = {},
): Promise<CreatePaymentResponse> => {
  if (!Number.isFinite(amount)) {
    throw new AppError("amount must be a number", 400);
  }

  if (amount < 1000) {
    throw new AppError("amount must be at least 1000", 400);
  }

  const now = Date.now();
  const { uniqueSuffix, finalAmount } = getAvailableUniqueAmount(amount);
  let rawPayment: unknown;
  let qrisString: string | null = null;
  let providerPayment: Partial<PaymentDetails> = {};

  try {
    rawPayment = await generateQrisAjaib(getUsername(), getToken(), finalAmount);
    qrisString = extractQrString(rawPayment);
    providerPayment = extractProviderPaymentDetails(rawPayment);

    if (!qrisString) {
      qrisString = generateFallbackDynamicQris(finalAmount);
    }
  } catch (error) {
    qrisString = generateFallbackDynamicQris(finalAmount, error);
    rawPayment = {
      provider_error: error instanceof Error ? error.message : String(error),
      fallback: "QRIS_STATIC",
    };
  }

  const providerExpiredAt = normalizeAmount(providerPayment.expired);
  const expiredAt = providerExpiredAt ?? Math.floor(now / 1000) + EXPIRY_SECONDS;
  const order: Order = {
    order_id: options.orderId ?? `QRIS-${now}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
    amount: finalAmount,
    base_amount: amount,
    unique_suffix: uniqueSuffix,
    final_amount: finalAmount,
    status: "PENDING",
    created_at: now,
    expired_at: expiredAt,
    raw_payment: {
      base_amount: amount,
      unique_suffix: uniqueSuffix,
      final_amount: finalAmount,
      qris_string: qrisString,
      provider_response: rawPayment,
    },
  };
  const payment = buildPaymentDetails(order, qrisString, providerPayment);
  const data = buildCreatePaymentData(order, qrisString, payment.qrcode_url);

  order.qrcode_url = payment.qrcode_url;

  if (options.persist ?? true) {
    await saveOrder(order);
  }

  return {
    success: true,
    data,
    payment,
    raw: {
      ...(typeof order.raw_payment === "object" && order.raw_payment !== null ? order.raw_payment : {}),
      transaction_id: data.transaction_id,
      merchant_ref: data.merchant_ref,
      amount: data.amount,
      final_amount: data.final_amount,
      qris_string: data.qris_string,
      qr_string: data.qr_string,
      status: data.status,
      expired_at: data.expired_at,
    },
  };
};

export const getHistory = async (): Promise<PaymentHistoryResponse> => {
  const token = getToken();
  const tokenId = token.split(":")[0];
  const historyType = "qris_history";
  const result = await postForm<unknown>(`https://app.orderkuota.com/api/v2/qris/mutasi/${tokenId}`, {
    app_reg_id: OK_CONSTANTS.app_reg_id,
    phone_uuid: OK_CONSTANTS.phone_uuid,
    phone_model: OK_CONSTANTS.phone_model,
    [`requests[${historyType}][keterangan]`]: "",
    [`requests[${historyType}][jumlah]`]: "",
    request_time: Date.now().toString(),
    phone_android_version: OK_CONSTANTS.phone_android_version,
    app_version_code: OK_CONSTANTS.app_version_code,
    auth_username: getUsername(),
    [`requests[${historyType}][page]`]: "1",
    auth_token: token,
    app_version_name: OK_CONSTANTS.app_version_name,
    ui_mode: OK_CONSTANTS.ui_mode,
    [`requests[${historyType}][dari_tanggal]`]: "",
    "requests[0]": "account",
    [`requests[${historyType}][ke_tanggal]`]: "",
  });

  return {
    success: true,
    data: result,
  };
};

export const getBalance = async (): Promise<PaymentBalanceResponse> => {
  const token = getToken();
  const tokenId = token.split(":")[0];
  const result = await postForm<unknown>(`https://app.orderkuota.com/api/v2/qris/menu/${tokenId}`, {
    request_time: Date.now().toString(),
    app_reg_id: OK_CONSTANTS.app_reg_id,
    phone_android_version: OK_CONSTANTS.phone_android_version,
    app_version_code: OK_CONSTANTS.app_version_code,
    phone_uuid: OK_CONSTANTS.phone_uuid,
    auth_username: getUsername(),
    "requests[1]": "qris_menu",
    auth_token: token,
    app_version_name: OK_CONSTANTS.app_version_name,
    ui_mode: OK_CONSTANTS.ui_mode,
    "requests[0]": "account",
    phone_model: OK_CONSTANTS.phone_model,
  });

  return {
    success: true,
    data: result,
  };
};

export const refreshPaymentStatus = async (orderId: string): Promise<Order> => {
  const order = getAllOrders().find((item) => item.order_id === orderId || String(item.payment_id) === orderId);

  if (!order) {
    throw new AppError("Payment not found", 404);
  }

  if (order.status !== "PENDING") {
    return order;
  }

  if (typeof order.expired_at === "number" && Date.now() >= order.expired_at * 1000) {
    order.status = "EXPIRED";
    return updateOrder(order);
  }

  const history = await getHistory();
  const transaction = getHistoryResults(history.data).find((item) => isMatchingTransaction(order, item));

  if (transaction) {
    order.status = "PAID";
    order.paid_at = Date.now();
    order.transaction = transaction;
    return updateOrder(order);
  }

  return order;
};
