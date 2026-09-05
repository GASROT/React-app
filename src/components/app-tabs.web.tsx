import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { getAppTabsForRole, type AppTabConfig } from '@/components/app-tabs.config';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

type NavigationContextValue = {
  activeX: Animated.Value;
  registerCenter: (index: number, center: number) => void;
  selectIndex: (index: number) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const ACTIVE_ICON_OFFSET_Y = 14;
const ACTIVE_INDICATOR_SIZE = 56;
const ACTIVE_DASH_HEIGHT = 4;
const ACTIVE_DASH_WIDTH = 32;
const INDICATOR_MOVE_DURATION = 135;
const ICON_ARRIVAL_DELAY = 160;
const ICON_SETTLE_DURATION = 90;

export default function AppTabs() {
  const user = useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);
  const tabs = getAppTabsForRole(user?.role);

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {tabs.map((tab, index) => (
            <TabTrigger
              key={tab.webName}
              name={tab.webName}
              href={tab.href as never}
              asChild>
              <TabButton index={index} tab={tab} />
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  index: number;
  tab: AppTabConfig;
};

// Abaixo desta largura a barra usa apenas icones; acima cabe o rotulo escrito.
const ICON_ONLY_MAX_WIDTH = 768;

export function TabButton({ index, tab, isFocused, ...props }: TabButtonProps) {
  const navigation = useContext(NavigationContext);
  const { width } = useWindowDimensions();
  const iconOnly = width < ICON_ONLY_MAX_WIDTH;
  const [iconProgress] = useState(() => new Animated.Value(isFocused ? 1 : 0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      iconProgress.setValue(isFocused ? 1 : 0);
      return;
    }

    const settle = Animated.timing(iconProgress, {
      toValue: isFocused ? 1 : 0,
      duration: isFocused ? ICON_SETTLE_DURATION : 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const animation = isFocused
      ? Animated.sequence([Animated.delay(ICON_ARRIVAL_DELAY), settle])
      : settle;

    animation.start();

    return () => animation.stop();
  }, [iconProgress, isFocused, reduceMotion]);

  useEffect(() => {
    if (isFocused) navigation?.selectIndex(index);
  }, [index, isFocused, navigation]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    navigation?.registerCenter(index, x + width / 2);
  };

  const iconStyle = {
    opacity: iconProgress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
    transform: [
      {
        translateY: iconProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -ACTIVE_ICON_OFFSET_Y],
        }),
      },
      { scale: iconProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
    ],
  } as const;

  return (
    <Pressable
      {...props}
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onLayout={handleLayout}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        {iconOnly ? (
          <SymbolView
            fallback={
              <Text style={[styles.tabIcon, isFocused ? styles.activeIcon : styles.inactiveIcon]}>
                {tab.icon}
              </Text>
            }
            name={{ web: isFocused ? tab.md.selected : tab.md.default }}
            size={22}
            tintColor={isFocused ? Colors.white : Colors.text.disabled}
          />
        ) : (
          <Text style={[styles.tabLabel, isFocused ? styles.activeIcon : styles.inactiveIcon]}>
            {tab.label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const [activeX] = useState(() => new Animated.Value(0));
  const [shapeProgress] = useState(() => new Animated.Value(0));
  const [centers] = useState(() => new Map<number, number>());
  const [reduceMotion, setReduceMotion] = useState(false);
  const activeIndexRef = useRef<number | null>(null);
  const transitionRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      subscription.remove();
      transitionRef.current?.stop();
    };
  }, []);

  const animateToIndex = (index: number) => {
    const center = centers.get(index);
    if (center === undefined) {
      activeIndexRef.current = index;
      return;
    }

    if (activeIndexRef.current === null) {
      activeIndexRef.current = index;
      activeX.setValue(center);
      return;
    }

    if (activeIndexRef.current === index) return;

    activeIndexRef.current = index;
    transitionRef.current?.stop();

    if (reduceMotion) {
      activeX.setValue(center);
      shapeProgress.setValue(0);
      return;
    }

    const transition = Animated.sequence([
      Animated.timing(shapeProgress, {
        toValue: 1,
        duration: 45,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(activeX, {
        toValue: center,
        duration: INDICATOR_MOVE_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(shapeProgress, {
        toValue: 0,
        duration: 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    transitionRef.current = transition;
    transition.start(({ finished }) => {
      if (finished) transitionRef.current = null;
    });
  };

  const registerCenter = (index: number, center: number) => {
    centers.set(index, center);
    if (activeIndexRef.current === index || (activeIndexRef.current === null && centers.size === 1)) {
      activeX.setValue(center);
    }
  };

  const dashStyle = {
    opacity: shapeProgress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1, 1] }),
    transform: [{ translateX: activeX }],
  } as const;

  const indicatorStyle = {
    opacity: shapeProgress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 0, 0] }),
    transform: [
      { translateX: activeX },
      { scale: shapeProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) },
    ],
  } as const;

  const contextValue: NavigationContextValue = {
    activeX,
    registerCenter,
    selectIndex: animateToIndex,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      <View {...props} style={styles.tabListContainer}>
        <View style={styles.innerContainer}>
          <Animated.View
            pointerEvents="none"
            style={[styles.activeDash, dashStyle]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.activeCircle, indicatorStyle]}
          />
          {props.children}
        </View>
      </View>
    </NavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
  innerContainer: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderTopColor: Colors.border.default,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-around',
    maxWidth: 680,
    minHeight: Layout.tabBarHeight + Spacing[2],
    overflow: 'visible',
    paddingHorizontal: Spacing[3],
    position: 'relative',
  },
  activeDash: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    height: ACTIVE_DASH_HEIGHT,
    left: -ACTIVE_DASH_WIDTH / 2,
    position: 'absolute',
    top: (Layout.tabBarHeight + Spacing[2] - ACTIVE_DASH_HEIGHT) / 2,
    width: ACTIVE_DASH_WIDTH,
  },
  activeCircle: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    boxShadow: '0 5px 14px rgba(4, 36, 15, 0.18)',
    height: ACTIVE_INDICATOR_SIZE,
    justifyContent: 'center',
    left: -ACTIVE_INDICATOR_SIZE / 2,
    position: 'absolute',
    top:
      (Layout.tabBarHeight + Spacing[2] - ACTIVE_INDICATOR_SIZE) / 2 - ACTIVE_ICON_OFFSET_Y,
    width: ACTIVE_INDICATOR_SIZE,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: Layout.tabBarHeight + Spacing[2],
    minWidth: 44,
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  tabIcon: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  activeIcon: {
    color: Colors.white,
  },
  inactiveIcon: {
    color: Colors.text.disabled,
  },
});
