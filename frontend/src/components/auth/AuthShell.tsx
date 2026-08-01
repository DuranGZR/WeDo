import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { spacing } from '@/design-system';

export const authColors = {
  background: '#CFCFCD',
  ink: '#090909',
  paper: '#FFFFFF',
  line: '#8D8D8B',
} as const;

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <Screen
      scroll={true}
      backgroundColor={authColors.background}
      style={styles.scroll}
      contentContainerStyle={styles.screen}
    >
      <View pointerEvents="none" style={styles.contourTop} />
      <View pointerEvents="none" style={styles.contourBottom} />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={authColors.ink} />
          </Pressable>
          <AppText style={styles.brand}>WeDo.</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleBlock}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        </View>

        <View style={styles.formCard}>{children}</View>
        <View style={styles.footer}>{footer}</View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: authColors.background },
  screen: { padding: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  container: {
    flex: 1,
    minHeight: 680,
    gap: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: authColors.ink,
    backgroundColor: authColors.paper,
  },
  brand: {
    color: authColors.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headerSpacer: { width: 42, height: 42 },
  titleBlock: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  title: {
    color: authColors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: { color: '#5F5F5D', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  formCard: {
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authColors.ink,
    backgroundColor: authColors.paper,
    ...Platform.select({
      web: { boxShadow: '0px 10px 0px rgba(0, 0, 0, 0.12)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 0,
        elevation: 5,
      },
    }),
  },
  footer: { alignItems: 'center', paddingBottom: spacing.sm },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  contourTop: {
    position: 'absolute',
    width: 230,
    height: 230,
    right: -150,
    top: -106,
    borderWidth: 1,
    borderColor: authColors.line,
    borderRadius: 104,
    transform: [{ rotate: '28deg' }],
  },
  contourBottom: {
    position: 'absolute',
    width: 190,
    height: 230,
    left: -152,
    bottom: 70,
    borderWidth: 1,
    borderColor: authColors.line,
    borderRadius: 90,
    transform: [{ rotate: '-28deg' }],
  },
});
