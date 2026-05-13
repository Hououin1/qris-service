import { Router } from "express";

import authRouter from "./authRoutes";
import orderRouter from "./orderRoutes";
import paymentCheckerRouter from "./paymentCheckerRoutes";
import paymentRouter from "./paymentRoutes";
import { getOrdersHandler } from "../controllers/orderController";

const qrisRouter = Router();

qrisRouter.use("/auth", authRouter);
qrisRouter.use("/payment", paymentRouter);
qrisRouter.use("/order", orderRouter);
qrisRouter.get("/orders", getOrdersHandler);
qrisRouter.use("/checker", paymentCheckerRouter);

export default qrisRouter;
