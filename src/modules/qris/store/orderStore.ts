import { join } from "node:path";

import { loadJson, saveJson } from "../utils/jsonStorage";

export type OrderStatus = "PENDING" | "PAID" | "EXPIRED";

export interface Order {
  order_id: string;
  payment_id?: number;
  amount: number;
  base_amount?: number;
  unique_suffix?: number;
  final_amount?: number;
  status: OrderStatus;
  created_at: number;
  expired_at?: number;
  qrcode_url?: string;
  raw_payment?: unknown;
  paid_at?: number;
  transaction?: unknown;
}

const orders = new Map<string, Order>();
const ORDERS_FILE_PATH = join(process.cwd(), "src", "data", "orders.json");
let dailySequence = 0;
let currentDateKey = "";

const pad = (value: number, length: number): string => {
  return value.toString().padStart(length, "0");
};

const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1, 2);
  const day = pad(date.getDate(), 2);

  return `${year}${month}${day}`;
};

export const generateOrderId = (date = new Date()): string => {
  const dateKey = getDateKey(date);

  if (dateKey !== currentDateKey) {
    currentDateKey = dateKey;
    dailySequence = 0;
  }

  dailySequence += 1;

  return `INV-${dateKey}-${pad(dailySequence, 4)}`;
};

const persistOrders = async (): Promise<void> => {
  await saveJson(ORDERS_FILE_PATH, getAllOrders());
};

export const loadOrders = async (): Promise<void> => {
  const savedOrders = await loadJson<Order[]>(ORDERS_FILE_PATH, []);

  orders.clear();

  for (const order of savedOrders) {
    orders.set(order.order_id, order);
  }
};

export const saveOrder = async (order: Order): Promise<Order> => {
  orders.set(order.order_id, order);
  await persistOrders();
  return order;
};

export const getOrderById = (orderId: string): Order | undefined => {
  return orders.get(orderId);
};

export const getAllOrders = (): Order[] => {
  return Array.from(orders.values());
};

export const updateOrder = async (order: Order): Promise<Order> => {
  orders.set(order.order_id, order);
  await persistOrders();
  return order;
};
