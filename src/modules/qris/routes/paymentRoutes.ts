import { Router } from "express";

import {
  createPaymentHandler,
  getBalanceHandler,
  getHistoryHandler,
  getPaymentStatusHandler,
} from "../controllers/paymentController";

const paymentRouter = Router();

paymentRouter.post("/create", createPaymentHandler);
paymentRouter.get("/status/:id", getPaymentStatusHandler);
paymentRouter.get("/balance", getBalanceHandler);
paymentRouter.get("/history", getHistoryHandler);

export default paymentRouter;
