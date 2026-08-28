import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { listProducts, type ProductListParams } from '@/features/catalog/api/catalog.api';
import { ProductBadge } from '@/features/catalog/components/product-badge';
import { ProductCard } from '@/features/catalog/components/product-card';
import {
  categoryLabels,
  type Product,
  type ProductCategory,
} from '@/features/catalog/data/products';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

const categories = Object.keys(categoryLabels) as ProductCategory[];
const sortOptions = [
  { label: 'Relevancia', value: 'relevance' },
  { label: 'Menor preco', value: 'price_asc' },
  { label: 'Maior preco', value: 'price_desc' },
  { label: 'Avaliacao', value: 'rating' },
] as const;

export function FeaturedProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [sort, setSort] = useState<ProductListParams['sort']>('relevance');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    listProducts({
      available: availableOnly || undefined,
      category: selectedCategory ?? undefined,
      limit: 50,
      search: search.trim() || undefined,
      sort,
    })
      .then((response) => {
        if (!mounted) return;
        setError(null);
        setProducts(response.data);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Nao foi possivel carregar os produtos em destaque.');
        setProducts([]);
      });

    return () => {
      mounted = false;
    };
  }, [availableOnly, search, selectedCategory, sort]);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.oldPrice || product.rating >= 4.5),
    [products],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Produtos em destaque</Text>
        <TextInput
          accessibilityLabel="Buscar produtos em destaque"
          onChangeText={setSearch}
          placeholder="Buscar por nome, SKU, NPK ou fabricante"
          placeholderTextColor={Colors.text.muted}
          style={styles.input}
          value={search}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.filters}
        horizontal
        showsHorizontalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAvailableOnly((current) => !current)}>
          <ProductBadge label={availableOnly ? 'Disponivel ativo' : 'Disponivel'} tone="accent" />
        </Pressable>
        {categories.map((category) => (
          <Pressable
            accessibilityRole="button"
            key={category}
            onPress={() =>
              setSelectedCategory((current) => (current === category ? null : category))
            }>
            <ProductBadge
              label={`${selectedCategory === category ? '✓ ' : ''}${categoryLabels[category]}`}
              tone={category}
            />
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.sortFilters}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {sortOptions.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => setSort(option.value)}
            style={[styles.sortChip, sort === option.value && styles.sortChipActive]}>
            <Text style={[styles.sortText, sort === option.value && styles.sortTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        contentContainerStyle={styles.list}
        data={featuredProducts}
        ListEmptyComponent={
          <Text style={error ? styles.errorText : styles.emptyText}>
            {error ?? 'Nenhum destaque encontrado para os filtros atuais.'}
          </Text>
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard compact product={item} />}
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
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  backText: {
    color: Colors.accent.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  input: {
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.border.strong,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Colors.text.primary,
    minHeight: Layout.inputHeight,
    paddingHorizontal: Spacing[3],
  },
  filters: {
    gap: Spacing[1.5],
    padding: Layout.screenPaddingH,
  },
  sortFilters: {
    gap: Spacing[1.5],
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[2],
  },
  sortChip: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing[3],
  },
  sortChipActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  sortText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  sortTextActive: {
    color: Colors.surface.base,
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
