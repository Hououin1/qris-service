export interface CreatePaymentRequestBody {
  amount: number;
}

export interface PaymentDetails {
  id?: number | string;
  amount?: number;
  qrcode_url?: string;
  qr_string?: string;
  qr_image?: string;
  name?: string;
  status?: string;
  info?: string;
  date?: string;
  expired?: number | string;
}

export interface CreatePaymentData {
  transaction_id: string;
  merchant_ref: string;
  amount: number;
  final_amount: number;
  qris_string: string;
  qr_string: string;
  status: "UNPAID";
  expired_at: number;
  unique_suffix?: number;
  qrcode_url?: string;
}

export interface CreatePaymentResponse {
  success: true;
  data: CreatePaymentData;
  payment: PaymentDetails;
  raw: unknown;
}

export interface PaymentBalanceResponse {
  success: true;
  data: unknown;
}

export interface PaymentHistoryResponse {
  success: true;
  data: unknown;
}
