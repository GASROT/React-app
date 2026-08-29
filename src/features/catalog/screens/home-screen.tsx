import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PriceDisplay } from '@/features/catalog/components/price-display';
import { ProductBadge } from '@/features/catalog/components/product-badge';
import { ProductCard } from '@/features/catalog/components/product-card';
import { getFeaturedBanners, listProducts } from '@/features/catalog/api/catalog.api';
import {
  categoryLabels,
  type Product,
  type ProductCategory,
} from '@/features/catalog/data/products';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Shadows, Spacing } from '@/shared/theme';

const categories = Object.keys(categoryLabels) as ProductCategory[];

export function HomeScreen() {
  const router = useRouter();
  const [activeBanner, setActiveBanner] = useState(0);
  const [homeProducts, setHomeProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HeroBannerData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const bannerWidth = Math.min(width - Layout.screenPaddingH * 2, 768);

  useEffect(() => {
    let mounted = true;

    Promise.all([listProducts(), getFeaturedBanners()])
      .then(([productResponse, bannerResponse]) => {
        if (!mounted) return;
        setError(null);
        setHomeProducts(productResponse.data);
        setBanners(bannerResponse);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Nao foi possivel carregar os dados da API.');
        setHomeProducts([]);
        setBanners([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header />
        <View style={styles.search}>
          <Text style={styles.searchText}>Buscar fertilizantes, defensivos, SKU...</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {banners.length > 0 ? (
          <View style={styles.carouselBlock}>
            <FlatList
              data={banners}
              decelerationRate="fast"
              horizontal
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(event) => {
                setActiveBanner(Math.round(event.nativeEvent.contentOffset.x / bannerWidth));
              }}
              pagingEnabled
              renderItem={({ item }) => <HeroBanner banner={item} width={bannerWidth} />}
              showsHorizontalScrollIndicator={false}
              snapToInterval={bannerWidth}
            />
            <View style={styles.dots}>
              {banners.map((banner, index) => (
                <View
                  key={banner.id}
                  style={[styles.dot, index === activeBanner && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        ) : null}

        <SectionHeader
          title="Categorias"
          action="Ver todas"
          onActionPress={() => router.push('/categories')}
        />
        <ScrollView
          contentContainerStyle={styles.chips}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <ProductBadge key={category} label={categoryLabels[category]} tone={category} />
          ))}
        </ScrollView>

        <SectionHeader
          title="Em destaque"
          action="Ver mais"
          onActionPress={() => router.push('/featured')}
        />
        {homeProducts.length > 0 ? (
          <FlatList
            columnWrapperStyle={styles.productRow}
            data={homeProducts.slice(0, 4)}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item }) => <ProductCard product={item} />}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>Nenhum produto retornado pela API.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroBanner({
  banner,
  width,
}: {
  banner: HeroBannerData;
  width: number;
}) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: banner.product.id } })}
      style={[styles.hero, { width }]}>
      <View style={styles.heroCopy}>
        <Text style={styles.overline}>Destaque Steam Sale</Text>
        <Text style={styles.heroTitle}>{banner.title}</Text>
        <Text style={styles.heroSub}>{banner.subtitle}</Text>
        <PriceDisplay oldPrice={banner.product.oldPrice} price={banner.product.price} size="lg" />
        <View style={styles.heroActions}>
          <Text style={styles.bannerTag}>{banner.tag}</Text>
          <Text style={styles.primaryButtonText}>Ver oferta</Text>
        </View>
      </View>
      <View style={styles.heroMetric}>
        <Text style={styles.heroMarker}>{banner.product.marker}</Text>
        <Text style={styles.heroMetricLabel}>
          {banner.product.npk ? `NPK ${banner.product.npk}` : banner.product.subcategory}
        </Text>
      </View>
    </Pressable>
  );
}

type HeroBannerData = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  product: Product;
};

function Header() {
  const router = useRouter();
  const user = useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>
        Agro<Text style={styles.logoAccent}>Shop</Text>
      </Text>
      <View style={styles.headerActions}>
        {user ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={() => router.push('/profile' as never)}
            style={styles.profileButton}>
            <SymbolView
              name={{ ios: 'person.fill', android: 'person', web: 'person' }}
              size={18}
              tintColor={Colors.accent.primary}
            />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Entrar na conta"
            onPress={() => router.push('/login' as never)}
            style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </Pressable>
        )}
        <View style={styles.cartButton}>
          <Text style={styles.iconButtonText}>Cart</Text>
          <Text style={styles.badge}>3</Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable accessibilityRole="button" onPress={onActionPress}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface.base,
    flex: 1,
  },
  content: {
    paddingBottom: Layout.tabBarHeight + Spacing[6],
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
  logo: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  logoAccent: {
    color: Colors.brand.cyan,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: Spacing[3],
  },
  loginButtonText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  profileButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  cartButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    minWidth: 46,
    position: 'relative',
  },
  iconButtonText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.surface.base,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    color: Colors.white,
    fontSize: 9,
    fontWeight: '900',
    height: 16,
    lineHeight: 14,
    position: 'absolute',
    right: -5,
    textAlign: 'center',
    top: -5,
    width: 16,
  },
  search: {
    backgroundColor: Colors.surface.layer1,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[2],
  },
  searchText: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Colors.text.muted,
    fontSize: 13,
    minHeight: Layout.inputHeight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  carouselBlock: {
    marginVertical: Layout.screenPaddingH,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.accent.primaryBorder,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing[4],
    minHeight: 180,
    overflow: 'hidden',
    padding: Layout.cardPaddingLg,
    ...Shadows.card,
  },
  heroCopy: {
    flex: 1,
    gap: Spacing[2],
  },
  overline: {
    color: Colors.brand.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  heroSub: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  heroActions: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    gap: Spacing[2],
    justifyContent: 'center',
    minHeight: Layout.buttonHeightMd,
    paddingHorizontal: Spacing[4],
    alignSelf: 'flex-start',
    ...Shadows.accentGlow,
  },
  bannerTag: {
    backgroundColor: Colors.feedback.success,
    borderRadius: BorderRadius.xs,
    color: Colors.text.inverse,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: Spacing[1.5],
    paddingVertical: Spacing[0.5],
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  dots: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing[1],
    marginTop: Spacing[2],
  },
  dot: {
    backgroundColor: Colors.border.strong,
    borderRadius: BorderRadius.full,
    height: 4,
    width: 20,
  },
  dotActive: {
    backgroundColor: Colors.accent.primary,
    width: 36,
  },
  heroMetric: {
    alignItems: 'center',
    backgroundColor: Colors.brand.cyanMuted,
    borderColor: Colors.brand.cyanBorder,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    width: 96,
  },
  heroMarker: {
    color: Colors.brand.cyan,
    fontSize: 34,
    fontWeight: '900',
  },
  heroMetricLabel: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionAction: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  chips: {
    gap: Spacing[1.5],
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[2],
  },
  productRow: {
    gap: Layout.itemGap,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Layout.itemGap,
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 13,
    paddingHorizontal: Layout.screenPaddingH,
  },
  errorText: {
    color: Colors.feedback.error,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[3],
  },
});
