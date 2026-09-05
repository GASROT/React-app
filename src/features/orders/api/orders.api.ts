import { apiRequest } from '@/shared/services/api/api-client';
import { normalizeOrder, normalizeOrders } from './order-normalizer';

export function listOrders() {
  return apiRequest<unknown[]>('/orders').then((orders) =>
    normalizeOrders(Array.isArray(orders) ? orders : []),
  );
}

export function getOrder(id: string) {
  return apiRequest<unknown>(`/orders/${encodeURIComponent(id)}`).then(normalizeOrder);
}
