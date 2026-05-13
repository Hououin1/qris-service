import { ErrorRequestHandler } from "express";

import { AppError } from "./appError";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });

    return;
  }

  console.error("Unexpected error:", error);

  response.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
