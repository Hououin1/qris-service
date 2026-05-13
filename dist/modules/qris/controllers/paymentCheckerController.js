"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopPaymentCheckerHandler = exports.startPaymentCheckerHandler = exports.getPaymentCheckerStatusHandler = exports.runPaymentCheckerOnceHandler = void 0;
const paymentChecker_service_1 = require("../services/paymentChecker.service");
const runPaymentCheckerOnceHandler = async (_request, response, next) => {
    try {
        const result = await (0, paymentChecker_service_1.runPaymentCheckerOnce)();
        response.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.runPaymentCheckerOnceHandler = runPaymentCheckerOnceHandler;
const getPaymentCheckerStatusHandler = (_request, response) => {
    response.json((0, paymentChecker_service_1.getCheckerStatus)());
};
exports.getPaymentCheckerStatusHandler = getPaymentCheckerStatusHandler;
const startPaymentCheckerHandler = (_request, response) => {
    response.json((0, paymentChecker_service_1.startChecker)());
};
exports.startPaymentCheckerHandler = startPaymentCheckerHandler;
const stopPaymentCheckerHandler = (_request, response) => {
    response.json((0, paymentChecker_service_1.stopChecker)());
};
exports.stopPaymentCheckerHandler = stopPaymentCheckerHandler;
