"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrder = exports.getAllOrders = exports.getOrderById = exports.saveOrder = exports.loadOrders = exports.generateOrderId = void 0;
const node_path_1 = require("node:path");
const jsonStorage_1 = require("../utils/jsonStorage");
const orders = new Map();
const ORDERS_FILE_PATH = (0, node_path_1.join)(process.cwd(), "src", "data", "orders.json");
let dailySequence = 0;
let currentDateKey = "";
const pad = (value, length) => {
    return value.toString().padStart(length, "0");
};
const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1, 2);
    const day = pad(date.getDate(), 2);
    return `${year}${month}${day}`;
};
const generateOrderId = (date = new Date()) => {
    const dateKey = getDateKey(date);
    if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        dailySequence = 0;
    }
    dailySequence += 1;
    return `INV-${dateKey}-${pad(dailySequence, 4)}`;
};
exports.generateOrderId = generateOrderId;
const persistOrders = async () => {
    await (0, jsonStorage_1.saveJson)(ORDERS_FILE_PATH, (0, exports.getAllOrders)());
};
const loadOrders = async () => {
    const savedOrders = await (0, jsonStorage_1.loadJson)(ORDERS_FILE_PATH, []);
    orders.clear();
    for (const order of savedOrders) {
        orders.set(order.order_id, order);
    }
};
exports.loadOrders = loadOrders;
const saveOrder = async (order) => {
    orders.set(order.order_id, order);
    await persistOrders();
    return order;
};
exports.saveOrder = saveOrder;
const getOrderById = (orderId) => {
    return orders.get(orderId);
};
exports.getOrderById = getOrderById;
const getAllOrders = () => {
    return Array.from(orders.values());
};
exports.getAllOrders = getAllOrders;
const updateOrder = async (order) => {
    orders.set(order.order_id, order);
    await persistOrders();
    return order;
};
exports.updateOrder = updateOrder;
