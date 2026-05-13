import dotenv from "dotenv";

dotenv.config();

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const defaultPort = 3000;
const parsedPort = Number(process.env.PORT);

export const env = {
  port: Number.isNaN(parsedPort) ? defaultPort : parsedPort,
  nodeEnv: process.env.NODE_ENV ?? "development",
  orderKuotaUsername:
    process.env.ORDERKUOTA_USERNAME?.trim() ??
    process.env.OK_USERNAME?.trim() ??
    process.env.ORKUT_USERNAME?.trim() ??
    "",
  orderKuotaPassword:
    process.env.ORDERKUOTA_PASSWORD?.trim() ??
    process.env.OK_PASSWORD?.trim() ??
    process.env.ORKUT_PASSWORD?.trim() ??
    "",
  orderKuotaToken:
    process.env.ORDERKUOTA_TOKEN?.trim() ??
    process.env.OK_TOKEN?.trim() ??
    "",
  qrisStatic:
    process.env.QRIS_STATIC?.trim() ??
    process.env.QRIS_STATIC_STRING?.trim() ??
    process.env.OK_QRIS_STATIC?.trim() ??
    "",
};
