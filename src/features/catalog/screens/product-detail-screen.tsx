import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PriceDisplay } from '@/features/catalog/components/price-display';
import { ProductBadge } from '@/features/catalog/components/product-badge';
import { StockIndicator } from '@/features/catalog/components/stock-indicator';
import { categoryLabels, products } from '@/features/catalog/data/products';
import { BorderRadius, Colors, Layout, Shadows, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

export function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const product = products.find((item) => item.id === id) ?? products[0];
  const related = products.filter(
    (item) => item.category === product.category && item.id !== product.id,
  );
  const unavailable = product.stock === 0;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.back}>Voltar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Produto</Text>
          <Text style={styles.favorite}>♡</Text>
        </View>

        <View style={styles.visual}>
          <View style={styles.marker}>
            <Text style={styles.markerText}>{product.marker}</Text>
          </View>
          <View style={styles.visualChips}>
            <ProductBadge label={categoryLabels[product.category]} tone={product.category} />
            {product.toxicClass ? (
              <ProductBadge label={`Classe ${product.toxicClass}`} tone="warning" />
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.manufacturer}>{product.manufacturer}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.rating}>
            ★ {product.rating.toFixed(1)} ({product.reviews} avaliacoes)
          </Text>

          <View style={styles.specGrid}>
            <Spec label="SKU" value={product.sku} />
            <Spec label="Unidade" value={product.packageSize} />
            <Spec label="NPK" value={product.npk ?? 'N/A'} />
            <Spec label="Subcategoria" value={product.subcategory} />
            <Spec label="Dosagem" value={product.dosage} wide />
            {product.mapa ? <Spec label="Registro MAPA" value={product.mapa} wide /> : null}
          </View>

          <View style={styles.priceBlock}>
            <PriceDisplay oldPrice={product.oldPrice} price={product.price} size="lg" />
            {product.wholesalePrice ? (
              <Text style={styles.wholesale}>
                Tabela PJ verificada: {formatCurrency(product.wholesalePrice)}
              </Text>
            ) : null}
            <Text style={styles.installments}>
              Cartao ate 3x sem juros, PIX com 5% de desconto, boleto em 3 dias uteis.
            </Text>
          </View>

          <StockIndicator stock={product.stock} />

          {product.requiresAgronomistCpf ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Compra restrita</Text>
              <Text style={styles.warningText}>
                Defensivos Classe I e II exigem CPF/CREA de engenheiro agronomo responsavel antes
                da compra.
              </Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descricao tecnica</Text>
            <Text style={styles.paragraph}>{product.description}</Text>
            <Text style={styles.paragraph}>{product.application}</Text>
          </View>

          <View style={styles.sheetBox}>
            <Text style={styles.sheetTitle}>Ficha tecnica PDF</Text>
            <Text style={styles.sheetUrl}>{product.technicalSheetUrl}</Text>
          </View>

          {related.length > 0 ? (
            <View style={styles.related}>
              <Text style={styles.sectionTitle}>Relacionados</Text>
              {related.slice(0, 2).map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() =>
                    router.push({ pathname: '/products/[id]', params: { id: item.id } })
                  }
                  style={styles.relatedItem}>
                  <Text style={styles.relatedName}>{item.name}</Text>
                  <Text style={styles.relatedPrice}>{formatCurrency(item.price)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={unavailable}
          style={[styles.cta, unavailable && styles.ctaDisabled]}>
          <Text style={styles.ctaText}>
            {unavailable ? 'Avisar quando disponivel' : 'Adicionar ao carrinho'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Spec({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.specCell, wide && styles.specCellWide]}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface.base,
    flex: 1,
  },
  content: {
    paddingBottom: Layout.tabBarHeight + 108,
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: Layout.headerHeight,
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
  },
  back: {
    color: Colors.accent.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  favorite: {
    color: Colors.text.secondary,
    fontSize: 22,
  },
  visual: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    height: 220,
    justifyContent: 'center',
  },
  marker: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.brand.cyanBorder,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 116,
    justifyContent: 'center',
    width: 116,
  },
  markerText: {
    color: Colors.brand.cyan,
    fontSize: 34,
    fontWeight: '900',
  },
  visualChips: {
    bottom: Spacing[3],
    flexDirection: 'row',
    gap: Spacing[1],
    left: Layout.screenPaddingH,
    position: 'absolute',
  },
  body: {
    gap: Spacing[3],
    padding: Layout.screenPaddingH,
  },
  manufacturer: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    color: Colors.text.primary,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 31,
  },
  rating: {
    color: Colors.feedback.warning,
    fontSize: 13,
    fontWeight: '800',
  },
  specGrid: {
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  specCell: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.subtle,
    borderWidth: 0.5,
    padding: Spacing[3],
    width: '50%',
  },
  specCellWide: {
    width: '100%',
  },
  specLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  specValue: {
    color: Colors.text.primary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginTop: Spacing[1],
  },
  priceBlock: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[1],
    padding: Layout.cardPadding,
    ...Shadows.card,
  },
  wholesale: {
    color: Colors.feedback.success,
    fontSize: 12,
    fontWeight: '800',
  },
  installments: {
    color: Colors.text.muted,
    fontSize: 12,
  },
  warningBox: {
    backgroundColor: Colors.feedback.warningMuted,
    borderColor: '#FFB83060',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[1],
    padding: Layout.cardPadding,
  },
  warningTitle: {
    color: Colors.feedback.warning,
    fontSize: 13,
    fontWeight: '900',
  },
  warningText: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    gap: Spacing[2],
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  paragraph: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
  },
  sheetBox: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[1],
    padding: Layout.cardPadding,
  },
  sheetTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  sheetUrl: {
    color: Colors.accent.primary,
    fontSize: 12,
  },
  related: {
    gap: Spacing[2],
  },
  relatedItem: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Layout.cardPadding,
  },
  relatedName: {
    color: Colors.text.primary,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  relatedPrice: {
    color: Colors.text.price,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  footer: {
    backgroundColor: Colors.surface.layer2,
    borderTopColor: Colors.border.subtle,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: Layout.screenPaddingH,
    position: 'absolute',
    right: 0,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightLg,
  },
  ctaDisabled: {
    backgroundColor: Colors.surface.layer3,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
});

