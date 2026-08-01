import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View, Platform } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { useLists } from '@/features/lists/hooks';
import { useSpaces } from '@/features/spaces/hooks';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/design-system';

export default function SpaceDetailScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const spaces = useSpaces();
  const lists = useLists(spaceId);
  const space = spaces.data?.data.find((entry) => entry.id === spaceId);

  if (spaces.isLoading || lists.isLoading)
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );

  if (!space)
    return (
      <Screen>
        <EmptyState
          title="Alan bulunamadı"
          description="Bu alan silinmiş veya erişim iznin yok."
        />
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
        <AppText variant="pageTitle">{space.name}</AppText>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={() => router.push(`/(onboarding)/invite-member?spaceId=${spaceId}`)}
        >
          <AppText style={styles.primaryBtnText}>Üye davet et</AppText>
        </Pressable>

        {(lists.data?.data ?? []).length === 0 ? (
          <EmptyState
            title="Henüz liste yok"
            description="Bu alana bir liste ekleyerek başla."
            action="Liste oluştur"
            onAction={() => router.push(`/list/create?spaceId=${spaceId}`)}
          />
        ) : (
          (lists.data?.data ?? []).map((list) => (
            <Pressable
              key={list.id}
              onPress={() => router.push(`/list/${list.id}`)}
              style={({ pressed }) => pressed && styles.btnPressed}
            >
              <View style={[styles.glassCard, { marginTop: 12 }]}>
                <AppText variant="cardTitle">{list.name}</AppText>
                <AppText muted>{list.is_default ? 'Varsayılan' : 'Ortak liste'}</AppText>
              </View>
            </Pressable>
          ))
        )}
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
