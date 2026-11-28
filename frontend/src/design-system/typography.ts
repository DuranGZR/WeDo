import { Platform, type TextStyle } from 'react-native';

export const systemFontFamily = Platform.select({
  ios: 'System',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: 'sans-serif',
});

const fontBase: TextStyle = {
  fontFamily: systemFontFamily,
};

export const typography = {
  display: {
    ...fontBase,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  largeTitle: {
    ...fontBase,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  editorialHero: {
    ...fontBase,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: -0.6,
  },
  editorialAccent: {
    ...fontBase,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  pageTitle: {
    ...fontBase,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  screenTitle: {
    ...fontBase,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  sectionTitle: {
    ...fontBase,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  cardTitle: {
    ...fontBase,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  eyebrow: {
    ...fontBase,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  body: {
    ...fontBase,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  secondary: {
    ...fontBase,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  caption: {
    ...fontBase,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  button: {
    ...fontBase,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  tabular: {
    ...fontBase,
    fontVariant: ['tabular-nums'],
  },
  systemFont: {
    fontFamily: systemFontFamily,
  },
} satisfies Record<string, TextStyle>;
