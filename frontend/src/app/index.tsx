import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing, radius } from '@/design-system';
import { useAuthStore } from '@/store/auth-store';

export default function IndexRoute() {
  const { hydrated, user } = useAuthStore();
  if (!hydrated)
    return (
      <View style={styles.splash}>
        <View style={styles.ambientContainer} pointerEvents="none">
          <View style={styles.blobCoral} />
          <View style={styles.blobSand} />
        </View>
        <View style={styles.glassCard}>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View style={styles.mark}>
              <AppText style={styles.markText}>W</AppText>
            </View>
            <AppText variant="display">WeDo</AppText>
            <AppText muted>Birlikte kaydet. Birlikte yap.</AppText>
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          </View>
        </View>
      </View>
    );
  return <Redirect href={user ? '/(tabs)' : '/(auth)/welcome'} />;
}

const styles: any = StyleSheet.create({
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  blobCoral: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accent,
    opacity: 0.08,
    ...Platform.select({
      web: { filter: 'blur(75px)' },
    }),
  },
  blobSand: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#A5A29B',
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(85px)' },
    }),
  },
  glassCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginBottom: spacing.sm,
  },
  markText: { color: colors.surface, fontSize: 24, fontWeight: '700' },
  loader: { marginTop: spacing.xl },
});
