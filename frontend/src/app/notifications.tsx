import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Screen, SectionHeader } from '@/components/ui';
import { colors, mono, spacing, radius } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';
import { useNotifications } from '@/features/collaboration/hooks';
import { handleNotificationData } from '@/features/notifications/navigation';

const { width } = Dimensions.get('window');

export default function NotificationsScreen() {
  const result = useNotifications();
  const client = useQueryClient();
  const notifications = result.data?.data ?? [];

  return (
    <Screen scroll={true} backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />

      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={mono.ink} />
        </Pressable>

        {notifications.some((n) => !n.read_at) && (
          <Pressable
            onPress={() =>
              void collaborationApi
                .readAllNotifications()
                .then(() => client.invalidateQueries({ queryKey: ['notifications'] }))
            }
            style={({ pressed }) => [styles.readAllBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Tümünü okundu yap"
          >
            <AppText style={styles.readAllText}>Tümünü oku</AppText>
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.header}>
          <AppText variant="caption" muted style={styles.headerCategory}>
            GÜNCELLEMELER
          </AppText>
          <AppText variant="largeTitle" style={styles.title}>
            Bildirimler
          </AppText>
        </View>

        {result.isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={mono.ink} />
          </View>
        ) : notifications.length === 0 ? (
          /* Custom Premium Empty State */
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={38} color={mono.paper} />
                <View style={styles.emptyBadge} />
              </View>
            </View>
            <AppText variant="sectionTitle" style={styles.emptyTitle}>
              Bildirim yok
            </AppText>
            <AppText muted style={styles.emptySubtitle}>
              Her şey güncel! Yeni ortak planlar veya güncellemeler olduğunda burada
              görebilirsin.
            </AppText>
          </Card>
        ) : (
          <View style={styles.notificationsList}>
            <SectionHeader title={`${notifications.length} güncelleme`} />
            {notifications.map((notification) => {
              const isUnread = !notification.read_at;
              return (
                <Card
                  key={notification.id}
                  style={[styles.card, isUnread && styles.unreadCard]}
                >
                  <Pressable
                    onPress={() => {
                      if (isUnread)
                        void collaborationApi
                          .readNotification(notification.id)
                          .then(() =>
                            client.invalidateQueries({ queryKey: ['notifications'] }),
                          );
                      handleNotificationData(notification.data);
                    }}
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
                        color={isUnread ? colors.accent : colors.secondaryText}
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
                  </Pressable>

                  {isUnread && (
                    <Pressable
                      onPress={() =>
                        void collaborationApi
                          .readNotification(notification.id)
                          .then(() =>
                            client.invalidateQueries({ queryKey: ['notifications'] }),
                          )
                      }
                      style={({ pressed }) => [
                        styles.markReadBtn,
                        pressed && styles.btnPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Okundu işaretle"
                    >
                      <Ionicons name="checkmark" size={14} color={colors.accent} />
                      <AppText style={styles.markReadText}>Okundu işaretle</AppText>
                    </Pressable>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contourTop: {
    position: 'absolute',
    top: -150,
    right: -155,
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.75,
  },
  contourBottom: {
    position: 'absolute',
    bottom: -160,
    left: -185,
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.5,
  },
  headerBar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mono.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: mono.ink,
  },
  readAllBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: mono.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: mono.ink,
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: mono.ink,
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
  header: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  headerCategory: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: mono.ink,
  },
  title: {
    fontSize: width > 400 ? 26 : 22,
    lineHeight: width > 400 ? 32 : 28,
    fontWeight: '800',
    color: mono.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: spacing.xl,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)',
      },
    }),
  },
  emptyIconContainer: {
    marginBottom: spacing.md,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyBadge: {
    position: 'absolute',
    top: 18,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: mono.ink,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: mono.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  notificationsList: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  unreadCard: {
    borderColor: 'rgba(200, 103, 75, 0.15)',
    backgroundColor: colors.surface,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 32px rgba(200, 103, 75, 0.06)',
      },
    }),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  statusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusUnread: {
    backgroundColor: colors.accentSoft,
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
  },
  fontWeightBold: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: spacing.xs,
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
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
