import { BorderRadius } from './border-radius';
import { Colors } from './colors';
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
  isDark: true,
} as const;

export type AppTheme = typeof theme;
export { BorderRadius, Colors, Layout, Shadows, Spacing, Typography };

