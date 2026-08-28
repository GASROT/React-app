import type { Product } from '@/features/catalog/data/products';

export type OrderStatus =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'SEPARANDO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO';

export type Order = {
  id: string;
  status: OrderStatus;
  date: string;
  paymentMethod: string;
  shippingMethod: string;
  deliveryAddress: string;
  tracking: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  products: {
    product: Product;
    quantity: number;
    unitPrice: number;
  }[];
};
