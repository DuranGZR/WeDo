import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, Platform, Pressable } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { colors, spacing, radius } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function ItemHistoryScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const [entries, setEntries] = useState<Awaited<
    ReturnType<typeof collaborationApi.activitiesForItem>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (itemId)
      void collaborationApi
        .activitiesForItem(itemId)
        .then(setEntries)
        .finally(() => setLoading(false));
  }, [itemId]);

  const data = entries?.data ?? [];

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
        <AppText variant="pageTitle">Geçmiş</AppText>

        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : data.length === 0 ? (
          <EmptyState
            title="Henüz geçmiş yok"
            description="İçerikle ilgili hareketler burada görünecek."
          />
        ) : (
          data.map((entry) => (
            <View key={entry.id} style={[styles.glassCard, styles.historyCard]}>
              <AppText>{entry.action}</AppText>
              <AppText variant="caption" muted>
                {new Date(entry.created_at).toLocaleString('tr-TR')}
              </AppText>
            </View>
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
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  historyCard: {
    marginTop: 12,
  },
});
