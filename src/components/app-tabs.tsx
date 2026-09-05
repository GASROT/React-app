import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import {
  AccessibilityInfo,
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAppTabsForRole, type AppTabConfig } from '@/components/app-tabs.config';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

type FluidNavigationContextValue = {
  activeX: Animated.Value;
  registerCenter: (index: number, center: number) => void;
  selectIndex: (index: number) => void;
};

const FluidNavigationContext = createContext<FluidNavigationContextValue | null>(null);

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

    Animated.spring(iconProgress, {
      toValue: isFocused ? 1 : 0,
      damping: 17,
      mass: 0.7,
      stiffness: 190,
      useNativeDriver: true,
    }).start();
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
      { translateY: iconProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
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
          } as never}
          size={22}
          tintColor={isFocused ? Colors.surface.base : Colors.text.primary}
        />
      </Animated.View>
    </Pressable>
  );
}

function FluidTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const [activeX] = useState(() => new Animated.Value(0));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [centers] = useState(() => new Map<number, number>());
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => subscription.remove();
  }, []);

  const animateToIndex = (index: number) => {
    setActiveIndex(index);
    const center = centers.get(index);
    if (center === undefined) return;

    if (reduceMotion) {
      activeX.setValue(center);
      return;
    }

    Animated.spring(activeX, {
      toValue: center,
      damping: 18,
      mass: 0.8,
      stiffness: 170,
      useNativeDriver: true,
    }).start();
  };

  const registerCenter = (index: number, center: number) => {
    centers.set(index, center);
    if (activeIndex === index || activeIndex === null) activeX.setValue(center);
  };

  return (
    <FluidNavigationContext.Provider
      value={{ activeX, registerCenter, selectIndex: animateToIndex }}>
      <View {...props} style={[styles.tabListContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.tabBar}>
          <Animated.View
            pointerEvents="none"
            style={[styles.navCurve, { transform: [{ translateX: activeX }] }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.activeCircle, { transform: [{ translateX: activeX }] }]}
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
  navCurve: {
    backgroundColor: Colors.surface.layer2,
    borderRadius: BorderRadius.full,
    height: 74,
    left: -37,
    position: 'absolute',
    top: -28,
    width: 74,
  },
  activeCircle: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.surface.layer2,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    height: 56,
    left: -28,
    position: 'absolute',
    top: -4,
    width: 56,
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
