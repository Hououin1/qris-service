"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDebugStorage = exports.getDebugEnv = exports.getHealth = exports.getHome = void 0;
const orderkuota_service_1 = require("../services/orderkuota.service");
const orderStore_1 = require("../store/orderStore");
const appService_1 = require("../services/appService");
const env_1 = require("../utils/env");
const getHome = (_request, response) => {
    response.json((0, appService_1.getWelcomeMessage)());
};
exports.getHome = getHome;
const getHealth = (_request, response) => {
    response.json((0, appService_1.getHealthStatus)());
};
exports.getHealth = getHealth;
const getDebugEnv = (_request, response) => {
    response.json({
        username: env_1.env.orderKuotaUsername,
        passwordLength: env_1.env.orderKuotaPassword.length,
    });
};
exports.getDebugEnv = getDebugEnv;
const getDebugStorage = async (_request, response) => {
    response.json({
        auth_saved: await (0, orderkuota_service_1.hasSavedAuthToken)(),
        orders_count: (0, orderStore_1.getAllOrders)().length,
    });
};
exports.getDebugStorage = getDebugStorage;
