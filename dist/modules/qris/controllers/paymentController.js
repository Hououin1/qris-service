"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatusHandler = exports.getHistoryHandler = exports.getBalanceHandler = exports.createPaymentHandler = void 0;
const orderkuota_service_1 = require("../services/orderkuota.service");
const appError_1 = require("../utils/appError");
const toPublicPaymentStatus = (status) => {
    if (status === "PENDING") {
        return "UNPAID";
    }
    return status;
};
const createPaymentHandler = async (request, response, next) => {
    try {
        const { amount } = request.body ?? {};
        if (typeof amount !== "number" || Number.isNaN(amount)) {
            throw new appError_1.AppError("amount must be a number", 400);
        }
        if (amount < 1000) {
            throw new appError_1.AppError("amount must be at least 1000", 400);
        }
        const result = await (0, orderkuota_service_1.generatePayment)(amount);
        response.json({
            success: true,
            data: result.data,
            payment: result.payment,
            raw: result.raw,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createPaymentHandler = createPaymentHandler;
const getBalanceHandler = async (_request, response, next) => {
    try {
        const result = await (0, orderkuota_service_1.getBalance)();
        response.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getBalanceHandler = getBalanceHandler;
const getHistoryHandler = async (_request, response, next) => {
    try {
        const result = await (0, orderkuota_service_1.getHistory)();
        response.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getHistoryHandler = getHistoryHandler;
const getPaymentStatusHandler = async (request, response, next) => {
    try {
        const order = await (0, orderkuota_service_1.refreshPaymentStatus)(request.params.id);
        const status = toPublicPaymentStatus(order.status);
        response.json({
            success: true,
            data: {
                transaction_id: order.order_id,
                merchant_ref: order.order_id,
                amount: order.base_amount ?? order.amount,
                final_amount: order.final_amount ?? order.amount,
                status,
                expired_at: order.expired_at,
                paid_at: order.paid_at,
            },
            payment: {
                id: order.order_id,
                amount: order.amount,
                status,
                expired: order.expired_at,
            },
            order,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentStatusHandler = getPaymentStatusHandler;
