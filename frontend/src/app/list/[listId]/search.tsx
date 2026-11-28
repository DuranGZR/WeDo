import { formatLocale, searchText, t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ItemCard } from '@/components/domain/ItemCard';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Card, Screen, ScreenHeader, TextField } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { useItems } from '@/features/items/hooks';

const { width } = Dimensions.get('window');

export default function ListSearchScreen() {
  useTranslation();
  const locale = formatLocale();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [query, setQuery] = useState('');
  const items = useItems(listId);

  const filtered = useMemo(
    () =>
      (items.data?.data ?? []).filter((item) =>
        searchText(
          `${item.title ?? ''} ${item.description ?? ''} ${item.source_domain ?? ''}`,
          locale,
        ).includes(searchText(query, locale)),
      ),
    [items.data, query, locale],
  );

  return (
    <Screen scroll={true}>
      <ScreenHeader fallbackHref={`/list/${listId}`} />

      <Animated.View
        entering={FadeInDown.duration(220)}
        layout={LAYOUT_SPRING}
        style={styles.content}
      >
        <View style={styles.header}>
          <AppText variant="largeTitle" style={styles.title}>
            {t('lists.searchThisList_d4145')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('lists.findASavedItemByItsTitleOrWebsite')}
          </AppText>
        </View>

        <Card style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={19} color="#9E7F60" style={styles.searchIcon} />
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder={t('lists.eGARestaurantRecipeOrMovie')}
              autoFocus
              style={styles.searchInput}
            />
          </View>
        </Card>

        {filtered.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={28} color="#9E7F60" />
              </View>
              <AppText variant="sectionTitle" style={styles.emptyTitle}>
                {t('lists.noResults')}
              </AppText>
              <AppText muted style={styles.emptySubtitle}>
                {t('lists.noSavedItemsMatchValueCheckYourSearchAndTry', {
                  value0: query,
                })}
              </AppText>
            </Card>
          </Animated.View>
        ) : (
          <View style={styles.resultsList}>
            {filtered.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(Math.min(index, 6) * 35).duration(200)}
                layout={LAYOUT_SPRING}
              >
                <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
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
  },
  resultsList: {
    gap: spacing.sm,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    maxWidth: 280,
  },
});
