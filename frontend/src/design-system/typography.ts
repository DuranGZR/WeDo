import { Platform, type TextStyle } from 'react-native';

export const systemFontFamily = Platform.select({
  ios: 'System',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: 'sans-serif',
});

const headingFont: TextStyle = {
  fontFamily: systemFontFamily,
};

const regularFont: TextStyle = {
  fontFamily: systemFontFamily,
};

const mediumFont: TextStyle = {
  fontFamily: systemFontFamily,
};

export const typography: Record<string, TextStyle> = {
  display: { ...headingFont, fontSize: 32, lineHeight: 40, fontWeight: '700' },
  largeTitle: { ...headingFont, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  pageTitle: { ...mediumFont, fontSize: 24, lineHeight: 30, fontWeight: '600' },
  sectionTitle: { ...mediumFont, fontSize: 20, lineHeight: 26, fontWeight: '600' },
  cardTitle: { ...mediumFont, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { ...regularFont, fontSize: 15, lineHeight: 21, fontWeight: '400' },
  secondary: { ...regularFont, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { ...regularFont, fontSize: 11, lineHeight: 15, fontWeight: '500' },
  button: { ...mediumFont, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  systemFont: {
    fontFamily: systemFontFamily,
  },
};
