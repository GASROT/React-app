import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

const orders = [
  {
    id: 'AG-2026-0831',
    status: 'CONFIRMADO',
    date: '23/08/2026',
    total: 641.16,
    items: 'Ureia, Superfosfato, KCL',
    tracking: 'Aguardando coleta',
  },
  {
    id: 'AG-2026-0794',
    status: 'ENVIADO',
    date: '18/08/2026',
    total: 489.9,
    items: 'Semente Milho Hibrido AGX',
    tracking: 'BR-JDL-94015522',
  },
  {
    id: 'AG-2026-0712',
    status: 'ENTREGUE',
    date: '02/08/2026',
    total: 249.9,
    items: 'Fungicida Foliar Classe IV',
    tracking: 'Entregue em 07/08/2026',
  },
];

const statusColors: Record<string, string> = {
  CONFIRMADO: Colors.accent.primary,
  ENVIADO: Colors.feedback.warning,
  ENTREGUE: Colors.feedback.success,
};

export function OrdersScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus pedidos</Text>
        <Text style={styles.subtitle}>Historico, status e rastreamento de entrega.</Text>
      </View>

      <View style={styles.timeline}>
        {orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>{order.id}</Text>
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
            <Text style={styles.items}>{order.items}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{order.date}</Text>
              <Text style={styles.total}>{formatCurrency(order.total)}</Text>
            </View>
            <Text style={styles.tracking}>Rastreamento: {order.tracking}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
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
  },
  card: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[2],
    padding: Layout.cardPadding,
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
    fontSize: 13,
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
});

