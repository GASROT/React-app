import type { Product, ProductCategory } from '@/features/catalog/data/products';
import type { OrderStatus } from '@/features/orders/data/orders';

import { apiRequest } from './api-client';
import { getAccessToken } from './auth-api';

export type AdminMetrics = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  averageTicket: number;
  productsInCatalog: number;
  lowStockProducts: number;
  inventoryValue: number;
  generatedAt: string;
};

export type AdminOrder = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  total: string | number;
  paymentMethod: string;
  shippingMethod: string;
  deliveryAddress: string;
  items: {
    quantity: number;
    product: {
      id: string;
      name: string;
      sku: string;
      packageSize: string;
    };
  }[];
};

export type CreateAdminProductPayload = Pick<
  Product,
  | 'name'
  | 'manufacturer'
  | 'sku'
  | 'subcategory'
  | 'dosage'
  | 'unit'
  | 'packageSize'
  | 'price'
  | 'stock'
  | 'technicalSheetUrl'
  | 'description'
  | 'application'
  | 'marker'
> & {
  category: ProductCategory;
  pmf?: number;
};

function adminHeaders(): Record<string, string> {
  const token = getAccessToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAdminMetrics() {
  return apiRequest<AdminMetrics>('/admin/metrics', {
    headers: adminHeaders(),
  });
}

export function listAdminOrders() {
  return apiRequest<AdminOrder[]>('/admin/orders', {
    headers: adminHeaders(),
  });
}

export function createAdminProduct(payload: CreateAdminProductPayload) {
  return apiRequest<Product>('/admin/products', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
}

export function updateAdminOrderStatus(orderId: string, status: OrderStatus) {
  return apiRequest<AdminOrder>(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
}
