import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { listProducts } from '@/features/catalog/api/catalog.api';
import { ProductCard } from '@/features/catalog/components/product-card';
import {
  categoryLabels,
  type Product,
  type ProductCategory,
} from '@/features/catalog/data/products';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

const categories = Object.keys(categoryLabels) as ProductCategory[];

export function CategoriesScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    listProducts({ limit: 50 })
      .then((response) => {
        if (!mounted) return;
        setError(null);
        setProducts(response.data);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Nao foi possivel carregar as categorias.');
        setProducts([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProducts = useMemo(
    () => products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Categorias</Text>
          <Text style={styles.subtitle}>Selecione uma categoria para ver os produtos.</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const count = products.filter((product) => product.category === item).length;
          const color = Colors.category[item];

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedCategory(item)}
              style={[styles.categoryCard, { borderColor: `${color}55` }]}>
              <View style={[styles.categoryMarker, { backgroundColor: `${color}1A` }]}>
                <Text style={[styles.categoryMarkerText, { color }]}>
                  {categoryLabels[item].slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{categoryLabels[item]}</Text>
                <Text style={styles.categorySubtitle}>{count} produtos encontrados</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />

      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedCategory(null)}
        transparent
        visible={Boolean(selectedCategory)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedCategory ? categoryLabels[selectedCategory] : ''}
                </Text>
                <Text style={styles.modalSubtitle}>{selectedProducts.length} produtos</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedCategory(null)}
                style={styles.closeButton}>
                <Text style={styles.closeText}>Fechar</Text>
              </Pressable>
            </View>

            <FlatList
              contentContainerStyle={styles.modalList}
              data={selectedProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard compact product={item} />}
            />
          </View>
        </View>
      </Modal>
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
    gap: Spacing[3],
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
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginTop: Spacing[1],
  },
  errorText: {
    color: Colors.feedback.error,
    fontSize: 13,
    fontWeight: '800',
    padding: Layout.screenPaddingH,
  },
  list: {
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing[3],
    minHeight: 76,
    padding: Layout.cardPadding,
  },
  categoryMarker: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  categoryMarkerText: {
    fontSize: 15,
    fontWeight: '900',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  categorySubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: Spacing[0.5],
  },
  chevron: {
    color: Colors.accent.primary,
    fontSize: 28,
  },
  modalBackdrop: {
    backgroundColor: Colors.surface.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPanel: {
    backgroundColor: Colors.surface.base,
    borderTopColor: Colors.border.default,
    borderTopWidth: 1,
    maxHeight: '84%',
    paddingBottom: Spacing[4],
  },
  modalHeader: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Layout.screenPaddingH,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  closeButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.accent.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  modalList: {
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
  },
});
