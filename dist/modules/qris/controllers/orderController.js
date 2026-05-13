"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersHandler = exports.getOrderHandler = exports.createOrderHandler = void 0;
const orderkuota_service_1 = require("../services/orderkuota.service");
const orderStore_1 = require("../store/orderStore");
const appError_1 = require("../utils/appError");
const normalizeNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : undefined;
    }
    return undefined;
};
const createOrderHandler = async (request, response, next) => {
    try {
        const { amount } = request.body ?? {};
        if (typeof amount !== "number" || Number.isNaN(amount)) {
            throw new appError_1.AppError("amount must be a number", 400);
        }
        if (amount < 1000) {
            throw new appError_1.AppError("amount must be at least 1000", 400);
        }
        const orderId = (0, orderStore_1.generateOrderId)();
        const paymentResult = await (0, orderkuota_service_1.generatePayment)(amount, {
            orderId,
            persist: false,
        });
        const order = {
            order_id: orderId,
            payment_id: normalizeNumber(paymentResult.payment.id),
            amount: normalizeNumber(paymentResult.payment.amount) ?? amount,
            base_amount: amount,
            unique_suffix: typeof paymentResult.raw === "object" && paymentResult.raw !== null
                ? normalizeNumber(paymentResult.raw.unique_suffix)
                : undefined,
            final_amount: normalizeNumber(paymentResult.payment.amount),
            status: "PENDING",
            created_at: Date.now(),
            expired_at: normalizeNumber(paymentResult.payment.expired),
            qrcode_url: paymentResult.payment.qrcode_url,
            raw_payment: paymentResult.raw,
        };
        await (0, orderStore_1.saveOrder)(order);
        response.json({
            success: true,
            order,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createOrderHandler = createOrderHandler;
const getOrderHandler = (request, response, next) => {
    try {
        const order = (0, orderStore_1.getOrderById)(request.params.orderId);
        if (!order) {
            throw new appError_1.AppError("Order not found", 404);
        }
        response.json({
            success: true,
            order,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderHandler = getOrderHandler;
const getOrdersHandler = (_request, response) => {
    response.json({
        success: true,
        orders: (0, orderStore_1.getAllOrders)(),
    });
};
exports.getOrdersHandler = getOrdersHandler;
