import type { Order } from '@/features/orders/data/orders';

let recentOrders: Order[] = [];

export function addRecentOrder(order: Order) {
  recentOrders = [order, ...recentOrders.filter((item) => item.id !== order.id)];
}

export function mergeRecentOrders(orders: Order[]) {
  const ids = new Set(orders.map((order) => order.id));
  return [...recentOrders.filter((order) => !ids.has(order.id)), ...orders];
}
