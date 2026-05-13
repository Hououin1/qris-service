"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes"));
const orderkuota_service_1 = require("./services/orderkuota.service");
const orderStore_1 = require("./store/orderStore");
const errorHandler_1 = require("./utils/errorHandler");
const env_1 = require("./utils/env");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(routes_1.default);
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    await (0, orderkuota_service_1.loadSavedAuthToken)();
    await (0, orderStore_1.loadOrders)();
    app.listen(env_1.env.port, () => {
        console.log(`Server is running on port ${env_1.env.port} in ${env_1.env.nodeEnv} mode`);
    });
};
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
