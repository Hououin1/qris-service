import { NextFunction, Request, Response } from "express";

import { ErrorResponse } from "../types/api";
import {
  CreatePaymentRequestBody,
  CreatePaymentResponse,
  PaymentBalanceResponse,
  PaymentHistoryResponse,
} from "../types/payment";
import {
  generatePayment,
  getBalance,
  getHistory,
  refreshPaymentStatus,
} from "../services/orderkuota.service";
import { AppError } from "../utils/appError";

interface PaymentStatusParams {
  id: string;
}

const toPublicPaymentStatus = (status: string): string => {
  if (status === "PENDING") {
    return "UNPAID";
  }

  return status;
};

export const createPaymentHandler = async (
  request: Request<unknown, CreatePaymentResponse | ErrorResponse, CreatePaymentRequestBody>,
  response: Response<CreatePaymentResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { amount } = request.body ?? {};

    if (typeof amount !== "number" || Number.isNaN(amount)) {
      throw new AppError("amount must be a number", 400);
    }

    if (amount < 1000) {
      throw new AppError("amount must be at least 1000", 400);
    }

    const result = await generatePayment(amount);
    response.json({
      success: true,
      data: result.data,
      payment: result.payment,
      raw: result.raw,
    });
  } catch (error) {
    next(error);
  }
};

export const getBalanceHandler = async (
  _request: Request,
  response: Response<PaymentBalanceResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getBalance();
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const getHistoryHandler = async (
  _request: Request,
  response: Response<PaymentHistoryResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getHistory();
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPaymentStatusHandler = async (
  request: Request<PaymentStatusParams>,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await refreshPaymentStatus(request.params.id);
    const status = toPublicPaymentStatus(order.status);

    response.json({
      success: true,
      data: {
        transaction_id: order.order_id,
        merchant_ref: order.order_id,
        amount: order.base_amount ?? order.amount,
        final_amount: order.final_amount ?? order.amount,
        status,
        expired_at: order.expired_at,
        paid_at: order.paid_at,
      },
      payment: {
        id: order.order_id,
        amount: order.amount,
        status,
        expired: order.expired_at,
      },
      order,
    });
  } catch (error) {
    next(error);
  }
};
