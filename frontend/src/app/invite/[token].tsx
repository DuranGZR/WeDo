import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, EmptyState, Screen } from '@/components/ui';
import { ApiClientError } from '@/api/client/api-client';
import { collaborationApi } from '@/features/collaboration/api';
import { colors, radius, spacing } from '@/design-system';
import { useAuthStore } from '@/store/auth-store';

export default function InviteLandingScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<Awaited<
    ReturnType<typeof collaborationApi.invitation>
  > | null>(null);

  useEffect(() => {
    if (token)
      void collaborationApi
        .invitation(token)
        .then(setInvite)
        .finally(() => setLoading(false));
  }, [token]);

  async function accept() {
    if (!token) return;
    if (!user) {
      router.push(`/(auth)/sign-in?inviteToken=${encodeURIComponent(token)}`);
      return;
    }
    setAccepting(true);
    try {
      await collaborationApi.acceptInvitation(token);
      await queryClient.invalidateQueries({ queryKey: ['spaces'] });
      router.replace('/invite/accepted');
    } catch (error) {
      Alert.alert(
        'Davet kabul edilemedi',
        error instanceof ApiClientError && error.status === 409
          ? 'Bu alanın zaten üyesisin.'
          : 'Davet geçersiz veya süresi dolmuş olabilir.',
      );
    } finally {
      setAccepting(false);
    }
  }

  if (loading)
    return (
      <Screen scroll={true}>
        <ActivityIndicator />
      </Screen>
    );

  if (!invite)
    return (
      <Screen scroll={true}>
        <View style={styles.ambientContainer} pointerEvents="none">
          <View style={styles.blobCoral} />
          <View style={styles.blobSand} />
        </View>
        <View style={styles.headerBar}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(tabs)')
            }
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Geri git"
          >
            <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
          </Pressable>
        </View>
        <View style={styles.content}>
          <EmptyState
            title="Davet bulunamadı"
            description="Bu davet geçersiz veya süresi dolmuş olabilir."
          />
        </View>
      </Screen>
    );

  return (
    <Screen scroll={true}>
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={styles.blobCoral} />
        <View style={styles.blobSand} />
      </View>
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <AppText variant="pageTitle">Bir alana davet edildin</AppText>
        <View style={styles.glassCard}>
          <AppText variant="cardTitle">{invite.space_name ?? 'Ortak alan'}</AppText>
          <AppText muted>
            {invite.inviter_name ?? 'Bir WeDo kullanıcısı'} seni birlikte kaydetmeye davet
            etti.
          </AppText>
        </View>
        <Pressable
          disabled={accepting}
          onPress={() => void accept()}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        >
          {accepting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <AppText style={styles.primaryBtnText}>Daveti kabul et</AppText>
          )}
        </Pressable>
      </View>
    </Screen>
  );
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
  headerBar: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' },
    }),
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(200, 103, 75, 0.15)',
      },
    }),
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
