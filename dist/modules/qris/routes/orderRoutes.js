"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const orderRouter = (0, express_1.Router)();
orderRouter.post("/create", orderController_1.createOrderHandler);
orderRouter.get("/:orderId", orderController_1.getOrderHandler);
exports.default = orderRouter;
