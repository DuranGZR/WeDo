import { Pressable, StyleSheet, View, Image, Platform } from 'react-native';
import { colors, mono, spacing, radius } from '@/design-system';
import type { Item } from '@/features/items/types';
import { AppText, Badge, Card } from '@/components/ui';

export function getItemPreviewImage(item: Item): string {
  if (item.preview_image_url) {
    return item.preview_image_url;
  }

  const title = (item.title ?? '').toLowerCase();
  const domain = (item.source_domain ?? '').toLowerCase();

  if (
    domain.includes('trendyol') ||
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

export function getItemSourceLabel(item: Item): string {
  const domain = (item.source_domain ?? '').toLowerCase();
  if (domain.includes('instagram')) return 'Instagram / Reels';
  if (domain.includes('youtube') || domain.includes('youtu.be')) return 'YouTube';
  if (domain.includes('tiktok')) return 'TikTok';
  if (domain.includes('trendyol')) return 'Trendyol';
  if (domain.includes('amazon') || domain.includes('hepsiburada')) return 'Alışveriş';
  if (domain.includes('google') || domain.includes('maps')) return 'Mekan';
  return item.source_domain ?? 'Link';
}

export function ItemCard({
  item,
  grid = false,
  onPress,
}: {
  item: Item;
  grid?: boolean;
  onPress: () => void;
}) {
  const completed = item.status === 'completed';
  const imageUrl = getItemPreviewImage(item);

  if (grid) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title ?? item.original_url ?? 'Kaydedilen içerik'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.gridCardPressable,
          pressed && styles.gridCardPressed,
        ]}
      >
        <Card style={styles.gridCard}>
          <Image source={{ uri: imageUrl }} style={styles.gridCoverImage} />

          <View style={styles.gridDetails}>
            <View style={styles.gridMeta}>
              <Badge
                label={completed ? 'Yapıldı' : 'Açık'}
                tone={completed ? 'success' : 'neutral'}
              />
              <Badge label={getItemSourceLabel(item)} tone="accent" />
              {item.source_domain ? (
                <AppText
                  variant="caption"
                  muted
                  numberOfLines={1}
                  style={styles.gridDomainText}
                >
                  {item.source_domain}
                </AppText>
              ) : null}
            </View>
            <View style={{ gap: 2 }}>
              <AppText variant="cardTitle" style={styles.gridTitleText} numberOfLines={1}>
                {item.title ?? 'Kaydedilen içerik'}
              </AppText>
              <AppText muted numberOfLines={1} style={styles.gridDescText}>
                {item.description ?? item.original_url ?? 'Bağlantı yok'}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                Ekleyen: {item.created_by_name}
              </AppText>
            </View>
            <AppText variant="caption" muted style={styles.gridDateText}>
              {new Date(item.created_at).toLocaleDateString('tr-TR')}
            </AppText>
          </View>
        </Card>
      </Pressable>
    );
  }

  // Row layout (Default)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title ?? item.original_url ?? 'Kaydedilen içerik'}
      onPress={onPress}
      style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
    >
      <Card style={styles.card}>
        <View style={styles.rowLayout}>
          {/* Cover image on the left */}
          <Image source={{ uri: imageUrl }} style={styles.coverImage} />

          {/* Details on the right */}
          <View style={styles.details}>
            <View style={styles.meta}>
              <Badge
                label={completed ? 'Yapıldı' : 'Açık'}
                tone={completed ? 'success' : 'neutral'}
              />
              <Badge label={getItemSourceLabel(item)} tone="accent" />
              {item.source_domain ? (
                <AppText
                  variant="caption"
                  muted
                  numberOfLines={1}
                  style={styles.domainText}
                >
                  {item.source_domain}
                </AppText>
              ) : null}
            </View>
            <AppText variant="cardTitle" style={styles.titleText} numberOfLines={1}>
              {item.title ?? 'Kaydedilen içerik'}
            </AppText>
            <AppText muted numberOfLines={1} style={styles.descText}>
              {item.description ?? item.original_url ?? 'Bağlantı yok'}
            </AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              Ekleyen: {item.created_by_name}
            </AppText>
            <AppText variant="caption" muted style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString('tr-TR')}
            </AppText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    width: '100%',
    marginBottom: spacing.md,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: 7,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 0px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  coverImage: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  details: {
    flex: 1,
    gap: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  domainText: {
    fontSize: 11,
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  descText: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  dateText: {
    fontSize: 10,
    marginTop: 2,
  },
  gridCardPressable: {
    width: '47%',
    marginBottom: spacing.md,
  },
  gridCardPressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.95,
  },
  gridCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: 7,
    height: 235,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 0px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  gridCoverImage: {
    width: '100%',
    height: 110,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  gridDetails: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridDomainText: {
    fontSize: 10,
    flex: 1,
  },
  gridTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryText,
  },
  gridDescText: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  gridDateText: {
    fontSize: 9,
    color: colors.tertiaryText,
  },
});
