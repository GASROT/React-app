import { apiRequest } from '@/shared/services/api/api-client';
import type { Order } from '@/features/orders/data/orders';
import { normalizeOrder } from '@/features/orders/api/order-normalizer';

export type ConfirmOrderPayload = {
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  shippingMethod: string;
  deliveryCep: string;
  stripePaymentToken?: string;
  idempotencyKey?: string;
};

export type ConfirmOrderResponse = Order & {
  paymentInstructions?: unknown;
};

export function confirmOrder(payload: ConfirmOrderPayload) {
  return apiRequest<unknown>('/checkout/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((order) => normalizeOrder(order) as ConfirmOrderResponse);
}
