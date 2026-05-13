"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authRouter = (0, express_1.Router)();
authRouter.get("/status", authController_1.authStatusHandler);
authRouter.post("/request-otp", authController_1.requestOtpHandler);
authRouter.post("/verify-otp", authController_1.verifyOtpHandler);
exports.default = authRouter;
