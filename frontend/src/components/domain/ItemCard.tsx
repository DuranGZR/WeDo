import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, SmartImage } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import type { Item } from '@/features/items/types';
import { formatDate, formatLocale, t } from '@/i18n';
import { haptic } from '@/lib/haptics';

export function getItemPreviewImage(item: Item): string {
  if (item.preview_image_url) {
    if (item.preview_image_url.startsWith('/')) {
      const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
      return `${baseUrl}${item.preview_image_url}`;
    }
    return item.preview_image_url;
  }

  const title = (item.title ?? '').toLowerCase();
  const domain = (item.source_domain ?? '').toLowerCase();

  if (
    domain.includes('trendyol') ||
    domain === 'ty.gl' ||
    domain.endsWith('.ty.gl') ||
    domain.includes('amazon') ||
    domain.includes('hepsiburada')
  ) {
    // If it has clothing/shirt keywords, return a beautiful navy blue shirt hanging on a hanger!
    if (
      title.includes('polo') ||
      title.includes('yaka') ||
      title.includes('shirt') ||
      title.includes('t-shirt') ||
      title.includes('mavi') ||
      title.includes('lacivert')
    ) {
      return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&auto=format&fit=crop&q=80';
    }
    // Trendyol/Shopping
    return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=80';
  }
  if (domain.includes('instagram')) {
    // Instagram/Social
    return 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=300&auto=format&fit=crop&q=80';
  }
  if (domain.includes('tiktok')) {
    // TikTok/Video
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
  }
  if (domain.includes('youtube')) {
    // YouTube
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300&auto=format&fit=crop&q=80';
  }
  if (domain.includes('google') || domain.includes('maps')) {
    // Google Maps/Places
    return 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&auto=format&fit=crop&q=80';
  }

  // Generic bookmark fallback
  return 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&auto=format&fit=crop&q=80';
}

export function getItemFallbackImage(item?: Item): string {
  if (!item) {
    return 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80';
  }
  const title = (item.title ?? '').toLowerCase();
  const domain = (item.source_domain ?? '').toLowerCase();

  if (
    domain.includes('trendyol') ||
    domain === 'ty.gl' ||
    domain.endsWith('.ty.gl') ||
    domain.includes('amazon') ||
    domain.includes('hepsiburada')
  ) {
    if (
      title.includes('polo') ||
      title.includes('yaka') ||
      title.includes('shirt') ||
      title.includes('t-shirt') ||
      title.includes('mavi') ||
      title.includes('lacivert')
    ) {
      return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&auto=format&fit=crop&q=80';
  }
  if (domain.includes('instagram')) {
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&auto=format&fit=crop&q=80';
  }
  if (domain.includes('tiktok')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
  }
  if (domain.includes('youtube')) {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80';
  }
  if (domain.includes('google') || domain.includes('maps')) {
    return 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400&auto=format&fit=crop&q=80';
}

export type ItemSourceKind =
  'instagram' | 'tiktok' | 'youtube' | 'shopping' | 'maps' | 'web';

/** Classifies an item's domain into canonical source filter buckets. */
export function classifyItemSource(item: Item): ItemSourceKind {
  const domain = (item.source_domain ?? '').toLowerCase();
  if (domain.includes('instagram')) return 'instagram';
  if (domain.includes('tiktok')) return 'tiktok';
  if (domain.includes('youtube') || domain.includes('youtu.be')) return 'youtube';
  if (
    domain.includes('trendyol') ||
    domain === 'ty.gl' ||
    domain.endsWith('.ty.gl') ||
    domain.includes('amazon') ||
    domain.includes('hepsiburada')
  ) {
    return 'shopping';
  }
  if (domain.includes('google') || domain.includes('maps')) return 'maps';
  return 'web';
}

export function getItemSourceLabel(item: Item): string {
  const domain = (item.source_domain ?? '').toLowerCase();
  if (domain.includes('instagram')) return 'Instagram / Reels';
  if (domain.includes('youtube') || domain.includes('youtu.be')) return 'YouTube';
  if (domain.includes('tiktok')) return 'TikTok';
  if (domain.includes('trendyol') || domain === 'ty.gl' || domain.endsWith('.ty.gl')) {
    return 'Trendyol';
  }
  if (domain.includes('amazon') || domain.includes('hepsiburada'))
    return t('common.shopping_8436b');
  if (domain.includes('google') || domain.includes('maps')) return 'Mekan';
  return item.source_domain ?? 'Link';
}

function InitialBadge({ name }: { name?: string | null }) {
  const initial = name?.trim().charAt(0).toLocaleUpperCase(formatLocale()) ?? 'W';
  return (
    <View style={styles.authorAvatar}>
      <AppText style={styles.authorInitial}>{initial}</AppText>
    </View>
  );
}

function LeftSwipeActions({
  progress,
  completed,
  onPress,
}: {
  progress: SharedValue<number>;
  completed: boolean;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.14, 0.55], [0, 0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.swipeLeftWrap, animatedStyle]}>
      <SpringPressable
        accessibilityRole="button"
        accessibilityLabel={completed ? t('items.markAsNotDone') : t('items.markAsDone')}
        pressScale={0.94}
        onPress={onPress}
        style={[
          styles.swipeActionBtn,
          completed ? styles.swipeRestoreBtn : styles.swipeDoneBtn,
        ]}
      >
        <Ionicons
          name={completed ? 'arrow-undo-outline' : 'checkmark-circle'}
          size={20}
          color={colors.onAccent}
        />
        <AppText style={styles.swipeActionText}>
          {completed ? t('lists.notDone') : t('lists.done')}
        </AppText>
      </SpringPressable>
    </Animated.View>
  );
}

