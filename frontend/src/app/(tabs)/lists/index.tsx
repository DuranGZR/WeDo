import { Ionicons } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  Platform,
  Dimensions,
} from 'react-native';
import { AppText, Card, EmptyState, Screen } from '@/components/ui';
import { colors, mono, radius, spacing } from '@/design-system';
import { useSpaceMembers } from '@/features/collaboration/hooks';
import { useLists } from '@/features/lists/hooks';
import { useSpaces } from '@/features/spaces/hooks';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';
import { itemsApi } from '@/features/items/api';
import { metadataRefreshInterval } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { getItemPreviewImage } from '@/components/domain/ItemCard';

const { width } = Dimensions.get('window');

function PendingAvatar() {
  return (
    <View
      accessible
      accessibilityLabel="Partner avatarı, davet bekleniyor"
      style={styles.pendingAvatar}
    >
      <AppText style={styles.pendingInitial}>?</AppText>
    </View>
  );
}

function MemberAvatar({ member, fallback }: { member?: any; fallback?: string }) {
  return <MonoAvatar name={member?.display_name ?? fallback ?? 'Kullanıcı'} size={28} />;
}

function MonoAvatar({ name, size = 28 }: { name?: string; size?: number }) {
  return (
    <View
      style={[styles.monoAvatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <AppText style={[styles.monoAvatarText, { fontSize: Math.max(10, size * 0.42) }]}>
        {name?.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
      </AppText>
    </View>
  );
}

function formatRelativeTime(value: string) {
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (diffMinutes < 1) return 'şimdi';
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  return `${Math.floor(diffHours / 24)} gün önce`;
}

export default function ListsScreen() {
  const user = useAuthStore((state) => state.user);
  const spaces = useSpaces();
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const setSelectedSpaceId = useSpaceStore((state) => state.setSelectedSpaceId);
  const [spaceSheetOpen, setSpaceSheetOpen] = useState(false);
  const space =
    spaces.data?.data.find((entry) => entry.id === selectedSpaceId) ??
    spaces.data?.data[0];
  const lists = useLists(space?.id ?? '');
  const entries = lists.data?.data ?? [];
  const members = useSpaceMembers(space?.id ?? '');
  const itemQueries = useQueries({
    queries: entries.map((list) => ({
      queryKey: ['lists', list.id, 'items'],
      queryFn: () => itemsApi.list(list.id),
      enabled: Boolean(list.id),
      refetchOnMount: 'always',
      refetchInterval: (query: { state: { data?: { data: Item[] } } }) =>
        metadataRefreshInterval(query.state.data?.data),
    })),
  });

  const needsInvite = Boolean(
    space && members.isSuccess && (members.data?.data.length ?? 0) < 2,
  );
  const allItems = itemQueries.flatMap((query) => query.data?.data ?? []);
  const today = new Date().toDateString();
  const newItemsToday = allItems.filter(
    (item) => new Date(item.created_at).toDateString() === today,
  ).length;
  const activitySummary = `${entries.length} liste · ${newItemsToday} yeni içerik`;

  return (
    <Screen
      scroll={true}
      backgroundColor={mono.background}
      contentContainerStyle={styles.screen}
    >
      <View style={styles.contourTop} pointerEvents="none" />
      {/* Top Bar Header */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Alan değiştir"
          onPress={() => setSpaceSheetOpen(true)}
          style={styles.spaceSelector}
        >
          <View style={styles.spaceCover}>
            <Ionicons name="sparkles" size={17} color={mono.paper} />
          </View>
          <View style={styles.spaceSelectorBody}>
            <View style={styles.spaceTitleRow}>
              <AppText variant="cardTitle" style={styles.spaceTitle}>
                {space?.name ?? 'Ortak alan'}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={mono.ink} />
            </View>
            <View style={styles.memberRow}>
              <MonoAvatar
                name={members.data?.data[0]?.display_name ?? 'Duran'}
                size={26}
              />
              {members.data?.data.length && members.data.data.length > 1 ? (
                <MemberAvatar member={members.data.data[1]} />
              ) : (
                <PendingAvatar />
              )}
              <AppText variant="caption" muted>
                {needsInvite ? '1 kişi bekleniyor' : 'Ortak alan'}
              </AppText>
            </View>
          </View>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bildirimler"
            onPress={() => router.push('/notifications')}
            style={styles.headerIconButton}
          >
            <Ionicons name="notifications-outline" size={21} color={mono.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil"
            onPress={() => router.push('/profile')}
          >
            <MonoAvatar name={user?.display_name ?? 'Duran'} size={40} />
          </Pressable>
        </View>
      </View>

      {/* Loader for first fetch */}
      {spaces.isLoading || lists.isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={mono.ink} />
        </View>
      ) : !space ? (
        <EmptyState
          title="Önce bir alan oluştur"
          description="Ortak listeler alanların içinde yaşar."
          action="Alan oluştur"
          onAction={() => router.push('/space/create')}
        />
      ) : (
        <>
          {/* Dashboard Premium Space Banner Card */}
          <Card style={styles.bannerCard}>
            <View style={styles.bannerGlow} />

            <View style={styles.bannerTop}>
              <View style={styles.spaceBadge}>
                <Ionicons name="shapes-outline" size={14} color={mono.paper} />
                <AppText style={styles.spaceBadgeText}>{space.name}</AppText>
              </View>
              <AppText style={styles.bannerTitle}>Bugün alanında neler var?</AppText>
            </View>

            <AppText style={styles.bannerDescription}>{activitySummary}</AppText>

            <Pressable
              onPress={() => router.push(`/list/create?spaceId=${space.id}`)}
              style={({ pressed }) => [
                styles.bannerButton,
                pressed && styles.bannerButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Yeni liste oluştur"
            >
              <Ionicons name="add" size={16} color={mono.paper} />
              <AppText style={styles.bannerButtonText}>Yeni Liste Ekle</AppText>
            </Pressable>
          </Card>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitleText}>Aktif Listeleriniz</AppText>
            <View style={styles.badgeCount}>
              <AppText style={styles.badgeCountText}>{entries.length}</AppText>
            </View>
          </View>

          {/* Lists Entries */}
          {entries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="albums-outline" size={32} color={mono.paper} />
                <View style={styles.emptyBadge} />
              </View>
              <AppText variant="sectionTitle" style={styles.emptyTitle}>
                İlk listenizi oluşturun
              </AppText>
              <AppText muted style={styles.emptySubtitle}>
                Gidilecek yerler, izlenecek filmler veya ortak hedefleriniz için bir liste
                açın.
              </AppText>
            </Card>
          ) : (
            <View style={styles.listContainer}>
              {entries.map((list, index) => {
                const items = itemQueries[index]?.data?.data ?? [];
                const previews = items.slice(0, 4);
                const latestItem = items[0];
                return (
                  <View key={list.id} style={styles.cardPressable}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${list.name} listesini aç`}
                      onPress={() => router.push(`/list/${list.id}`)}
                      style={({ pressed }) => [pressed && styles.cardPressed]}
                    >
                      <Card style={styles.card}>
                        <View style={styles.previewGrid}>
                          {Array.from({ length: 4 }).map((_, previewIndex) => {
                            const item = previews[previewIndex];
                            return item ? (
                              <Image
                                key={item.id}
                                source={{ uri: getItemPreviewImage(item) }}
                                style={styles.previewTile}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                key={`empty-${previewIndex}`}
                                style={[styles.previewTile, styles.emptyPreviewTile]}
                              />
                            );
                          })}
                        </View>
                        <View style={styles.body}>
                          <AppText variant="cardTitle" style={styles.cardName}>
                            {list.name}
                          </AppText>
                          <AppText
                            muted
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={styles.cardMeta}
                          >
                            {latestItem
                              ? `${latestItem.created_by_name ?? 'Birisi'} ekledi · ${formatRelativeTime(latestItem.created_at)}`
                              : '0 içerik'}
                          </AppText>
                        </View>
                      </Card>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${list.name} listesine içerik ekle`}
                      hitSlop={8}
                      onPress={() => router.push(`/item/create?listId=${list.id}`)}
                      style={({ pressed }) => [
                        styles.quickAddButton,
                        pressed && styles.quickAddButtonPressed,
                      ]}
                    >
                      <Ionicons name="add" size={18} color={mono.paper} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      <Modal
        visible={spaceSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSpaceSheetOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSpaceSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <AppText variant="sectionTitle">Alan değiştir</AppText>
            {(spaces.data?.data ?? []).map((entry) => (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityLabel={`${entry.name} alanını seç`}
                onPress={() => {
                  setSelectedSpaceId(entry.id);
                  setSpaceSheetOpen(false);
                }}
                style={styles.sheetRow}
              >
                <View style={styles.listIcon}>
                  <Ionicons name="people-outline" size={19} color={mono.paper} />
                </View>
                <AppText variant="cardTitle">{entry.name}</AppText>
                {entry.id === space?.id ? (
                  <Ionicons name="checkmark" size={20} color={mono.ink} />
                ) : null}
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSpaceSheetOpen(false);
                router.push('/space/create');
              }}
              style={({ pressed }) => [
                styles.sheetCreateButton,
                pressed && styles.cardPressed,
              ]}
            >
              <AppText style={styles.sheetCreateText}>Yeni alan oluştur</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles: any = StyleSheet.create({
  contourTop: {
    position: 'absolute',
    top: -165,
    right: -165,
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.7,
  },
  screen: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 128,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: width > 400 ? 30 : 26,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.8,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  bannerCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
    gap: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)',
      },
    }),
  },
  bannerGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: mono.ink,
    opacity: 0.35,
    ...Platform.select({
      web: { filter: 'blur(30px)' },
    }),
  },
  bannerTop: {
    gap: spacing.xs,
  },
  spaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mono.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    gap: 4,
  },
  spaceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: mono.paper,
  },
  bannerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: mono.ink,
    letterSpacing: -0.3,
  },
  bannerDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: mono.muted,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 4,
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 0px rgba(0, 0, 0, 0.16)',
      },
    }),
  },
  bannerButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  bannerButtonText: {
    color: mono.paper,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitleText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: mono.ink,
  },
  badgeCount: {
    backgroundColor: mono.soft,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: mono.muted,
  },
  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)',
      },
    }),
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  emptyBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mono.ink,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.secondaryText,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.xs,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: 110, // Avoid bottom tab bar overlap
  },
  cardPressable: {
    width: '48%',
    position: 'relative',
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  card: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: spacing.sm,
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 0px rgba(0, 0, 0, 0.12)',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
      },
    }),
  },
  previewGrid: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: mono.soft,
  },
  previewTile: {
    width: '49%',
    height: '49%',
    backgroundColor: mono.soft,
  },
  emptyPreviewTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: mono.ink,
  },
  cardMeta: {
    fontSize: 11,
    lineHeight: 15,
    color: mono.muted,
    marginRight: 28,
  },
  quickAddButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  quickAddButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.92 }],
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20, 20, 18, 0.35)',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: mono.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: mono.ink,
  },
  sheetRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: mono.soft,
  },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  spaceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 58,
    padding: 6,
    paddingRight: spacing.md,
    borderRadius: 18,
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  spaceCover: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  spaceSelectorBody: { gap: 2 },
  spaceTitle: { fontSize: 16, lineHeight: 20, letterSpacing: -0.2 },
  spaceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pendingAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: mono.ink,
  },
  pendingInitial: { color: mono.ink, fontSize: 11, fontWeight: '600' },
  monoAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  monoAvatarText: { color: mono.paper, fontWeight: '800' },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  sheetCreateButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: mono.ink,
  },
  sheetCreateText: { color: mono.paper, fontWeight: '800', fontSize: 14 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
