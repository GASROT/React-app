import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listProducts } from '@/features/catalog/api/catalog.api';
import { ProductBadge } from '@/features/catalog/components/product-badge';
import { ProductCard } from '@/features/catalog/components/product-card';
import {
  categoryLabels,
  type Product,
  type ProductCategory,
} from '@/features/catalog/data/products';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

const categories = Object.keys(categoryLabels) as ProductCategory[];

export function CatalogScreen() {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    listProducts()
      .then((response) => {
        if (!mounted) return;
        setError(null);
        setCatalogProducts(response.data);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Nao foi possivel carregar o catalogo pela API.');
        setCatalogProducts([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Catalogo tecnico</Text>
        <Text style={styles.subtitle}>Busca por SKU, composicao, fabricante e estoque.</Text>
        <Text style={styles.input}>MAP, NPK 11-52-0, defensivo...</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.filters}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <ProductBadge key={category} label={categoryLabels[category]} tone={category} />
        ))}
        <ProductBadge label="Disponivel" tone="success" />
        <ProductBadge label="Atacado PJ" tone="accent" />
      </ScrollView>

      <FlatList
        contentContainerStyle={styles.list}
        data={catalogProducts}
        ListEmptyComponent={
          <Text style={error ? styles.errorText : styles.emptyText}>
            {error ?? 'Nenhum produto retornado pela API.'}
          </Text>
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard compact product={item} />}
        showsVerticalScrollIndicator={false}
      />
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
    lineHeight: 19,
  },
  input: {
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.border.strong,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Colors.text.muted,
    fontSize: 13,
    marginTop: Spacing[2],
    minHeight: Layout.inputHeight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  filters: {
    gap: Spacing[1.5],
    padding: Layout.screenPaddingH,
  },
  list: {
    gap: Layout.itemGap,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Layout.tabBarHeight + Spacing[6],
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 13,
  },
  errorText: {
    color: Colors.feedback.error,
    fontSize: 13,
    fontWeight: '800',
  },
});
