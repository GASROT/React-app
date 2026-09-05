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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAppTabsForRole, type AppTabConfig } from '@/components/app-tabs.config';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Shadows, Spacing } from '@/shared/theme';

type FluidNavigationContextValue = {
  activeX: Animated.Value;
  registerCenter: (index: number, center: number) => void;
  selectIndex: (index: number) => void;
};

const FluidNavigationContext = createContext<FluidNavigationContextValue | null>(null);

const ACTIVE_ICON_OFFSET_Y = 8;
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
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <FluidTabList>
          {tabs.map((tab, index) => (
            <TabTrigger
              key={tab.nativeName}
              name={tab.nativeName}
              href={tab.href as never}
              asChild>
              <TabButton index={index} tab={tab} />
            </TabTrigger>
          ))}
        </FluidTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  index: number;
  tab: AppTabConfig;
};

function TabButton({ index, isFocused, tab, ...props }: TabButtonProps) {
  const navigation = useContext(FluidNavigationContext);
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
      useNativeDriver: true,
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
        <SymbolView
          name={{
            ios: isFocused ? tab.sf.selected : tab.sf.default,
            android: isFocused ? tab.md.selected : tab.md.default,
            web: isFocused ? tab.md.selected : tab.md.default,
          }}
          size={22}
          tintColor={isFocused ? Colors.white : Colors.text.disabled}
        />
      </Animated.View>
    </Pressable>
  );
}

function FluidTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
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
        useNativeDriver: true,
      }),
      Animated.timing(activeX, {
        toValue: center,
        duration: INDICATOR_MOVE_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(shapeProgress, {
        toValue: 0,
        duration: 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
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

  return (
    <FluidNavigationContext.Provider
      value={{ activeX, registerCenter, selectIndex: animateToIndex }}>
      <View {...props} style={[styles.tabListContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.tabBar}>
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
    </FluidNavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  tabSlot: {
    flex: 1,
  },
  tabListContainer: {
    backgroundColor: Colors.surface.layer2,
    borderTopColor: Colors.border.default,
    borderTopWidth: 1,
  },
  tabBar: {
    alignItems: 'center',
    flexDirection: 'row',
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
    ...Shadows.md,
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    height: ACTIVE_INDICATOR_SIZE,
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
});
