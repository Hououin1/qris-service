import { Router } from "express";

import {
  getPaymentCheckerStatusHandler,
  runPaymentCheckerOnceHandler,
  startPaymentCheckerHandler,
  stopPaymentCheckerHandler,
} from "../controllers/paymentCheckerController";

const paymentCheckerRouter = Router();

paymentCheckerRouter.post("/run-once", runPaymentCheckerOnceHandler);
paymentCheckerRouter.post("/start", startPaymentCheckerHandler);
paymentCheckerRouter.post("/stop", stopPaymentCheckerHandler);
paymentCheckerRouter.get("/status", getPaymentCheckerStatusHandler);

export default paymentCheckerRouter;
