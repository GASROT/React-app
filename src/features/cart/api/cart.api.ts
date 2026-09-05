import type { Product } from '@/features/catalog/data/products';
import { apiRequest } from '@/shared/services/api/api-client';

export type CartResponse = {
  items: {
    productId: string;
    quantity: number;
    product: Product;
    lineTotal: number;
    warning: string | null;
  }[];
  summary: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
};

export function getCart() {
  return apiRequest<CartResponse>('/cart');
}

export function addCartItem(productId: string, quantity = 1) {
  return apiRequest<CartResponse>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateCartItem(productId: string, quantity: number) {
  return apiRequest<CartResponse>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(productId: string) {
  return apiRequest<CartResponse>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}
