import { HealthResponse, MessageResponse } from "../types/api";

export const getWelcomeMessage = (): MessageResponse => {
  return {
    message: "QRIS research backend is running",
  };
};

export const getHealthStatus = (): HealthResponse => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
};
