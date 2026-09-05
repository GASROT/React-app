import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  AccessibilityInfo,
  Animated,
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
import {
  getExperimentSubjectId,
  getExperimentVariant,
  HOME_HERO_CTA_EXPERIMENT,
  trackExperimentEvent,
} from '@/shared/services/experiments/experiments';
import { BorderRadius, Colors, Layout, Shadows, Spacing } from '@/shared/theme';

const categories = Object.keys(categoryLabels) as ProductCategory[];
const BANNER_AUTO_ROTATION_MS = 5000;

export function HomeScreen() {
  const router = useRouter();
  const [heroExperiment] = useState(() => {
    const subjectId = getExperimentSubjectId(getCurrentUser()?.id);
    return { subjectId, ...getExperimentVariant(HOME_HERO_CTA_EXPERIMENT, subjectId) };
  });
  const [activeBanner, setActiveBanner] = useState(0);
  const [homeProducts, setHomeProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HeroBannerData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const { width } = useWindowDimensions();
  const bannerGap = Spacing[2];
  const bannerWidth = Math.min(Math.max(width * 0.75, 248), 780);
  const bannerSidePadding = Math.max((width - bannerWidth) / 2, Layout.screenPaddingH);
  const bannerSnapInterval = bannerWidth + bannerGap;
  const bannerListRef = useRef<FlatList<HeroBannerData>>(null);
  const activeBannerRef = useRef(0);
  const isDraggingBannerRef = useRef(false);
  const [scrollX] = useState(() => new Animated.Value(0));

  const selectBanner = useCallback((index: number) => {
    activeBannerRef.current = index;
    setActiveBanner(index);
  }, []);

  const scrollToBanner = useCallback((index: number) => {
    if (banners.length === 0) return;

    const nextIndex = (index + banners.length) % banners.length;
    selectBanner(nextIndex);
    bannerListRef.current?.scrollToOffset({
      animated: !reduceMotion,
      offset: nextIndex * bannerSnapInterval,
    });
  }, [bannerSnapInterval, banners.length, reduceMotion, selectBanner]);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    bannerListRef.current?.scrollToOffset({
      animated: false,
      offset: activeBannerRef.current * bannerSnapInterval,
    });
  }, [bannerSnapInterval]);

  useFocusEffect(useCallback(() => {
    if (banners.length < 2 || reduceMotion) return undefined;

    const timer = setInterval(() => {
      if (!isDraggingBannerRef.current) {
        scrollToBanner(activeBannerRef.current + 1);
      }
    }, BANNER_AUTO_ROTATION_MS);

    return () => clearInterval(timer);
  }, [banners.length, reduceMotion, scrollToBanner]));

  useFocusEffect(useCallback(() => {
    let mounted = true;

    Promise.all([listProducts(), getFeaturedBanners()])
      .then(([productResponse, bannerResponse]) => {
        if (!mounted) return;
        setError(null);
        setHomeProducts(productResponse.data);
        setBanners(bannerResponse);
        if (activeBannerRef.current >= bannerResponse.length) {
          selectBanner(0);
        }
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
  }, [selectBanner]));

  useEffect(() => {
    if (banners.length === 0) return;

    trackExperimentEvent(
      HOME_HERO_CTA_EXPERIMENT,
      heroExperiment.variant,
      heroExperiment.subjectId,
      'exposure',
    );
  }, [banners.length, heroExperiment]);

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
            <Animated.FlatList
              ref={bannerListRef}
              contentContainerStyle={{ paddingHorizontal: bannerSidePadding }}
              data={banners}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                index,
                length: bannerSnapInterval,
                offset: bannerSnapInterval * index,
              })}
              horizontal
              ItemSeparatorComponent={() => <View style={{ width: bannerGap }} />}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(event) => {
                const index = Math.min(
                  Math.max(Math.round(event.nativeEvent.contentOffset.x / bannerSnapInterval), 0),
                  banners.length - 1,
                );
                isDraggingBannerRef.current = false;
                selectBanner(index);
              }}
              onMomentumScrollBegin={() => {
                isDraggingBannerRef.current = true;
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true },
              )}
              onScrollBeginDrag={() => {
                isDraggingBannerRef.current = true;
              }}
              onScrollEndDrag={() => {
                isDraggingBannerRef.current = false;
              }}
              removeClippedSubviews={false}
              renderItem={({ item, index }) => {
                const isActive = index === activeBanner;
                const inputRange = [
                  (index - 1) * bannerSnapInterval,
                  index * bannerSnapInterval,
                  (index + 1) * bannerSnapInterval,
                ];
                const opacity = reduceMotion
                  ? (isActive ? 1 : 0.72)
                  : scrollX.interpolate({
                      extrapolate: 'clamp',
                      inputRange,
                      outputRange: [0.72, 1, 0.72],
                    });
                const scaleX = reduceMotion
                  ? (isActive ? 1.04 : 0.84)
                  : scrollX.interpolate({
                      extrapolate: 'clamp',
                      inputRange,
                      outputRange: [0.84, 1.04, 0.84],
                    });
                const scaleY = reduceMotion
                  ? (isActive ? 1 : 0.9)
                  : scrollX.interpolate({
                      extrapolate: 'clamp',
                      inputRange,
                      outputRange: [0.9, 1, 0.9],
                    });
                const translateX = reduceMotion
                  ? (isActive ? 0 : index < activeBanner ? bannerWidth * 0.07 : -bannerWidth * 0.07)
                  : scrollX.interpolate({
                      extrapolate: 'clamp',
                      inputRange,
                      outputRange: [-bannerWidth * 0.07, 0, bannerWidth * 0.07],
                    });
                const translateY = reduceMotion
                  ? (isActive ? 0 : 12)
                  : scrollX.interpolate({
                      extrapolate: 'clamp',
                      inputRange,
                      outputRange: [12, 0, 12],
                    });

                return (
                  <Animated.View
                    style={{
                      opacity,
                      transform: [{ translateX }, { scaleX }, { scaleY }, { translateY }],
                      width: bannerWidth,
                      zIndex: isActive ? 2 : 1,
                    }}>
                    <HeroBanner
                      banner={item}
                      ctaLabel={heroExperiment.value.ctaLabel}
                      compact={bannerWidth < 420}
                      onConversion={() =>
                        trackExperimentEvent(
                          HOME_HERO_CTA_EXPERIMENT,
                          heroExperiment.variant,
                          heroExperiment.subjectId,
                          'conversion',
                        )
                      }
                      selected={isActive}
                    />
                  </Animated.View>
                );
              }}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              snapToInterval={bannerSnapInterval}
            />
            <View style={styles.dots}>
              {banners.map((banner, index) => (
                <Pressable
                  accessibilityLabel={`Exibir banner ${index + 1} de ${banners.length}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: index === activeBanner }}
                  key={banner.id}
                  onPress={() => scrollToBanner(index)}
                  style={styles.dotTouch}>
                  <View style={[styles.dot, index === activeBanner && styles.dotActive]} />
                </Pressable>
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
  ctaLabel,
  compact,
  onConversion,
  selected,
}: {
  banner: HeroBannerData;
  ctaLabel: string;
  compact: boolean;
  onConversion: () => void;
  selected: boolean;
}) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        onConversion();
        router.push({ pathname: '/products/[id]', params: { id: banner.product.id } });
      }}
      style={[styles.hero, compact && styles.heroCompact]}>
      <View style={styles.heroCopy}>
        <Text style={styles.overline}>Destaque AgroShop Sale</Text>
        <Text
          numberOfLines={2}
          style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
          {banner.title}
        </Text>
        <Text numberOfLines={2} style={styles.heroSub}>{banner.subtitle}</Text>
        <PriceDisplay oldPrice={banner.product.oldPrice} price={banner.product.price} size="lg" />
        <View style={styles.heroActions}>
          <Text style={styles.bannerTag}>{banner.tag}</Text>
          <Text style={styles.primaryButtonText}>{ctaLabel}</Text>
        </View>
      </View>
      <HeroProductVisual compact={compact} product={banner.product} />
    </Pressable>
  );
}

function HeroProductVisual({ compact, product }: { compact: boolean; product: Product }) {
  const imageUrl = product.media.find((media) => media.type === 'image' && media.url)?.url;
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl && failedImageUrl !== imageUrl);

  return (
    <View style={[styles.heroVisual, compact && styles.heroVisualCompact]}>
      {showImage && imageUrl ? (
        <Image
          accessibilityLabel={`Imagem de ${product.name}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setFailedImageUrl(imageUrl)}
          source={{ uri: imageUrl }}
          style={styles.heroProductImage}
          transition={150}
        />
      ) : (
        <Text style={styles.heroMarker}>{product.marker}</Text>
      )}
      <View style={styles.heroVisualLabel}>
        <Text numberOfLines={1} style={styles.heroMetricLabel}>
          {product.npk ? `NPK ${product.npk}` : product.subcategory}
        </Text>
      </View>
    </View>
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
    color: Colors.accent.primary,
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
    color: Colors.text.inverse,
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
    height: 220,
    overflow: 'hidden',
    padding: Layout.cardPaddingLg,
    width: '100%',
    ...Shadows.card,
  },
  heroCompact: {
    height: 236,
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
  heroTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
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
    color: Colors.text.inverse,
    fontSize: 13,
    fontWeight: '900',
  },
  dots: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing[1],
  },
  dotTouch: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
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
  heroVisual: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer3,
    borderColor: Colors.brand.cyanBorder,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 148,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 124,
  },
  heroVisualCompact: {
    height: 116,
    width: 76,
  },
  heroProductImage: {
    height: '100%',
    width: '100%',
  },
  heroMarker: {
    color: Colors.brand.cyan,
    fontSize: 36,
    fontWeight: '900',
  },
  heroVisualLabel: {
    backgroundColor: Colors.surface.overlay,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing[1],
    paddingVertical: Spacing[1],
    position: 'absolute',
    right: 0,
  },
  heroMetricLabel: {
    color: Colors.text.primary,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    textAlign: 'center',
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
