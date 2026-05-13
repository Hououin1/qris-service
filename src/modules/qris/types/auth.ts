export interface VerifyOtpRequestBody {
  otp: string;
}

export interface RequestOtpResponse {
  success: true;
  data: unknown;
}

export interface AuthUser {
  id?: string;
  name?: string;
  username?: string;
  balance?: string;
}

export interface VerifyOtpResponse {
  success: true;
  token: string;
  user: AuthUser;
}

export interface AuthStatusResponse {
  hasToken: boolean;
  token: string | null;
}

export interface FailedOrderKuotaResponse {
  success: false;
  message: string;
  author?: string;
}

export type SuccessfulTokenResponse = {
  token: string;
  id?: string;
  name?: string;
  username?: string;
  balance?: string;
};
