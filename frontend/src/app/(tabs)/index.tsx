import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppText, Button, Card, EmptyState, HomeScreenSkeleton, Screen } from '@/components/ui';
import { ScreenMotion } from '@/components/motion/ScreenMotion';
import { useToast } from '@/components/feedback/AppToast';
import { colors, mono, radius, spacing } from '@/design-system';
import { collaborationApi, type SpaceMember } from '@/features/collaboration/api';
import { useSpaceMembers } from '@/features/collaboration/hooks';
import { itemsApi } from '@/features/items/api';
import { metadataRefreshInterval } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { useCreateList, useLists } from '@/features/lists/hooks';
import type { List } from '@/features/lists/types';
import { useSpaces } from '@/features/spaces/hooks';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';
import { getItemPreviewImage, getItemSourceLabel, getItemFallbackImage } from '@/components/domain/ItemCard';

const homeColors = {
  background: '#CFCFCD',
  ink: '#090909',
  paper: '#FFFFFF',
  line: '#8D8D8B',
  border: '#090909',
  borderSubtle: 'rgba(9, 9, 9, 0.12)',
  muted: '#5F5F5D',
  subtle: '#8D8D8B',
  soft: '#E7E7E5',
} as const;

const listTemplates = [
  { name: 'Gidilecek Yerler', icon: 'map-outline', color: '#E7E7E5' },
  { name: 'İzlenecekler', icon: 'film-outline', color: '#D9D9D7' },
  { name: 'Alınacaklar', icon: 'cart-outline', color: '#EDEDEC' },
  { name: 'Yapılacaklar', icon: 'checkbox-outline', color: '#D1D1CF' },
] as const;

