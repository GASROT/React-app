import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/shared/theme';
import type { ProductCategory } from '../data/products';

type Props = {
  label: string;
  tone: ProductCategory | 'success' | 'warning' | 'accent';
};

export function ProductBadge({ label, tone }: Props) {
  const color =
    tone === 'success'
      ? Colors.feedback.success
      : tone === 'warning'
        ? Colors.feedback.warning
        : tone === 'accent'
          ? Colors.accent.primary
          : Colors.category[tone];

  return (
    <View style={[styles.badge, { borderColor: `${color}60`, backgroundColor: `${color}1A` }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing[1.5],
    paddingVertical: Spacing[0.5],
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

