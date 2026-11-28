import { formatLocale, formatRelativeTime, t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import {
  getItemFallbackImage,
  getItemPreviewImage,
  getItemSourceLabel,
} from '@/components/domain/ItemCard';
import { useToast } from '@/components/feedback/AppToast';
import { ScreenMotion } from '@/components/motion/ScreenMotion';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING, ENTER_EASING } from '@/components/motion/springs';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  GlassSurface,
  HomeScreenSkeleton,
  Screen,
  SmartImage,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';
import { useSpaceMembers } from '@/features/collaboration/hooks';
import { itemsApi } from '@/features/items/api';
import { metadataRefreshInterval } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { haptic } from '@/lib/haptics';
import { getListAppearance } from '@/features/lists/appearance';
import { useCreateList, useLists } from '@/features/lists/hooks';
import type { List } from '@/features/lists/types';
import { OutboxStatusBanner } from '@/features/sharing/OutboxStatusBanner';
import { syncOutbox } from '@/features/sharing/sync';
import { UpcomingPlansSection } from '@/features/plans/UpcomingPlansSection';
import { useSpaces } from '@/features/spaces/hooks';
import { MemberLinks } from '@/features/spaces/MemberLinks';
import { SpaceHeaderBar } from '@/features/spaces/SpaceHeaderBar';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';

const listTemplates = [
  {
    get name() {
      return t('onboarding.placesToVisit');
    },
    icon: 'map-outline',
    color: '#EFECE6',
  },
  {
    get name() {
      return t('common.watchlist');
    },
    icon: 'film-outline',
    color: '#E9E2D7',
  },
  {
    get name() {
      return t('common.shopping');
    },
    icon: 'cart-outline',
    color: '#F3F0EA',
  },
  {
    get name() {
      return t('onboarding.toDo');
    },
    icon: 'checkbox-outline',
    color: '#E5DFD4',
  },
] as const;

function splitEditorialHeadline(text: string): { leading: string; accent: string } {
  const trimmed = text.trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace <= 0) return { leading: '', accent: trimmed };
  return {
    leading: trimmed.slice(0, lastSpace),
    accent: trimmed.slice(lastSpace + 1),
  };
}

function Preview({
  item,
  compact = false,
  height,
}: {
  item?: Item;
  compact?: boolean;
  height?: number;
}) {
  useTranslation();
  const previewStyle = [
    styles.preview,
    compact && styles.previewCompact,
    height !== undefined && { height },
  ];

  if (item) {
    const rawUrl = getItemPreviewImage(item);
    const pending =
      (item.metadata_status === 'pending' || item.metadata_status === 'processing') &&
      !item.preview_image_url;
    return (
      <SmartImage
        uri={rawUrl}
        fallbackUri={getItemFallbackImage(item)}
        pending={pending}
        compact={compact}
        style={previewStyle}
      />
    );
  }

  return (
    <View style={[previewStyle, styles.fallbackPreview]}>
      <Ionicons
        name="bookmark-outline"
        size={compact ? 20 : 24}
        color={colors.primaryText}
      />
      <AppText variant="caption" style={styles.previewLabel} numberOfLines={1}>
        WeDo
      </AppText>
    </View>
  );
}

function PendingAvatar({ size = 22 }: { size?: number }) {
  useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('home.partnerAvatarInvitationPending')}
      style={[
        styles.pendingAvatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <AppText style={[styles.pendingInitial, { fontSize: Math.max(8, size * 0.42) }]}>
        ?
      </AppText>
    </View>
  );
}

function MonoAvatar({
  name,
  size = 28,
  radius: cornerRadius,
}: {
  name?: string | null;
  size?: number;
  radius?: number;
}) {
  useTranslation();
  const resolvedRadius = cornerRadius !== undefined ? cornerRadius : size / 2;
  return (
    <View
      accessible
      accessibilityLabel={t('home.avatarForValue', { value0: name ?? t('common.user') })}
      style={[
        styles.monoAvatar,
        { width: size, height: size, borderRadius: resolvedRadius },
      ]}
    >
      <AppText style={[styles.monoAvatarText, { fontSize: Math.max(9, size * 0.4) }]}>
        {name?.trim().charAt(0).toLocaleUpperCase(formatLocale()) ?? 'W'}
      </AppText>
    </View>
  );
}

