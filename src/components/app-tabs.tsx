import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useSyncExternalStore } from 'react';

import { getAppTabsForRole } from '@/components/app-tabs.config';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';
import { Colors } from '@/shared/theme';

export default function AppTabs() {
  const user = useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);
  const tabs = getAppTabsForRole(user?.role);

  return (
    <NativeTabs
      backgroundColor={Colors.surface.layer2}
      indicatorColor={Colors.accent.primary}
      labelStyle={{
        selected: { color: Colors.accent.primary },
        default: { color: Colors.text.muted },
      }}
      tintColor={Colors.accent.primary}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.nativeName} name={tab.nativeName}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={tab.sf as never}
            md={tab.md as never}
            selectedColor={Colors.accent.primary}
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
