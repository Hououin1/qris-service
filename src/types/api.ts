export interface MessageResponse {
  message: string;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface DebugEnvResponse {
  username: string;
  passwordLength: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  details?: unknown;
}
