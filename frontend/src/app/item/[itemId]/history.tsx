import { formatDate, t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, Platform, Pressable } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { colors, spacing, radius } from '@/design-system';
import { useItemActivities } from '@/features/collaboration/hooks';
import { Ionicons } from '@expo/vector-icons';

export default function ItemHistoryScreen() {
  useTranslation();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const result = useItemActivities(itemId);
  const data = result.data?.data ?? [];

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
          accessibilityLabel={t('common.goBack')}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <AppText variant="pageTitle">{t('items.history')}</AppText>

        {result.isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : result.isError ? (
          <EmptyState
            title={t('items.historyLoadFailed')}
            description={t('lists.checkYourConnectionAndTryAgain')}
            action={t('common.tryAgain')}
            onAction={() => void result.refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState
            title={t('items.noHistoryYet')}
            description={t('items.activityForThisItemWillAppearHere')}
          />
        ) : (
          data.map((entry) => (
            <View key={entry.id} style={[styles.glassCard, styles.historyCard]}>
              <AppText>{entry.action}</AppText>
              <AppText variant="caption" muted>
                {formatDate(entry.created_at, true)}
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
    ...StyleSheet.absoluteFill,
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
