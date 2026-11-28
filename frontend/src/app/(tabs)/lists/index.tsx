import { formatRelativeTime, t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { queryKeys } from '@/api/query-keys';
import { getItemFallbackImage, getItemPreviewImage } from '@/components/domain/ItemCard';
import { useOptionalToast } from '@/components/feedback/AppToast';
import { ScreenMotion } from '@/components/motion/ScreenMotion';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { ENTER_EASING, LAYOUT_SPRING } from '@/components/motion/springs';
import {
  AppText,
  Card,
  EmptyState,
  GlassSurface,
  Screen,
  SegmentedControl,
  Skeleton,
  SkeletonCard,
  SmartImage,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { collaborationApi, type Plan } from '@/features/collaboration/api';
import { useSpaceMembers } from '@/features/collaboration/hooks';
import { itemsApi } from '@/features/items/api';
import { metadataRefreshInterval } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { getListAppearance } from '@/features/lists/appearance';
import { useLists } from '@/features/lists/hooks';
import { usePlanAction, useSpacePlans } from '@/features/plans/hooks';
import { PlanCard } from '@/features/plans/PlanCard';
import { PlanSheet } from '@/features/plans/PlanSheet';
import { OutboxStatusBanner } from '@/features/sharing/OutboxStatusBanner';
import { syncOutbox } from '@/features/sharing/sync';
import { useSpaces } from '@/features/spaces/hooks';
import { SpaceHeaderBar } from '@/features/spaces/SpaceHeaderBar';
import { haptic } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';

function splitHeadline(text: string): { leading: string; accent: string } {
  const trimmed = text.trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace <= 0) return { leading: '', accent: trimmed };
  return {
    leading: trimmed.slice(0, lastSpace),
    accent: trimmed.slice(lastSpace + 1),
  };
}

function CollageImage({
  item,
  style,
}: {
  item: Item;
  style: Record<string, unknown> | Record<string, unknown>[];
}) {
  const uri = getItemPreviewImage(item);
  const pending =
    (item.metadata_status === 'pending' || item.metadata_status === 'processing') &&
    !item.preview_image_url;
  return (
    <SmartImage
      uri={uri}
      fallbackUri={getItemFallbackImage(item)}
      pending={pending}
      compact
      style={style as never}
    />
  );
}

/** Adaptive cover preview that avoids empty placeholder bookmark grids. */
function ListCoverPreview({
  listName,
  isDefault,
  customIcon,
  items,
}: {
  listName: string;
  isDefault?: boolean;
  customIcon?: string | null;
  items: Item[];
}) {
  const visual = getListAppearance(listName, Boolean(isDefault), customIcon);
  const previews = items.slice(0, 4);

  if (previews.length === 0) {
    return (
      <View
        style={[
          styles.previewBox,
          styles.emptyPreviewCanvas,
          { backgroundColor: visual.backgroundColor },
        ]}
      >
        <View style={styles.emptyPreviewBadge}>
          <Ionicons name={visual.icon} size={22} color={colors.primaryText} />
        </View>
      </View>
    );
  }

  if (previews.length === 1) {
    return (
      <View style={styles.previewBox}>
        <CollageImage item={previews[0]!} style={styles.previewSingle} />
      </View>
    );
  }

  if (previews.length === 2) {
    return (
      <View style={[styles.previewBox, styles.previewSplitRow]}>
        <CollageImage item={previews[0]!} style={styles.previewHalf} />
        <CollageImage item={previews[1]!} style={styles.previewHalf} />
      </View>
    );
  }

  if (previews.length === 3) {
    return (
      <View style={[styles.previewBox, styles.previewSplitRow]}>
        <CollageImage item={previews[0]!} style={styles.previewFeaturedLeft} />
        <View style={styles.previewRightColumn}>
          <CollageImage item={previews[1]!} style={styles.previewRightHalf} />
          <CollageImage item={previews[2]!} style={styles.previewRightHalf} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.previewBox, styles.previewQuad]}>
      {previews.map((item) => (
        <CollageImage key={item.id} item={item} style={styles.previewTile} />
      ))}
    </View>
  );
}

