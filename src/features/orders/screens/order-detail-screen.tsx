import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOrder } from '@/features/orders/api/orders.api';
import type { Order } from '@/features/orders/data/orders';
import { ProductThumbnail } from '@/shared/components/product-thumbnail';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

const timeline = ['Pedido realizado', 'Pagamento aprovado', 'Em preparacao', 'Enviado', 'Entregue'];

const reachedByStatus: Record<string, number> = {
  PENDENTE: 0,
  CONFIRMADO: 1,
  SEPARANDO: 2,
  ENVIADO: 3,
  ENTREGUE: 4,
  CANCELADO: 0,
};

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reached = order ? reachedByStatus[order.status] ?? 0 : 0;
  const total = order ? order.subtotal - order.discount + order.shipping : 0;

  useEffect(() => {
    let mounted = true;

    if (!id) return undefined;

    getOrder(id)
      .then((response) => {
        if (!mounted) return;
        setError(null);
        setOrder(response);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Nao foi possivel carregar o pedido pela API.');
        setOrder(null);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/orders');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {!order ? (
        <View style={styles.stateContainer}>
          <Text style={error ? styles.errorText : styles.stateText}>
            {error ?? 'Carregando pedido...'}
          </Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={navigateBack}>
            <Text style={styles.back}>Voltar</Text>
          </Pressable>
          <Text style={styles.title}>Detalhes do pedido</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.status}>{order.status}</Text>
          <View style={styles.timeline}>
            {timeline.map((step, index) => (
              <View key={step} style={styles.timelineStep}>
                <View style={[styles.timelineDot, index <= reached && styles.timelineDotDone]} />
                <Text style={[styles.timelineLabel, index <= reached && styles.timelineLabelDone]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos</Text>
          {order.products.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.product.id}
              onPress={() =>
                router.push({ pathname: '/products/[id]', params: { id: item.product.id } })
              }
              style={styles.productRow}>
              <ProductThumbnail
                marker={item.product.marker}
                media={item.product.media}
                name={item.product.name}
                size={52}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productMeta}>
                  {item.quantity} un. x {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.productTotal}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacoes do pedido</Text>
          <Info label="Numero" value={order.id} />
          <Info label="Data" value={order.date} />
          <Info label="Pagamento" value={order.paymentMethod} />
          <Info label="Entrega" value={order.shippingMethod} />
          <Info label="Endereco" value={order.deliveryAddress} />
          <Info label="Rastreamento" value={order.tracking} />
        </View>

        <View style={styles.summary}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
          <SummaryRow label="Desconto" value={`-${formatCurrency(order.discount)}`} positive />
          <SummaryRow label="Frete" value={order.shipping === 0 ? 'Gratis' : formatCurrency(order.shipping)} />
          <View style={styles.divider} />
          <SummaryRow label="Total" value={formatCurrency(total)} total />
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  positive,
  total,
}: {
  label: string;
  value: string;
  positive?: boolean;
  total?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, total && styles.summaryTotal]}>{label}</Text>
      <Text style={[styles.summaryValue, positive && styles.positive, total && styles.summaryTotal]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.surface.base, flex: 1 },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Layout.screenPaddingH,
  },
  stateText: {
    color: Colors.text.muted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.feedback.error,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    gap: Spacing[4],
    paddingBottom: Layout.tabBarHeight + Spacing[6],
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: Layout.headerHeight,
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
  },
  back: { color: Colors.accent.primary, fontSize: 13, fontWeight: '900' },
  title: { color: Colors.text.primary, fontSize: 15, fontWeight: '900' },
  headerSpacer: { width: 42 },
  statusCard: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[3],
    marginHorizontal: Layout.screenPaddingH,
    marginTop: Layout.screenPaddingH,
    padding: Layout.cardPadding,
  },
  orderId: { color: Colors.text.primary, fontSize: 20, fontWeight: '900' },
  status: { color: Colors.accent.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  timeline: { gap: Spacing[2] },
  timelineStep: { alignItems: 'center', flexDirection: 'row', gap: Spacing[2] },
  timelineDot: {
    backgroundColor: Colors.border.strong,
    borderRadius: BorderRadius.full,
    height: 10,
    width: 10,
  },
  timelineDotDone: { backgroundColor: Colors.accent.primary },
  timelineLabel: { color: Colors.text.muted, fontSize: 13, fontWeight: '700' },
  timelineLabelDone: { color: Colors.text.primary },
  section: {
    gap: Spacing[2],
    paddingHorizontal: Layout.screenPaddingH,
  },
  sectionTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: '900' },
  productRow: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Layout.cardPadding,
  },
  productInfo: { flex: 1 },
  productName: { color: Colors.text.primary, fontSize: 14, fontWeight: '900' },
  productMeta: { color: Colors.text.secondary, fontSize: 12, marginTop: Spacing[1] },
  productTotal: {
    color: Colors.text.price,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  infoRow: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing[1],
    padding: Layout.cardPadding,
  },
  infoLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoValue: { color: Colors.text.primary, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  summary: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[2],
    marginHorizontal: Layout.screenPaddingH,
    padding: Layout.cardPadding,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: Colors.text.secondary, fontSize: 13 },
  summaryValue: {
    color: Colors.text.primary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  positive: { color: Colors.feedback.success },
  summaryTotal: { color: Colors.text.primary, fontSize: 18, fontWeight: '900' },
  divider: { backgroundColor: Colors.border.default, height: 1 },
});
