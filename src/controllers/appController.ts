import { Request, Response } from "express";

import { hasSavedAuthToken } from "../services/orderkuota.service";
import { getAllOrders } from "../store/orderStore";
import { getHealthStatus, getWelcomeMessage } from "../services/appService";
import { DebugEnvResponse, HealthResponse, MessageResponse } from "../types/api";
import { env } from "../utils/env";

interface DebugStorageResponse {
  auth_saved: boolean;
  orders_count: number;
}

export const getHome = (
  _request: Request,
  response: Response<MessageResponse>,
): void => {
  response.json(getWelcomeMessage());
};

export const getHealth = (
  _request: Request,
  response: Response<HealthResponse>,
): void => {
  response.json(getHealthStatus());
};

export const getDebugEnv = (
  _request: Request,
  response: Response<DebugEnvResponse>,
): void => {
  response.json({
    username: env.orderKuotaUsername,
    passwordLength: env.orderKuotaPassword.length,
  });
};

export const getDebugStorage = async (
  _request: Request,
  response: Response<DebugStorageResponse>,
): Promise<void> => {
  response.json({
    auth_saved: await hasSavedAuthToken(),
    orders_count: getAllOrders().length,
  });
};
