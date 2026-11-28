import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system';
import {
  formatListIcon,
  getListAppearance,
  LIST_COLOR_PRESETS,
  LIST_ICON_PRESETS,
} from '@/features/lists/appearance';
import { t } from '@/i18n';

/** Warm Alabaster icon & background swatch selector for list creation and editing. */
export function ListAppearancePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value?: string | null;
  onChange: (encoded: string) => void;
}) {
  useTranslation();
  const resolved = getListAppearance(name || 'Liste', false, value);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText style={styles.label}>{t('lists.appearanceLabel')}</AppText>
        <View style={styles.previewPill}>
          <View
            style={[styles.previewDot, { backgroundColor: resolved.backgroundColor }]}
          >
            <Ionicons name={resolved.icon} size={15} color={resolved.color} />
          </View>
          <AppText numberOfLines={1} style={styles.previewTitle}>
            {name.trim() || t('lists.newList')}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" muted style={styles.subLabel}>
        {t('lists.iconLabel')}
      </AppText>
      <View style={styles.iconGrid}>
        {LIST_ICON_PRESETS.map((iconName) => {
          const selected = resolved.icon === iconName;
          return (
            <SpringPressable
              key={iconName}
              accessibilityRole="button"
              accessibilityLabel={iconName}
              accessibilityState={{ selected }}
              pressScale={0.92}
              haptic="selection"
              onPress={() => onChange(formatListIcon(iconName, resolved.backgroundColor))}
              style={[
                styles.iconTile,
                selected && {
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                },
              ]}
            >
              <Ionicons
                name={iconName}
                size={18}
                color={selected ? colors.onAccent : colors.primaryText}
              />
            </SpringPressable>
          );
        })}
      </View>

      <AppText variant="caption" muted style={styles.subLabel}>
        {t('lists.colorLabel')}
      </AppText>
      <View style={styles.colorRow}>
        {LIST_COLOR_PRESETS.map((swatch) => {
          const selected =
            resolved.backgroundColor.toUpperCase() === swatch.toUpperCase();
          return (
            <SpringPressable
              key={swatch}
              accessibilityRole="button"
              accessibilityLabel={swatch}
              accessibilityState={{ selected }}
              pressScale={0.9}
              haptic="selection"
              onPress={() => onChange(formatListIcon(resolved.icon, swatch))}
              style={[
                styles.colorCircle,
                { backgroundColor: swatch },
                selected && styles.colorCircleActive,
              ]}
            >
              {selected ? (
                <Ionicons name="checkmark" size={14} color={colors.primaryText} />
              ) : null}
            </SpringPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 3,
    paddingTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    maxWidth: 180,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    flexShrink: 1,
  },
  subLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 3,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(17, 17, 16, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
});
