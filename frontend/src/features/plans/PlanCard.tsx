import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { useOptionalToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, Card, SmartImage } from '@/components/ui';
import { getItemFallbackImage, getItemPreviewImage } from '@/components/domain/ItemCard';
import { colors, shadows, spacing } from '@/design-system';
import type { Plan } from '@/features/collaboration/api';
import type { Item } from '@/features/items/types';
import { decodePlanNote } from '@/features/plans/note-meta';
import {
  formatPlanCalendarBadge,
  formatPlanDateLabel,
  formatPlanShortDateTime,
  formatPlanTimeLabel,
  formatPlanWeekdayLabel,
  t,
} from '@/i18n';
import { addPlanToDeviceCalendar, openInGoogleCalendar } from '@/lib/external-apps';

export type PlanCardAction = 'cancel' | 'complete';

export function formatPlanReminderText(minutes?: number | null): string | null {
  if (!minutes) return null;
  if (minutes === 15) return t('plans.reminder15');
  if (minutes === 60) return t('plans.reminder60');
  if (minutes === 1440) return t('plans.reminder1440');
  return null;
}

export function PlanCard({
  plan,
  item,
  listName,
  variant,
  isActionPending = false,
  onAction,
  onEdit,
  onPress,
}: {
  plan: Plan;
  item?: Item;
  listName?: string | null;
  variant: 'home' | 'list' | 'detail';
  isActionPending?: boolean;
  onAction: (action: PlanCardAction) => void;
  onEdit?: () => void;
  onPress?: () => void;
}) {
  const toast = useOptionalToast();
  const planTitle = item?.title ?? t('common.savedItem');
  const reminderText = formatPlanReminderText(plan.reminder_minutes_before);
  const { location, note } = decodePlanNote(plan.note);
  const calendarBadge = formatPlanCalendarBadge(plan.scheduled_at);

  const scheduleLine =
    variant === 'home'
      ? `${formatPlanWeekdayLabel(plan.scheduled_at)} · ${formatPlanTimeLabel(plan.scheduled_at)}`
      : variant === 'detail'
        ? formatPlanTimeLabel(plan.scheduled_at)
        : formatPlanShortDateTime(plan.scheduled_at);

  const saveDeviceCalendar = () => {
    void addPlanToDeviceCalendar({
      itemId: plan.item_id,
      scheduledAt: plan.scheduled_at,
      reminderMinutesBefore: plan.reminder_minutes_before,
    }).then((res) => {
      toast?.showToast({
        type: res.status === 'saved' ? 'success' : 'warning',
        title:
          res.status === 'saved'
            ? t('plans.addedToCalendar')
            : t('plans.calendarPermissionDenied'),
      });
    });
  };

  const handleOpenCalendar = () => {
    if (Platform.OS === 'web') {
      void openInGoogleCalendar({
        itemId: plan.item_id,
        scheduledAt: plan.scheduled_at,
      });
      return;
    }

    Alert.alert(t('plans.calendarPickerTitle'), undefined, [
      {
        text: t('plans.deviceCalendarOption'),
        onPress: saveDeviceCalendar,
      },
      {
        text: t('plans.addToGoogleCalendar'),
        onPress: () => {
          void openInGoogleCalendar({
            itemId: plan.item_id,
            scheduledAt: plan.scheduled_at,
          });
        },
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ]);
  };

  const leadingVisual =
    variant === 'list' && item ? (
      <SmartImage
        uri={getItemPreviewImage(item)}
        fallbackUri={getItemFallbackImage(item)}
        compact
        style={styles.thumb}
      />
    ) : (
      <View style={styles.dateLeaf}>
        <AppText style={styles.dateLeafDay}>{calendarBadge.day}</AppText>
        <AppText style={styles.dateLeafMonth}>{calendarBadge.monthShort}</AppText>
      </View>
    );

  const bodyContent = (
    <>
      {leadingVisual}

      <View style={styles.copy}>
        {variant === 'detail' ? (
          <>
            <AppText style={styles.eyebrow}>{t('plans.activePlan')}</AppText>
            <AppText numberOfLines={1} style={styles.title}>
              {`${formatPlanDateLabel(plan.scheduled_at)} · ${formatPlanWeekdayLabel(plan.scheduled_at)}`}
            </AppText>
          </>
        ) : (
          <AppText numberOfLines={variant === 'home' ? 1 : 2} style={styles.title}>
            {planTitle}
          </AppText>
        )}

        <View style={styles.scheduleWrap}>
          <AppText style={styles.scheduleText}>{scheduleLine}</AppText>
          {reminderText ? (
            <>
              <AppText style={styles.metaSeparator}>{' · '}</AppText>
              <AppText style={styles.reminderText}>{reminderText}</AppText>
            </>
          ) : null}
        </View>

        <View style={styles.statusLine}>
          <View style={styles.statusDot} />
          <AppText style={styles.statusText}>{t('lists.planned')}</AppText>
          {variant === 'list' && listName ? (
            <AppText numberOfLines={1} style={styles.listLabel}>
              {` · ${listName}`}
            </AppText>
          ) : null}
        </View>

        {location || note ? (
          <AppText numberOfLines={2} style={styles.extraNote}>
            {[location, note].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}
      </View>
    </>
  );

  return (
    <Card variant={variant === 'detail' ? 'elevated' : 'default'} style={styles.card}>
      <View style={styles.mainRow}>
        {onPress ? (
          <SpringPressable
            accessibilityRole="button"
            accessibilityLabel={planTitle}
            pressScale={0.985}
            haptic="light"
            onPress={onPress}
            style={styles.mainTouchable}
          >
            {bodyContent}
          </SpringPressable>
        ) : (
          <View style={styles.mainTouchable}>{bodyContent}</View>
        )}

        {onEdit ? (
          <SpringPressable
            accessibilityRole="button"
            accessibilityLabel={`${t('plans.editAction')} · ${planTitle}`}
            pressScale={0.92}
            haptic="selection"
            hitSlop={6}
            onPress={onEdit}
            style={styles.editIconBtn}
          >
            <Ionicons name="create-outline" size={16} color="#6F5A45" />
          </SpringPressable>
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.tertiaryText} />
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('plans.addToAppleCalendar')}
          pressScale={0.96}
          haptic="selection"
          hitSlop={6}
          onPress={handleOpenCalendar}
          style={styles.footerLinkBtn}
        >
          <Ionicons name="calendar-outline" size={14} color="#7A5E42" />
          <AppText style={styles.footerLinkText}>{t('plans.addToAppleCalendar')}</AppText>
        </SpringPressable>

        <View style={styles.footerActions}>
          <SpringPressable
            accessibilityRole="button"
            pressScale={0.95}
            haptic="warning"
            hitSlop={6}
            disabled={isActionPending}
            onPress={() => onAction('cancel')}
            style={styles.footerLinkBtn}
          >
            <AppText style={styles.cancelLinkText}>{t('plans.cancelPlan')}</AppText>
          </SpringPressable>
          <SpringPressable
            accessibilityRole="button"
            pressScale={0.95}
            haptic="medium"
            hitSlop={6}
            disabled={isActionPending}
            onPress={() => onAction('complete')}
            style={styles.footerLinkBtn}
          >
            <Ionicons name="checkmark-done" size={15} color={colors.success} />
            <AppText style={styles.completeLinkText}>{t('plans.complete')}</AppText>
          </SpringPressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mainTouchable: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: colors.surfaceSecondary,
  },
  dateLeaf: {
    width: 46,
    height: 48,
    borderRadius: 13,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E5D5C1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dateLeafDay: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.primaryText,
  },
  dateLeafMonth: {
    fontSize: 9.5,
    lineHeight: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#8D6F52',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '600',
    color: '#8D6F52',
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.primaryText,
  },
  scheduleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#6F5A45',
  },
  metaSeparator: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.tertiaryText,
  },
  reminderText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.secondaryText,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.success,
  },
  listLabel: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondaryText,
  },
  extraNote: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondaryText,
    marginTop: 2,
  },
  editIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F6F3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(17, 17, 16, 0.06)',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  footerLinkText: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '600',
    color: '#6F5A45',
  },
  cancelLinkText: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '600',
    color: '#9A5B54',
  },
  completeLinkText: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.success,
  },
});
