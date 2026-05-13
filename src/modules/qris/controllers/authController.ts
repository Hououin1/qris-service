import { Request, Response, NextFunction } from "express";

import { ErrorResponse } from "../types/api";
import { AuthStatusResponse, RequestOtpResponse, VerifyOtpRequestBody, VerifyOtpResponse } from "../types/auth";
import { getAuthStatus, requestOtp, verifyOtp } from "../services/orderkuota.service";

export const requestOtpHandler = async (
  _request: Request,
  response: Response<RequestOtpResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await requestOtp();
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtpHandler = async (
  request: Request<unknown, VerifyOtpResponse | ErrorResponse, VerifyOtpRequestBody>,
  response: Response<VerifyOtpResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await verifyOtp(request.body?.otp ?? "");
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const authStatusHandler = async (
  _request: Request,
  response: Response<AuthStatusResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getAuthStatus();
    response.json(result);
  } catch (error) {
    next(error);
  }
};