function getDailyMessage(items: Item[]) {
  const now = new Date();
  const todayItems = items.filter(
    (item) => new Date(item.created_at).toDateString() === now.toDateString(),
  );
  if (todayItems.length > 0) return t('home.newItemsToday', { count: todayItems.length });
  if (now.getHours() < 12) return t('home.startTheDayWithAnIdeaToShare');
  if (now.getHours() < 18) return t('home.addANewDiscoveryForTheAfternoon');
  return t('home.howAboutAddingSomethingToYourEveningPlans');
}

function QuickSaveCard() {
  useTranslation();
  const contentTypes = [
    { label: t('home.video'), icon: 'videocam-outline' },
    { label: t('home.place'), icon: 'location-outline' },
    { label: t('home.product'), icon: 'cube-outline' },
    { label: t('home.event'), icon: 'calendar-outline' },
  ] as const;

  return (
    <View style={styles.quickSaveWrap}>
      <View style={styles.heroCardWrap}>
        <LinearGradient
          colors={['#C4AA8E', '#A48567', '#86694E']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.88, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.typeRow}>
            {contentTypes.map((type) => (
              <View key={type.label} style={styles.heroTypeTile}>
                <Ionicons name={type.icon} size={18} color={colors.onAccent} />
                <AppText variant="caption" style={styles.heroTypeTileLabel}>
                  {type.label}
                </AppText>
              </View>
            ))}
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.quickSaveTitle}>
              {t('home.saveYourFirstItemTogether')}
            </AppText>
            <AppText style={styles.quickSaveDescription}>
              {t('home.tapShareOnSomethingYouLikeThenChooseWedo')}
            </AppText>
          </View>
          <SpringPressable
            accessibilityRole="button"
            accessibilityLabel={t('home.howToSave')}
            onPress={() => router.push('/(onboarding)/share-tutorial')}
            pressScale={0.965}
            haptic="light"
            style={styles.heroCtaPressable}
          >
            <GlassSurface
              pointerEvents="none"
              interactive
              tintColor="rgba(255, 255, 255, 0.20)"
              fallbackBackgroundColor="rgba(255, 255, 255, 0.24)"
              blurIntensity={28}
              style={styles.heroCtaPill}
            >
              <View style={styles.heroCtaSpacer} />
              <AppText style={styles.heroCtaText}>
                {t('home.howDoISaveSomething')}
              </AppText>
              <View style={styles.heroCtaArrowCircle}>
                <Ionicons name="arrow-forward" size={17} color={colors.primaryText} />
              </View>
            </GlassSurface>
          </SpringPressable>
        </LinearGradient>
      </View>
      <SpringPressable
        accessibilityRole="button"
        accessibilityLabel={t('home.addALinkManually')}
        onPress={() => router.push('/item/create')}
        pressScale={0.955}
        haptic="light"
        style={styles.manualLinkPill}
      >
        <Ionicons name="link-outline" size={16} color={colors.primaryText} />
        <AppText style={styles.manualLinkText}>{t('home.addALinkManually')}</AppText>
      </SpringPressable>
    </View>
  );
}

