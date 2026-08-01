import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Screen, TextField } from '@/components/ui';
import { colors, mono, radius, spacing } from '@/design-system';
import { ItemCard } from '@/components/domain/ItemCard';
import { useItems } from '@/features/items/hooks';
import { useList } from '@/features/lists/hooks';

const { width } = Dimensions.get('window');

function getListIcon(name: string, isDefault: boolean): any {
  const lower = name.toLowerCase();
  if (
    lower.includes('git') ||
    lower.includes('gez') ||
    lower.includes('yer') ||
    lower.includes('seyahat') ||
    lower.includes('tatil')
  ) {
    return 'location-outline';
  }
  if (
    lower.includes('izle') ||
    lower.includes('film') ||
    lower.includes('dizi') ||
    lower.includes('tv') ||
    lower.includes('sinema')
  ) {
    return 'play-circle-outline';
  }
  if (
    lower.includes('al') ||
    lower.includes('market') ||
    lower.includes('alışveriş') ||
    lower.includes('bakkal') ||
    lower.includes('kıyafet')
  ) {
    return 'cart-outline';
  }
  if (
    lower.includes('yemek') ||
    lower.includes('mutfak') ||
    lower.includes('tarif') ||
    lower.includes('restoran') ||
    lower.includes('kafe') ||
    lower.includes('akşam')
  ) {
    return 'restaurant-outline';
  }
  if (
    lower.includes('müzik') ||
    lower.includes('şarkı') ||
    lower.includes('çal') ||
    lower.includes('konser')
  ) {
    return 'musical-notes-outline';
  }
  if (
    lower.includes('plan') ||
    lower.includes('takvim') ||
    lower.includes('etkinlik') ||
    lower.includes('aktivite')
  ) {
    return 'calendar-outline';
  }
  return isDefault ? 'star-outline' : 'list-outline';
}

