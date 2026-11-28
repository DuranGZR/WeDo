import { formatLocale, searchText, t, type TranslationKey } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  classifyItemSource,
  ItemCard,
  type ItemSourceKind,
} from '@/components/domain/ItemCard';
import { useOptionalToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { ENTER_EASING, LAYOUT_SPRING, SLIDE_SPRING } from '@/components/motion/springs';
import {
  AppText,
  Button,
  Card,
  GlassSurface,
  IconButton,
  ListDetailSkeleton,
  Screen,
  ScreenHeader,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { itemsApi } from '@/features/items/api';
import { useItems } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { getListAppearance } from '@/features/lists/appearance';
import { useList, useLists } from '@/features/lists/hooks';
import { haptic } from '@/lib/haptics';

type SortOption = 'newest' | 'oldest' | 'az';
type SourceFilter = 'all' | ItemSourceKind;

const SORT_OPTIONS: { value: SortOption; labelKey: TranslationKey }[] = [
  { value: 'newest', labelKey: 'lists.sortNewest' },
  { value: 'oldest', labelKey: 'lists.sortOldest' },
  { value: 'az', labelKey: 'lists.sortAZ' },
];

const SOURCE_OPTIONS: { value: SourceFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'lists.sourceAll' },
  { value: 'instagram', labelKey: 'lists.sourceInstagram' },
  { value: 'tiktok', labelKey: 'lists.sourceTikTok' },
  { value: 'youtube', labelKey: 'lists.sourceYoutube' },
  { value: 'shopping', labelKey: 'lists.sourceShopping' },
  { value: 'maps', labelKey: 'lists.sourceMaps' },
  { value: 'web', labelKey: 'lists.sourceWeb' },
];

const SWITCH_STEP = 38; // 36px circle + 2px gap

export default function ListDetailScreen() {
  useTranslation();
  const locale = formatLocale();
  const client = useQueryClient();
  const toast = useOptionalToast();
  const reducedMotion = useReducedMotion();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const list = useList(listId);
  const spaceLists = useLists(list.data?.space_id ?? '');
  const result = useItems(listId);
  const { refetch } = result;
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>(
    'all',
  );
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [moveTargetItem, setMoveTargetItem] = useState<Item | null>(null);

  const viewThumbX = useSharedValue(0);
  useEffect(() => {
    const target = viewMode === 'list' ? SWITCH_STEP : 0;
    if (reducedMotion) {
      viewThumbX.value = target;
      return;
    }
    viewThumbX.value = withSpring(target, SLIDE_SPRING);
  }, [reducedMotion, viewMode, viewThumbX]);

  const viewThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: viewThumbX.value }],
  }));

  const items = useMemo(() => result.data?.data ?? [], [result.data?.data]);

  const filteredItems = useMemo(() => {
    const query = searchText(searchQuery.trim(), locale);
    const matches = items.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && item.status === 'completed') ||
        (statusFilter === 'pending' && item.status !== 'completed');
      const matchesSource =
        sourceFilter === 'all' || classifyItemSource(item) === sourceFilter;
      const matchesSearch =
        !isSearching ||
        !query ||
        searchText(
          `${item.title ?? ''} ${item.description ?? ''} ${item.source_domain ?? ''}`,
          locale,
        ).includes(query);
      return matchesStatus && matchesSource && matchesSearch;
    });

    return [...matches].sort((a, b) => {
      if (sortBy === 'az') {
        return (a.title ?? '').localeCompare(b.title ?? '', locale);
      }
      const delta = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortBy === 'oldest' ? -delta : delta;
    });
  }, [items, isSearching, searchQuery, statusFilter, sourceFilter, sortBy, locale]);

  if (result.isLoading || list.isLoading) {
    return (
      <Screen>
        <ListDetailSkeleton />
      </Screen>
    );
  }

  if (result.isError || !list.data) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <AppText variant="sectionTitle" style={styles.errorTitle}>
            {t('lists.couldnTLoadList')}
          </AppText>
          <AppText muted style={styles.errorSubtitle}>
            {t('lists.checkYourConnectionAndTryAgain')}
          </AppText>
          <Button
            label={t('lists.goBack')}
            onPress={() => router.replace('/(tabs)/lists')}
          />
        </Card>
      </Screen>
    );
  }

  const listVisual = getListAppearance(
    list.data.name,
    list.data.is_default,
    list.data.icon,
  );
  const destinationLists = (spaceLists.data?.data ?? []).filter(
    (entry) => entry.id !== listId,
  );

  const invalidateListQueries = async (targetItemId?: string) => {
    await client.invalidateQueries({ queryKey: ['lists', listId] });
    await client.invalidateQueries({ queryKey: ['lists'] });
    if (targetItemId) {
      await client.invalidateQueries({ queryKey: ['items', targetItemId] });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await client.invalidateQueries({ queryKey: ['lists', listId] });
      await result.refetch?.();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleComplete = async (target: Item) => {
    const wasCompleted = target.status === 'completed';
    try {
      if (wasCompleted) {
        await itemsApi.restore(target.id);
      } else {
        await itemsApi.complete(target.id);
      }
      await invalidateListQueries(target.id);
      toast?.showToast({
        type: wasCompleted ? 'info' : 'success',
        title: wasCompleted
          ? t('items.markedAsNotDoneToast')
          : t('items.markedAsDoneToast'),
        actionLabel: t('common.undo'),
        onAction: () => {
          const revert = wasCompleted
            ? itemsApi.complete(target.id)
            : itemsApi.restore(target.id);
          void revert.then(() => invalidateListQueries(target.id));
        },
      });
    } catch {
      toast?.showToast({ type: 'error', title: t('common.tryAgainShort') });
    }
  };

  const handleMoveToList = async (targetListId: string, targetListName: string) => {
    if (!moveTargetItem) return;
    const itemToMove = moveTargetItem;
    try {
      await itemsApi.move(itemToMove.id, targetListId);
      setMoveTargetItem(null);
      await invalidateListQueries(itemToMove.id);
      toast?.showToast({
        type: 'success',
        title: t('items.movedToListToast', { list: targetListName }),
        actionLabel: t('common.undo'),
        onAction: () => {
          void itemsApi
            .move(itemToMove.id, listId)
            .then(() => invalidateListQueries(itemToMove.id));
        },
      });
    } catch {
      toast?.showToast({ type: 'error', title: t('common.tryAgainShort') });
    }
  };

  const confirmDeleteItem = (target: Item) => {
    haptic.warning();
    Alert.alert(t('items.deleteThisItem'), t('items.thisItemWillBeRemovedFromTheList'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('items.delete'),
        style: 'destructive',
        onPress: () => {
          void itemsApi
            .remove(target.id)
            .then(async () => {
              haptic.medium();
              await invalidateListQueries(target.id);
              toast?.showToast({ type: 'info', title: t('items.deletedToast') });
            })
            .catch(() => {
              toast?.showToast({ type: 'error', title: t('common.tryAgainShort') });
            });
        },
      },
    ]);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <ScreenHeader
        fallbackHref="/(tabs)/lists"
        rightAction={
          <View style={styles.headerActions}>
            <IconButton
              tone="glass"
              size={40}
              label={t('lists.searchThisList_28c9c')}
              icon={
                <Ionicons
                  name={isSearching ? 'close' : 'search-outline'}
                  size={18}
                  color={colors.primaryText}
                />
              }
              onPress={() => {
                setIsSearching((current) => {
                  if (current) setSearchQuery('');
                  return !current;
                });
              }}
            />
            <SpringPressable
              onPress={() => router.push(`/list/${listId}/edit`)}
              hitSlop={8}
              pressScale={0.94}
              haptic="light"
              style={styles.editBtnPressable}
              accessibilityRole="button"
              accessibilityLabel={t('lists.editList')}
            >
              <View style={styles.editBtn}>
                <Ionicons name="create-outline" size={16} color={colors.primaryText} />
                <AppText style={styles.editBtnText}>{t('lists.edit')}</AppText>
              </View>
            </SpringPressable>
          </View>
        }
      />

      <View style={styles.headerContent}>
        <View style={styles.identityRow}>
          <View
            style={[styles.iconCircle, { backgroundColor: listVisual.backgroundColor }]}
          >
            <Ionicons name={listVisual.icon} size={22} color={listVisual.color} />
          </View>
          <View style={styles.identityMeta}>
            <AppText variant="pageTitle" numberOfLines={2} style={styles.listName}>
              {list.data.name}
            </AppText>
            <AppText style={styles.countText}>
              {t('common.itemCount', { count: items.length })}
            </AppText>
          </View>
          <SpringPressable
            onPress={() => router.push(`/item/create?listId=${listId}`)}
            pressScale={0.95}
            haptic="medium"
            style={styles.addCompactPill}
            accessibilityRole="button"
            accessibilityLabel={t('lists.addLink')}
          >
            <Ionicons name="add" size={18} color={colors.onAccent} />
            <AppText style={styles.addCompactText}>{t('lists.addLink_95772')}</AppText>
          </SpringPressable>
        </View>

        {isSearching ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(150)}
            exiting={reducedMotion ? undefined : FadeOut.duration(120)}
            style={styles.searchBarRow}
          >
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={18}
                color={colors.secondaryText}
                style={styles.searchFieldIcon}
              />
              <TextField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('lists.searchThisList')}
                style={styles.searchField}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <SpringPressable
                  hitSlop={8}
                  pressScale={0.88}
                  haptic="selection"
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.tertiaryText} />
                </SpringPressable>
              )}
            </View>
            <SpringPressable
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              pressScale={0.95}
              haptic="selection"
              style={styles.cancelSearchBtn}
            >
              <AppText style={styles.cancelSearchText}>{t('items.cancel')}</AppText>
            </SpringPressable>
          </Animated.View>
        ) : null}

        {items.length > 0 ? (
          <>
            <View style={styles.controlsRow}>
              <SegmentedControl
                style={styles.segmentedFlex}
                options={[
                  { value: 'all', label: t('lists.all') },
                  { value: 'pending', label: t('lists.notDone') },
                  { value: 'completed', label: t('lists.done') },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <View style={styles.viewSwitcher}>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.viewSwitchThumb, viewThumbStyle]}
                />
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityLabel={t('lists.gridView')}
                  accessibilityState={{ selected: viewMode === 'grid' }}
                  pressScale={0.9}
                  pressOpacity={0.85}
                  haptic={viewMode === 'grid' ? 'none' : 'selection'}
                  onPress={() => {
                    if (viewMode === 'grid') return;
                    setViewMode('grid');
                  }}
                  style={styles.viewSwitchItem}
                >
                  <Ionicons
                    name="grid-outline"
                    size={16}
                    color={viewMode === 'grid' ? colors.onAccent : colors.secondaryText}
                  />
                </SpringPressable>
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityLabel={t('lists.listView')}
                  accessibilityState={{ selected: viewMode === 'list' }}
                  pressScale={0.9}
                  pressOpacity={0.85}
                  haptic={viewMode === 'list' ? 'none' : 'selection'}
                  onPress={() => {
                    if (viewMode === 'list') return;
                    setViewMode('list');
                  }}
                  style={styles.viewSwitchItem}
                >
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color={viewMode === 'list' ? colors.onAccent : colors.secondaryText}
                  />
                </SpringPressable>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterStrip}
            >
              {SORT_OPTIONS.map((option) => {
                const selected = sortBy === option.value;
                return (
                  <SpringPressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    pressScale={0.94}
                    haptic="selection"
                    onPress={() => setSortBy(option.value)}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                  >
                    <AppText
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextActive,
                      ]}
                    >
                      {t(option.labelKey)}
                    </AppText>
                  </SpringPressable>
                );
              })}

              <View style={styles.filterDivider} />

              {SOURCE_OPTIONS.map((option) => {
                const selected = sourceFilter === option.value;
                return (
                  <SpringPressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    pressScale={0.94}
                    haptic="selection"
                    onPress={() => setSourceFilter(option.value)}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                  >
                    <AppText
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextActive,
                      ]}
                    >
                      {t(option.labelKey)}
                    </AppText>
                  </SpringPressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </View>
    </View>
  );

  const emptyElement =
    items.length === 0 ? (
      <Animated.View layout={LAYOUT_SPRING} style={styles.emptyHeroWrap}>
        <LinearGradient
          colors={['#C4AA8E', '#A48567', '#86694E']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.88, y: 1 }}
          style={styles.emptyHeroCard}
        >
          <View style={styles.emptyHeroIconCircle}>
            <Ionicons name="link-outline" size={26} color={colors.onAccent} />
          </View>
          <AppText style={styles.emptyHeroTitle}>{t('lists.yourListIsEmpty')}</AppText>
          <AppText style={styles.emptyHeroSubtitle}>
            {t('lists.shareSomethingFromAnotherAppOrAddALinkAbove')}
          </AppText>
          <SpringPressable
            accessibilityRole="button"
            accessibilityLabel={t('items.addItem')}
            onPress={() => router.push(`/item/create?listId=${listId}`)}
            pressScale={0.97}
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
              <AppText style={styles.emptyCtaText}>{t('lists.addYourFirstItem')}</AppText>
              <View style={styles.emptyCtaArrowCircle}>
                <Ionicons name="arrow-forward" size={17} color={colors.primaryText} />
              </View>
            </GlassSurface>
          </SpringPressable>
        </LinearGradient>
      </Animated.View>
    ) : (
      <Animated.View entering={FadeIn.duration(200)} layout={LAYOUT_SPRING}>
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIconCircleMuted}>
            <Ionicons
              name={
                isSearching && searchQuery.trim()
                  ? 'search-outline'
                  : statusFilter === 'completed'
                    ? 'checkmark-done-circle-outline'
                    : 'checkbox-outline'
              }
              size={30}
              color={colors.secondaryText}
            />
          </View>
          <AppText variant="sectionTitle" style={styles.emptyTitle}>
            {isSearching && searchQuery.trim()
              ? t('lists.noResults')
              : statusFilter === 'completed'
                ? t('lists.noCompletedItems')
                : t('lists.nothingLeftToDo')}
          </AppText>
          <AppText muted style={styles.emptySubtitle}>
            {isSearching && searchQuery.trim()
              ? t('lists.noSavedItemsMatchValueCheckYourSearchAndTry', {
                  value0: searchQuery,
                })
              : statusFilter === 'completed'
                ? t('lists.noItemsInThisListHaveBeenMarkedAsDone')
                : t('lists.youVeCompletedEverythingInThisList')}
          </AppText>
        </Card>
      </Animated.View>
    );

  return (
    <Screen
      scroll={false}
      dismissKeyboardOnTap={false}
      ambient="hero"
      style={styles.screenNoPad}
    >
      <View style={styles.listShell}>
        {listHeader}
        <Animated.FlatList
          key={viewMode}
          style={styles.flatListFlex}
          data={items.length === 0 ? [] : filteredItems}
          keyExtractor={(entry) => entry.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyElement}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor="#9E7F60"
              colors={['#9E7F60']}
            />
          }
          renderItem={({ item }) => (
            <View style={viewMode === 'grid' ? styles.gridItemCell : styles.listItemCell}>
              <ItemCard
                item={item}
                grid={viewMode === 'grid'}
                onPress={() => router.push(`/item/${item.id}`)}
                onToggleComplete={
                  viewMode === 'list' ? () => void handleToggleComplete(item) : undefined
                }
                onMovePress={
                  viewMode === 'list' && destinationLists.length > 0
                    ? () => setMoveTargetItem(item)
                    : undefined
                }
                onDeletePress={
                  viewMode === 'list' ? () => confirmDeleteItem(item) : undefined
                }
              />
            </View>
          )}
        />
      </View>

      <Modal
        visible={Boolean(moveTargetItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setMoveTargetItem(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMoveTargetItem(null)}>
          <Animated.View
            entering={
              reducedMotion ? undefined : SlideInDown.duration(220).easing(ENTER_EASING)
            }
            exiting={reducedMotion ? undefined : SlideOutDown.duration(160)}
            style={styles.moveSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandle} />
            <AppText variant="sectionTitle">{t('items.destinationList')}</AppText>
            {destinationLists.map((entry) => (
              <SpringPressable
                key={entry.id}
                accessibilityRole="button"
                pressScale={0.975}
                haptic="selection"
                onPress={() => void handleMoveToList(entry.id, entry.name)}
                style={styles.moveSheetOption}
              >
                <AppText style={styles.moveSheetOptionText}>{entry.name}</AppText>
                <Ionicons name="arrow-forward" size={17} color={colors.primaryText} />
              </SpringPressable>
            ))}
            <Button
              label={t('items.cancel')}
              variant="ghost"
              onPress={() => setMoveTargetItem(null)}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editBtnPressable: {
    borderRadius: radius.pill,
  },
  editBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#F1EDE6',
    borderWidth: 1,
    borderColor: 'rgba(17, 17, 16, 0.08)',
    ...shadows.glass,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  listShell: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  flatListFlex: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: 10,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  headerBlock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerContent: {
    gap: spacing.md + 2,
    paddingHorizontal: 2,
    paddingTop: spacing.xs,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  gridItemCell: {
    flex: 1,
    maxWidth: '48.6%',
  },
  listItemCell: {
    width: '100%',
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  filterChipTextActive: {
    color: colors.onAccent,
  },
  filterDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 16, 0.34)',
  },
  moveSheet: {
    gap: spacing.sm + 2,
    padding: spacing.xl,
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
  moveSheetOption: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moveSheetOptionText: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  screenNoPad: {
    padding: 0,
    paddingBottom: 0,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...shadows.glass,
  },
  identityMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listName: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  countText: {
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  addCompactPill: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    ...shadows.pillAction,
  },
  addCompactText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onAccent,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchFieldIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 2,
  },
  searchField: {
    paddingLeft: spacing.xxl + 10,
    paddingRight: spacing.xxl,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 2,
    padding: 2,
  },
  cancelSearchBtn: {
    paddingHorizontal: spacing.sm,
    height: 46,
    justifyContent: 'center',
  },
  cancelSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segmentedFlex: {
    flex: 1,
  },
  viewSwitcher: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: '#EFEBE4',
    borderWidth: 1,
    borderColor: 'rgba(17, 17, 16, 0.08)',
    padding: 4,
    gap: 2,
  },
  viewSwitchThumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  viewSwitchItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 2,
  },
  itemsList: {
    gap: 10,
    marginTop: 2,
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
  emptyHeroIconCircle: {
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
  emptyHeroTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.onAccent,
    textAlign: 'center',
    letterSpacing: -0.35,
  },
  emptyHeroSubtitle: {
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
  emptyCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  emptyIconCircleMuted: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.secondaryText,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorCard: {
    margin: spacing.lg,
    borderRadius: radius.cardLg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: colors.error,
    fontWeight: '700',
  },
  errorSubtitle: {
    textAlign: 'center',
  },
});
