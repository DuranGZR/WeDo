import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, TextField, Card } from '@/components/ui';
import { ItemCard } from '@/components/domain/ItemCard';
import { useItems } from '@/features/items/hooks';
import { colors, spacing, radius } from '@/design-system';

const { width } = Dimensions.get('window');

export default function ListSearchScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [query, setQuery] = useState('');
  const items = useItems(listId);

  const filtered = useMemo(
    () =>
      (items.data?.data ?? []).filter((item) =>
        `${item.title ?? ''} ${item.description ?? ''} ${item.source_domain ?? ''}`
          .toLocaleLowerCase('tr-TR')
          .includes(query.toLocaleLowerCase('tr-TR')),
      ),
    [items.data, query],
  );

  return (
    <Screen scroll={true}>
      {/* Ambient Glow Background Blobs */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={styles.blobCoral} />
        <View style={styles.blobSand} />
      </View>

      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace(`/list/${listId}`)
          }
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.header}>
          <AppText variant="largeTitle" style={styles.title}>
            Listede Ara
          </AppText>
          <AppText muted style={styles.subtitle}>
            Aradığın bir içeriği başlığına veya web sitesi adına göre bul.
          </AppText>
        </View>

        {/* Search Bar Input Card */}
        <Card style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons
              name="search"
              size={20}
              color={colors.accent}
              style={styles.searchIcon}
            />
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Örn: Restoran adı, yemek, film..."
              autoFocus
              style={styles.searchInput}
            />
          </View>
        </Card>

        {/* Search Results */}
        {filtered.length === 0 ? (
          /* Custom Premium Empty Search State Card */
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={32} color={colors.secondaryText} />
              <View style={styles.emptyQuestionMark}>
                <AppText style={styles.questionText}>?</AppText>
              </View>
            </View>
            <AppText variant="sectionTitle" style={styles.emptyTitle}>
              Sonuç bulunamadı
            </AppText>
            <AppText muted style={styles.emptySubtitle}>
              &quot;{query}&quot; aramasıyla eşleşen bir kayıt bulunamadı. Lütfen
              kelimeleri kontrol edip tekrar deneyin.
            </AppText>
          </Card>
        ) : (
          <View style={styles.resultsList}>
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/item/${item.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  blobCoral: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accent,
    opacity: 0.08,
    ...Platform.select({
      web: { filter: 'blur(75px)' },
    }),
  },
  blobSand: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#A5A29B',
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(85px)' },
    }),
  },
  headerBar: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' },
    }),
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
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: width > 400 ? 26 : 22,
    lineHeight: width > 400 ? 32 : 28,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  searchCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    paddingLeft: spacing.xxl + 8,
  },
  resultsList: {
    gap: spacing.sm,
  },
  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  emptyQuestionMark: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondaryText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '800',
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
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
