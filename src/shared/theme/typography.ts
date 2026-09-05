export const Typography = {
  fontSize: {
    eyebrow: 11,
    xs: 11,
    sm: 12,
    base: 13,
    md: 14,
    lg: 15,
    xl: 17,
    '2xl': 19,
    price: 22,
    '3xl': 24,
    display: 36,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },
  // Escalas prontas do design system: corpo minimo 15px para leitura sob sol.
  text: {
    display: { fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
    title: { fontSize: 24, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 },
    card: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
    price: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
    body: { fontSize: 15, lineHeight: 24, fontWeight: '400' },
    label: { fontSize: 13, fontWeight: '700' },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  },
} as const;