export default function ListDetailScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const list = useList(listId);
  const result = useItems(listId);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>(
    'all',
  );

  const items = useMemo(() => result.data?.data ?? [], [result.data?.data]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && item.status === 'completed') ||
        (statusFilter === 'pending' && item.status !== 'completed');
      const query = searchQuery.trim().toLocaleLowerCase('tr-TR');
      const matchesSearch =
        !isSearching ||
        !query ||
        `${item.title ?? ''} ${item.description ?? ''} ${item.source_domain ?? ''}`
          .toLocaleLowerCase('tr-TR')
          .includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [items, isSearching, searchQuery, statusFilter]);

  if (result.isLoading || list.isLoading) {
    return (
      <Screen backgroundColor={mono.background}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={mono.ink} />
        </View>
      </Screen>
    );
  }

  if (result.isError || !list.data) {
    return (
      <Screen backgroundColor={mono.background}>
        <Card style={styles.errorCard}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <AppText variant="sectionTitle" style={styles.errorTitle}>
            Liste yüklenemedi
          </AppText>
          <AppText muted style={styles.errorSubtitle}>
            Bağlantını kontrol edip tekrar dene.
          </AppText>
          <Pressable
            onPress={() => router.replace('/(tabs)/lists')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          >
            <AppText style={styles.primaryBtnText}>Geri Git</AppText>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  const iconName = getListIcon(list.data.name, list.data.is_default);

  return (
    <Screen scroll={true} backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />

      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.push('/lists')}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={mono.ink} />
        </Pressable>

        <Pressable
          onPress={() => router.push(`/list/${listId}/edit`)}
          style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Listeyi düzenle"
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={mono.ink}
            style={{ marginRight: 2 }}
          />
          <AppText style={styles.editBtnText}>Düzenle</AppText>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* List Identity Card (Centered) */}
        <View style={styles.identityContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={30} color={mono.paper} />
          </View>
          <AppText variant="largeTitle" style={styles.listName}>
            {list.data.name}
          </AppText>
          <View style={styles.countBadge}>
            <AppText style={styles.countBadgeText}>{items.length} içerik</AppText>
          </View>
        </View>

        {/* Action Row or Search Input */}
        {isSearching ? (
          <View style={styles.searchBarRow}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={18}
                color={mono.ink}
                style={styles.searchFieldIcon}
              />
              <TextField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Listede ara..."
                style={styles.searchField}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.tertiaryText} />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              style={({ pressed }) => [
                styles.cancelSearchBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <AppText style={styles.cancelSearchText}>İptal</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setIsSearching(true)}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnSecondary,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Listede ara"
            >
              <Ionicons name="search" size={18} color={colors.primaryText} />
              <AppText style={styles.actionBtnText}>Ara</AppText>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/item/create?listId=${listId}`)}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnPrimary,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Bağlantı ekle"
            >
              <Ionicons name="add" size={18} color={mono.paper} />
              <AppText style={[styles.actionBtnText, { color: mono.paper }]}>
                Bağlantı Ekle
              </AppText>
            </Pressable>
          </View>
        )}

        {items.length > 0 ? (
          <View style={styles.filterRow}>
            {(
              [
                ['all', 'Tümü'],
                ['pending', 'Yapılmadı'],
                ['completed', 'Yapıldı'],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setStatusFilter(value)}
                style={({ pressed }) => [
                  styles.filterChip,
                  statusFilter === value && styles.filterChipActive,
                  pressed && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${label} filtrele`}
              >
                <AppText
                  style={[
                    styles.filterChipText,
                    statusFilter === value && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* List Content Area */}
        {items.length === 0 ? (
          /* Custom Premium Empty State Card */
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="link-outline" size={32} color={mono.paper} />
              <View style={styles.emptyBadge} />
            </View>
            <AppText variant="sectionTitle" style={styles.emptyTitle}>
              Listeniz boş
            </AppText>
            <AppText muted style={styles.emptySubtitle}>
              Dışarıdan bir içerik paylaşarak veya yukarıdan bağlantı ekleyerek ilk kaydı
              oluşturun.
            </AppText>
            <Pressable
              onPress={() => router.push(`/item/create?listId=${listId}`)}
              style={({ pressed }) => [
                styles.emptyActionBtn,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="İlk içeriği ekle"
            >
              <AppText style={styles.emptyActionBtnText}>İçerik Ekle</AppText>
            </Pressable>
          </Card>
        ) : filteredItems.length === 0 ? (
          /* Empty Search Results Card */
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={32} color={colors.secondaryText} />
              <View style={styles.emptyBadge} />
            </View>
            <AppText variant="sectionTitle" style={styles.emptyTitle}>
              Sonuç bulunamadı
            </AppText>
            <AppText muted style={styles.emptySubtitle}>
              &quot;{searchQuery}&quot; aramasıyla eşleşen bir kayıt bulunamadı. Lütfen
              kelimeleri kontrol edip tekrar deneyin.
            </AppText>
          </Card>
        ) : (
          <View style={styles.itemsContainer}>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                grid={true}
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
  contourTop: {
    position: 'absolute',
    top: -150,
    right: -155,
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.75,
  },
  contourBottom: {
    position: 'absolute',
    bottom: -160,
    left: -185,
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.5,
  },
  headerBar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mono.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: mono.ink,
  },
  editBtn: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: mono.paper,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: mono.ink,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: mono.ink,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
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
  identityContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  listName: {
    fontSize: width > 400 ? 26 : 22,
    fontWeight: '800',
    color: mono.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: mono.soft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: mono.muted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  filterChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  filterChipActive: {
    backgroundColor: mono.ink,
    borderColor: mono.ink,
  },
  filterChipText: {
    color: mono.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: mono.paper,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnSecondary: {
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  actionBtnPrimary: {
    backgroundColor: mono.ink,
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 0px rgba(0, 0, 0, 0.16)',
      },
    }),
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: mono.ink,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchFieldIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 2,
  },
  searchField: {
    flex: 1,
    paddingLeft: spacing.xxl + 8,
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
    height: 48,
    justifyContent: 'center',
  },
  cancelSearchText: {
    fontSize: 14,
    fontWeight: '700',
    color: mono.ink,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
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
  emptyActionBtn: {
    backgroundColor: mono.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  emptyActionBtnText: {
    color: mono.paper,
    fontWeight: '700',
    fontSize: 13,
  },
  errorCard: {
    margin: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDE8E8',
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
  primaryBtn: {
    backgroundColor: mono.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  primaryBtnText: {
    color: mono.paper,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
