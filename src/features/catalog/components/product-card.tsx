import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCart } from '@/features/cart/store/cart.store';
import { BorderRadius, Colors, Layout, Shadows, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';
import { categoryLabels, type Product } from '../data/products';
import { PriceDisplay } from './price-display';
import { ProductBadge } from './product-badge';
import { StockIndicator } from './stock-indicator';

type Props = {
  product: Product;
  compact?: boolean;
};

export function ProductCard({ product, compact = false }: Props) {
  const router = useRouter();
  const { addProduct, getQuantity, loading } = useCart();
  const unavailable = product.stock === 0;
  const quantity = getQuantity(product.id);
  const added = quantity > 0;
  const openProduct = () => {
    router.push({ pathname: '/products/[id]', params: { id: product.id } });
  };
  const addToCart = () => {
    if (!unavailable && !loading) {
      void addProduct(product.id, product.minMultiple ?? 1);
    }
  };

  if (compact) {
    return (
      <Pressable accessibilityRole="button" onPress={openProduct} style={styles.compactCard}>
        <ProductMarker product={product} size={52} />
        <View style={styles.compactInfo}>
          <Text numberOfLines={2} style={styles.name}>
            {product.name}
          </Text>
          <Text style={styles.brand}>{product.manufacturer}</Text>
          <Text style={styles.meta}>
            {product.npk ? `NPK ${product.npk}  |  ` : ''}
            {product.packageSize}
          </Text>
          <StockIndicator stock={product.stock} />
        </View>
        <View style={styles.compactPrice}>
          <Text style={styles.compactPriceText}>{formatCurrency(product.price)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: unavailable || loading, selected: added }}
            onPress={addToCart}
            style={[styles.compactAddButton, added && styles.addedButton, unavailable && styles.disabledButton]}>
            <Text style={[styles.compactAddText, added && styles.addedButtonText, unavailable && styles.disabledText]}>
              {unavailable ? 'Avise-me' : added ? 'Adicionado' : 'Adicionar'}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openProduct}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.visual}>
        <ProductMarker product={product} size={58} />
        <View style={styles.badgeOverlay}>
          <ProductBadge label={categoryLabels[product.category]} tone={product.category} />
          {product.oldPrice ? <ProductBadge label="Promocao" tone="success" /> : null}
        </View>
        <Text style={styles.favorite}>♡</Text>
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.brand}>{product.manufacturer}</Text>
        <Text style={styles.meta}>
          SKU {product.sku} {product.npk ? `| NPK ${product.npk}` : ''}
        </Text>
        <Text style={styles.rating}>★ {product.rating.toFixed(1)} ({product.reviews})</Text>
        <PriceDisplay price={product.price} oldPrice={product.oldPrice} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: unavailable || loading, selected: added }}
          onPress={addToCart}
          style={[styles.addButton, added && styles.addedButton, unavailable && styles.disabledButton]}>
          <Text style={[styles.addButtonText, added && styles.addedButtonText, unavailable && styles.disabledText]}>
            {unavailable ? 'Avisar quando disponivel' : added ? 'Adicionado' : '+ Carrinho'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function ProductMarker({ product, size }: { product: Product; size: number }) {
  const color = Colors.category[product.category];

  return (
    <View style={[styles.marker, { height: size, width: size, borderColor: `${color}55` }]}>
      <Text style={[styles.markerText, { color }]}>{product.marker}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: Layout.cardBorderWidth,
    flex: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  visual: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    height: 128,
    justifyContent: 'center',
  },
  badgeOverlay: {
    flexDirection: 'row',
    gap: Spacing[1],
    left: Spacing[2],
    position: 'absolute',
    top: Spacing[2],
  },
  favorite: {
    backgroundColor: Colors.surface.overlay,
    borderRadius: BorderRadius.full,
    color: Colors.text.secondary,
    fontSize: 16,
    height: 28,
    lineHeight: 27,
    position: 'absolute',
    right: Spacing[2],
    textAlign: 'center',
    top: Spacing[2],
    width: 28,
  },
  marker: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 19,
    fontWeight: '900',
  },
  body: {
    gap: Spacing[1],
    padding: Layout.cardPadding,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  brand: {
    color: Colors.text.muted,
    fontSize: 12,
  },
  meta: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  rating: {
    color: Colors.feedback.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: Spacing[1],
    minHeight: 32,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
  },
  addButtonText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  addedButton: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  addedButtonText: {
    color: Colors.surface.base,
  },
  disabledButton: {
    backgroundColor: Colors.surface.layer3,
  },
  compactCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[3],
  },
  compactInfo: {
    flex: 1,
    gap: Spacing[0.5],
  },
  compactPrice: {
    alignItems: 'flex-end',
    gap: Spacing[2],
  },
  compactPriceText: {
    color: Colors.text.price,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  compactAddButton: {
    alignItems: 'center',
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 32,
    minWidth: 92,
    justifyContent: 'center',
    paddingHorizontal: Spacing[2],
  },
  compactAddText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  disabledText: {
    color: Colors.text.muted,
  },
});
