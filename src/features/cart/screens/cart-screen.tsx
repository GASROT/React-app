import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmOrder } from '@/features/checkout/api/checkout.api';
import { replaceCart, useCart } from '@/features/cart/store/cart.store';
import { addRecentOrder } from '@/features/orders/store/recent-orders.store';
import { ProductThumbnail } from '@/shared/components/product-thumbnail';
import { getCurrentUser } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

export function CartScreen() {
  const router = useRouter();
  const { cart, error, loading, updateQuantity, removeProduct } = useCart();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const checkoutDisabled = loading || cart.items.length === 0;

  const finishCheckout = async () => {
    if (checkoutDisabled) return;

    if (!getCurrentUser()) {
      setCheckoutError(null);
      router.push({
        pathname: '/(tabs)/profile',
        params: { notice: 'checkout-auth-required' },
      });
      return;
    }

    try {
      setCheckoutError(null);
      const order = await confirmOrder({
        paymentMethod: 'pix',
        shippingMethod: cart.summary.shipping === 0 ? 'Frete gratis AgroShop' : 'PAC Rural',
        deliveryCep: '14000-000',
        idempotencyKey: `checkout-${Date.now()}`,
      });
      addRecentOrder(order);

      replaceCart({
        items: [],
        summary: {
          subtotal: 0,
          discount: 0,
          shipping: 0,
          total: 0,
        },
      });
      router.replace({
        pathname: '/(tabs)/orders',
        params: { finalizedOrderId: order.id },
      });
    } catch (caughtError) {
      setCheckoutError(
        caughtError instanceof Error ? caughtError.message : 'Nao foi possivel finalizar a compra.',
      );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Carrinho</Text>
        <Text style={styles.count}>{cart?.items.length ?? 0} itens</Text>
      </View>

      {error && cart.items.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : cart.items.length === 0 ? (
        <View style={styles.stateContainer}>
          {loading ? (
            <Text style={styles.stateText}>Carregando carrinho...</Text>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{ ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' }}
                  size={26}
                  tintColor={Colors.text.link}
                />
              </View>
              <Text style={styles.emptyTitle}>Seu carrinho esta vazio</Text>
              <Text style={styles.emptyBody}>
                Veja o que os produtores perto de voce colheram esta semana.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/catalog' as never)}
                style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Ver ofertas de hoje</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.items}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {cart.items.map(({ product, quantity, lineTotal, warning }) => {
              const step = product.minMultiple ?? 1;
              const canDecrease = quantity > step;
              const canIncrease = quantity + step <= product.stock;

              return (
                <View key={product.id} style={styles.item}>
                  <ProductThumbnail
                    marker={product.marker}
                    media={product.media}
                    name={product.name}
                    size={56}
                  />
                  <View style={styles.info}>
                    <Text numberOfLines={2} style={styles.itemName}>
                      {product.name} {product.packageSize}
                    </Text>
                    <Text numberOfLines={2} style={styles.itemDescription}>
                      {product.description}
                    </Text>
                    <Text style={styles.itemBrand}>
                      {product.manufacturer} - SKU {product.sku}
                    </Text>
                    {warning ? <Text style={styles.warning}>{warning}</Text> : null}
                    <View style={styles.itemFooter}>
                      <View style={styles.qty}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !canDecrease || loading }}
                          onPress={() => {
                            if (canDecrease) void updateQuantity(product.id, quantity - step);
                          }}
                          style={[styles.qtyButton, !canDecrease && styles.qtyButtonDisabled]}>
                          <Text style={styles.qtyButtonText}>-</Text>
                        </Pressable>
                        <Text style={styles.qtyValue}>{quantity}</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !canIncrease || loading }}
                          onPress={() => {
                            if (canIncrease) void updateQuantity(product.id, quantity + step);
                          }}
                          style={[styles.qtyButton, !canIncrease && styles.qtyButtonDisabled]}>
                          <Text style={styles.qtyButtonText}>+</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.itemPrice}>{formatCurrency(lineTotal)}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void removeProduct(product.id)}
                      style={styles.removeButton}>
                      <Text style={styles.removeText}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.summary}>
            {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}
            <SummaryRow label="Subtotal" value={formatCurrency(cart.summary.subtotal)} />
            <SummaryRow
              label="Desconto cupom AGR10"
              positive
              value={`-${formatCurrency(cart.summary.discount)}`}
            />
            <SummaryRow
              label="Frete"
              positive={cart.summary.shipping === 0}
              value={cart.summary.shipping === 0 ? 'Gratis' : formatCurrency(cart.summary.shipping)}
            />
            <View style={styles.divider} />
            <SummaryRow label="Total" total value={formatCurrency(cart.summary.total)} />
            <Text style={styles.installments}>
              ou 3x de {formatCurrency(cart.summary.total / 3)} sem juros
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: checkoutDisabled }}
              onPress={() => void finishCheckout()}
              style={[styles.checkoutButton, checkoutDisabled && styles.checkoutButtonDisabled]}>
              <Text style={styles.checkoutText}>
                {loading ? 'Processando...' : 'Finalizar compra'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
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
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
    paddingBottom: Spacing[4],
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Layout.screenPaddingH,
  },
  stateText: {
    color: Colors.text.muted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.strong,
    borderRadius: BorderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: Spacing[2.5],
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
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  warning: {
    color: Colors.feedback.warning,
    fontSize: 11,
    fontWeight: '700',
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
  itemDescription: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
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
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  qtyButtonDisabled: {
    opacity: 0.35,
  },
  qtyButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  qtyValue: {
    backgroundColor: Colors.surface.layer2,
    color: Colors.text.primary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    height: 32,
    lineHeight: 31,
    textAlign: 'center',
    width: 38,
  },
  itemPrice: {
    color: Colors.text.price,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  removeButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: Colors.feedback.error,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: Spacing[3],
  },
  removeText: {
    color: Colors.feedback.error,
    fontSize: 12,
    fontWeight: '800',
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
  checkoutButtonDisabled: {
    opacity: 0.55,
  },
  checkoutText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '900',
  },
});