function Preview({
  item,
  compact = false,
  height,
}: {
  item?: Item;
  compact?: boolean;
  height?: number;
}) {
  const [imageError, setImageError] = useState(false);
  const previewStyle = [
    styles.preview,
    compact && styles.previewCompact,
    height !== undefined && { height },
  ];

  if (item) {
    const rawUrl = getItemPreviewImage(item);
    const imageUrl = imageError ? getItemFallbackImage(item) : rawUrl;
    return (
      <Image
        source={{ uri: imageUrl }}
        style={previewStyle}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <View style={[previewStyle, styles.fallbackPreview]}>
      <Ionicons name="bookmark-outline" size={compact ? 20 : 24} color={homeColors.ink} />
      <AppText variant="caption" style={styles.previewLabel} numberOfLines={1}>
        WeDo
      </AppText>
    </View>
  );
}
function PendingAvatar({ size = 26 }: { size?: number }) {
  return (
    <View
      accessible
      accessibilityLabel="Partner avatarı, davet bekleniyor"
      style={[
        styles.pendingAvatar,
        size !== 26 && { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <AppText style={[styles.pendingInitial, { fontSize: Math.max(8, size * 0.42) }]}>?</AppText>
    </View>
  );
}

function MonoAvatar({
  name,
  size = 28,
  radius,
}: {
  name?: string | null;
  size?: number;
  radius?: number;
}) {
  const borderRadius = radius !== undefined ? radius : size / 2;
  return (
    <View
      accessible
      accessibilityLabel={`${name ?? 'Kullanıcı'} avatarı`}
      style={[styles.monoAvatar, { width: size, height: size, borderRadius }]}
    >
      <AppText style={[styles.monoAvatarText, { fontSize: Math.max(9, size * 0.4) }]}>
        {name?.trim().charAt(0).toUpperCase() ?? 'W'}
      </AppText>
    </View>
  );
}

function MemberAvatar({
  member,
  fallback,
  size = 28,
}: {
  member?: SpaceMember;
  fallback?: string;
  size?: number;
}) {
  return <MonoAvatar name={member?.display_name ?? fallback ?? 'Kullanıcı'} size={size} />;
}

function getDailyMessage(items: Item[]) {
  const now = new Date();
  const todayItems = items.filter(
    (item) => new Date(item.created_at).toDateString() === now.toDateString(),
  );
  if (todayItems.length > 0) return `Bugün ${todayItems.length} yeni içerik eklendi.`;
  if (now.getHours() < 12) return 'Güne birlikte bir fikir ekleyerek başlayın.';
  if (now.getHours() < 18) return 'Öğleden sonra için yeni bir keşif ekleyin.';
  return 'Akşam planınıza bir şeyler eklemeye ne dersiniz?';
}

function formatRelativeTime(value: string) {
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (diffMinutes < 1) return 'şimdi';
  if (diffMinutes < 60) return `${diffMinutes} dk`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa`;
  return `${Math.floor(diffHours / 24)} gün`;
}

function getHomeListStyle(name: string) {
  const lower = name.toLocaleLowerCase('tr-TR');
  if (lower.includes('izle') || lower.includes('film') || lower.includes('dizi')) {
    return {
      icon: 'film-outline' as const,
      backgroundColor: '#D9D9D7',
      color: homeColors.ink,
    };
  }
  if (lower.includes('alın') || lower.includes('alışveriş') || lower.includes('market')) {
    return {
      icon: 'cart-outline' as const,
      backgroundColor: '#EDEDEC',
      color: homeColors.ink,
    };
  }
  if (lower.includes('yap') || lower.includes('hedef')) {
    return {
      icon: 'checkbox-outline' as const,
      backgroundColor: '#D1D1CF',
      color: homeColors.ink,
    };
  }
  return {
    icon: 'map-outline' as const,
    backgroundColor: '#E7E7E5',
    color: homeColors.ink,
  };
}

function QuickSaveCard() {
  const contentTypes = [
    { label: 'Video', icon: 'videocam-outline', color: '#F4F4F5' },
    { label: 'Mekân', icon: 'location-outline', color: '#F4F4F5' },
    { label: 'Ürün', icon: 'cube-outline', color: '#F4F4F5' },
    { label: 'Etkinlik', icon: 'calendar-outline', color: '#F4F4F5' },
  ] as const;
  return (
    <View style={styles.quickSaveWrap}>
      <Card style={styles.quickSave}>
        <View style={styles.typeRow}>
          {contentTypes.map((type) => (
            <View
              key={type.label}
              style={[styles.typeTile, { backgroundColor: type.color }]}
            >
              <Ionicons name={type.icon} size={18} color={homeColors.ink} />
              <AppText variant="caption">{type.label}</AppText>
            </View>
          ))}
        </View>
        <AppText style={styles.quickSaveTitle}>İlk ortak kaydınızı ekleyin</AppText>
        <AppText style={styles.quickSaveDescription}>
          Bir içerikte Paylaş’a dokunup WeDo’yu seçin.
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nasıl kaydedilir"
          onPress={() => router.push('/(onboarding)/share-tutorial')}
          style={({ pressed }) => [styles.monoPrimaryButton, pressed && styles.pressed]}
        >
          <AppText style={styles.monoPrimaryButtonText}>Nasıl kaydedilir?</AppText>
          <Ionicons name="arrow-forward" size={17} color={homeColors.paper} />
        </Pressable>
      </Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bağlantıyı elle ekle"
        onPress={() => router.push('/item/create')}
        style={styles.manualLink}
      >
        <AppText variant="caption" style={styles.manualLinkText}>
          Bağlantıyı elle ekle
        </AppText>
      </Pressable>
    </View>
  );
}

function InviteCard({ spaceId }: { spaceId: string }) {
  return (
    <View style={styles.inviteCard}>
      <View style={styles.inviteContent}>
        <View style={styles.inviteAvatarWrap}>
          <PendingAvatar size={34} />
          <View style={styles.plusBadge}>
            <Ionicons name="add" size={10} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.inviteBody}>
          <View style={styles.inviteStatus}>
            <View style={styles.inviteStatusDot} />
            <AppText variant="caption" style={styles.inviteStatusText}>
              Davet bekleniyor
            </AppText>
          </View>
          <AppText style={styles.inviteCardTitle}>Partnerini davet et</AppText>
          <AppText variant="caption" style={styles.inviteCardDesc}>
            Kaydettiklerinize birlikte karar verin.
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Davet et"
          onPress={() => router.push(`/(onboarding)/invite-member?spaceId=${spaceId}`)}
          style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
        >
          <AppText variant="caption" style={styles.inviteButtonText}>
            Davet et
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ListTemplates({
  spaceId,
  createList,
  existingLists,
}: {
  spaceId: string;
  createList: (name: string) => void;
  existingLists: List[];
}) {
  const availableTemplates = listTemplates.filter(
    (template) =>
      !existingLists.some(
        (list) => list.name.trim().toLowerCase() === template.name.trim().toLowerCase(),
      ),
  );

  if (availableTemplates.length === 0) {
    return null;
  }

  const hasCreatedLists = existingLists.length > 0;

  return (
    <View style={styles.templateSection}>
      {hasCreatedLists ? (
        <AppText style={styles.templateIntroHeader}>
          Önerilen şablonlar ile hızlıca ekle:
        </AppText>
      ) : (
        <>
          <View style={styles.templateSectionHeader}>
            <View style={styles.homeSectionTitleWrap}>
              <View style={styles.sectionHeaderIconBadge}>
                <Ionicons name="albums" size={13} color={homeColors.paper} />
              </View>
              <AppText style={styles.templateSectionTitle}>Ortak listeler</AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yeni liste oluştur"
              onPress={() => router.push(`/list/create?spaceId=${spaceId}`)}
              style={styles.templateAddAction}
            >
              <Ionicons name="add" size={16} color={homeColors.ink} />
              <AppText style={styles.templateAddActionText}>Yeni liste</AppText>
            </Pressable>
          </View>
          <AppText style={styles.templateIntro}>
            Hızlıca başlamak için bir şablon seçin:
          </AppText>
        </>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScrollView}
        contentContainerStyle={styles.templateRow}
      >
        {availableTemplates.map((template) => (
          <Pressable
            key={template.name}
            accessibilityRole="button"
            accessibilityLabel={`${template.name} listesi oluştur`}
            onPress={() => createList(template.name)}
            style={({ pressed }) => [
              styles.templateCard,
              { backgroundColor: template.color },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.templateHeader}>
              <Ionicons name={template.icon} size={20} color={colors.primaryText} />
              <View style={styles.templatePlusBadge}>
                <Ionicons name="add" size={10} color={colors.primaryText} />
              </View>
            </View>
            <AppText variant="caption" style={styles.templateCardName}>
              {template.name}
            </AppText>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kendin oluştur"
          onPress={() => router.push(`/list/create?spaceId=${spaceId}`)}
          style={({ pressed }) => [styles.customTemplate, pressed && styles.pressed]}
        >
          <View style={styles.templateHeader}>
            <Ionicons name="add-outline" size={20} color={homeColors.ink} />
          </View>
          <AppText variant="caption" style={styles.customTemplateText}>
            Kendin oluştur
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ListRow({
  list,
  count,
  memberNames,
  onPress,
}: {
  list: List;
  count: number;
  memberNames: string[];
  onPress: () => void;
}) {
  const listStyle = getHomeListStyle(list.name);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${list.name} listesini aç`}
      onPress={onPress}
      style={({ pressed }) => [styles.listRowPressable, pressed && styles.listRowPressed]}
    >
      <View style={styles.listRow}>
        <View style={[styles.listIcon, { backgroundColor: listStyle.backgroundColor }]}>
          <Ionicons name={listStyle.icon} size={16} color={listStyle.color} />
        </View>
        <View style={styles.listBody}>
          <AppText style={styles.homeListName}>
            {list.name}
          </AppText>
          <AppText style={styles.homeListCount}>
            {count} kayıt
          </AppText>
        </View>
        {memberNames.length >= 2 ? (
          <View style={styles.memberStack}>
            {memberNames.slice(0, 2).map((name, index) => (
              <View
                key={`${name}-${index}`}
                style={[styles.memberStackItem, index > 0 && styles.memberStackOverlap]}
              >
                <MonoAvatar name={name} size={20} />
              </View>
            ))}
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={14} color={homeColors.ink} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const spaces = useSpaces();
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const setSelectedSpaceId = useSpaceStore((state) => state.setSelectedSpaceId);
  const [spaceSheetOpen, setSpaceSheetOpen] = useState(false);
  const space =
    spaces.data?.data.find((entry) => entry.id === selectedSpaceId) ??
    spaces.data?.data[0];

  useEffect(() => {
    if (spaces.isSuccess && spaces.data?.data.length === 0 && !selectedSpaceId) {
      router.replace('/space/create');
    }
  }, [spaces.isSuccess, spaces.data?.data, selectedSpaceId]);

  const lists = useLists(space?.id ?? '');
  const listEntries = lists.data?.data ?? [];
  const members = useSpaceMembers(space?.id ?? '');
  const spaceMemberQueries = useQueries({
    queries: spaceSheetOpen
      ? (spaces.data?.data ?? []).map((entry) => ({
          queryKey: ['spaces', entry.id, 'members'],
          queryFn: () => collaborationApi.members(entry.id),
        }))
      : [],
  });
  const createList = useCreateList(space?.id ?? '');
  const itemQueries = useQueries({
    queries: listEntries.map((list) => ({
      queryKey: ['lists', list.id, 'items'],
      queryFn: () => itemsApi.list(list.id),
      enabled: Boolean(list.id),
      refetchOnMount: 'always',
      refetchInterval: (query: { state: { data?: { data: Item[] } } }) =>
        metadataRefreshInterval(query.state.data?.data),
    })),
  });
  const allItems = useMemo(
    () => itemQueries.flatMap((query) => query.data?.data ?? []),
    [itemQueries],
  );
  const recentItems = useMemo(
    () =>
      [...allItems]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 6),
    [allItems],
  );
  const hasContent = allItems.length > 0;
  const isContentLoading = itemQueries.some((query) => query.isLoading);
  const needsInvite = Boolean(
    space && members.isSuccess && (members.data?.data.length ?? 0) < 2,
  );
  const memberNames = (members.data?.data ?? []).map((member) => member.display_name);
  const spaceLabel = space?.name ?? 'Ortak alan';
  const memberLabel = needsInvite
    ? 'Davet bekleniyor'
    : (members.data?.data ?? [])
        .slice(0, 2)
        .map((member) => member.display_name)
        .join(' · ');
  const dailyMessage = getDailyMessage(allItems);
  const { width: windowWidth } = useWindowDimensions();
  const recentCardWidth = useMemo(() => {
    if (windowWidth > 640) return 168;
    // Show 2 full cards and ~40-50% peek of the 3rd card on mobile
    return Math.min(160, Math.max(130, Math.floor((windowWidth - 44) / 2.45)));
  }, [windowWidth]);
  const recentImageHeight = recentCardWidth < 155 ? 94 : 104;

  const createTemplateList = (name: string) => {
    createList.mutate(name, {
      onSuccess: (list) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast({
          title: 'Liste oluşturuldu',
          message: `${name} listen hazır.`,
          actionLabel: 'Aç',
          onAction: () => router.push(`/list/${list.id}`),
        });
      },
      onError: (error: any) => {

        const isConflict = error?.message?.includes('409') || error?.status === 409;
        Alert.alert(
          'Liste oluşturulamadı',
          isConflict ? 'Bu isimde bir liste zaten mevcut.' : 'Tekrar deneyin.',
        );
      },
    });
  };

  if (spaces.isLoading || (Boolean(space?.id) && lists.isLoading))
    return (
      <Screen backgroundColor={homeColors.background}>
        <HomeScreenSkeleton />
      </Screen>
    );

  if (spaces.isError && !spaces.data)
    return (
      <Screen backgroundColor={homeColors.background}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Bağlantı Kurulamadı"
          description="Sunucuyla iletişim kurulurken bir sorun oluştu. Lütfen internet bağlantını kontrol et."
          action="Yeniden Dene"
          onAction={() => void spaces.refetch()}
        />
      </Screen>
    );

  return (
    <ScreenMotion>
      <Screen backgroundColor={homeColors.background} contentContainerStyle={styles.screen}>
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
                name={user?.display_name || user?.email?.split('@')[0] || 'Kullanıcı'}
                size={26}
              />
              {(() => {
                const partner = members.data?.data?.find((m) => m.user_id !== user?.id);
                return partner ? (
                  <MemberAvatar member={partner} size={26} />
                ) : (
                  <PendingAvatar />
                );
              })()}
              <AppText variant="caption" muted>
                {memberLabel}
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
            <MonoAvatar name={user?.display_name || user?.email?.split('@')[0] || 'Kullanıcı'} size={40} />
          </Pressable>
        </View>
      </View>
      <View style={styles.greeting}>
        <AppText style={styles.greetingSub}>
          Merhaba, {user?.display_name || user?.email?.split('@')[0] || 'Kullanıcı'}
        </AppText>
        <AppText style={styles.heroTitle}>
          Neler planlıyoruz?
        </AppText>
        <AppText style={styles.dailyMessage}>
          {dailyMessage}
        </AppText>
      </View>

      {!space ? (
        <Card style={styles.noSpace}>
          <AppText variant="sectionTitle">İlk ortak alanınızı oluşturun</AppText>
          <Button label="Alan oluştur" onPress={() => router.push('/space/create')} />
        </Card>
      ) : !hasContent && !isContentLoading ? (
        <>
          <QuickSaveCard />
          {needsInvite && <InviteCard spaceId={space.id} />}

          {listEntries.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <View style={styles.templateSectionHeader}>
                <View style={styles.homeSectionTitleWrap}>
                  <View style={styles.sectionHeaderIconBadge}>
                    <Ionicons name="albums" size={13} color={homeColors.paper} />
                  </View>
                  <AppText style={styles.templateSectionTitle}>Ortak listeler</AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Yeni liste oluştur"
                  onPress={() => router.push(`/list/create?spaceId=${space.id}`)}
                  style={styles.templateAddAction}
                >
                  <Ionicons name="add" size={16} color={homeColors.ink} />
                  <AppText style={styles.templateAddActionText}>Yeni liste</AppText>
                </Pressable>
              </View>
              <View style={styles.listCard}>
                {listEntries.map((list, index) => {
                  const query = itemQueries[index];
                  const count = query?.data?.data?.length ?? 0;
                  const isLast = index === listEntries.length - 1;
                  return (
                    <View key={list.id}>
                      <ListRow
                        list={list}
                        count={count}
                        memberNames={memberNames}
                        onPress={() => router.push(`/list/${list.id}`)}
                      />
                      {!isLast && <View style={styles.listDivider} />}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <ListTemplates
            spaceId={space.id}
            createList={createTemplateList}
            existingLists={listEntries}
          />
        </>
      ) : (
        <>
          <View style={styles.homeSectionHeader}>
            <View style={styles.homeSectionTitleWrap}>
              <View style={styles.sectionHeaderIconBadge}>
                <Ionicons name="time-outline" size={18} color={homeColors.ink} />
              </View>
              <AppText style={styles.homeSectionTitle}>Son eklenenler</AppText>
            </View>
            <Pressable
              onPress={() => router.push('/lists')}
              style={styles.homeSectionAction}
            >
              <AppText style={styles.homeSectionActionText}>Tümünü gör</AppText>
              <Ionicons name="chevron-forward" size={13} color={homeColors.muted} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScrollView}
            contentContainerStyle={styles.horizontalList}
          >
            {recentItems.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title ?? 'İçerik'} detayını aç`}
                onPress={() => router.push(`/item/${item.id}`)}
                style={({ pressed }) => [
                  styles.recentCardWrapper,
                  { width: recentCardWidth },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.recentCard}>
                  <View style={[styles.recentPreviewWrap, { height: recentImageHeight }]}>
                    <Preview item={item} height={recentImageHeight} />
                    <View style={styles.sourceBadge}>
                      <AppText style={styles.sourceBadgeText} numberOfLines={1}>
                        {getItemSourceLabel(item)}
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.recentCardContent}>
                    <AppText
                      numberOfLines={2}
                      style={styles.recentCardTitle}
                    >
                      {item.title ?? 'Kaydedilen içerik'}
                    </AppText>
                    <View style={styles.sourceRow}>
                      <AppText
                        variant="caption"
                        numberOfLines={1}
                        style={[styles.recentMeta, { flex: 1 }]}
                      >
                        {item.created_by_name} · {formatRelativeTime(item.created_at)}
                      </AppText>
                      <MonoAvatar name={item.created_by_name} size={18} />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.homeSectionHeader}>
            <View style={styles.homeSectionTitleWrap}>
              <View style={styles.sectionHeaderIconBadge}>
                <Ionicons name="albums-outline" size={18} color={homeColors.ink} />
              </View>
              <AppText style={styles.homeSectionTitle}>Ortak listeler</AppText>
            </View>
            <Pressable
              onPress={() =>
                router.push(
                  listEntries.length >= 2 ? '/lists' : `/list/create?spaceId=${space.id}`,
                )
              }
              style={styles.homeSectionAction}
            >
              <AppText style={styles.homeSectionActionText}>
                {listEntries.length >= 2 ? 'Tümünü gör' : 'Yeni liste'}
              </AppText>
              <Ionicons
                name={listEntries.length >= 2 ? 'chevron-forward' : 'add'}
                size={14}
                color={homeColors.muted}
              />
            </Pressable>
          </View>
          <View style={styles.listCard}>
            {listEntries.slice(0, 4).map((list, index) => {
              const query = itemQueries[index];
              const count = query?.data?.data?.length ?? 0;
              const isLast = index === Math.min(listEntries.length, 4) - 1;
              return (
                <View key={list.id}>
                  <ListRow
                    list={list}
                    count={count}
                    memberNames={memberNames}
                    onPress={() => router.push(`/list/${list.id}`)}
                  />
                  {!isLast && <View style={styles.listDivider} />}
                </View>
              );
            })}
          </View>
          {needsInvite && <InviteCard spaceId={space.id} />}
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
            <View style={styles.sheetHeading}>
              <View style={styles.sheetHeadingIcon}>
                <Ionicons name="sparkles" size={18} color={homeColors.paper} />
              </View>
              <View>
                <AppText style={styles.sheetTitle}>Alan değiştir</AppText>
                <AppText style={styles.sheetSubtitle}>
                  Birlikte karar vereceğin alanı seç.
                </AppText>
              </View>
            </View>
            {(spaces.data?.data ?? []).map((entry) => (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityLabel={`${entry.name} alanını seç`}
                onPress={() => {
                  setSelectedSpaceId(entry.id);
                  setSpaceSheetOpen(false);
                }}
                style={({ pressed }) => [
                  styles.sheetRow,
                  entry.id === space?.id && styles.sheetRowActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.sheetRowIcon}>
                  <Ionicons name="people-outline" size={19} color={homeColors.paper} />
                </View>
                <View style={styles.sheetRowBody}>
                  <AppText variant="cardTitle" style={styles.sheetRowTitle}>
                    {entry.name}
                  </AppText>
                  <AppText style={styles.sheetRowMeta}>
                    {(() => {
                      const memberQuery =
                        spaceMemberQueries[
                          (spaces.data?.data ?? []).findIndex((space) => space.id === entry.id)
                        ];
                      const entryMembers = memberQuery?.data?.data ?? [];
                      if (entryMembers.length > 0) {
                        return entryMembers.map((member) => member.display_name).join(' · ');
                      }
                      if (memberQuery?.isLoading) return 'Üyeler yükleniyor…';
                      return 'Davet bekleniyor';
                    })()}
                  </AppText>
                </View>
                {entry.id === space?.id && (
                  <Ionicons name="checkmark-circle" size={21} color={homeColors.ink} />
                )}
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
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="add" size={19} color={homeColors.paper} />
              <AppText style={styles.sheetCreateText}>Yeni alan oluştur</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      </Screen>
    </ScreenMotion>
  );
}

const styles = StyleSheet.create({
  contourTop: {
    display: 'none',
  },
  contourBottom: {
    display: 'none',
  },
  screen: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  greeting: { gap: 4, marginBottom: 22, marginTop: 4 },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
    color: homeColors.muted,
    letterSpacing: -0.1,
  },
  heroTitle: {
    color: homeColors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dailyMessage: { color: homeColors.muted, fontSize: 13, lineHeight: 18 },
  noSpace: { gap: spacing.md },
  quickSaveWrap: { marginBottom: spacing.xl },
  quickSave: {
    gap: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: homeColors.border,
    backgroundColor: homeColors.paper,
    ...Platform.select({ web: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' } }),
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeTile: {
    flex: 1,
    minHeight: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  manualLink: {
    alignSelf: 'center',
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  manualLinkText: {
    color: homeColors.ink,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  quickSaveTitle: {
    color: homeColors.ink,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  quickSaveDescription: { color: homeColors.muted, fontSize: 13, lineHeight: 19 },
  monoPrimaryButton: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: homeColors.ink,
  },
  monoPrimaryButtonText: { color: homeColors.paper, fontSize: 14, fontWeight: '700' },
  inviteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: homeColors.border,
    backgroundColor: homeColors.paper,
    marginBottom: spacing.xl,
    ...Platform.select({
      web: { boxShadow: '0px 5px 0px rgba(0, 0, 0, 0.12)' },
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 0,
      },
    }),
  },
  inviteStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  inviteStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  inviteStatusText: { color: homeColors.muted, fontSize: 11, fontWeight: '600' },
  inviteContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inviteAvatarWrap: {
    position: 'relative',
    padding: 3,
    borderRadius: 20,
    backgroundColor: homeColors.soft,
  },
  plusBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeColors.ink,
    borderWidth: 1.5,
    borderColor: homeColors.paper,
  },
  inviteBody: { flex: 1, gap: 2 },
  inviteCardTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: homeColors.ink,
  },
  inviteCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: homeColors.muted,
  },
  inviteButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeColors.ink,
  },
  inviteButtonText: { color: homeColors.paper, fontSize: 12, fontWeight: '600' },
  templateSection: { marginBottom: spacing.xl },
  templateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  templateSectionTitle: {
    color: homeColors.ink,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
  },
  templateAddAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 5,
  },
  templateAddActionText: { color: homeColors.ink, fontSize: 12, fontWeight: '700' },
  templateIntro: { color: homeColors.muted, fontSize: 13, marginBottom: spacing.md },
  templateIntroHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: homeColors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  templateRow: { paddingHorizontal: 20, gap: spacing.sm, paddingBottom: spacing.xs },
  templateCard: {
    width: 132,
    minHeight: 88,
    borderRadius: 12,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: homeColors.ink,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  templatePlusBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: homeColors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCardName: {
    fontWeight: '700',
    color: homeColors.ink,
    marginTop: spacing.xs,
  },
  customTemplate: {
    width: 132,
    minHeight: 88,
    borderRadius: 12,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: homeColors.ink,
    backgroundColor: homeColors.paper,
  },
  customTemplateText: { color: homeColors.ink, fontWeight: '600' },
  guideCard: {
    padding: spacing.lg,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    marginBottom: spacing.section,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  guideTitle: {
    fontWeight: '700',
    color: colors.primaryText,
  },
  guideSteps: {
    gap: 2,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  guideStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  guideStepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
  },
  guideStepBody: {
    flex: 1,
    gap: 2,
  },
  guideStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  guideStepDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.secondaryText,
  },
  guideConnector: {
    width: 2,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 11,
    marginVertical: 2,
  },
  homeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: 10,
  },
  homeSectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  homeSectionTitle: {
    color: homeColors.ink,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionHeaderIconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  homeSectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  homeSectionActionText: { color: homeColors.muted, fontSize: 13, fontWeight: '600' },
  horizontalScrollView: {
    marginHorizontal: -20,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  decisionCard: { width: 196, padding: spacing.md, gap: spacing.sm, borderRadius: 18 },
  preview: {
    width: '100%',
    height: 124,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  previewCompact: { width: 84, height: 84 },
  fallbackPreview: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  previewLabel: { color: homeColors.muted },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  decisionActions: { flexDirection: 'row', gap: spacing.sm },
  wantButton: {
    minHeight: 38,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  wantText: { color: colors.accent, fontWeight: '700' },
  passButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  glassEmptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    height: 38,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(200, 103, 75, 0.15)',
      },
    }),
  },
  emptyActionBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  planCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.lg,
  },
  planBody: { flex: 1, gap: spacing.xs },
  recentCardWrapper: {
    width: 142,
  },
  recentCard: {
    padding: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: homeColors.ink,
    backgroundColor: homeColors.paper,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 0px rgba(0, 0, 0, 0.12)',
      },
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 0,
      },
    }),
  },
  recentCardContent: {
    gap: 3,
    padding: 9,
  },
  recentCardTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: homeColors.ink,
  },
  recentMeta: { color: homeColors.muted, fontSize: 11, lineHeight: 15 },
  recentPreviewWrap: {
    position: 'relative',
    width: '100%',
    height: 104,
    backgroundColor: homeColors.soft,
  },
  sourceBadge: {
    position: 'absolute',
    right: 7,
    top: 7,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(9, 9, 9, 0.85)',
  },
  sourceBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  listCard: {
    padding: 0,
    borderRadius: 14,
    marginBottom: spacing.md,
    backgroundColor: homeColors.paper,
    borderWidth: 1,
    borderColor: homeColors.ink,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 0px rgba(0, 0, 0, 0.12)',
      },
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 0,
      },
    }),
  },
  listRowPressable: {
    flex: 1,
  },
  listRowPressed: {
    backgroundColor: homeColors.soft,
  },
  listRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  listIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: { flex: 1, gap: 1 },
  homeListName: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: homeColors.ink,
  },
  homeListCount: { fontSize: 11, lineHeight: 14, color: homeColors.muted },
  listDivider: {
    height: 1,
    backgroundColor: homeColors.borderSubtle,
    marginLeft: 52,
    marginRight: 12,
  },
  memberStack: { flexDirection: 'row', alignItems: 'center', marginRight: 2 },
  memberStackItem: { borderRadius: 11, borderWidth: 1.5, borderColor: colors.surface },
  memberStackOverlap: { marginLeft: -7 },
  countText: { color: colors.secondaryText },
  pressed: { opacity: 0.75 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24,24,23,0.28)',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.xxl,
    paddingBottom: spacing.section,
    backgroundColor: homeColors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: homeColors.ink,
    marginBottom: spacing.sm,
  },
  sheetRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: homeColors.border,
    borderRadius: 14,
  },
  sheetRowActive: { backgroundColor: homeColors.soft },
  sheetHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeadingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeColors.ink,
  },
  sheetTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800', color: homeColors.ink },
  sheetSubtitle: { fontSize: 12, lineHeight: 16, color: homeColors.muted },
  sheetRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeColors.ink,
  },
  sheetRowBody: { flex: 1, gap: 1 },
  sheetRowTitle: { color: homeColors.ink },
  sheetRowMeta: { fontSize: 11, color: homeColors.muted },
  sheetCreateButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: homeColors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  sheetCreateText: { color: homeColors.paper, fontSize: 14, fontWeight: '800' },
});
