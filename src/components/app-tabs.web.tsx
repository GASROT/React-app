import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { useSyncExternalStore } from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { getAppTabsForRole } from '@/components/app-tabs.config';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

export default function AppTabs() {
  const user = useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);
  const tabs = getAppTabsForRole(user?.role);

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {tabs.map((tab) => (
            <TabTrigger
              key={tab.webName}
              name={tab.webName}
              href={tab.href as never}
              asChild>
              <TabButton icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: string;
  label: string;
};

export function TabButton({ icon, label, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonSelected]}>
        <Text style={[styles.tabIcon, !isFocused && styles.tabIconInactive]}>
          {icon}
        </Text>
        <Text style={[styles.tabText, isFocused && styles.tabTextSelected]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <Text style={styles.brandText}>
          Agro<Text style={styles.brandAccent}>Shop</Text>
        </Text>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    padding: Spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing[1],
    maxWidth: 800,
    minHeight: Layout.tabBarHeight,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
  },
  brandText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '900',
    marginRight: 'auto',
  },
  brandAccent: {
    color: Colors.brand.cyan,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    borderRadius: BorderRadius.sm,
    gap: 2,
    minHeight: 44,
    minWidth: 76,
    paddingHorizontal: Spacing[1],
    paddingVertical: Spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonSelected: {
    backgroundColor: Colors.accent.primaryMuted,
    borderColor: Colors.accent.primaryBorder,
    borderWidth: 1,
  },
  tabIcon: {
    fontSize: 16,
    lineHeight: 18,
  },
  tabIconInactive: {
    opacity: 0.35,
  },
  tabText: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: Colors.accent.primary,
  },
});