export default function ListsScreen() {
  useTranslation();
  const client = useQueryClient();
  const toast = useOptionalToast();
  const user = useAuthStore((state) => state.user);
  const spaces = useSpaces();
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const setSelectedSpaceId = useSpaceStore((state) => state.setSelectedSpaceId);
  const [spaceSheetOpen, setSpaceSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<'lists' | 'plans'>('lists');
  const [isReordering, setIsReordering] = useState(false);
  const [reorderingPending, setReorderingPending] = useState(false);
  const [editingPlanTarget, setEditingPlanTarget] = useState<{
    plan: Plan;
    item: Item;
  } | null>(null);
  const [mountCutoffMs] = useState(() => Date.now() - 24 * 60 * 60 * 1000);
  const space =
    spaces.data?.data.find((entry) => entry.id === selectedSpaceId) ??
    spaces.data?.data[0];

  useEffect(() => {
    if (spaces.isSuccess && spaces.data?.data.length === 0 && !selectedSpaceId) {
      router.replace('/space/create');
    }
  }, [spaces.isSuccess, spaces.data?.data, selectedSpaceId]);

  const lists = useLists(space?.id ?? '');
  const entries = useMemo(() => lists.data?.data ?? [], [lists.data?.data]);
  const members = useSpaceMembers(space?.id ?? '');
  const plansQuery = useSpacePlans(space?.id ?? '');
  const planAction = usePlanAction(space?.id ?? '');
  const spaceMemberQueries = useQueries({
    queries: spaceSheetOpen
      ? (spaces.data?.data ?? []).map((entry) => ({
          queryKey: ['spaces', entry.id, 'members'],
          queryFn: () => collaborationApi.members(entry.id),
        }))
      : [],
  });
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

  const memberEntries = members.data?.data ?? [];
  const needsInvite = Boolean(space && members.isSuccess && memberEntries.length < 2);
  const allItems = itemQueries.flatMap((query) => query.data?.data ?? []);
  const itemContextMap = useMemo(() => {
    const map = new Map<string, { item: Item; listName: string }>();
    entries.forEach((list, idx) => {
      const listItems = itemQueries[idx]?.data?.data ?? [];
      for (const entry of listItems) {
        map.set(entry.id, { item: entry, listName: list.name });
      }
    });
    return map;
  }, [entries, itemQueries]);

  const plansCutoffMs =
    typeof plansQuery.dataUpdatedAt === 'number' && plansQuery.dataUpdatedAt > 0
      ? plansQuery.dataUpdatedAt - 24 * 60 * 60 * 1000
      : mountCutoffMs;

  const activePlans = useMemo(() => {
    return (plansQuery.data?.data ?? [])
      .filter(
        (plan) =>
          (plan.status === 'proposed' || plan.status === 'approved') &&
          new Date(plan.scheduled_at).getTime() >= plansCutoffMs,
      )
      .sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      );
  }, [plansQuery.data?.data, plansCutoffMs]);

  const today = new Date().toDateString();
  const newItemsToday = allItems.filter(
    (item) => new Date(item.created_at).toDateString() === today,
  ).length;
  const activitySummary = `${t('lists.listCount', { count: entries.length })} · ${t('lists.newItemCount', { count: newItemsToday })}`;
  const headline = splitHeadline(t('lists.whatSHappeningInYourSpaceToday'));

  const currentUserName =
    user?.display_name || user?.email?.split('@')[0] || t('common.user');

  const buildFallbackPlanItem = (plan: Plan): Item => ({
    id: plan.item_id,
    space_id: plan.space_id,
    list_id: '',
    created_by: plan.created_by,
    created_by_name: t('common.someone'),
    client_item_id: null,
    type: 'link',
    status: 'planned',
    title: t('common.savedItem'),
    description: null,
    preview_image_url: null,
    original_url: null,
    canonical_url: null,
    source_domain: null,
    source_app: null,
    shared_text: null,
    metadata_status: 'ready',
    completed_at: null,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncOutbox();
      await client.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }, [client]);

  const moveListOrder = useCallback(
    async (index: number, direction: -1 | 1) => {
      if (!space?.id || reorderingPending) return;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= entries.length) return;
      const next = [...entries];
      const [moved] = next.splice(index, 1);
      if (!moved) return;
      next.splice(targetIndex, 0, moved);
      const nextIds = next.map((entry) => entry.id);

      haptic.selection();
      setReorderingPending(true);
      try {
        const reordered = await collaborationApi.reorderLists(space.id, nextIds);
        if (Array.isArray(reordered) && reordered.length > 0) {
          client.setQueryData(queryKeys.lists(space.id), {
            data: reordered,
            pagination: { page: 1, page_size: reordered.length, has_more: false },
          });
        } else {
          await client.invalidateQueries({ queryKey: queryKeys.lists(space.id) });
        }
        toast?.showToast({ type: 'success', title: t('lists.orderUpdated') });
      } catch {
        toast?.showToast({ type: 'error', title: t('common.tryAgainShort') });
      } finally {
        setReorderingPending(false);
      }
    },
    [client, entries, reorderingPending, space, toast],
  );

  return (
    <ScreenMotion>
      <Screen
        edges={['top']}
        ambient="hero"
        scroll={true}
        refreshing={refreshing}
        onRefresh={() => void handleRefresh()}
        contentContainerStyle={styles.screen}
      >
        <SpaceHeaderBar
          spaceId={space?.id}
          spaceName={space?.name}
          fallbackUserName={currentUserName}
          members={memberEntries}
          needsInvite={needsInvite}
          onOpenSpaceSwitcher={() => setSpaceSheetOpen(true)}
          onPressAdd={() =>
            router.push(space ? `/list/create?spaceId=${space.id}` : '/space/create')
          }
          addLabel={space ? t('home.createANewList') : t('home.createSpace')}
        />
        <OutboxStatusBanner />

        {spaces.isLoading || lists.isLoading ? (
          <View style={styles.skeletonGroup}>
            <Skeleton width={110} height={14} borderRadius={6} />
            <Skeleton width="78%" height={30} borderRadius={8} />
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {[1, 2, 3].map((key) => (
                <SkeletonCard key={key} style={styles.skeletonListCard}>
                  <Skeleton width={46} height={46} borderRadius={16} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton width="55%" height={16} borderRadius={6} />
                    <Skeleton width="35%" height={12} borderRadius={6} />
                  </View>
                </SkeletonCard>
              ))}
            </View>
          </View>
        ) : !space ? (
          <EmptyState
            title={t('lists.createASpaceFirst')}
            description={t('lists.sharedListsBelongToASpace')}
            action={t('home.createSpace')}
            onAction={() => router.push('/space/create')}
          />
        ) : (
          <>
            <View style={styles.editorialHeader}>
              <AppText variant="eyebrow" style={styles.summaryEyebrow}>
                {activitySummary}
              </AppText>
              <AppText style={styles.editorialLine}>
                {headline.leading ? (
                  <AppText variant="editorialHero" style={styles.headlineLeading}>
                    {headline.leading}{' '}
                  </AppText>
                ) : null}
                <AppText variant="editorialAccent" style={styles.headlineAccent}>
                  {headline.accent}
                </AppText>
              </AppText>
            </View>

            <SegmentedControl
              style={styles.sectionSwitch}
              options={[
                {
                  value: 'lists',
                  label:
                    entries.length > 0
                      ? `${t('plans.listsTabTitle')} (${entries.length})`
                      : t('plans.listsTabTitle'),
                },
                {
                  value: 'plans',
                  label:
                    activePlans.length > 0
                      ? `${t('plans.tabTitle')} (${activePlans.length})`
                      : t('plans.tabTitle'),
                },
              ]}
              value={activeSection}
              onChange={(next) => {
                setActiveSection(next);
                if (next === 'plans') setIsReordering(false);
              }}
            />

            {activeSection === 'plans' ? (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleGroup}>
                    <AppText style={styles.sectionTitleText}>
                      {t('plans.scheduledSectionTitle')}
                    </AppText>
                    <View style={styles.badgeCount}>
                      <AppText style={styles.badgeCountText}>
                        {activePlans.length}
                      </AppText>
                    </View>
                  </View>
                </View>

                {activePlans.length === 0 ? (
                  <Card style={styles.emptyPlansCard}>
                    <View style={styles.emptyPlansIcon}>
                      <Ionicons name="calendar-outline" size={28} color="#9E7F60" />
                    </View>
                    <AppText variant="sectionTitle" style={styles.emptyPlansTitle}>
                      {t('plans.noPlansTitle')}
                    </AppText>
                    <AppText muted style={styles.emptyPlansSubtitle}>
                      {t('plans.noPlansSubtitle')}
                    </AppText>
                  </Card>
                ) : (
                  <View style={styles.plansStack}>
                    {activePlans.map((plan) => {
                      const ctx = itemContextMap.get(plan.item_id);
                      const linkedItem = ctx?.item ?? buildFallbackPlanItem(plan);

                      return (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          item={linkedItem}
                          listName={ctx?.listName}
                          variant="list"
                          isActionPending={planAction.isPending}
                          onPress={() => router.push(`/item/${plan.item_id}`)}
                          onEdit={() => setEditingPlanTarget({ plan, item: linkedItem })}
                          onAction={(action) => {
                            planAction.mutate(
                              { planId: plan.id, action },
                              {
                                onSuccess: () =>
                                  toast?.showToast({
                                    type: action === 'cancel' ? 'info' : 'success',
                                    title:
                                      action === 'cancel'
                                        ? t('plans.cancelledToast')
                                        : t('plans.planUpdated'),
                                  }),
                              },
                            );
                          }}
                        />
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleGroup}>
                    <AppText style={styles.sectionTitleText}>
                      {t('lists.yourActiveLists')}
                    </AppText>
                    <View style={styles.badgeCount}>
                      <AppText style={styles.badgeCountText}>{entries.length}</AppText>
                    </View>
                  </View>
                  <View style={styles.sectionHeaderActions}>
                    {entries.length > 1 ? (
                      <SpringPressable
                        onPress={() => setIsReordering((current) => !current)}
                        pressScale={0.94}
                        haptic="selection"
                        style={[
                          styles.reorderPill,
                          isReordering && styles.reorderPillActive,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isReordering ? t('lists.doneReordering') : t('lists.reorder')
                        }
                      >
                        <Ionicons
                          name={isReordering ? 'checkmark' : 'swap-vertical-outline'}
                          size={14}
                          color={isReordering ? colors.onAccent : colors.primaryText}
                        />
                        <AppText
                          style={[
                            styles.reorderPillText,
                            isReordering && styles.reorderPillTextActive,
                          ]}
                        >
                          {isReordering ? t('lists.doneReordering') : t('lists.reorder')}
                        </AppText>
                      </SpringPressable>
                    ) : null}
                    <SpringPressable
                      onPress={() => router.push(`/list/create?spaceId=${space.id}`)}
                      pressScale={0.94}
                      haptic="light"
                      style={styles.newListPill}
                      accessibilityRole="button"
                      accessibilityLabel={t('home.createANewList')}
                    >
                      <Ionicons name="add" size={16} color={colors.primaryText} />
                      <AppText style={styles.newListPillText}>
                        {t('home.newList')}
                      </AppText>
                    </SpringPressable>
                  </View>
                </View>

                {entries.length === 0 ? (
                  <Animated.View
                    entering={FadeIn.duration(220)}
                    style={styles.emptyHeroWrap}
                  >
                    <LinearGradient
                      colors={['#C4AA8E', '#A48567', '#86694E']}
                      locations={[0, 0.45, 1]}
                      start={{ x: 0.12, y: 0 }}
                      end={{ x: 0.88, y: 1 }}
                      style={styles.emptyHeroCard}
                    >
                      <View style={styles.emptyIconCircle}>
                        <Ionicons
                          name="albums-outline"
                          size={26}
                          color={colors.onAccent}
                        />
                      </View>
                      <AppText style={styles.emptyTitle}>
                        {t('lists.createYourFirstList')}
                      </AppText>
                      <AppText style={styles.emptySubtitle}>
                        {t('lists.makeAListOfPlacesToVisitMoviesToWatch')}
                      </AppText>
                      <SpringPressable
                        accessibilityRole="button"
                        accessibilityLabel={t('lists.createAList')}
                        onPress={() => router.push(`/list/create?spaceId=${space.id}`)}
                        pressScale={0.965}
                        haptic="medium"
                        style={styles.emptyCtaPressable}
                      >
                        <GlassSurface
                          pointerEvents="none"
                          interactive
                          tintColor="rgba(255, 255, 255, 0.20)"
                          fallbackBackgroundColor="rgba(255, 255, 255, 0.24)"
                          blurIntensity={28}
                          style={styles.emptyCtaPill}
                        >
                          <View style={styles.emptyCtaSpacer} />
                          <AppText style={styles.emptyCtaText}>
                            {t('lists.createAList')}
                          </AppText>
                          <View style={styles.emptyCtaArrowCircle}>
                            <Ionicons
                              name="arrow-forward"
                              size={17}
                              color={colors.primaryText}
                            />
                          </View>
                        </GlassSurface>
                      </SpringPressable>
                    </LinearGradient>
                  </Animated.View>
                ) : (
                  <Animated.View
                    entering={FadeIn.duration(220)}
                    layout={LAYOUT_SPRING}
                    style={styles.listContainer}
                  >
                    {entries.map((list, index) => {
                      const items = itemQueries[index]?.data?.data ?? [];
                      const latestItem = items[0];
                      return (
                        <Animated.View
                          key={list.id}
                          layout={LAYOUT_SPRING}
                          style={styles.cardPressable}
                        >
                          <SpringPressable
                            accessibilityRole="button"
                            accessibilityLabel={t('home.openValue', {
                              value0: list.name,
                            })}
                            onPress={() => router.push(`/list/${list.id}`)}
                            pressScale={0.968}
                            haptic="light"
                            style={styles.card}
                          >
                            <ListCoverPreview
                              listName={list.name}
                              isDefault={list.is_default}
                              customIcon={list.icon}
                              items={items}
                            />
                            <View style={styles.cardFooter}>
                              <View style={styles.body}>
                                <AppText
                                  variant="cardTitle"
                                  numberOfLines={1}
                                  style={styles.cardName}
                                >
                                  {list.name}
                                </AppText>
                                <AppText
                                  muted
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                  style={styles.cardMeta}
                                >
                                  {latestItem
                                    ? t('lists.lastAdded', {
                                        name:
                                          latestItem.created_by_name ??
                                          t('common.someone'),
                                        time: formatRelativeTime(latestItem.created_at),
                                      })
                                    : t('lists.0Items')}
                                </AppText>
                              </View>
                              {isReordering ? (
                                <View style={styles.reorderControls}>
                                  <SpringPressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t('lists.moveUp')}
                                    hitSlop={6}
                                    pressScale={0.88}
                                    disabled={index === 0 || reorderingPending}
                                    onPress={(event) => {
                                      event.stopPropagation();
                                      void moveListOrder(index, -1);
                                    }}
                                    style={[
                                      styles.reorderArrowBtn,
                                      index === 0 && styles.reorderArrowDisabled,
                                    ]}
                                  >
                                    <Ionicons
                                      name="chevron-up"
                                      size={15}
                                      color={colors.primaryText}
                                    />
                                  </SpringPressable>
                                  <SpringPressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t('lists.moveDown')}
                                    hitSlop={6}
                                    pressScale={0.88}
                                    disabled={
                                      index === entries.length - 1 || reorderingPending
                                    }
                                    onPress={(event) => {
                                      event.stopPropagation();
                                      void moveListOrder(index, 1);
                                    }}
                                    style={[
                                      styles.reorderArrowBtn,
                                      index === entries.length - 1 &&
                                        styles.reorderArrowDisabled,
                                    ]}
                                  >
                                    <Ionicons
                                      name="chevron-down"
                                      size={15}
                                      color={colors.primaryText}
                                    />
                                  </SpringPressable>
                                </View>
                              ) : (
                                <SpringPressable
                                  accessibilityRole="button"
                                  accessibilityLabel={t('lists.addAnItemToValue', {
                                    value0: list.name,
                                  })}
                                  hitSlop={8}
                                  pressScale={0.88}
                                  haptic="medium"
                                  onPress={(event) => {
                                    event.stopPropagation();
                                    router.push(`/item/create?listId=${list.id}`);
                                  }}
                                  style={styles.quickAddButton}
                                >
                                  <Ionicons
                                    name="add"
                                    size={16}
                                    color={colors.onAccent}
                                  />
                                </SpringPressable>
                              )}
                            </View>
                          </SpringPressable>
                        </Animated.View>
                      );
                    })}
                  </Animated.View>
                )}
              </>
            )}
          </>
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
              <AppText variant="sectionTitle" style={styles.sheetTitle}>
                {t('home.switchSpace')}
              </AppText>
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
              >
                {(spaces.data?.data ?? []).map((entry, index) => {
                  const memberQuery = spaceMemberQueries[index];
                  const entryMembers = memberQuery?.data?.data ?? [];
                  const active = entry.id === space?.id;
                  return (
                    <SpringPressable
                      key={entry.id}
                      accessibilityRole="button"
                      accessibilityLabel={t('home.chooseValue', { value0: entry.name })}
                      pressScale={0.98}
                      haptic="selection"
                      onPress={() => {
                        setSelectedSpaceId(entry.id);
                        setSpaceSheetOpen(false);
                      }}
                      style={[styles.sheetRow, active && styles.sheetRowActive]}
                    >
                      <View style={styles.listIcon}>
                        <Ionicons
                          name="people-outline"
                          size={18}
                          color={colors.onAccent}
                        />
                      </View>
                      <View style={styles.sheetRowBody}>
                        <AppText variant="cardTitle" style={styles.sheetRowTitle}>
                          {entry.name}
                        </AppText>
                        <AppText variant="caption" muted numberOfLines={1}>
                          {memberQuery?.isLoading
                            ? t('home.loadingMembers')
                            : entryMembers.length > 0
                              ? entryMembers
                                  .map((member) => member.display_name)
                                  .join(' · ')
                              : t('home.invitationPending')}
                        </AppText>
                      </View>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={21}
                          color={colors.primaryText}
                        />
                      ) : null}
                    </SpringPressable>
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
                <Ionicons name="add" size={18} color={colors.onAccent} />
                <AppText style={styles.sheetCreateText}>
                  {t('home.createANewSpace')}
                </AppText>
              </SpringPressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {editingPlanTarget ? (
          <PlanSheet
            visible={Boolean(editingPlanTarget)}
            item={editingPlanTarget.item}
            existingPlan={editingPlanTarget.plan}
            onClose={() => setEditingPlanTarget(null)}
          />
        ) : null}
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
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  editorialHeader: {
    gap: 4,
    marginBottom: 14,
    marginTop: 2,
  },
  sectionSwitch: {
    marginBottom: 16,
  },
  emptyPlansCard: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  emptyPlansIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyPlansTitle: {
    textAlign: 'center',
  },
  emptyPlansSubtitle: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: 19,
  },
  plansStack: {
    gap: spacing.sm + 2,
    paddingBottom: spacing.md,
  },
  summaryEyebrow: {
    color: colors.secondaryText,
    letterSpacing: -0.1,
  },
  editorialLine: {
    lineHeight: 35,
  },
  headlineLeading: {
    color: colors.secondaryText,
  },
  headlineAccent: {
    color: colors.primaryText,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: spacing.sm,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.35,
  },
  badgeCount: {
    backgroundColor: colors.accentSoft,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  newListPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    ...shadows.glass,
  },
  newListPillPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  newListPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primaryText,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
  },
  reorderPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  reorderPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
  },
  reorderPillTextActive: {
    color: colors.onAccent,
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reorderArrowDisabled: {
    opacity: 0.35,
  },
  emptyHeroWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    ...shadows.elevated,
  },
  emptyHeroCard: {
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.onAccent,
    textAlign: 'center',
    letterSpacing: -0.35,
  },
  emptySubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(255, 252, 248, 0.88)',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 4,
  },
  emptyCtaPressable: {
    width: '100%',
    borderRadius: radius.pill,
  },
  emptyCtaPill: {
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
  emptyCtaSpacer: {
    width: 38,
  },
  emptyCtaText: {
    color: colors.onAccent,
    fontSize: 14.5,
    fontWeight: '600',
  },
  emptyCtaArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: spacing.md,
  },
  cardPressable: {
    width: '48.2%',
  },
  cardPressed: {
    transform: [{ scale: 0.978 }],
    opacity: 0.93,
  },
  card: {
    gap: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    padding: 8,
    ...shadows.card,
  },
  previewBox: {
    width: '100%',
    aspectRatio: 1.04,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  emptyPreviewCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPreviewBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glass,
  },
  previewSingle: {
    width: '100%',
    height: '100%',
  },
  previewSplitRow: {
    flexDirection: 'row',
    gap: 3,
  },
  previewHalf: {
    flex: 1,
    height: '100%',
  },
  previewFeaturedLeft: {
    flex: 1.25,
    height: '100%',
  },
  previewRightColumn: {
    flex: 1,
    gap: 3,
    height: '100%',
  },
  previewRightHalf: {
    flex: 1,
    width: '100%',
  },
  previewQuad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  previewTile: {
    width: '49%',
    height: '49%',
    backgroundColor: colors.surfaceSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardName: {
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.primaryText,
  },
  cardMeta: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.secondaryText,
  },
  quickAddButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadows.glass,
  },
  quickAddButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },
  pressed: { opacity: 0.8 },
  skeletonGroup: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  skeletonListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
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
  },
  sheetTitle: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  sheetScroll: { maxHeight: 360 },
  sheetScrollContent: { gap: spacing.sm },
  sheetRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
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
  sheetRowBody: { flex: 1, gap: 2 },
  sheetRowTitle: { color: colors.primaryText },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sheetCreateButton: {
    minHeight: 50,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  sheetCreateText: { color: colors.onAccent, fontWeight: '600', fontSize: 14 },
});
