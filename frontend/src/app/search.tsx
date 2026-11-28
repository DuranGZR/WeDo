import { Ionicons } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import {
  classifyItemSource,
  ItemCard,
  type ItemSourceKind,
} from '@/components/domain/ItemCard';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Card, Screen, ScreenHeader, TextField } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { itemsApi } from '@/features/items/api';
import { metadataRefreshInterval } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { useLists } from '@/features/lists/hooks';
import type { List } from '@/features/lists/types';
import { useSpaces } from '@/features/spaces/hooks';
import { formatLocale, searchText, t, type TranslationKey } from '@/i18n';
import { useSpaceStore } from '@/store/space-store';

type SourceFilter = 'all' | ItemSourceKind;

const SOURCE_OPTIONS: { value: SourceFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'lists.sourceAll' },
  { value: 'instagram', labelKey: 'lists.sourceInstagram' },
  { value: 'tiktok', labelKey: 'lists.sourceTikTok' },
  { value: 'youtube', labelKey: 'lists.sourceYoutube' },
  { value: 'shopping', labelKey: 'lists.sourceShopping' },
  { value: 'maps', labelKey: 'lists.sourceMaps' },
  { value: 'web', labelKey: 'lists.sourceWeb' },
];

type SearchResultEntry = {
  item: Item;
  list: List;
};

/** Searches across every list in the active shared space. */
export default function SpaceSearchScreen() {
  useTranslation();
  const locale = formatLocale();
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const spaces = useSpaces();
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const space =
    spaces.data?.data.find((entry) => entry.id === selectedSpaceId) ??
    spaces.data?.data[0];

  const lists = useLists(space?.id ?? '');
  const listEntries = useMemo(() => lists.data?.data ?? [], [lists.data?.data]);

  const itemQueries = useQueries({
    queries: listEntries.map((list) => ({
      queryKey: ['lists', list.id, 'items'],
      queryFn: () => itemsApi.list(list.id),
      enabled: Boolean(list.id),
      refetchInterval: (q: { state: { data?: { data: Item[] } } }) =>
        metadataRefreshInterval(q.state.data?.data),
    })),
  });

  const combined = useMemo<SearchResultEntry[]>(() => {
    const out: SearchResultEntry[] = [];
    listEntries.forEach((list, idx) => {
      const items = itemQueries[idx]?.data?.data ?? [];
      for (const item of items) {
        out.push({ item, list });
      }
    });
    return out.sort(
      (a, b) =>
        new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime(),
    );
  }, [itemQueries, listEntries]);

  const normalizedQuery = searchText(query.trim(), locale);

  const filtered = useMemo(
    () =>
      combined.filter(({ item, list }) => {
        if (sourceFilter !== 'all' && classifyItemSource(item) !== sourceFilter) {
          return false;
        }
        if (!normalizedQuery) return true;
        return searchText(
          `${item.title ?? ''} ${item.description ?? ''} ${item.source_domain ?? ''} ${list.name}`,
          locale,
        ).includes(normalizedQuery);
      }),
    [combined, locale, normalizedQuery, sourceFilter],
  );

  const headerElement = (
    <View style={styles.headerBlock}>
      <View style={styles.sheetHandle} />
      <ScreenHeader
        backIcon="close"
        backLabel={t('legal.close')}
        fallbackHref="/(tabs)"
      />

      <View style={styles.header}>
        <AppText variant="largeTitle" style={styles.title}>
          {t('lists.searchSpace')}
        </AppText>
        <AppText muted style={styles.subtitle}>
          {t('lists.searchSpaceSubtitle')}
        </AppText>
      </View>

      <Card style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={19} color="#9E7F60" style={styles.searchIcon} />
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder={t('lists.searchSpacePlaceholder')}
            autoFocus
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t('items.cancel')}
              hitSlop={8}
              pressScale={0.88}
              haptic="selection"
              onPress={() => setQuery('')}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color={colors.tertiaryText} />
            </SpringPressable>
          ) : null}
        </View>
      </Card>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
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
                style={[styles.filterChipText, selected && styles.filterChipTextActive]}
              >
                {t(option.labelKey)}
              </AppText>
            </SpringPressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const emptyElement = (
    <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(180)}>
      <Card style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="search-outline" size={28} color="#9E7F60" />
        </View>
        <AppText variant="sectionTitle" style={styles.emptyTitle}>
          {t('lists.noResults')}
        </AppText>
        <AppText muted style={styles.emptySubtitle}>
          {normalizedQuery
            ? t('lists.noSavedItemsMatchValueCheckYourSearchAndTry', {
                value0: query,
              })
            : t('lists.noSpaceSearchMatches')}
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
      <Animated.FlatList
        data={filtered}
        keyExtractor={(entry) => entry.item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={headerElement}
        ListEmptyComponent={emptyElement}
        renderItem={({ item: entry }) => (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(160)}
            layout={reducedMotion ? undefined : LAYOUT_SPRING}
            style={styles.resultBlock}
          >
            <View style={styles.listBadgeRow}>
              <Ionicons name="albums-outline" size={12} color="#7A5E42" />
              <AppText variant="caption" style={styles.listBadgeText}>
                {t('lists.inList', { list: entry.list.name })}
              </AppText>
            </View>
            <ItemCard
              item={entry.item}
              onPress={() => router.push(`/item/${entry.item.id}`)}
            />
          </Animated.View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenNoPad: {
    padding: 0,
    paddingBottom: 0,
  },
  content: {
    flexGrow: 1,
    gap: spacing.sm + 2,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(17, 17, 16, 0.16)',
    marginBottom: 2,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  searchCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.sm + 2,
    ...shadows.card,
  },
  searchRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 2,
  },
  searchInput: {
    paddingLeft: spacing.xxl + 10,
    paddingRight: spacing.xxl,
  },
  clearBtn: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 2,
    padding: 2,
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
  resultBlock: {
    gap: 5,
  },
  listBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.xs + 2,
  },
  listBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7A5E42',
  },
  emptyCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
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
  },
});
