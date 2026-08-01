import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { mono, spacing } from '@/design-system';

export function AccountScaffold({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Screen scroll backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri git"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')
          }
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={21} color={mono.ink} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={styles.titleGroup}>
          <AppText variant="pageTitle" style={styles.title}>
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
  return <View style={[styles.card, danger && styles.dangerCard]}>{children}</View>;
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={18} color={danger ? mono.danger : mono.ink} />
      </View>
      <View style={styles.rowCopy}>
        <AppText style={danger && styles.dangerText}>{title}</AppText>
        {description ? (
          <AppText variant="caption" muted style={styles.rowDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={mono.muted} />
    </Pressable>
  );
}

export const accountStyles = StyleSheet.create({
  fieldGroup: { gap: spacing.md },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: mono.muted },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: mono.ink,
  },
  primaryButtonText: { color: mono.paper, fontWeight: '800' },
  secondaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
  },
  secondaryButtonText: { color: mono.ink, fontWeight: '800' },
  dangerButton: { borderColor: mono.danger },
  dangerButtonText: { color: mono.danger },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  divider: { height: 1, backgroundColor: mono.line, opacity: 0.35 },
  note: { fontSize: 12, lineHeight: 17 },
});

const styles = StyleSheet.create({
  contourTop: {
    position: 'absolute',
    top: -162,
    right: -165,
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.7,
  },
  contourBottom: {
    position: 'absolute',
    bottom: -180,
    left: -190,
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.5,
  },
  header: {
    height: 46,
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  content: { gap: spacing.lg, paddingBottom: spacing.huge },
  titleGroup: { gap: spacing.xs, paddingVertical: spacing.sm },
  title: { fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    ...Platform.select({ web: { boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)' } }),
  },
  dangerCard: { borderColor: mono.danger },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  dangerIcon: { backgroundColor: '#F4E1DF' },
  rowCopy: { flex: 1, gap: 2 },
  rowDescription: { fontSize: 11, lineHeight: 15 },
  dangerText: { color: mono.danger },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
});
