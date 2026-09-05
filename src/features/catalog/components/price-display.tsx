import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/shared/utils/currency';
import { Colors, Spacing } from '@/shared/theme';

type Props = {
  price: number;
  oldPrice?: number;
  unit?: string;
  size?: 'sm' | 'lg';
};

export function PriceDisplay({ price, oldPrice, unit, size = 'sm' }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.price, size === 'lg' && styles.priceLarge]}>
        {formatCurrency(price)}
      </Text>
      {unit ? <Text style={styles.unit}>/{unit}</Text> : null}
      {oldPrice ? <Text style={styles.oldPrice}>{formatCurrency(oldPrice)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1.5],
  },
  price: {
    color: Colors.text.price,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  priceLarge: {
    fontSize: 28,
  },
  unit: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  oldPrice: {
    color: Colors.text.priceOld,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
});
