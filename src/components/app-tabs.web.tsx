import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Inicio</TabButton>
          </TabTrigger>
          <TabTrigger name="catalog" href="/catalog" asChild>
            <TabButton>Catalogo</TabButton>
          </TabTrigger>
          <TabTrigger name="cart" href="/cart" asChild>
            <TabButton>Carrinho</TabButton>
          </TabTrigger>
          <TabTrigger name="orders" href="/orders" asChild>
            <TabButton>Pedidos</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Perfil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonSelected]}>
        <Text style={[styles.tabText, isFocused && styles.tabTextSelected]}>
          {children}
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
    minHeight: 36,
    minWidth: 76,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonSelected: {
    backgroundColor: Colors.accent.primaryMuted,
    borderColor: Colors.accent.primaryBorder,
    borderWidth: 1,
  },
  tabText: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextSelected: {
    color: Colors.accent.primary,
  },
});
