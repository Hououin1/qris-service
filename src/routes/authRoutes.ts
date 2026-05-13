import { Router } from "express";

import {
  authStatusHandler,
  requestOtpHandler,
  verifyOtpHandler,
} from "../controllers/authController";

const authRouter = Router();

authRouter.get("/status", authStatusHandler);
authRouter.post("/request-otp", requestOtpHandler);
authRouter.post("/verify-otp", verifyOtpHandler);

export default authRouter;
