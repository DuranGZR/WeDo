import { formatRelativeTime, t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated';

import { ItemCommentsSection } from '@/components/domain/ItemCommentsSection';
import {
  getItemFallbackImage,
  getItemPreviewImage,
  getItemSourceLabel,
} from '@/components/domain/ItemCard';
import { useToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { ENTER_EASING, LAYOUT_SPRING } from '@/components/motion/springs';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  GlassSurface,
  IconButton,
  ItemDetailSkeleton,
  Screen,
  ScreenHeader,
  SmartImage,
  TextField,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { itemsApi } from '@/features/items/api';
import {
  useCompleteItem,
  useDeleteItem,
  useItem,
  useMoveItem,
  useRestoreItem,
  useUpdateItem,
} from '@/features/items/hooks';
import { useLists } from '@/features/lists/hooks';
import { PlanCard } from '@/features/plans/PlanCard';
import { usePlanAction, useSpacePlans } from '@/features/plans/hooks';
import { PlanSheet } from '@/features/plans/PlanSheet';
import { SafetyActions } from '@/features/safety/SafetyActions';
import {
  buildLocationQuery,
  isPlaceLikeItem,
  openInAppleMaps,
  openInGoogleMaps,
} from '@/lib/external-apps';
import { haptic } from '@/lib/haptics';

export default function ItemDetailScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const client = useQueryClient();
  const { showToast } = useToast();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const item = useItem(itemId);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const lists = useLists(item.data?.space_id ?? '');
  const plans = useSpacePlans(item.data?.space_id ?? '');
  const planAction = usePlanAction(item.data?.space_id ?? '');
  const complete = useCompleteItem(itemId);
  const restore = useRestoreItem(itemId);
  const remove = useDeleteItem(itemId, item.data?.list_id ?? '');
  const update = useUpdateItem(itemId);
  const move = useMoveItem(itemId, item.data?.list_id ?? '', item.data?.space_id ?? '');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (item.isLoading) {
    return (
      <Screen>
        <ItemDetailSkeleton />
      </Screen>
    );
  }

  if (item.isError && !item.data) {
    return (
      <Screen>
        <ScreenHeader onBack={goBack} />
        <EmptyState
          icon="cloud-offline-outline"
          title={t('items.couldnTLoad')}
          description={t('items.weCouldnTLoadThisItemPleaseCheckYourConnection')}
          action={t('common.retry')}
          onAction={() => void item.refetch()}
        />
      </Screen>
    );
  }

  if (!item.data) {
    return (
      <Screen>
        <ScreenHeader onBack={goBack} />
        <EmptyState
          icon="alert-circle-outline"
          title={t('items.itemNotFound')}
          description={t('items.thisItemHasBeenDeletedOrIsNoLongerAvailable')}
          action={t('items.goBack')}
          onAction={goBack}
        />
      </Screen>
    );
  }

  const value = item.data;
  const completed = value.status === 'completed';

  const confirmDelete = () => {
    haptic.warning();
    Alert.alert(t('items.deleteThisItem'), t('items.thisItemWillBeRemovedFromTheList'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('items.delete'),
        style: 'destructive',
        onPress: () => {
          haptic.medium();
          remove.mutate(undefined, { onSuccess: () => router.back() });
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await client.invalidateQueries({ queryKey: ['items', itemId] });
      await client.invalidateQueries({ queryKey: ['items', itemId, 'comments'] });
      if (value.space_id) {
        await client.invalidateQueries({ queryKey: ['spaces', value.space_id, 'plans'] });
      }
      await item.refetch?.();
    } finally {
      setRefreshing(false);
    }
  };

  const openEditModal = () => {
    setEditTitle(value.title ?? '');
    setEditDescription(value.description ?? '');
    setIsEditOpen(true);
  };

  const saveEdits = () => {
    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();
    update.mutate(
      {
        title: trimmedTitle || undefined,
        description: trimmedDescription,
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          showToast({ type: 'success', title: t('items.updated') });
        },
        onError: (err) => {
          showToast({
            type: 'error',
            title: t('settings.couldnTSave'),
            message: err instanceof Error ? err.message : t('common.tryAgainShort'),
          });
        },
      },
    );
  };

  const handleCopyLink = async () => {
    if (!value.original_url) return;
    try {
      await Clipboard.setStringAsync(value.original_url);
      showToast({ type: 'success', title: t('items.copiedLink') });
    } catch {
      showToast({ type: 'error', title: t('common.tryAgainShort') });
    }
  };

  const placeLike = isPlaceLikeItem(value);
  const locationQuery = buildLocationQuery({
    title: value.title,
    originalUrl: value.original_url,
  });

  const activePlan = (plans.data?.data ?? []).find(
    (entry) =>
      entry.item_id === value.id &&
      (entry.status === 'proposed' || entry.status === 'approved'),
  );

  const pendingPreview =
    (value.metadata_status === 'pending' || value.metadata_status === 'processing') &&
    !value.preview_image_url;

  return (
    <Screen
      scroll
      automaticallyAdjustKeyboardInsets
      refreshing={refreshing}
      onRefresh={() => void handleRefresh()}
    >
      <ScreenHeader
        onBack={goBack}
        rightAction={
          <View style={styles.headerActions}>
            <IconButton
              tone="glass"
              size={40}
              label={t('items.editItem')}
              icon={
                <Ionicons name="create-outline" size={18} color={colors.primaryText} />
              }
              onPress={openEditModal}
            />
            <IconButton
              tone="glass"
              size={40}
              label={t('items.viewHistory')}
              icon={<Ionicons name="time-outline" size={18} color={colors.primaryText} />}
              onPress={() => router.push(`/item/${value.id}/history`)}
            />
          </View>
        }
      />

      <Animated.View entering={FadeIn.duration(220)} style={styles.content}>
        <Card variant="elevated" style={styles.previewCard}>
          <SmartImage
            uri={getItemPreviewImage(value)}
            fallbackUri={getItemFallbackImage(value)}
            pending={pendingPreview}
            style={styles.cover}
          />
          <View style={styles.metaPills}>
            <View style={styles.sourceBadge}>
              <AppText style={styles.sourceBadgeText}>
                {getItemSourceLabel(value)}
              </AppText>
            </View>
            <AppText variant="caption" muted>
              {formatRelativeTime(value.created_at)}
            </AppText>
          </View>
          <AppText variant="pageTitle" style={styles.title}>
            {value.title ?? t('common.savedItem')}
          </AppText>
          {value.description ? (
            <AppText style={styles.description}>{value.description}</AppText>
          ) : null}
          {value.original_url ? (
            <View style={styles.linkRow}>
              <SpringPressable
                onPress={() => void Linking.openURL(value.original_url!)}
                pressScale={0.965}
                haptic="light"
                style={[styles.pillPressable, styles.linkOpenFlex]}
                accessibilityRole="button"
                accessibilityLabel={t('items.openLink')}
              >
                <GlassSurface
                  elevated
                  interactive
                  tintColor="rgba(255, 255, 255, 0.52)"
                  fallbackBackgroundColor={colors.glassElevated}
                  style={styles.sourceButton}
                >
                  <Ionicons name="open-outline" size={17} color={colors.primaryText} />
                  <AppText style={styles.sourceButtonText}>{t('items.openLink')}</AppText>
                </GlassSurface>
              </SpringPressable>
              <IconButton
                tone="glass"
                size={46}
                label={t('items.copyLink')}
                icon={
                  <Ionicons name="copy-outline" size={18} color={colors.primaryText} />
                }
                onPress={() => void handleCopyLink()}
              />
            </View>
          ) : null}
          {placeLike && locationQuery ? (
            <View style={styles.mapsRow}>
              {Platform.OS === 'ios' ? (
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityLabel={t('items.openAppleMaps')}
                  pressScale={0.95}
                  haptic="light"
                  onPress={() => void openInAppleMaps(locationQuery, value.original_url)}
                  style={styles.mapPill}
                >
                  <Ionicons name="map-outline" size={15} color="#5F4932" />
                  <AppText style={styles.mapPillText}>{t('items.openAppleMaps')}</AppText>
                </SpringPressable>
              ) : null}
              <SpringPressable
                accessibilityRole="button"
                accessibilityLabel={t('items.openGoogleMaps')}
                pressScale={0.95}
                haptic="light"
                onPress={() => void openInGoogleMaps(locationQuery, value.original_url)}
                style={styles.mapPill}
              >
                <Ionicons name="navigate-outline" size={15} color="#5F4932" />
                <AppText style={styles.mapPillText}>{t('items.openGoogleMaps')}</AppText>
              </SpringPressable>
            </View>
          ) : null}
          <View style={styles.creatorRow}>
            <View style={styles.creatorIcon}>
              <Ionicons name="person-outline" size={14} color={colors.primaryText} />
            </View>
            <AppText muted style={styles.creatorText}>
              {t('items.addedBy')} {value.created_by_name}
            </AppText>
          </View>
        </Card>

        <SafetyActions
          itemId={value.id}
          userId={value.created_by}
          displayName={value.created_by_name}
          spaceId={value.space_id}
        />

        {activePlan ? (
          <PlanCard
            plan={activePlan}
            item={value}
            variant="detail"
            isActionPending={planAction.isPending}
            onEdit={() => setIsPlanOpen(true)}
            onAction={(action) => {
              planAction.mutate(
                { planId: activePlan.id, action },
                {
                  onSuccess: () =>
                    showToast({
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
        ) : (
          <SpringPressable
            onPress={() => setIsPlanOpen(true)}
            pressScale={0.965}
            haptic="light"
            style={styles.pillPressable}
            accessibilityRole="button"
            accessibilityLabel={t('plans.schedulePlan')}
          >
            <GlassSurface
              elevated
              interactive
              tintColor="rgba(250, 245, 238, 0.78)"
              fallbackBackgroundColor="#FAF5EE"
              style={styles.scheduleTrigger}
            >
              <Ionicons name="calendar-outline" size={19} color="#7A5E42" />
              <AppText style={styles.scheduleTriggerText}>
                {t('plans.schedulePlan')}
              </AppText>
            </GlassSurface>
          </SpringPressable>
        )}

        <SpringPressable
          onPress={() => {
            if (completed) {
              restore.mutate(undefined, {
                onSuccess: () =>
                  showToast({
                    type: 'info',
                    title: t('items.markedAsNotDoneToast'),
                    actionLabel: t('common.undo'),
                    onAction: () => complete.mutate(),
                  }),
              });
            } else {
              complete.mutate(undefined, {
                onSuccess: () =>
                  showToast({
                    type: 'success',
                    title: t('items.markedAsDoneToast'),
                    actionLabel: t('common.undo'),
                    onAction: () => restore.mutate(),
                  }),
              });
            }
          }}
          disabled={complete.isPending || restore.isPending}
          pressScale={0.965}
          haptic={completed ? 'light' : 'medium'}
          style={[
            styles.pillPressable,
            !completed && styles.completeButton,
            (complete.isPending || restore.isPending) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            completed ? t('items.markAsNotDone') : t('items.markAsDone')
          }
        >
          {completed ? (
            <GlassSurface
              elevated
              interactive
              tintColor="rgba(255, 255, 255, 0.54)"
              fallbackBackgroundColor={colors.glassElevated}
              style={styles.restoreButton}
            >
              {restore.isPending ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <>
                  <Ionicons
                    name="arrow-undo-outline"
                    size={19}
                    color={colors.primaryText}
                  />
                  <AppText style={styles.restoreText}>{t('items.markAsNotDone')}</AppText>
                </>
              )}
            </GlassSurface>
          ) : complete.isPending ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.onAccent}
              />
              <AppText style={styles.completeText}>{t('items.markAsDone')}</AppText>
            </>
          )}
        </SpringPressable>

        <SpringPressable
          onPress={() => setIsMoveOpen((current) => !current)}
          pressScale={0.965}
          haptic="selection"
          style={styles.pillPressable}
          accessibilityRole="button"
        >
          <GlassSurface
            elevated
            interactive
            tintColor="rgba(255, 255, 255, 0.52)"
            fallbackBackgroundColor={colors.glassElevated}
            style={styles.moveButton}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={19}
              color={colors.primaryText}
            />
            <AppText style={styles.moveText}>{t('items.moveToAnotherList')}</AppText>
          </GlassSurface>
        </SpringPressable>

        {isMoveOpen ? (
          <Animated.View entering={FadeInDown.duration(180)} layout={LAYOUT_SPRING}>
            <Card style={styles.moveCard}>
              <AppText variant="cardTitle">{t('items.destinationList')}</AppText>
              {lists.data?.data
                .filter((entry) => entry.id !== value.list_id)
                .map((entry) => (
                  <SpringPressable
                    key={entry.id}
                    accessibilityRole="button"
                    disabled={move.isPending}
                    pressScale={0.975}
                    haptic="selection"
                    onPress={() => {
                      const previousListId = value.list_id;
                      move.mutate(entry.id, {
                        onSuccess: () => {
                          setIsMoveOpen(false);
                          showToast({
                            type: 'success',
                            title: t('items.movedToListToast', { list: entry.name }),
                            actionLabel: t('common.undo'),
                            onAction: () => {
                              void itemsApi.move(value.id, previousListId).then(() => {
                                void client.invalidateQueries({
                                  queryKey: ['items', value.id],
                                });
                                void client.invalidateQueries({ queryKey: ['lists'] });
                                router.replace(`/list/${previousListId}`);
                              });
                            },
                          });
                          router.replace(`/list/${entry.id}`);
                        },
                      });
                    }}
                    style={styles.moveOption}
                  >
                    <AppText style={styles.moveOptionText}>{entry.name}</AppText>
                    <Ionicons name="arrow-forward" size={17} color={colors.primaryText} />
                  </SpringPressable>
                ))}
              {lists.data?.data.length === 1 ? (
                <AppText muted>
                  {t('items.createAnotherListInThisSpaceToMoveTheItem')}
                </AppText>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        <ItemCommentsSection itemId={value.id} spaceId={value.space_id} />

        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('items.viewHistory')}
          pressScale={0.975}
          haptic="selection"
          onPress={() => router.push(`/item/${value.id}/history`)}
          style={styles.pillPressable}
        >
          <GlassSurface
            elevated
            interactive
            tintColor="rgba(255, 255, 255, 0.52)"
            fallbackBackgroundColor={colors.glassElevated}
            style={styles.moveButton}
          >
            <Ionicons name="time-outline" size={18} color={colors.primaryText} />
            <AppText style={styles.moveText}>{t('items.viewHistory')}</AppText>
          </GlassSurface>
        </SpringPressable>

        <SpringPressable
          onPress={confirmDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={remove.isPending}
          pressScale={0.96}
          haptic="warning"
          style={[styles.deleteButton, remove.isPending && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel={t('items.deleteItem')}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <AppText style={styles.deleteText}>
            {remove.isPending ? t('safety.deleting') : t('items.deleteItem')}
          </AppText>
        </SpringPressable>
      </Animated.View>

      <Modal
        visible={isEditOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsEditOpen(false)}>
          <Animated.View
            entering={
              reducedMotion ? undefined : SlideInDown.duration(220).easing(ENTER_EASING)
            }
            exiting={reducedMotion ? undefined : SlideOutDown.duration(160)}
            style={styles.sheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandle} />
            <AppText variant="sectionTitle">{t('items.editItem')}</AppText>
            <TextField
              label={t('items.titleLabel')}
              value={editTitle}
              onChangeText={setEditTitle}
              maxLength={255}
              placeholder={t('common.savedItem')}
            />
            <TextField
              label={t('items.noteLabel')}
              value={editDescription}
              onChangeText={setEditDescription}
              maxLength={1000}
              multiline
              placeholder={t('items.notePlaceholder')}
            />
            <Button
              label={t('sharing.save')}
              variant="primary"
              loading={update.isPending}
              disabled={update.isPending}
              onPress={saveEdits}
            />
            <Button
              label={t('items.cancel')}
              variant="ghost"
              onPress={() => setIsEditOpen(false)}
            />
          </Animated.View>
        </Pressable>
      </Modal>
      <PlanSheet
        visible={isPlanOpen}
        item={value}
        existingPlan={activePlan}
        onClose={() => setIsPlanOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.md + 2,
    padding: spacing.sm,
    paddingBottom: spacing.huge,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewCard: {
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cover: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  metaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  sourceBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryText,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.primaryText,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkOpenFlex: {
    flex: 1,
  },
  mapsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
  },
  mapPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5F4932',
  },
  pillPressable: {
    borderRadius: radius.pill,
  },
  sourceButton: {
    minHeight: 46,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  sourceButtonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  creatorIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorText: {
    fontSize: 13,
  },
  completeButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  completeText: { color: colors.onAccent, fontSize: 15, fontWeight: '600' },
  restoreButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  restoreText: { color: colors.primaryText, fontSize: 15, fontWeight: '600' },
  moveButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  moveText: { color: colors.primaryText, fontSize: 14, fontWeight: '600' },
  moveCard: {
    gap: spacing.sm,
    padding: spacing.md + 2,
    borderRadius: 22,
  },
  moveOption: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moveOptionText: { color: colors.primaryText, fontWeight: '600' },
  deleteButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(184, 74, 66, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.errorSoft,
  },
  deleteText: { color: colors.error, fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.55 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 16, 0.34)',
  },
  sheet: {
    gap: spacing.md,
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
  scheduleTrigger: {
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D4BEA4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  scheduleTriggerText: {
    color: '#5F4932',
    fontSize: 15,
    fontWeight: '600',
  },
});
