"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authStatusHandler = exports.verifyOtpHandler = exports.requestOtpHandler = void 0;
const orderkuota_service_1 = require("../services/orderkuota.service");
const requestOtpHandler = async (_request, response, next) => {
    try {
        const result = await (0, orderkuota_service_1.requestOtp)();
        response.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.requestOtpHandler = requestOtpHandler;
const verifyOtpHandler = async (request, response, next) => {
    try {
        const result = await (0, orderkuota_service_1.verifyOtp)(request.body?.otp ?? "");
        response.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.verifyOtpHandler = verifyOtpHandler;
const authStatusHandler = async (_request, response, next) => {
    try {
        const result = await (0, orderkuota_service_1.getAuthStatus)();
        response.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.authStatusHandler = authStatusHandler;
