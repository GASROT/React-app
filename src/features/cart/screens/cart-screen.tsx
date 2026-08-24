import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cartPreview } from '@/features/catalog/data/products';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

const subtotal = cartPreview.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
const discount = subtotal * 0.1;
const total = subtotal - discount;

export function CartScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Carrinho</Text>
        <Text style={styles.count}>{cartPreview.length} itens</Text>
      </View>

      <View style={styles.items}>
        {cartPreview.map(({ product, quantity }) => (
          <View key={product.id} style={styles.item}>
            <View style={styles.marker}>
              <Text style={styles.markerText}>{product.marker}</Text>
            </View>
            <View style={styles.info}>
              <Text numberOfLines={2} style={styles.itemName}>
                {product.name} {product.packageSize}
              </Text>
              <Text style={styles.itemBrand}>{product.manufacturer}</Text>
              <View style={styles.itemFooter}>
                <View style={styles.qty}>
                  <Text style={styles.qtyButton}>-</Text>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <Text style={styles.qtyButton}>+</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatCurrency(product.price * quantity)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
        <SummaryRow label="Desconto cupom AGR10" positive value={`-${formatCurrency(discount)}`} />
        <SummaryRow label="Frete" positive value="Gratis" />
        <View style={styles.divider} />
        <SummaryRow label="Total" total value={formatCurrency(total)} />
        <Text style={styles.installments}>ou 3x de {formatCurrency(total / 3)} sem juros</Text>
        <Pressable accessibilityRole="button" style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Finalizar compra</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
      <Text style={[styles.summaryLabel, total && styles.summaryTotalLabel]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          positive && styles.positive,
          total && styles.summaryTotalValue,
        ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface.base,
    flex: 1,
  },
  header: {
    alignItems: 'baseline',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  count: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  items: {
    flex: 1,
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
  },
  item: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[3],
  },
  marker: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderRadius: BorderRadius.sm,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  markerText: {
    color: Colors.brand.cyan,
    fontSize: 17,
    fontWeight: '900',
  },
  info: {
    flex: 1,
    gap: Spacing[1],
  },
  itemName: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  itemBrand: {
    color: Colors.text.muted,
    fontSize: 12,
  },
  itemFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qty: {
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  qtyButton: {
    backgroundColor: Colors.surface.layer3,
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
    height: 28,
    lineHeight: 27,
    textAlign: 'center',
    width: 28,
  },
  qtyValue: {
    backgroundColor: Colors.surface.layer2,
    color: Colors.text.primary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    height: 28,
    lineHeight: 27,
    textAlign: 'center',
    width: 36,
  },
  itemPrice: {
    color: Colors.text.price,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  summary: {
    backgroundColor: Colors.surface.layer2,
    borderTopColor: Colors.border.subtle,
    borderTopWidth: 1,
    gap: Spacing[1],
    padding: Layout.screenPaddingH,
    paddingBottom: Layout.tabBarHeight + Spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  summaryValue: {
    color: Colors.text.primary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  positive: {
    color: Colors.feedback.success,
  },
  divider: {
    backgroundColor: Colors.border.default,
    height: 1,
    marginVertical: Spacing[1],
  },
  summaryTotalLabel: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  installments: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'right',
  },
  checkoutButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    marginTop: Spacing[2],
    minHeight: Layout.buttonHeightLg,
  },
  checkoutText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
});

