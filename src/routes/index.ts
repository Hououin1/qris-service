import { Router } from "express";

import { getDebugEnv, getDebugStorage, getHealth, getHome } from "../controllers/appController";
import { getOrdersHandler } from "../controllers/orderController";
import authRouter from "./authRoutes";
import orderRouter from "./orderRoutes";
import paymentCheckerRouter from "./paymentCheckerRoutes";
import paymentRouter from "./paymentRoutes";
import qrisRouter from "../modules/qris/routes";

const router = Router();

router.get("/", getHome);
router.get("/health", getHealth);
router.get("/debug/env", getDebugEnv);
router.get("/debug/storage", getDebugStorage);
router.use("/auth", authRouter);
router.use("/payment", paymentRouter);
router.use("/order", orderRouter);
router.use("/checker", paymentCheckerRouter);
router.get("/orders", getOrdersHandler);
router.use("/qris", qrisRouter);

export default router;
