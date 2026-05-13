"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = exports.getWelcomeMessage = void 0;
const getWelcomeMessage = () => {
    return {
        message: "QRIS research backend is running",
    };
};
exports.getWelcomeMessage = getWelcomeMessage;
const getHealthStatus = () => {
    return {
        status: "ok",
        timestamp: new Date().toISOString(),
    };
};
exports.getHealthStatus = getHealthStatus;
