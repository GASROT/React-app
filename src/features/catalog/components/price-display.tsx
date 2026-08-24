import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/shared/utils/currency';
import { Colors, Spacing } from '@/shared/theme';

type Props = {
  price: number;
  oldPrice?: number;
  size?: 'sm' | 'lg';
};

export function PriceDisplay({ price, oldPrice, size = 'sm' }: Props) {
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;

  return (
    <View style={styles.row}>
      {discount > 0 ? (
        <Text style={styles.discount}>{`-${discount}%`}</Text>
      ) : null}
      <Text style={[styles.price, size === 'lg' && styles.priceLarge]}>
        {formatCurrency(price)}
      </Text>
      {oldPrice ? <Text style={styles.oldPrice}>{formatCurrency(oldPrice)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1.5],
  },
  discount: {
    backgroundColor: Colors.feedback.success,
    borderRadius: 2,
    color: Colors.text.inverse,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: Spacing[1.5],
    paddingVertical: Spacing[0.5],
  },
  price: {
    color: Colors.text.price,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  priceLarge: {
    fontSize: 24,
  },
  oldPrice: {
    color: Colors.text.priceOld,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    textDecorationLine: 'line-through',
  },
});

