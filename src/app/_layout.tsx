import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

export default function TabLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="featured" />
        <Stack.Screen name="products/[id]" />
        <Stack.Screen name="profile/[section]" />
        <Stack.Screen name="orders/[id]" />
      </Stack>
    </ThemeProvider>
  );
}