function InviteCard({ spaceId }: { spaceId: string }) {
  useTranslation();
  return (
    <View style={styles.inviteCard}>
      <View style={styles.inviteContent}>
        <View style={styles.inviteAvatarWrap}>
          <PendingAvatar size={30} />
          <View style={styles.plusBadge}>
            <Ionicons name="add" size={10} color={colors.onAccent} />
          </View>
        </View>
        <View style={styles.inviteBody}>
          <View style={styles.inviteStatus}>
            <View style={styles.inviteStatusDot} />
            <AppText variant="caption" style={styles.inviteStatusText}>
              {t('home.invitationPending')}
            </AppText>
          </View>
          <AppText style={styles.inviteCardTitle}>
            {t('onboarding.inviteYourPartner')}
          </AppText>
          <AppText variant="caption" style={styles.inviteCardDesc} numberOfLines={1}>
            {t('home.decideWhatToDoWithYourSavedIdeas')}
          </AppText>
        </View>
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('home.invite')}
          onPress={() => router.push(`/(onboarding)/invite-member?spaceId=${spaceId}`)}
          pressScale={0.94}
          haptic="medium"
          style={styles.inviteButton}
        >
          <AppText variant="caption" style={styles.inviteButtonText}>
            {t('home.invite')}
          </AppText>
        </SpringPressable>
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
  useTranslation();
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
          {t('home.getStartedWithASuggestedTemplate')}
        </AppText>
      ) : (
        <>
          <View style={styles.templateSectionHeader}>
            <AppText style={styles.templateSectionTitle}>{t('home.sharedLists')}</AppText>
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t('home.createANewList')}
              onPress={() => router.push(`/list/create?spaceId=${spaceId}`)}
              pressScale={0.94}
              haptic="light"
              style={styles.templateAddAction}
            >
              <Ionicons name="add" size={16} color={colors.primaryText} />
              <AppText style={styles.templateAddActionText}>{t('home.newList')}</AppText>
            </SpringPressable>
          </View>
          <AppText style={styles.templateIntro}>
            {t('home.chooseATemplateToGetStarted')}
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
          <SpringPressable
            key={template.name}
            accessibilityRole="button"
            accessibilityLabel={t('home.createAValueList', { value0: template.name })}
            onPress={() => createList(template.name)}
            pressScale={0.95}
            haptic="selection"
            style={styles.templateCard}
          >
            <View style={styles.templateHeader}>
              <View style={styles.templateIconBadge}>
                <Ionicons name={template.icon} size={17} color={colors.primaryText} />
              </View>
              <View style={styles.templatePlusBadge}>
                <Ionicons name="add" size={12} color={colors.primaryText} />
              </View>
            </View>
            <AppText variant="caption" style={styles.templateCardName}>
              {template.name}
            </AppText>
          </SpringPressable>
        ))}
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('home.createYourOwn')}
          onPress={() => router.push(`/list/create?spaceId=${spaceId}`)}
          pressScale={0.95}
          haptic="light"
          style={styles.customTemplate}
        >
          <View style={styles.templateHeader}>
            <View style={styles.templateIconBadge}>
              <Ionicons name="add-outline" size={18} color={colors.primaryText} />
            </View>
          </View>
          <AppText variant="caption" style={styles.customTemplateText}>
            {t('home.createYourOwn')}
          </AppText>
        </SpringPressable>
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
  useTranslation();
  const listStyle = getListAppearance(list.name, list.is_default, list.icon);
  return (
    <Animated.View layout={LAYOUT_SPRING}>
      <SpringPressable
        accessibilityRole="button"
        accessibilityLabel={t('home.openValue', { value0: list.name })}
        onPress={onPress}
        pressScale={0.975}
        haptic="light"
        style={styles.listRowCard}
      >
        <View style={styles.listRow}>
          <View style={[styles.listIcon, { backgroundColor: listStyle.backgroundColor }]}>
            <Ionicons name={listStyle.icon} size={18} color={listStyle.color} />
          </View>
          <View style={styles.listBody}>
            <AppText style={styles.homeListName}>{list.name}</AppText>
            <AppText style={styles.homeListCount}>
              {t('common.itemCount', { count })}
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
          <Ionicons name="chevron-forward" size={15} color={colors.tertiaryText} />
        </View>
      </SpringPressable>
    </Animated.View>
  );
}

