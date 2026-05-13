import { Router } from "express";

import {
  createOrderHandler,
  getOrderHandler,
} from "../controllers/orderController";

const orderRouter = Router();

orderRouter.post("/create", createOrderHandler);
orderRouter.get("/:orderId", getOrderHandler);

export default orderRouter;
