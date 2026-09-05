import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/shared/theme';

type Props = {
  stock: number;
};

function getStockState(stock: number) {
  if (stock === 0) return { color: Colors.border.strong, label: 'Esgotado' };
  if (stock <= 10) return { color: Colors.feedback.error, label: 'Ultimas unidades' };
  if (stock <= 50) return { color: Colors.feedback.warning, label: 'Estoque limitado' };
  return { color: Colors.feedback.success, label: 'Em estoque' };
}

export function StockIndicator({ stock }: Props) {
  const state = getStockState(stock);

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: state.color }]} />
      <Text style={[styles.label, { color: state.color }]}>
        {stock > 0 ? `${state.label} - ${stock} un.` : state.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[1],
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

