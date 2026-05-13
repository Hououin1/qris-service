"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const orderRoutes_1 = __importDefault(require("./orderRoutes"));
const paymentCheckerRoutes_1 = __importDefault(require("./paymentCheckerRoutes"));
const paymentRoutes_1 = __importDefault(require("./paymentRoutes"));
const orderController_1 = require("../controllers/orderController");
const qrisRouter = (0, express_1.Router)();
qrisRouter.use("/auth", authRoutes_1.default);
qrisRouter.use("/payment", paymentRoutes_1.default);
qrisRouter.use("/order", orderRoutes_1.default);
qrisRouter.get("/orders", orderController_1.getOrdersHandler);
qrisRouter.use("/checker", paymentCheckerRoutes_1.default);
exports.default = qrisRouter;
