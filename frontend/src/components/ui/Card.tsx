import { Platform, View, type ViewProps, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/design-system';

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 6px 0px rgba(0, 0, 0, 0.12)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.12,
          shadowRadius: 0,
          elevation: 5,
        }),
  },
});
