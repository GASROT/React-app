import { BorderRadius } from './border-radius';
import { Colors, Palette } from './colors';
import { Shadows } from './shadows';
import { Layout, Spacing } from './spacing';
import { Typography } from './typography';

export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  layout: Layout,
  borderRadius: BorderRadius,
  shadows: Shadows,
  isDark: false,
} as const;

export type AppTheme = typeof theme;
export { BorderRadius, Colors, Layout, Palette, Shadows, Spacing, Typography };

