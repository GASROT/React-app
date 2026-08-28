import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { appTabs } from '@/components/app-tabs.config';
import { Colors } from '@/shared/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.surface.layer2}
      indicatorColor={Colors.accent.primary}
      labelStyle={{
        selected: { color: Colors.accent.primary },
        default: { color: Colors.text.muted },
      }}
      tintColor={Colors.accent.primary}>
      {appTabs.map((tab) => (
        <NativeTabs.Trigger key={tab.nativeName} name={tab.nativeName}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={tab.sf}
            md={tab.md}
            selectedColor={Colors.accent.primary}
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