function RightSwipeActions({
  progress,
  onMovePress,
  onDeletePress,
}: {
  progress: SharedValue<number>;
  onMovePress?: () => void;
  onDeletePress?: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.14, 0.55], [0, 0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.swipeRightWrap, animatedStyle]}>
      {onMovePress ? (
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('items.moveToAnotherList')}
          pressScale={0.94}
          onPress={onMovePress}
          style={[styles.swipeActionBtn, styles.swipeMoveBtn]}
        >
          <Ionicons name="swap-horizontal-outline" size={19} color={colors.onAccent} />
          <AppText style={styles.swipeActionText}>{t('lists.quickMove')}</AppText>
        </SpringPressable>
      ) : null}
      {onDeletePress ? (
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('items.deleteItem')}
          pressScale={0.94}
          onPress={onDeletePress}
          style={[styles.swipeActionBtn, styles.swipeDeleteBtn]}
        >
          <Ionicons name="trash-outline" size={19} color={colors.onAccent} />
          <AppText style={styles.swipeActionText}>{t('items.delete')}</AppText>
        </SpringPressable>
      ) : null}
    </Animated.View>
  );
}

export function ItemCard({
  item,
  grid = false,
  onPress,
  onToggleComplete,
  onMovePress,
  onDeletePress,
}: {
  item: Item;
  grid?: boolean;
  onPress: () => void;
  onToggleComplete?: () => void;
  onMovePress?: () => void;
  onDeletePress?: () => void;
}) {
  useTranslation();
  const swipeRef = useRef<SwipeableMethods>(null);
  const completed = item.status === 'completed';
  const planned = item.status === 'planned';
  const isMetadataPending =
    item.metadata_status === 'pending' || item.metadata_status === 'processing';
  const defaultFallback =
    'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=300&auto=format&fit=crop&q=80';
  const imageUrl = getItemPreviewImage(item);
  const sourceLabel = getItemSourceLabel(item);
  const metaText = item.created_by_name
    ? `${item.created_by_name} · ${formatDate(item.created_at)}`
    : formatDate(item.created_at);

  if (grid) {
    return (
      <Animated.View
        layout={LAYOUT_SPRING}
        entering={FadeIn.duration(180)}
        style={styles.gridCardSlot}
      >
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={item.title ?? item.original_url ?? t('common.savedItem')}
          haptic="light"
          onPress={onPress}
          pressScale={0.965}
          style={[styles.gridCard, completed && styles.completedCard]}
        >
          <View style={styles.gridCoverWrap}>
            <SmartImage
              uri={imageUrl}
              fallbackUri={defaultFallback}
              pending={isMetadataPending && !item.preview_image_url}
              style={[styles.gridCoverImage, completed && styles.completedMedia]}
            />
            {completed ? (
              <View style={styles.doneGlassPill}>
                <Ionicons name="checkmark" size={11} color={colors.onAccent} />
                <AppText style={styles.doneGlassText}>{t('lists.done')}</AppText>
              </View>
            ) : planned ? (
              <View style={styles.plannedGlassPill}>
                <Ionicons name="calendar-outline" size={11} color={colors.onAccent} />
                <AppText style={styles.doneGlassText}>{t('lists.planned')}</AppText>
              </View>
            ) : null}
            <View style={styles.sourceGlassPill}>
              <AppText style={styles.sourceGlassText} numberOfLines={1}>
                {sourceLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.gridDetails}>
            <AppText
              variant="cardTitle"
              style={[styles.gridTitleText, completed && styles.completedTitle]}
              numberOfLines={2}
            >
              {item.title ?? t('common.savedItem')}
            </AppText>
            <View style={styles.gridFooterRow}>
              <AppText variant="caption" numberOfLines={1} style={styles.gridMetaText}>
                {metaText}
              </AppText>
              {item.created_by_name ? <InitialBadge name={item.created_by_name} /> : null}
            </View>
          </View>
        </SpringPressable>
      </Animated.View>
    );
  }

  const swipeEnabled = Boolean(
    !grid && (onToggleComplete || onMovePress || onDeletePress),
  );

  const rowPressable = (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={item.title ?? item.original_url ?? t('common.savedItem')}
      haptic="light"
      onPress={onPress}
      pressScale={0.985}
      style={[styles.rowCard, completed && styles.completedRowCard]}
    >
      <View style={styles.rowLayout}>
        <SmartImage
          uri={imageUrl}
          fallbackUri={defaultFallback}
          pending={isMetadataPending && !item.preview_image_url}
          compact
          style={[styles.coverImage, completed && styles.completedMedia]}
        />

        <View style={styles.details}>
          <View style={styles.meta}>
            <View style={styles.rowSourcePill}>
              <AppText style={styles.rowSourceText} numberOfLines={1}>
                {sourceLabel}
              </AppText>
            </View>
            {completed ? (
              <View style={styles.rowDonePill}>
                <Ionicons name="checkmark" size={10} color={colors.success} />
                <AppText style={styles.rowDoneText}>{t('lists.done')}</AppText>
              </View>
            ) : planned ? (
              <View style={styles.rowPlannedPill}>
                <Ionicons name="calendar-outline" size={10} color="#7A5E42" />
                <AppText style={styles.rowPlannedText}>{t('lists.planned')}</AppText>
              </View>
            ) : null}
          </View>

          <AppText
            variant="cardTitle"
            style={[styles.titleText, completed && styles.completedTitle]}
            numberOfLines={2}
          >
            {item.title ?? t('common.savedItem')}
          </AppText>

          <View style={styles.rowFooter}>
            {item.created_by_name ? <InitialBadge name={item.created_by_name} /> : null}
            <AppText variant="caption" numberOfLines={1} style={styles.rowMetaText}>
              {metaText}
            </AppText>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.tertiaryText}
          style={styles.rowChevron}
        />
      </View>
    </SpringPressable>
  );

  return (
    <Animated.View
      layout={LAYOUT_SPRING}
      entering={FadeIn.duration(140)}
      style={[styles.cardSlot, styles.rowShadowWrap]}
    >
      {swipeEnabled ? (
        <ReanimatedSwipeable
          ref={swipeRef}
          containerStyle={styles.swipeContainer}
          childrenContainerStyle={styles.swipeChildrenContainer}
          friction={2}
          overshootLeft={false}
          overshootRight={false}
          leftThreshold={44}
          rightThreshold={44}
          renderLeftActions={
            onToggleComplete
              ? (progress) => (
                  <LeftSwipeActions
                    progress={progress}
                    completed={completed}
                    onPress={() => {
                      swipeRef.current?.close();
                      if (completed) haptic.light();
                      else haptic.success();
                      onToggleComplete();
                    }}
                  />
                )
              : undefined
          }
          renderRightActions={
            onMovePress || onDeletePress
              ? (progress) => (
                  <RightSwipeActions
                    progress={progress}
                    onMovePress={
                      onMovePress
                        ? () => {
                            swipeRef.current?.close();
                            haptic.selection();
                            onMovePress();
                          }
                        : undefined
                    }
                    onDeletePress={
                      onDeletePress
                        ? () => {
                            swipeRef.current?.close();
                            haptic.warning();
                            onDeletePress();
                          }
                        : undefined
                    }
                  />
                )
              : undefined
          }
        >
          {rowPressable}
        </ReanimatedSwipeable>
      ) : (
        <View style={styles.swipeContainer}>{rowPressable}</View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardSlot: {
    width: '100%',
  },
  rowShadowWrap: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  swipeContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3EFE9',
  },
  swipeChildrenContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
  },
  rowCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(17, 17, 16, 0.06)',
    backgroundColor: colors.surface,
    padding: 11,
  },
  completedRowCard: {
    backgroundColor: '#FAF8F4',
    borderColor: '#EAE4DB',
  },
  completedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
  },
  completedMedia: {
    opacity: 0.74,
  },
  completedTitle: {
    color: colors.secondaryText,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coverImage: {
    width: 74,
    height: 74,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  rowChevron: {
    marginLeft: 2,
    marginRight: 2,
  },
  rowSourcePill: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  rowSourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primaryText,
  },
  rowDonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  rowDoneText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  rowPlannedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rowPlannedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7A5E42',
  },
  titleText: {
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.primaryText,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  rowMetaText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.secondaryText,
  },
  gridCardSlot: {
    width: '100%',
  },
  swipeLeftWrap: {
    justifyContent: 'center',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 4,
  },
  swipeRightWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 4,
    paddingRight: 6,
  },
  swipeActionBtn: {
    minWidth: 70,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  swipeDoneBtn: {
    backgroundColor: colors.success,
  },
  swipeRestoreBtn: {
    backgroundColor: '#9E7F60',
  },
  swipeMoveBtn: {
    backgroundColor: '#8B6D4E',
  },
  swipeDeleteBtn: {
    backgroundColor: colors.error,
  },
  swipeActionText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  gridCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    padding: 7,
    gap: 8,
    ...shadows.card,
  },
  gridCoverWrap: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  gridCoverImage: {
    width: '100%',
    height: '100%',
  },
  doneGlassPill: {
    position: 'absolute',
    left: 7,
    top: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(78, 122, 88, 0.88)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  plannedGlassPill: {
    position: 'absolute',
    left: 7,
    top: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(158, 127, 96, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  doneGlassText: {
    color: colors.onAccent,
    fontSize: 9.5,
    fontWeight: '600',
  },
  sourceGlassPill: {
    position: 'absolute',
    right: 7,
    top: 7,
    maxWidth: '72%',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    backgroundColor: 'rgba(17, 17, 16, 0.56)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  sourceGlassText: {
    color: colors.onAccent,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  gridDetails: {
    gap: 6,
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 4,
  },
  gridTitleText: {
    fontSize: 13.5,
    lineHeight: 18,
    minHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: colors.primaryText,
  },
  gridFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  gridMetaText: {
    flex: 1,
    fontSize: 11,
    color: colors.secondaryText,
  },
  authorAvatar: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.onAccent,
  },
});
