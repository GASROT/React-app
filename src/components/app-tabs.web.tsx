import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from 'expo-router/ui';
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAppTabsForRole } from '@/components/app-tabs.config';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

type NavigationContextValue = {
  activeX: Animated.Value;
  registerCenter: (index: number, center: number) => void;
  selectIndex: (index: number) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

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
              <TabButton index={index} icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  index: number;
  icon: string;
  label: string;
};

export function TabButton({ index, icon, label, isFocused, ...props }: TabButtonProps) {
  const navigation = useContext(NavigationContext);
  const [iconProgress] = useState(() => new Animated.Value(isFocused ? 1 : 0));

  useEffect(() => {
    Animated.spring(iconProgress, {
      toValue: isFocused ? 1 : 0,
      damping: 17,
      mass: 0.7,
      stiffness: 190,
      useNativeDriver: true,
    }).start();
  }, [iconProgress, isFocused]);

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
      { translateY: iconProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
      { scale: iconProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
    ],
  } as const;

  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onLayout={handleLayout}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Text style={[styles.tabIcon, isFocused ? styles.activeIcon : styles.inactiveIcon]}>
          {icon}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const [activeX] = useState(() => new Animated.Value(0));
  const [centers] = useState(() => new Map<number, number>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const animateToIndex = (index: number) => {
    setActiveIndex(index);
    const center = centers.get(index);
    if (center === undefined) return;

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
    if (activeIndex === index || activeIndex === null) {
      activeX.setValue(center);
    }
  };

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
            style={[styles.navCurve, { transform: [{ translateX: activeX }] }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.activeCircle, { transform: [{ translateX: activeX }] }]}
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
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.surface.layer2,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    height: 56,
    justifyContent: 'center',
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
  tabIcon: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  activeIcon: {
    color: Colors.white,
  },
  inactiveIcon: {
    color: Colors.text.disabled,
  },
});
