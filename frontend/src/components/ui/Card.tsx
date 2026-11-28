import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadows, spacing } from '@/design-system';
import { GlassSurface } from './GlassSurface';

export type CardProps = ViewProps & {
  variant?: 'default' | 'glass' | 'elevated';
};

export function Card({ style, variant = 'default', ...props }: CardProps) {
  if (variant === 'glass') {
    return <GlassSurface elevated {...props} style={[styles.glassCard, style]} />;
  }

  return (
    <View
      {...props}
      style={[styles.card, variant === 'elevated' && styles.elevatedCard, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  elevatedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLg,
    ...shadows.elevated,
  },
  glassCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
  },
});
