import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/design-system';

export type ListAppearance = {
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  color: string;
};

export const LIST_ICON_PRESETS: readonly (keyof typeof Ionicons.glyphMap)[] = [
  'albums-outline',
  'map-outline',
  'restaurant-outline',
  'film-outline',
  'cart-outline',
  'musical-notes-outline',
  'calendar-outline',
  'heart-outline',
  'sparkles-outline',
  'airplane-outline',
  'gift-outline',
  'home-outline',
];

export const LIST_COLOR_PRESETS = [
  '#EFECE6',
  '#FAF5EE',
  '#E9E2D7',
  '#F2E3D5',
  '#E5ECE6',
  '#E6EBF2',
  '#F2E5E5',
  '#EDE6F0',
] as const;

/** Parses a stored `icon` field formatted as `<ionicon>|<hex>` or just `<ionicon>`. */
export function parseListIcon(raw?: string | null): {
  icon?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
} {
  if (!raw) return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const [iconPart, bgPart] = trimmed.split('|');
  const glyphMap = Ionicons.glyphMap as Record<string, unknown> | undefined;
  const isValidIcon =
    Boolean(iconPart) &&
    (glyphMap ? iconPart! in glyphMap : /^[a-z0-9-]+$/.test(iconPart!));
  const icon = isValidIcon ? (iconPart as keyof typeof Ionicons.glyphMap) : undefined;
  const backgroundColor = bgPart && /^#[0-9A-Fa-f]{6}$/.test(bgPart) ? bgPart : undefined;
  return { icon, backgroundColor };
}

/** Encodes an icon and background swatch into <=32 chars for backend storage. */
export function formatListIcon(
  icon: keyof typeof Ionicons.glyphMap,
  backgroundColor: string,
): string {
  const combined = `${icon}|${backgroundColor}`;
  return combined.length <= 32 ? combined : icon.slice(0, 32);
}

/** Maps a shared list name and optional custom icon token to warm iconography and surface tints. */
export function getListAppearance(
  name: string,
  isDefault = false,
  customIcon?: string | null,
): ListAppearance {
  const parsed = parseListIcon(customIcon);
  if (parsed.icon || parsed.backgroundColor) {
    const inferred = getListAppearance(name, isDefault);
    return {
      icon: parsed.icon ?? inferred.icon,
      backgroundColor: parsed.backgroundColor ?? inferred.backgroundColor,
      color: colors.primaryText,
    };
  }

  const lower = name.toLocaleLowerCase('tr-TR');

  if (
    lower.includes('izle') ||
    ['watch', 'movie', 'series'].some((word) => lower.includes(word)) ||
    lower.includes('film') ||
    lower.includes('dizi') ||
    lower.includes('sinema') ||
    lower.includes('tv')
  ) {
    return {
      icon: 'film-outline',
      backgroundColor: '#E9E2D7',
      color: colors.primaryText,
    };
  }

  if (
    lower.includes('alın') ||
    lower.includes('alışveriş') ||
    ['shop', 'buy', 'grocer'].some((word) => lower.includes(word)) ||
    lower.includes('market')
  ) {
    return {
      icon: 'cart-outline',
      backgroundColor: '#F3F0EA',
      color: colors.primaryText,
    };
  }

  if (
    lower.includes('yap') ||
    ['todo', 'goal', 'to-do'].some((word) => lower.includes(word)) ||
    lower.includes('hedef')
  ) {
    return {
      icon: 'checkbox-outline',
      backgroundColor: '#E5DFD4',
      color: colors.primaryText,
    };
  }

  if (
    lower.includes('yemek') ||
    lower.includes('mutfak') ||
    lower.includes('tarif') ||
    ['recipe', 'food', 'restaurant'].some((word) => lower.includes(word)) ||
    lower.includes('restoran') ||
    lower.includes('kafe')
  ) {
    return {
      icon: 'restaurant-outline',
      backgroundColor: '#EFECE6',
      color: colors.primaryText,
    };
  }

  if (
    lower.includes('müzik') ||
    ['music', 'song', 'concert'].some((word) => lower.includes(word)) ||
    lower.includes('şarkı') ||
    lower.includes('konser')
  ) {
    return {
      icon: 'musical-notes-outline',
      backgroundColor: '#EAE4DA',
      color: colors.primaryText,
    };
  }

  if (
    lower.includes('plan') ||
    lower.includes('takvim') ||
    lower.includes('etkinlik') ||
    ['event', 'calendar', 'activity'].some((word) => lower.includes(word))
  ) {
    return {
      icon: 'calendar-outline',
      backgroundColor: '#EDE8DF',
      color: colors.primaryText,
    };
  }

  if (
    lower.includes('git') ||
    lower.includes('gez') ||
    lower.includes('yer') ||
    lower.includes('seyahat') ||
    ['travel', 'place', 'visit'].some((word) => lower.includes(word)) ||
    lower.includes('tatil')
  ) {
    return { icon: 'map-outline', backgroundColor: '#EFECE6', color: colors.primaryText };
  }

  return {
    icon: isDefault ? 'star-outline' : 'albums-outline',
    backgroundColor: '#EFECE6',
    color: colors.primaryText,
  };
}
