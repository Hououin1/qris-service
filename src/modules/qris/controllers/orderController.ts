import { NextFunction, Request, Response } from "express";

import { generatePayment } from "../services/orderkuota.service";
import {
  generateOrderId,
  getAllOrders,
  getOrderById,
  Order,
  saveOrder,
} from "../store/orderStore";
import { ErrorResponse } from "../types/api";
import { AppError } from "../utils/appError";

interface CreateOrderRequestBody {
  amount: number;
}

interface CreateOrderResponse {
  success: true;
  order: Order;
}

interface GetOrdersResponse {
  success: true;
  orders: Order[];
}

interface GetOrderParams {
  orderId: string;
}

interface GetOrderResponse {
  success: true;
  order: Order;
}

const normalizeNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  return undefined;
};

export const createOrderHandler = async (
  request: Request<unknown, CreateOrderResponse | ErrorResponse, CreateOrderRequestBody>,
  response: Response<CreateOrderResponse | ErrorResponse>,
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

    const orderId = generateOrderId();
    const paymentResult = await generatePayment(amount, {
      orderId,
      persist: false,
    });
    const order: Order = {
      order_id: orderId,
      payment_id: normalizeNumber(paymentResult.payment.id),
      amount: normalizeNumber(paymentResult.payment.amount) ?? amount,
      base_amount: amount,
      unique_suffix:
        typeof paymentResult.raw === "object" && paymentResult.raw !== null
          ? normalizeNumber((paymentResult.raw as { unique_suffix?: unknown }).unique_suffix)
          : undefined,
      final_amount: normalizeNumber(paymentResult.payment.amount),
      status: "PENDING",
      created_at: Date.now(),
      expired_at: normalizeNumber(paymentResult.payment.expired),
      qrcode_url: paymentResult.payment.qrcode_url,
      raw_payment: paymentResult.raw,
    };

    await saveOrder(order);

    response.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderHandler = (
  request: Request<GetOrderParams, GetOrderResponse | ErrorResponse>,
  response: Response<GetOrderResponse | ErrorResponse>,
  next: NextFunction,
): void => {
  try {
    const order = getOrderById(request.params.orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    response.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersHandler = (
  _request: Request,
  response: Response<GetOrdersResponse>,
): void => {
  response.json({
    success: true,
    orders: getAllOrders(),
  });
};
