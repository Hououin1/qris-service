import { NextFunction, Request, Response } from "express";

import {
  CheckerControlResponse,
  CheckerRunOnceResponse,
  CheckerStatusResponse,
  getCheckerStatus,
  runPaymentCheckerOnce,
  startChecker,
  stopChecker,
} from "../services/paymentChecker.service";
import { ErrorResponse } from "../types/api";

export const runPaymentCheckerOnceHandler = async (
  _request: Request,
  response: Response<CheckerRunOnceResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await runPaymentCheckerOnce();
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPaymentCheckerStatusHandler = (
  _request: Request,
  response: Response<CheckerStatusResponse>,
): void => {
  response.json(getCheckerStatus());
};

export const startPaymentCheckerHandler = (
  _request: Request,
  response: Response<CheckerControlResponse>,
): void => {
  response.json(startChecker());
};

export const stopPaymentCheckerHandler = (
  _request: Request,
  response: Response<CheckerControlResponse>,
): void => {
  response.json(stopChecker());
};
