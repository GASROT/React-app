import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useSyncExternalStore, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listOrders } from '@/features/orders/api/orders.api';
import type { Order, OrderStatus } from '@/features/orders/data/orders';
import { mergeRecentOrders } from '@/features/orders/store/recent-orders.store';
import {
  listAdminOrders,
  updateAdminOrderStatus,
  type AdminOrder,
} from '@/shared/services/api/admin-api';
import { ProductThumbnail } from '@/shared/components/product-thumbnail';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

const statusColors: Record<string, string> = {
  PENDENTE: Colors.text.muted,
  CONFIRMADO: Colors.accent.primary,
  SEPARANDO: Colors.brand.cyan,
  ENVIADO: Colors.feedback.warning,
  ENTREGUE: Colors.feedback.success,
  CANCELADO: Colors.feedback.error,
};

const nextStatusByCurrent: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDENTE: 'CONFIRMADO',
  CONFIRMADO: 'SEPARANDO',
  SEPARANDO: 'ENVIADO',
  ENVIADO: 'ENTREGUE',
};

export function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ finalizedOrderId?: string }>();
  const user = useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);
  const isAdmin = user?.role === 'ADMIN';
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      if (!user) {
        setError(null);
        setMessage(null);
        setOrderList([]);
        setLoading(false);
        return undefined;
      }

      setLoading(true);
      const request = isAdmin
        ? listAdminOrders().then((orders) => orders.map(mapAdminOrder))
        : listOrders().then(mergeRecentOrders);

      request
        .then((response) => {
          if (!mounted) return;
          setError(null);
          setMessage(null);
          setOrderList(response);
          setLoading(false);
        })
        .catch(() => {
          if (!mounted) return;
          setError(
            isAdmin
              ? 'Nao foi possivel carregar os pedidos administrativos.'
              : 'Nao foi possivel carregar os pedidos pela API.',
          );
          setOrderList([]);
          setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [isAdmin, user]),
  );

  async function advanceOrderStatus(order: Order) {
    const nextStatus = nextStatusByCurrent[order.status];
    if (!nextStatus) return;

    setUpdatingOrderId(order.id);
    setMessage(null);

    try {
      await updateAdminOrderStatus(order.id, nextStatus);
      setOrderList((orders) =>
        orders.map((item) => (item.id === order.id ? { ...item, status: nextStatus } : item)),
      );
      setMessage(`Pedido ${order.id} atualizado para ${nextStatus}.`);
    } catch {
      setMessage('Nao foi possivel alterar o status deste pedido.');
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{isAdmin ? 'Pedidos da empresa' : 'Meus pedidos'}</Text>
        <Text style={styles.subtitle}>
          {isAdmin
            ? 'Pedidos realizados pelos usuarios e status operacional.'
            : 'Historico, status e rastreamento de entrega.'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.stateText}>Carregando pedidos...</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {!loading && orderList.length === 0 ? (
          error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{
                    ios: user ? 'shippingbox' : 'person',
                    android: user ? 'inventory_2' : 'person',
                    web: user ? 'inventory_2' : 'person',
                  }}
                  size={26}
                  tintColor={Colors.text.link}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {user ? 'Voce ainda nao tem pedidos' : 'Faca login para ver seus pedidos'}
              </Text>
              <Text style={styles.emptyBody}>
                {user
                  ? 'Seus pedidos aparecem aqui assim que voce finalizar uma compra.'
                  : 'Entre na sua conta para acompanhar historico, status e rastreamento.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push((user ? '/catalog' : '/login') as never)}
                style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>
                  {user ? 'Ver ofertas de hoje' : 'Entrar'}
                </Text>
              </Pressable>
            </View>
          )
        ) : null}
        {orderList.map((order) => (
          <Pressable
            accessibilityRole="button"
            key={order.id}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
            style={({ pressed }) => [
              styles.card,
              order.id === params.finalizedOrderId && styles.finalizedCard,
              pressed && styles.pressed,
            ]}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.orderId}>{order.id}</Text>
                {order.id === params.finalizedOrderId ? (
                  <Text style={styles.finalizedText}>Pedido finalizado</Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.status,
                  {
                    color: statusColors[order.status],
                    borderColor: `${statusColors[order.status]}60`,
                    backgroundColor: `${statusColors[order.status]}1A`,
                  },
                ]}>
                {order.status}
              </Text>
            </View>
            <View style={styles.orderItemsPreview}>
              <View style={styles.orderThumbnails}>
                {(order.products ?? []).slice(0, 2).map((item) => (
                  <ProductThumbnail
                    key={item.product.id}
                    marker={item.product.marker}
                    media={item.product.media}
                    name={item.product.name}
                    size={44}
                  />
                ))}
              </View>
              <Text numberOfLines={3} style={styles.items}>
                {(order.products ?? [])
                  .map((item) => `${item.quantity}x ${item.product.name} ${item.product.packageSize}`)
                  .join(', ')}
              </Text>
            </View>
            <View style={styles.detailGrid}>
              <Info label="Pagamento" value={order.paymentMethod} />
              <Info label="Entrega" value={order.shippingMethod} />
              <Info label="Endereco" value={order.deliveryAddress} />
              <Info label="Itens" value={`${order.products?.length ?? 0}`} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{order.date}</Text>
              <Text style={styles.total}>{formatCurrency(order.total)}</Text>
            </View>
            <Text style={styles.tracking}>Rastreamento: {order.tracking}</Text>
            {isAdmin && nextStatusByCurrent[order.status] ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: updatingOrderId === order.id }}
                disabled={updatingOrderId === order.id}
                onPress={() => advanceOrderStatus(order)}
                style={styles.adminAction}>
                <Text style={styles.adminActionText}>
                  {updatingOrderId === order.id
                    ? 'Atualizando...'
                    : `Avancar para ${nextStatusByCurrent[order.status]}`}
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function mapAdminOrder(order: AdminOrder): Order {
  const products = order.items.map((item) => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      manufacturer: 'AgroShop',
      sku: item.product.sku,
      category: 'fertilizante' as const,
      subcategory: 'Pedido',
      unit: 'un' as const,
      packageSize: item.product.packageSize,
      price: 0,
      rating: 0,
      reviews: 0,
      stock: 0,
      dosage: 'Administrado pela empresa',
      description: 'Item de pedido administrativo.',
      application: 'Separacao e envio.',
      technicalSheetUrl: '',
      media: [],
      marker: 'AG',
    },
    quantity: item.quantity,
    unitPrice: 0,
  }));

  return {
    id: order.id,
    status: order.status,
    date: new Intl.DateTimeFormat('pt-BR').format(new Date(order.createdAt)),
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    deliveryAddress: order.deliveryAddress,
    tracking: 'Gestao administrativa',
    subtotal: Number(order.total),
    discount: 0,
    shipping: 0,
    total: Number(order.total),
    products,
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface.base,
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    gap: Spacing[1],
    padding: Layout.screenPaddingH,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  timeline: {
    gap: Spacing[3],
    padding: Layout.screenPaddingH,
    paddingBottom: Layout.tabBarHeight + Spacing[6],
  },
  stateText: {
    color: Colors.text.muted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.strong,
    borderRadius: BorderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: Spacing[2.5],
    marginTop: Spacing[6],
    maxWidth: 360,
    padding: Spacing[6],
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primaryMuted,
    borderRadius: BorderRadius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    color: Colors.text.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    marginTop: Spacing[1],
    minHeight: Layout.buttonHeightMd,
    paddingHorizontal: Spacing[5],
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.feedback.error,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: Colors.brand.cyan,
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[2],
    padding: Layout.cardPadding,
  },
  finalizedCard: {
    borderColor: Colors.accent.primary,
  },
  finalizedText: {
    color: Colors.accent.primary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: Spacing[0.5],
  },
  pressed: {
    opacity: 0.78,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderId: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  status: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
  },
  items: {
    color: Colors.text.secondary,
    flex: 1,
    fontSize: 13,
  },
  orderItemsPreview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[2],
  },
  orderThumbnails: {
    flexDirection: 'row',
    gap: Spacing[1],
  },
  detailGrid: {
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  infoCell: {
    backgroundColor: Colors.surface.layer2,
    gap: Spacing[0.5],
    padding: Spacing[2],
    width: '50%',
  },
  infoLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: Colors.text.muted,
    fontSize: 12,
  },
  total: {
    color: Colors.text.price,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  tracking: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Colors.text.secondary,
    fontSize: 12,
    padding: Spacing[2],
  },
  adminAction: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightMd,
    paddingHorizontal: Spacing[3],
  },
  adminActionText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '900',
  },
});
