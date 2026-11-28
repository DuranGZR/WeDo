import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

export function AccountScaffold({
  title,
  subtitle,
  children,
  automaticallyAdjustKeyboardInsets = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  automaticallyAdjustKeyboardInsets?: boolean;
}) {
  useTranslation();
  return (
    <Screen scroll automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}>
      <ScreenHeader fallbackHref="/(tabs)/profile" />

      <View style={styles.content}>
        <View style={styles.titleGroup}>
          <AppText variant="largeTitle" style={styles.title}>
            {title}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {subtitle}
          </AppText>
        </View>
        {children}
      </View>
    </Screen>
  );
}

export function AccountCard({
  children,
  danger = false,
}: {
  children: ReactNode;
  danger?: boolean;
}) {
  useTranslation();
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(240)}
      layout={reducedMotion ? undefined : LAYOUT_SPRING}
      style={[styles.card, danger && styles.dangerCard]}
    >
      {children}
    </Animated.View>
  );
}

export function AccountRow({
  icon,
  title,
  description,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  useTranslation();
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      pressScale={0.985}
      haptic="selection"
      onPress={onPress}
      style={styles.row}
    >
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? colors.error : colors.primaryText}
        />
      </View>
      <View style={styles.rowCopy}>
        <AppText style={danger && styles.dangerText}>{title}</AppText>
        {description ? (
          <AppText variant="caption" muted style={styles.rowDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.tertiaryText} />
    </SpringPressable>
  );
}

export const accountStyles = StyleSheet.create({
  fieldGroup: { gap: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.secondaryText,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  primaryButtonText: { color: colors.onAccent, fontWeight: '700' },
  secondaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glassElevated,
    ...shadows.glass,
  },
  secondaryButtonText: { color: colors.primaryText, fontWeight: '700' },
  dangerButton: {
    backgroundColor: colors.errorSoft,
    borderColor: 'rgba(184, 74, 66, 0.25)',
  },
  dangerButtonText: { color: colors.error, fontWeight: '700' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  divider: { height: 1, backgroundColor: 'rgba(17, 17, 16, 0.06)' },
  note: { fontSize: 12, lineHeight: 17 },
});

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: 72 },
  titleGroup: { gap: spacing.xs, paddingVertical: spacing.sm },
  title: { fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.secondaryText },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    ...shadows.card,
  },
  dangerCard: { borderColor: 'rgba(184, 74, 66, 0.35)' },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  dangerIcon: { backgroundColor: colors.errorSoft },
  rowCopy: { flex: 1, gap: 2 },
  rowDescription: { fontSize: 12, lineHeight: 16 },
  dangerText: { color: colors.error },
});
