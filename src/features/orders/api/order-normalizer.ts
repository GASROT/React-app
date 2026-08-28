import type { Product } from '@/features/catalog/data/products';
import type { Order, OrderStatus } from '@/features/orders/data/orders';

type LegacyOrderItem = {
  product?: Product;
  quantity?: number;
  unitPrice?: number;
};

type OrderLike = Partial<Order> & {
  items?: LegacyOrderItem[];
  deliveryCep?: string;
};

const validStatuses: OrderStatus[] = [
  'PENDENTE',
  'CONFIRMADO',
  'SEPARANDO',
  'ENVIADO',
  'ENTREGUE',
  'CANCELADO',
];

export function normalizeOrder(value: unknown): Order {
  const order = isRecord(value) ? (value as OrderLike) : {};
  const products =
    order.products ??
    order.items
      ?.filter((item): item is Required<LegacyOrderItem> => Boolean(item.product))
      .map((item) => ({
        product: item.product,
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? item.product.price,
      })) ??
    [];

  const subtotal =
    order.subtotal ??
    products.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = order.discount ?? 0;
  const shipping = order.shipping ?? 0;

  return {
    id: order.id ?? 'PEDIDO-PENDENTE',
    status: validStatuses.includes(order.status as OrderStatus)
      ? (order.status as OrderStatus)
      : 'PENDENTE',
    date: order.date ?? new Intl.DateTimeFormat('pt-BR').format(new Date()),
    paymentMethod: order.paymentMethod ?? 'pix',
    shippingMethod: order.shippingMethod ?? 'PAC Rural',
    deliveryAddress: order.deliveryAddress ?? order.deliveryCep ?? 'Endereco nao informado',
    tracking: order.tracking ?? 'Aguardando coleta',
    subtotal,
    discount,
    shipping,
    total: order.total ?? subtotal - discount + shipping,
    products,
  };
}

export function normalizeOrders(orders: unknown[]): Order[] {
  return orders.map(normalizeOrder);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