function SharedListStack({
  lists,
  itemQueries,
  memberNames,
}: {
  lists: List[];
  itemQueries: ({ data?: { data?: Item[] } } | undefined)[];
  memberNames: string[];
}) {
  return (
    <View style={styles.listStack}>
      {lists.map((list, index) => (
        <ListRow
          key={list.id}
          list={list}
          count={itemQueries[index]?.data?.data?.length ?? 0}
          memberNames={memberNames}
          onPress={() => router.push(`/list/${list.id}`)}
        />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  useTranslation();
  const client = useQueryClient();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const spaces = useSpaces();
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const setSelectedSpaceId = useSpaceStore((state) => state.setSelectedSpaceId);
  const [spaceSheetOpen, setSpaceSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const memberEntries = members.data?.data ?? [];
  const needsInvite = Boolean(space && members.isSuccess && memberEntries.length < 2);
  const memberNames = memberEntries.map((member) => member.display_name);
  const dailyMessage = getDailyMessage(allItems);
  const heroHeadline = splitEditorialHeadline(t('home.whatAreWePlanning'));
  const { width: windowWidth } = useWindowDimensions();
  const recentCardWidth = useMemo(() => {
    if (windowWidth > 640) return 244;
    return Math.min(238, Math.max(212, Math.round(windowWidth * 0.59)));
  }, [windowWidth]);
  const recentImageHeight = Math.round(recentCardWidth * 0.62);

  const createTemplateList = (name: string) => {
    createList.mutate(name, {
      onSuccess: (list) => {
        showToast({
          title: t('home.listCreated'),
          message: t('home.yourValueListIsReady', { value0: name }),
          actionLabel: t('home.open'),
          onAction: () => router.push(`/list/${list.id}`),
        });
      },
      onError: (error: unknown) => {
        haptic.error();
        const err = error as { message?: string; status?: number } | undefined;
        const isConflict = err?.message?.includes('409') || err?.status === 409;
        Alert.alert(
          t('home.couldnTCreateList'),
          isConflict ? t('lists.nameAlreadyExists') : t('common.tryAgain'),
        );
      },
    });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncOutbox();
      await client.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }, [client]);

  if (spaces.isLoading || (Boolean(space?.id) && lists.isLoading)) {
    return (
      <Screen>
        <HomeScreenSkeleton />
      </Screen>
    );
  }

  if (spaces.isError && !spaces.data) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          title={t('home.connectionFailed')}
          description={t('home.weCouldnTConnectToTheServerPleaseCheckYour')}
          action={t('common.retry')}
          onAction={() => void spaces.refetch()}
        />
      </Screen>
    );
  }

  return (
    <ScreenMotion>
      <Screen
        edges={['top']}
        ambient="hero"
        refreshing={refreshing}
        onRefresh={() => void handleRefresh()}
        contentContainerStyle={styles.screen}
      >
        <SpaceHeaderBar
          spaceId={space?.id}
          spaceName={space?.name}
          fallbackUserName={user?.display_name}
          members={memberEntries}
          needsInvite={needsInvite}
          onOpenSpaceSwitcher={() => setSpaceSheetOpen(true)}
          onPressAdd={() => router.push('/item/create')}
          addLabel={t('items.addItem')}
        />
        <OutboxStatusBanner />

        <View style={styles.greeting}>
          <AppText variant="eyebrow" style={styles.greetingSub}>
            {t('home.hello')}{' '}
            {user?.display_name || user?.email?.split('@')[0] || t('common.user')}
          </AppText>
          <AppText style={styles.heroLine}>
            {heroHeadline.leading ? (
              <AppText variant="editorialHero" style={styles.heroLeading}>
                {heroHeadline.leading}{' '}
              </AppText>
            ) : null}
            <AppText variant="editorialAccent" style={styles.heroAccent}>
              {heroHeadline.accent}
            </AppText>
          </AppText>
          <AppText style={styles.dailyMessage}>{dailyMessage}</AppText>
        </View>

        {!space ? (
          <Card style={styles.noSpace}>
            <AppText variant="sectionTitle">
              {t('home.createYourFirstSharedSpace')}
            </AppText>
            <Button
              label={t('home.createSpace')}
              onPress={() => router.push('/space/create')}
            />
          </Card>
        ) : !hasContent && !isContentLoading ? (
          <Animated.View entering={FadeIn.duration(220)} layout={LAYOUT_SPRING}>
            <QuickSaveCard />
            {needsInvite && <InviteCard spaceId={space.id} />}

            {listEntries.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.templateSectionHeader}>
                  <AppText style={styles.templateSectionTitle}>
                    {t('home.sharedLists')}
                  </AppText>
                  <SpringPressable
                    accessibilityRole="button"
                    accessibilityLabel={t('home.createANewList')}
                    onPress={() => router.push(`/list/create?spaceId=${space.id}`)}
                    pressScale={0.94}
                    haptic="light"
                    style={styles.templateAddAction}
                  >
                    <Ionicons name="add" size={16} color={colors.primaryText} />
                    <AppText style={styles.templateAddActionText}>
                      {t('home.newList')}
                    </AppText>
                  </SpringPressable>
                </View>
                <SharedListStack
                  lists={listEntries}
                  itemQueries={itemQueries}
                  memberNames={memberNames}
                />
              </View>
            )}

            <ListTemplates
              spaceId={space.id}
              createList={createTemplateList}
              existingLists={listEntries}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(220)} layout={LAYOUT_SPRING}>
            <UpcomingPlansSection spaceId={space.id} items={allItems} />

            <View style={styles.homeSectionHeader}>
              <AppText style={styles.homeSectionTitle}>{t('home.recentlyAdded')}</AppText>
              <SpringPressable
                onPress={() => router.push('/lists')}
                pressScale={0.94}
                haptic="selection"
                style={styles.homeSectionAction}
              >
                <AppText style={styles.homeSectionActionText}>{t('home.seeAll')}</AppText>
                <Ionicons name="chevron-forward" size={13} color={colors.secondaryText} />
              </SpringPressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={recentCardWidth + 12}
              snapToAlignment="start"
              decelerationRate="fast"
              style={styles.horizontalScrollView}
              contentContainerStyle={styles.horizontalList}
            >
              {recentItems.map((item) => (
                <SpringPressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.openValue_98d3f', {
                    value0: item.title ?? t('home.item'),
                  })}
                  onPress={() => router.push(`/item/${item.id}`)}
                  pressScale={0.968}
                  haptic="light"
                  style={[styles.recentCardWrapper, { width: recentCardWidth }]}
                >
                  <View style={styles.recentCard}>
                    <View
                      style={[styles.recentPreviewWrap, { height: recentImageHeight }]}
                    >
                      <Preview item={item} height={recentImageHeight} />
                      <View style={styles.sourceBadge}>
                        <AppText style={styles.sourceBadgeText} numberOfLines={1}>
                          {getItemSourceLabel(item)}
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.recentCardContent}>
                      <AppText numberOfLines={2} style={styles.recentCardTitle}>
                        {item.title ?? t('common.savedItem')}
                      </AppText>
                      <View style={styles.sourceRow}>
                        <AppText
                          variant="caption"
                          numberOfLines={1}
                          style={[styles.recentMeta, { flex: 1 }]}
                        >
                          {item.created_by_name} · {formatRelativeTime(item.created_at)}
                        </AppText>
                        <MonoAvatar name={item.created_by_name} size={20} />
                      </View>
                    </View>
                  </View>
                </SpringPressable>
              ))}
            </ScrollView>

            <View style={styles.homeSectionHeader}>
              <AppText style={styles.homeSectionTitle}>{t('home.sharedLists')}</AppText>
              <SpringPressable
                onPress={() =>
                  router.push(
                    listEntries.length >= 2
                      ? '/lists'
                      : `/list/create?spaceId=${space.id}`,
                  )
                }
                pressScale={0.94}
                haptic="selection"
                style={styles.homeSectionAction}
              >
                <AppText style={styles.homeSectionActionText}>
                  {listEntries.length >= 2 ? t('home.seeAll') : t('home.newList')}
                </AppText>
                <Ionicons
                  name={listEntries.length >= 2 ? 'chevron-forward' : 'add'}
                  size={14}
                  color={colors.secondaryText}
                />
              </SpringPressable>
            </View>
            <SharedListStack
              lists={listEntries.slice(0, 4)}
              itemQueries={itemQueries}
              memberNames={memberNames}
            />
            {needsInvite && <InviteCard spaceId={space.id} />}
          </Animated.View>
        )}

        <Modal
          visible={spaceSheetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSpaceSheetOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSpaceSheetOpen(false)}
          >
            <Animated.View
              entering={SlideInDown.duration(220).easing(ENTER_EASING)}
              style={styles.sheet}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeading}>
                <View style={styles.sheetHeadingIcon}>
                  <Ionicons name="layers-outline" size={18} color={colors.onAccent} />
                </View>
                <View>
                  <AppText style={styles.sheetTitle}>{t('home.switchSpace')}</AppText>
                  <AppText style={styles.sheetSubtitle}>
                    {t('home.chooseASpaceToMakeDecisionsTogether')}
                  </AppText>
                </View>
              </View>
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
              >
                {(spaces.data?.data ?? []).map((entry, index) => {
                  const memberQuery = spaceMemberQueries[index];
                  const entryMembers = memberQuery?.data?.data ?? [];
                  return (
                    <View
                      key={entry.id}
                      style={[
                        styles.sheetRow,
                        entry.id === space?.id && styles.sheetRowActive,
                      ]}
                    >
                      <View style={styles.sheetSelectRow}>
                        <SpringPressable
                          accessibilityRole="button"
                          accessibilityLabel={t('home.chooseValue', {
                            value0: entry.name,
                          })}
                          pressScale={0.98}
                          haptic="selection"
                          onPress={() => {
                            setSelectedSpaceId(entry.id);
                            setSpaceSheetOpen(false);
                          }}
                          style={styles.sheetSelectButton}
                        >
                          <View style={styles.sheetRowIcon}>
                            <Ionicons
                              name="people-outline"
                              size={18}
                              color={colors.onAccent}
                            />
                          </View>
                          <AppText
                            variant="cardTitle"
                            style={[styles.sheetRowTitle, { flex: 1 }]}
                          >
                            {entry.name}
                          </AppText>
                          {entry.id === space?.id ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={21}
                              color={colors.primaryText}
                            />
                          ) : null}
                        </SpringPressable>
                        <SpringPressable
                          accessibilityRole="button"
                          accessibilityLabel={t('members.leaveNamed', {
                            name: entry.name,
                          })}
                          pressScale={0.9}
                          haptic="light"
                          onPress={() => {
                            setSpaceSheetOpen(false);
                            router.push(`/space/${entry.id}/leave` as never);
                          }}
                          style={styles.sheetLeaveButton}
                        >
                          <Ionicons name="exit-outline" size={20} color={colors.error} />
                        </SpringPressable>
                      </View>
                      {entryMembers.length ? (
                        <MemberLinks
                          spaceId={entry.id}
                          members={entryMembers}
                          onOpen={() => setSpaceSheetOpen(false)}
                        />
                      ) : (
                        <AppText style={styles.sheetRowMeta}>
                          {memberQuery?.isLoading
                            ? t('home.loadingMembers')
                            : memberQuery?.isError
                              ? t('members.unavailable')
                              : t('home.invitationPending')}
                        </AppText>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
              <SpringPressable
                accessibilityRole="button"
                onPress={() => {
                  setSpaceSheetOpen(false);
                  router.push('/space/create');
                }}
                pressScale={0.965}
                haptic="medium"
                style={styles.sheetCreateButton}
              >
                <Ionicons name="add" size={19} color={colors.onAccent} />
                <AppText style={styles.sheetCreateText}>
                  {t('home.createANewSpace')}
                </AppText>
              </SpringPressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </Screen>
    </ScreenMotion>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 136,
  },
  pendingAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderFocus,
  },
  pendingInitial: { color: colors.primaryText, fontSize: 11, fontWeight: '600' },
  monoAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  monoAvatarText: { color: colors.onAccent, fontWeight: '700' },
  greeting: { gap: 4, marginBottom: 22, marginTop: 2 },
  greetingSub: {
    color: colors.secondaryText,
    letterSpacing: -0.1,
  },
  heroLine: {
    lineHeight: 36,
  },
  heroLeading: {
    color: colors.secondaryText,
  },
  heroAccent: {
    color: colors.primaryText,
  },
  dailyMessage: {
    color: colors.secondaryText,
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 2,
  },
  noSpace: { gap: spacing.md },
  sectionBlock: { marginBottom: spacing.lg },
  quickSaveWrap: { marginBottom: spacing.lg, gap: 12 },
  heroCardWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    ...shadows.elevated,
  },
  heroCard: {
    padding: 18,
    gap: 16,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  heroTypeTile: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  heroTypeTileLabel: {
    color: colors.onAccent,
    fontSize: 11.5,
    fontWeight: '600',
  },
  heroCopy: {
    gap: 6,
  },
  quickSaveTitle: {
    color: colors.onAccent,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  quickSaveDescription: {
    color: 'rgba(255, 252, 248, 0.88)',
    fontSize: 13.5,
    lineHeight: 19,
  },
  heroCtaPressable: {
    borderRadius: radius.pill,
  },
  heroCtaPill: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingLeft: 14,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  heroCtaSpacer: {
    width: 38,
  },
  heroCtaText: {
    color: colors.onAccent,
    fontSize: 14.5,
    fontWeight: '600',
  },
  heroCtaArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualLinkPill: {
    alignSelf: 'center',
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    ...shadows.glass,
  },
  manualLinkText: {
    color: colors.primaryText,
    fontSize: 13.5,
    fontWeight: '600',
  },
  inviteCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    marginTop: 4,
    marginBottom: spacing.xl,
    ...shadows.card,
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
    backgroundColor: colors.warning,
  },
  inviteStatusText: { color: colors.secondaryText, fontSize: 11, fontWeight: '600' },
  inviteContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inviteAvatarWrap: {
    position: 'relative',
    padding: 3,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
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
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  inviteBody: { flex: 1, gap: 1 },
  inviteCardTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  inviteCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.secondaryText,
  },
  inviteButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadows.glass,
  },
  inviteButtonText: { color: colors.onAccent, fontSize: 12, fontWeight: '600' },
  templateSection: { marginBottom: spacing.xl },
  templateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  templateSectionTitle: {
    color: colors.primaryText,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  templateAddAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
  },
  templateAddActionText: { color: colors.primaryText, fontSize: 12, fontWeight: '600' },
  templateIntro: { color: colors.secondaryText, fontSize: 13, marginBottom: spacing.md },
  templateIntroHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  templateRow: { paddingHorizontal: 20, gap: 10, paddingBottom: spacing.xs },
  templateCard: {
    width: 138,
    minHeight: 96,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    ...shadows.card,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  templateIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templatePlusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: spacing.xs,
  },
  customTemplate: {
    width: 138,
    minHeight: 96,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    ...shadows.glass,
  },
  customTemplateText: { fontSize: 13, color: colors.primaryText, fontWeight: '600' },
  homeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: 12,
  },
  homeSectionTitle: {
    color: colors.primaryText,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  homeSectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  homeSectionActionText: { color: colors.secondaryText, fontSize: 13, fontWeight: '600' },
  horizontalScrollView: {
    marginHorizontal: -20,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  previewCompact: { width: 84, height: 84 },
  fallbackPreview: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  previewLabel: { color: colors.secondaryText },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  recentCardWrapper: {
    width: 224,
  },
  cardPressed: {
    transform: [{ scale: 0.978 }],
    opacity: 0.93,
  },
  recentCard: {
    padding: 7,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    ...shadows.card,
  },
  recentPreviewWrap: {
    position: 'relative',
    width: '100%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  sourceBadge: {
    position: 'absolute',
    right: 9,
    top: 9,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(17, 17, 16, 0.56)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  sourceBadgeText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  recentCardContent: {
    gap: 5,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
  },
  recentCardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.primaryText,
  },
  recentMeta: { color: colors.secondaryText, fontSize: 11.5, lineHeight: 16 },
  listStack: {
    gap: 10,
    marginBottom: spacing.lg,
  },
  listRowCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    overflow: 'hidden',
    ...shadows.card,
  },
  listRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: { flex: 1, gap: 2 },
  homeListName: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.primaryText,
  },
  homeListCount: { fontSize: 12, lineHeight: 16, color: colors.secondaryText },
  memberStack: { flexDirection: 'row', alignItems: 'center', marginRight: 2 },
  memberStackItem: { borderRadius: 11, borderWidth: 1.5, borderColor: colors.surface },
  memberStackOverlap: { marginLeft: -7 },
  pressed: { opacity: 0.8 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 16, 0.30)',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.xxl,
    paddingBottom: spacing.section,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    ...shadows.elevated,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(17, 17, 16, 0.16)',
    marginBottom: spacing.xs,
  },
  sheetScroll: { maxHeight: 360 },
  sheetScrollContent: { gap: spacing.sm },
  sheetSelectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sheetSelectButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetLeaveButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRow: {
    minHeight: 58,
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
  },
  sheetRowActive: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderFocus,
  },
  sheetHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeadingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sheetTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.primaryText,
  },
  sheetSubtitle: { fontSize: 12, lineHeight: 16, color: colors.secondaryText },
  sheetRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sheetRowTitle: { color: colors.primaryText },
  sheetRowMeta: { fontSize: 11.5, color: colors.secondaryText },
  sheetCreateButton: {
    minHeight: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.pillAction,
  },
  sheetCreateText: { color: colors.onAccent, fontSize: 14, fontWeight: '600' },
});
