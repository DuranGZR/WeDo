import { t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { queryKeys } from '@/api/query-keys';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';

import {
  AppText,
  Card,
  GlassSurface,
  Screen,
  ScreenHeader,
  SectionHeader,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';
import { useNotifications } from '@/features/collaboration/hooks';
import { handleNotificationData } from '@/features/notifications/navigation';
import { haptic } from '@/lib/haptics';

const { width } = Dimensions.get('window');

export default function NotificationsScreen() {
  useTranslation();
  const result = useNotifications();
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const notifications = result.data?.data ?? [];
  const hasUnread = notifications.some((n) => !n.read_at);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.notifications }),
        client.invalidateQueries({ queryKey: queryKeys.unreadCount }),
      ]);
      await result.refetch?.();
    } finally {
      setRefreshing(false);
    }
  };

  const listHeader = (
    <View style={styles.listHeaderWrap}>
      <ScreenHeader
        rightAction={
          hasUnread ? (
            <SpringPressable
              onPress={() => {
                void collaborationApi.readAllNotifications().then(() => {
                  haptic.success();
                  void client.invalidateQueries({ queryKey: queryKeys.unreadCount });
                  return client.invalidateQueries({ queryKey: ['notifications'] });
                });
              }}
              hitSlop={8}
              pressScale={0.94}
              haptic="medium"
              style={styles.pillPressable}
              accessibilityRole="button"
              accessibilityLabel={t('notifications.markAllAsRead')}
            >
              <GlassSurface
                elevated
                interactive
                tintColor="rgba(255, 255, 255, 0.52)"
                fallbackBackgroundColor={colors.glassElevated}
                style={styles.readAllBtn}
              >
                <AppText style={styles.readAllText}>
                  {t('notifications.markAllAsRead_7ac9f')}
                </AppText>
              </GlassSurface>
            </SpringPressable>
          ) : undefined
        }
      />

      <View style={styles.header}>
        <AppText variant="eyebrow" style={styles.headerCategory}>
          {t('notifications.updates')}
        </AppText>
        <AppText variant="largeTitle" style={styles.title}>
          {t('common.notifications')}
        </AppText>
      </View>

      {!result.isLoading && notifications.length > 0 ? (
        <SectionHeader
          title={t('notifications.updateCount', { count: notifications.length })}
        />
      ) : null}
    </View>
  );

  const emptyComponent = result.isLoading ? (
    <View style={styles.notificationsList}>
      {[1, 2, 3].map((key) => (
        <SkeletonCard key={key} style={styles.skeletonCard}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="62%" height={16} borderRadius={6} />
            <Skeleton width="88%" height={13} borderRadius={6} />
          </View>
        </SkeletonCard>
      ))}
    </View>
  ) : (
    <Animated.View entering={FadeInDown.duration(240)}>
      <Card style={styles.emptyCard}>
        <View style={styles.emptyIconContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-outline" size={32} color="#9E7F60" />
          </View>
        </View>
        <AppText variant="sectionTitle" style={styles.emptyTitle}>
          {t('notifications.noNotifications')}
        </AppText>
        <AppText muted style={styles.emptySubtitle}>
          {t('notifications.youReAllCaughtUpNewSharedPlansAndUpdates')}
        </AppText>
      </Card>
    </Animated.View>
  );

  return (
    <Screen scroll={false} dismissKeyboardOnTap={false} style={styles.screenNoPad}>
      <Animated.FlatList
        data={result.isLoading ? [] : notifications}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor="#9E7F60"
            colors={['#9E7F60']}
          />
        }
        renderItem={({ item: notification, index }) => {
          const isUnread = !notification.read_at;
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 6) * 35).duration(220)}
              layout={LAYOUT_SPRING}
              style={styles.cardRow}
            >
              <Card style={[styles.card, isUnread ? styles.unreadCard : styles.readCard]}>
                <SpringPressable
                  onPress={() => {
                    if (isUnread)
                      void collaborationApi.readNotification(notification.id).then(() => {
                        void client.invalidateQueries({
                          queryKey: queryKeys.unreadCount,
                        });
                        return client.invalidateQueries({
                          queryKey: ['notifications'],
                        });
                      });
                    handleNotificationData(notification.data);
                  }}
                  pressScale={0.975}
                  haptic="light"
                  style={styles.notificationItem}
                >
                  <View
                    style={[
                      styles.statusIconCircle,
                      isUnread ? styles.statusUnread : styles.statusRead,
                    ]}
                  >
                    <Ionicons
                      name={isUnread ? 'notifications' : 'notifications-outline'}
                      size={16}
                      color={isUnread ? '#9E7F60' : colors.secondaryText}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationMeta}>
                      <AppText
                        variant="cardTitle"
                        style={[
                          styles.notificationTitle,
                          isUnread && styles.fontWeightBold,
                        ]}
                      >
                        {notification.title}
                      </AppText>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>
                    <AppText muted={!isUnread} style={styles.notificationBody}>
                      {notification.body}
                    </AppText>
                  </View>
                </SpringPressable>

                {isUnread && (
                  <SpringPressable
                    onPress={() =>
                      void collaborationApi.readNotification(notification.id).then(() => {
                        haptic.success();
                        void client.invalidateQueries({
                          queryKey: queryKeys.unreadCount,
                        });
                        return client.invalidateQueries({
                          queryKey: ['notifications'],
                        });
                      })
                    }
                    pressScale={0.94}
                    haptic="selection"
                    style={styles.markReadBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t('notifications.markAsRead')}
                  >
                    <Ionicons name="checkmark" size={14} color={colors.primaryText} />
                    <AppText style={styles.markReadText}>
                      {t('notifications.markAsRead')}
                    </AppText>
                  </SpringPressable>
                )}
              </Card>
            </Animated.View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pillPressable: {
    borderRadius: radius.pill,
  },
  readAllBtn: {
    height: 38,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
  },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  screenNoPad: {
    padding: 0,
    paddingBottom: 0,
  },
  listHeaderWrap: {
    gap: spacing.md,
  },
  cardRow: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  headerCategory: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.secondaryText,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md + 2,
    gap: spacing.md,
  },
  emptyCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyIconContainer: {
    marginBottom: spacing.md,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glass,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.secondaryText,
    textAlign: 'center',
    maxWidth: 280,
  },
  notificationsList: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  unreadCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(17, 17, 16, 0.12)',
    ...shadows.card,
  },
  readCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderColor: colors.border,
    ...shadows.glass,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  statusIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  statusUnread: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: 'rgba(158, 127, 96, 0.25)',
  },
  statusRead: {
    backgroundColor: colors.surfaceSecondary,
  },
  notificationContent: {
    flex: 1,
    gap: 2,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  notificationTitle: {
    fontSize: 15,
    color: colors.primaryText,
    fontWeight: '600',
    flex: 1,
  },
  fontWeightBold: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#9E7F60',
    marginLeft: spacing.xs,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.secondaryText,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  markReadText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryText,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
