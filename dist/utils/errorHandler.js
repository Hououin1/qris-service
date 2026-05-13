"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const appError_1 = require("./appError");
const errorHandler = (error, _request, response, _next) => {
    if (error instanceof appError_1.AppError) {
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
exports.errorHandler = errorHandler;
