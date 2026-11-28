import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { LAYOUT_SPRING } from '@/components/motion/springs';
import {
  AppText,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { useItemActivities } from '@/features/collaboration/hooks';
import { formatDate, t } from '@/i18n';

export default function ItemHistoryScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const result = useItemActivities(itemId);
  const data = result.data?.data ?? [];
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await result.refetch?.();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen scroll={true} refreshing={refreshing} onRefresh={() => void handleRefresh()}>
      <ScreenHeader />

      <View style={styles.content}>
        <AppText variant="largeTitle" style={styles.title}>
          {t('items.history')}
        </AppText>

        {result.isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map((key) => (
              <SkeletonCard key={key} style={styles.skeletonCard}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="72%" height={15} borderRadius={6} />
                  <Skeleton width="42%" height={12} borderRadius={6} />
                </View>
              </SkeletonCard>
            ))}
          </View>
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
          <View style={styles.list}>
            {data.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={
                  reducedMotion ? undefined : FadeInDown.delay(index * 40).duration(220)
                }
                layout={reducedMotion ? undefined : LAYOUT_SPRING}
              >
                <Card style={styles.historyCard}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="time-outline" size={16} color="#9E7F60" />
                  </View>
                  <View style={styles.historyCopy}>
                    <AppText style={styles.actionText}>{entry.action}</AppText>
                    <AppText variant="caption" muted>
                      {formatDate(entry.created_at, true)}
                    </AppText>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  title: {
    letterSpacing: -0.6,
  },
  list: {
    gap: spacing.sm + 2,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  historyCard: {
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  actionText: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});
