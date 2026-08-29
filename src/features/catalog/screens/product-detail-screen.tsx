import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCart } from '@/features/cart/store/cart.store';
import { getProduct } from '@/features/catalog/api/catalog.api';
import { PriceDisplay } from '@/features/catalog/components/price-display';
import { ProductBadge } from '@/features/catalog/components/product-badge';
import { StockIndicator } from '@/features/catalog/components/stock-indicator';
import { categoryLabels, type Product } from '@/features/catalog/data/products';
import { BorderRadius, Colors, Layout, Shadows, Spacing } from '@/shared/theme';

const paymentOptions = [
  {
    title: 'Comprar agora',
    subtitle: 'Preco final com impostos incluidos',
    label: '+ Carrinho',
    tone: 'primary',
  },
  {
    title: 'PIX AgroShop',
    subtitle: 'Pagamento instantaneo com 5% de desconto',
    label: 'Selecionar',
    tone: 'success',
  },
  {
    title: 'Boleto rural',
    subtitle: 'Vencimento em 3 dias uteis',
    label: 'Ir ao carrinho',
    tone: 'neutral',
  },
] as const;

type PixSimulation = {
  amount: number;
  code: string;
};

export function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addProduct, getQuantity, loading: cartLoading } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeMediaId, setActiveMediaId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [pixSimulation, setPixSimulation] = useState<PixSimulation | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const cartActionInProgress = useRef(false);
  const activeMedia =
    product?.media.find((media) => media.id === activeMediaId) ?? product?.media[0];
  const unavailable = product?.stock === 0;
  const addedToCart = product ? getQuantity(product.id) > 0 : false;

  useEffect(() => {
    let mounted = true;

    if (!id) return undefined;

    getProduct(id)
      .then((response) => {
        if (!mounted) return;
        setError(null);
        setProduct(response);
        setActiveMediaId(response.media[0]?.id);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Nao foi possivel carregar o produto pela API.');
        setProduct(null);
        setActiveMediaId(undefined);
      });

    return () => {
      mounted = false;
    };
  }, [id]);
  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/catalog');
  };

  const addCurrentProductToCart = async () => {
    if (!product || unavailable) return false;

    if (addedToCart) {
      setActionFeedback('Este produto ja esta no carrinho.');
      return true;
    }

    if (cartActionInProgress.current || cartLoading) return false;

    cartActionInProgress.current = true;
    setAddingToCart(true);
    setActionFeedback(null);

    try {
      await addProduct(product.id, product.minMultiple ?? 1);
      setActionFeedback('Produto adicionado ao carrinho.');
      return true;
    } catch {
      setActionFeedback('Nao foi possivel adicionar o produto ao carrinho. Tente novamente.');
      return false;
    } finally {
      cartActionInProgress.current = false;
      setAddingToCart(false);
    }
  };

  const openCartAfterAdding = async () => {
    const ready = addedToCart || (await addCurrentProductToCart());
    if (ready) router.push('/(tabs)/cart');
  };

  const generatePixSimulation = () => {
    if (!product || unavailable) return;

    const transactionId = product.sku.replace(/[^A-Z0-9-]/gi, '').toUpperCase();

    setPixSimulation({
      amount: product.price * 0.95,
      code: `00020126580014BR.GOV.BCB.PIX0136AGROSHOP-PIX-FICTICIO-${transactionId}5204000053039865802BR5920AGROSHOP PAGAMENTO6009SAO PAULO62070503***6304ABCD`,
    });
    setPixCopied(false);
    setActionFeedback('Codigo Pix ficticio gerado para simulacao.');
  };

  const copyPixCode = async () => {
    if (!pixSimulation) return;

    try {
      await Clipboard.setStringAsync(pixSimulation.code);
      setPixCopied(true);
      setActionFeedback('Codigo Pix copiado.');
    } catch {
      setActionFeedback('Nao foi possivel copiar o codigo Pix.');
    }
  };

  const handlePaymentOption = (title: (typeof paymentOptions)[number]['title']) => {
    if (title === 'PIX AgroShop') {
      generatePixSimulation();
      return;
    }

    if (title === 'Boleto rural') {
      void openCartAfterAdding();
      return;
    }

    void addCurrentProductToCart();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {!product ? (
        <View style={styles.stateContainer}>
          <Text style={error ? styles.errorText : styles.stateText}>
            {error ?? 'Carregando produto...'}
          </Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={navigateBack}>
            <Text style={styles.back}>Menu</Text>
          </Pressable>
          <Text style={styles.wishlist}>★ Lista de desejos</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.productPhoto}>
            <Text style={styles.mediaKind}>{activeMedia?.type === 'video' ? 'VIDEO' : 'FOTO'}</Text>
            <Text style={styles.marker}>{product.marker}</Text>
            <Text style={styles.mediaTitle}>{activeMedia?.title}</Text>
            {activeMedia?.type === 'video' ? <Text style={styles.playButton}>▶</Text> : null}
          </View>

          <View style={styles.carouselControls}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const current = product.media.findIndex((media) => media.id === activeMediaId);
                const previous = current <= 0 ? product.media.length - 1 : current - 1;
                setActiveMediaId(product.media[previous]?.id);
              }}
              style={styles.arrowButton}>
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <ScrollView
              contentContainerStyle={styles.thumbnails}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {product.media.map((media) => (
                <Pressable
                  accessibilityRole="button"
                  key={media.id}
                  onPress={() => setActiveMediaId(media.id)}
                  style={[
                    styles.thumbnail,
                    activeMediaId === media.id && styles.thumbnailActive,
                  ]}>
                  <Text style={styles.thumbnailMarker}>
                    {media.type === 'video' ? '▶' : product.marker}
                  </Text>
                  <Text numberOfLines={1} style={styles.thumbnailText}>
                    {media.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const current = product.media.findIndex((media) => media.id === activeMediaId);
                const next = current >= product.media.length - 1 ? 0 : current + 1;
                setActiveMediaId(product.media[next]?.id);
              }}
              style={styles.arrowButton}>
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.summary}>
            <Text style={styles.name}>{product.name}</Text>
            <InfoRow label="Fabricante" value={product.manufacturer} highlight />
            <InfoRow label="Categoria" value={categoryLabels[product.category]} />
            <InfoRow label="SKU" value={product.sku} />
            <InfoRow
              label="Avaliacoes"
              value={`${product.rating.toFixed(1)} de 5 (${product.reviews})`}
            />
            <Text style={styles.description}>{product.description}</Text>
            <Text style={styles.description}>{product.application}</Text>
            <View style={styles.tags}>
              <ProductBadge label={categoryLabels[product.category]} tone={product.category} />
              {product.npk ? <ProductBadge label={`NPK ${product.npk}`} tone="accent" /> : null}
              {product.toxicClass ? (
                <ProductBadge label={`Classe ${product.toxicClass}`} tone="warning" />
              ) : null}
            </View>
          </View>

          <View style={styles.sheet}>
            <Text style={styles.sectionTitle}>Ficha tecnica</Text>
            <SpecGrid product={product} />
            <View style={styles.pdfRow}>
              <Text style={styles.pdfLabel}>PDF</Text>
              <Text numberOfLines={1} style={styles.pdfUrl}>
                {product.technicalSheetUrl}
              </Text>
            </View>
          </View>

          <View style={styles.paymentStack}>
            <Text style={styles.sectionTitle}>Formas de pagamento</Text>
            {paymentOptions.map((option) => (
              <View key={option.title} style={styles.paymentCard}>
                <View style={styles.paymentText}>
                  <Text style={styles.paymentTitle}>{option.title}</Text>
                  <Text style={styles.paymentSubtitle}>{option.subtitle}</Text>
                </View>
                <View style={styles.paymentAction}>
                  <PriceDisplay
                    price={option.title.includes('PIX') ? product.price * 0.95 : product.price}
                  />
                  <Pressable
                    accessibilityLabel={`${option.title}: ${option.label}`}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: unavailable || addingToCart,
                      selected:
                        option.title === 'Comprar agora'
                          ? addedToCart
                          : option.title === 'PIX AgroShop' && Boolean(pixSimulation),
                    }}
                    disabled={unavailable || addingToCart}
                    onPress={() => handlePaymentOption(option.title)}
                    style={[
                      styles.paymentButton,
                      option.tone === 'success' && styles.paymentButtonSuccess,
                      (unavailable || addingToCart) && styles.paymentButtonDisabled,
                    ]}>
                    <Text style={styles.paymentButtonText}>
                      {unavailable
                        ? 'Indisponivel'
                        : addingToCart
                          ? 'Aguarde...'
                          : option.title === 'Comprar agora' && addedToCart
                            ? 'Adicionado'
                            : option.title === 'PIX AgroShop' && pixSimulation
                              ? 'Gerado'
                              : option.label}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {pixSimulation ? (
              <View accessibilityLiveRegion="polite" style={styles.pixPanel}>
                <Text style={styles.pixTitle}>Pagamento rapido Pix AgroShop</Text>
                <Text style={styles.pixWarning}>
                  SIMULACAO: este codigo e ficticio e nenhum pagamento real sera processado.
                </Text>
                <PriceDisplay price={pixSimulation.amount} />
                <Text selectable style={styles.pixCode}>
                  {pixSimulation.code}
                </Text>
                <Text style={styles.pixExpiry}>
                  Valido por 30 minutos apos a geracao.
                </Text>
                <Pressable
                  accessibilityLabel="Copiar codigo Pix ficticio"
                  accessibilityRole="button"
                  onPress={() => void copyPixCode()}
                  style={[styles.copyButton, pixCopied && styles.copyButtonSuccess]}>
                  <Text style={styles.copyButtonText}>{pixCopied ? 'Copiado' : 'Copiar codigo Pix'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {actionFeedback ? (
            <Text accessibilityLiveRegion="polite" style={styles.actionFeedback}>
              {actionFeedback}
            </Text>
          ) : null}

          <StockIndicator stock={product.stock} />

          {product.requiresAgronomistCpf ? (
            <View style={styles.restricted}>
              <Text style={styles.restrictedTitle}>Compra restrita por regra MAPA</Text>
              <Text style={styles.restrictedText}>
                Defensivos Classe I e II exigem CPF/CREA de engenheiro agronomo responsavel antes
                da compra.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      )}

      {product ? (
        <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: unavailable || addingToCart, selected: addedToCart }}
          disabled={unavailable || addingToCart}
          onPress={() => void openCartAfterAdding()}
          style={[styles.cta, (unavailable || addingToCart) && styles.ctaDisabled]}>
          <Text style={styles.ctaText}>
            {unavailable
              ? 'Avisar quando disponivel'
              : addingToCart
                ? 'Adicionando...'
                : addedToCart
                  ? 'Adicionado - ir ao carrinho'
                  : 'Adicionar ao carrinho'}
          </Text>
        </Pressable>
      </View>
      ) : null}
    </SafeAreaView>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

function SpecGrid({ product }: { product: Product }) {
  const specs = [
    ['Marca', product.manufacturer],
    ['Modelo', product.sku],
    ['Categoria', categoryLabels[product.category]],
    ['Embalagem', product.packageSize],
    ['Unidade', product.unit],
    ['NPK', product.npk ?? 'N/A'],
    ['Dosagem', product.dosage],
    ['Garantia', 'Qualidade conforme ficha tecnica'],
  ];

  return (
    <View style={styles.specGrid}>
      {specs.map(([label, value]) => (
        <View key={label} style={styles.specCell}>
          <Text style={styles.specLabel}>{label}</Text>
          <Text style={styles.specValue}>{value}</Text>
        </View>
      ))}
      {product.mapa ? (
        <View style={[styles.specCell, styles.specWide]}>
          <Text style={styles.specLabel}>Registro MAPA</Text>
          <Text style={styles.specValue}>{product.mapa}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.surface.base, flex: 1 },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Layout.screenPaddingH,
  },
  stateText: {
    color: Colors.text.muted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.feedback.error,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: { paddingBottom: Layout.tabBarHeight + 112 },
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
  back: { color: Colors.text.primary, fontSize: 16, fontWeight: '900' },
  wishlist: { color: Colors.text.primary, fontSize: 13, fontWeight: '900' },
  hero: {
    backgroundColor: Colors.surface.layer1,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
  },
  productPhoto: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.default,
    borderBottomWidth: 1,
    height: 292,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mediaKind: {
    color: Colors.brand.cyan,
    fontSize: 11,
    fontWeight: '900',
    left: Layout.screenPaddingH,
    letterSpacing: 1.2,
    position: 'absolute',
    top: Spacing[3],
  },
  marker: { color: Colors.brand.cyan, fontSize: 62, fontWeight: '900' },
  mediaTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: Spacing[3],
  },
  playButton: {
    backgroundColor: Colors.surface.overlay,
    borderColor: Colors.text.primary,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    color: Colors.white,
    fontSize: 28,
    height: 64,
    lineHeight: 60,
    position: 'absolute',
    textAlign: 'center',
    width: 64,
  },
  carouselControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[1],
    padding: Spacing[2],
  },
  arrowButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderRadius: BorderRadius.sm,
    height: 34,
    justifyContent: 'center',
    width: 42,
  },
  arrowText: { color: Colors.text.primary, fontSize: 25, lineHeight: 28 },
  thumbnails: { gap: Spacing[2] },
  thumbnail: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: Spacing[2],
    width: 126,
  },
  thumbnailActive: { borderColor: Colors.text.primary },
  thumbnailMarker: { color: Colors.brand.cyan, fontSize: 18, fontWeight: '900' },
  thumbnailText: { color: Colors.text.secondary, fontSize: 10, marginTop: Spacing[1] },
  body: { gap: Spacing[4], padding: Layout.screenPaddingH },
  summary: { gap: Spacing[2] },
  name: {
    color: Colors.text.primary,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 30,
  },
  infoRow: { flexDirection: 'row', gap: Spacing[2] },
  infoLabel: { color: Colors.text.muted, fontSize: 13, minWidth: 92 },
  infoValue: { color: Colors.text.secondary, flex: 1, fontSize: 13, fontWeight: '700' },
  infoValueHighlight: { color: Colors.accent.primary },
  description: { color: Colors.text.secondary, fontSize: 16, lineHeight: 23 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[1] },
  sectionTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: '900' },
  sheet: { gap: Spacing[3] },
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
  specWide: { width: '100%' },
  specLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '900',
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
  pdfRow: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing[2],
    padding: Layout.cardPadding,
  },
  pdfLabel: { color: Colors.brand.cyan, fontSize: 12, fontWeight: '900' },
  pdfUrl: { color: Colors.accent.primary, flex: 1, fontSize: 12 },
  paymentStack: { gap: Spacing[3] },
  paymentCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing[3],
    justifyContent: 'space-between',
    padding: Layout.cardPadding,
    ...Shadows.card,
  },
  paymentText: { flex: 1, gap: Spacing[1] },
  paymentTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: '800' },
  paymentSubtitle: { color: Colors.text.secondary, fontSize: 13, lineHeight: 18 },
  paymentAction: { alignItems: 'flex-end', gap: Spacing[1] },
  paymentButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.black,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 96,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  paymentButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  paymentButtonSuccess: { backgroundColor: Colors.feedback.success },
  paymentButtonDisabled: { backgroundColor: Colors.surface.layer3 },
  pixPanel: {
    backgroundColor: Colors.feedback.successMuted,
    borderColor: Colors.feedback.success,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[3],
    padding: Layout.cardPadding,
  },
  pixTitle: { color: Colors.text.primary, fontSize: 16, fontWeight: '900' },
  pixWarning: {
    color: Colors.feedback.warning,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  pixCode: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 17,
    padding: Spacing[3],
  },
  pixExpiry: { color: Colors.text.secondary, fontSize: 12 },
  copyButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing[4],
  },
  copyButtonSuccess: { backgroundColor: Colors.feedback.success },
  copyButtonText: { color: Colors.text.inverse, fontSize: 13, fontWeight: '900' },
  actionFeedback: {
    color: Colors.feedback.success,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  restricted: {
    backgroundColor: Colors.feedback.warningMuted,
    borderColor: '#FFB83060',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[1],
    padding: Layout.cardPadding,
  },
  restrictedTitle: { color: Colors.feedback.warning, fontSize: 13, fontWeight: '900' },
  restrictedText: { color: Colors.text.secondary, fontSize: 12, lineHeight: 18 },
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
  ctaDisabled: { backgroundColor: Colors.surface.layer3 },
  ctaText: { color: Colors.white, fontSize: 14, fontWeight: '900' },
});
