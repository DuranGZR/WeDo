import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated';

import { useOptionalToast } from '@/components/feedback/AppToast';
import { ENTER_EASING } from '@/components/motion/springs';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, Button } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import type { Plan } from '@/features/collaboration/api';
import type { Item } from '@/features/items/types';
import { useCreatePlan, useUpdatePlan } from '@/features/plans/hooks';
import {
  currentLanguage,
  formatPlanDateLabel,
  formatPlanTimeLabel,
  formatPlanWeekdayLabel,
  t,
} from '@/i18n';
import { addPlanToDeviceCalendar, openInGoogleCalendar } from '@/lib/external-apps';
import { haptic } from '@/lib/haptics';

const REMINDER_OPTIONS = [15, 60, 1440] as const;

function getDefaultPlanDate(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(19, 0, 0, 0);
  return next;
}

export function PlanSheet({
  visible,
  item,
  existingPlan,
  onClose,
}: {
  visible: boolean;
  item: Item;
  existingPlan?: Plan | null;
  onClose: () => void;
}) {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const toast = useOptionalToast();
  const createPlan = useCreatePlan(item.space_id);
  const updatePlan = useUpdatePlan(item.space_id);

  const [scheduledDate, setScheduledDate] = useState<Date>(() => getDefaultPlanDate());
  const [minDate, setMinDate] = useState<Date>(() => new Date());
  const [iosPickerMode, setIosPickerMode] = useState<'date' | 'time'>('date');
  const [androidMode, setAndroidMode] = useState<'date' | 'time' | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState<number>(60);
  const [saveToCalendar, setSaveToCalendar] = useState(true);
  const wasVisible = useRef(false);

  const isEditing = Boolean(existingPlan);
  const pickerLocale = currentLanguage() === 'tr' ? 'tr_TR' : 'en_US';

  useEffect(() => {
    const justOpened = visible && !wasVisible.current;
    wasVisible.current = visible;
    if (!justOpened) return;

    setMinDate(new Date());
    setIosPickerMode('date');
    setAndroidMode(null);

    if (existingPlan) {
      const parsed = new Date(existingPlan.scheduled_at);
      setScheduledDate(Number.isNaN(parsed.getTime()) ? getDefaultPlanDate() : parsed);
      setReminderMinutes(existingPlan.reminder_minutes_before ?? 60);
      setSaveToCalendar(false);
    } else {
      setScheduledDate(getDefaultPlanDate());
      setReminderMinutes(60);
      setSaveToCalendar(true);
    }
  }, [existingPlan, visible]);

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setAndroidMode(null);
    if (event.type === 'dismissed' || !selected) return;
    haptic.selection();
    setScheduledDate(selected);
  };

  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  const handleSubmit = async () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    try {
      if (existingPlan) {
        await updatePlan.mutateAsync({
          planId: existingPlan.id,
          body: {
            scheduled_at: scheduledDate.toISOString(),
            timezone,
            reminder_minutes_before: reminderMinutes,
          },
        });
      } else {
        await createPlan.mutateAsync({
          space_id: item.space_id,
          item_id: item.id,
          scheduled_at: scheduledDate.toISOString(),
          timezone,
          reminder_minutes_before: reminderMinutes,
        });
      }

      let calMessage: string | undefined;
      if (saveToCalendar) {
        const calResult = await addPlanToDeviceCalendar({
          itemId: item.id,
          scheduledAt: scheduledDate,
          reminderMinutesBefore: reminderMinutes,
        });
        if (calResult.status === 'saved') calMessage = t('plans.addedToCalendar');
        else if (calResult.status === 'denied')
          calMessage = t('plans.calendarPermissionDenied');
      }

      onClose();
      toast?.showToast({
        type: 'success',
        title: existingPlan ? t('plans.planUpdated') : t('plans.planCreated'),
        message: calMessage,
        actionLabel: t('plans.addToGoogleCalendar'),
        onAction: () =>
          void openInGoogleCalendar({
            itemId: item.id,
            scheduledAt: scheduledDate,
          }),
      });
    } catch (error) {
      toast?.showToast({
        type: 'error',
        title: t('settings.couldnTSave'),
        message: error instanceof Error ? error.message : t('common.tryAgainShort'),
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={
            reducedMotion ? undefined : SlideInDown.duration(220).easing(ENTER_EASING)
          }
          exiting={reducedMotion ? undefined : SlideOutDown.duration(160)}
          style={styles.sheet}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerBadge}>
                <Ionicons name="calendar-outline" size={20} color="#9E7F60" />
              </View>
              <View style={styles.headerCopy}>
                <AppText variant="sectionTitle">
                  {isEditing ? t('plans.editPlanTitle') : t('plans.scheduleTitle')}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {item.title ?? t('common.savedItem')}
                </AppText>
              </View>
            </View>

            <View style={styles.selectorGrid}>
              <SpringPressable
                accessibilityRole="button"
                accessibilityLabel={t('plans.dateOnlyLabel')}
                accessibilityState={{
                  selected: Platform.OS === 'ios' ? iosPickerMode === 'date' : undefined,
                }}
                pressScale={0.97}
                haptic="selection"
                onPress={() => {
                  if (Platform.OS === 'ios') setIosPickerMode('date');
                  else if (Platform.OS === 'android') setAndroidMode('date');
                }}
                style={[
                  styles.selectorCard,
                  Platform.OS === 'ios' &&
                    iosPickerMode === 'date' &&
                    styles.selectorCardActive,
                ]}
              >
                <View style={styles.selectorTopRow}>
                  <View style={styles.selectorLabelRow}>
                    <Ionicons name="calendar-outline" size={14} color="#9E7F60" />
                    <AppText style={styles.selectorEyebrow}>
                      {t('plans.dateOnlyLabel')}
                    </AppText>
                  </View>
                  <Ionicons
                    name={
                      Platform.OS === 'ios' && iosPickerMode === 'date'
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={15}
                    color="#7A5E42"
                  />
                </View>
                <AppText style={styles.selectorValue} numberOfLines={1}>
                  {formatPlanDateLabel(scheduledDate)}
                </AppText>
                <AppText variant="caption" style={styles.selectorSubvalue}>
                  {formatPlanWeekdayLabel(scheduledDate)}
                </AppText>
              </SpringPressable>

              <SpringPressable
                accessibilityRole="button"
                accessibilityLabel={t('plans.timeOnlyLabel')}
                accessibilityState={{
                  selected: Platform.OS === 'ios' ? iosPickerMode === 'time' : undefined,
                }}
                pressScale={0.97}
                haptic="selection"
                onPress={() => {
                  if (Platform.OS === 'ios') setIosPickerMode('time');
                  else if (Platform.OS === 'android') setAndroidMode('time');
                }}
                style={[
                  styles.selectorCard,
                  styles.timeSelectorCard,
                  Platform.OS === 'ios' &&
                    iosPickerMode === 'time' &&
                    styles.selectorCardActive,
                ]}
              >
                <View style={styles.selectorTopRow}>
                  <View style={styles.selectorLabelRow}>
                    <Ionicons name="time-outline" size={14} color="#9E7F60" />
                    <AppText style={styles.selectorEyebrow}>
                      {t('plans.timeOnlyLabel')}
                    </AppText>
                  </View>
                  <Ionicons
                    name={
                      Platform.OS === 'ios' && iosPickerMode === 'time'
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={15}
                    color="#7A5E42"
                  />
                </View>
                <AppText style={styles.selectorValue} numberOfLines={1}>
                  {formatPlanTimeLabel(scheduledDate)}
                </AppText>
                <AppText variant="caption" style={styles.selectorSubvalue}>
                  {t('plans.tapToChange')}
                </AppText>
              </SpringPressable>
            </View>

            {Platform.OS === 'ios' ? (
              <View style={styles.pickerPanel}>
                <DateTimePicker
                  value={scheduledDate}
                  mode={iosPickerMode}
                  display="spinner"
                  locale={pickerLocale}
                  themeVariant="light"
                  textColor={colors.primaryText}
                  minimumDate={iosPickerMode === 'date' ? minDate : undefined}
                  onChange={handlePickerChange}
                  style={styles.iosSpinner}
                />
              </View>
            ) : Platform.OS === 'android' && androidMode ? (
              <DateTimePicker
                value={scheduledDate}
                mode={androidMode}
                minimumDate={androidMode === 'date' ? minDate : undefined}
                onChange={handlePickerChange}
              />
            ) : null}

            <View style={styles.section}>
              <AppText style={styles.label}>{t('plans.reminderLabel')}</AppText>
              <View style={styles.reminderRow}>
                {REMINDER_OPTIONS.map((minutes) => {
                  const selected = reminderMinutes === minutes;
                  const label =
                    minutes === 15
                      ? t('plans.reminder15')
                      : minutes === 60
                        ? t('plans.reminder60')
                        : t('plans.reminder1440');
                  return (
                    <SpringPressable
                      key={minutes}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={label}
                      pressScale={0.95}
                      haptic="selection"
                      onPress={() => setReminderMinutes(minutes)}
                      style={[styles.reminderChip, selected && styles.reminderChipActive]}
                    >
                      <AppText
                        style={[
                          styles.reminderText,
                          selected && styles.reminderTextActive,
                        ]}
                      >
                        {label}
                      </AppText>
                    </SpringPressable>
                  );
                })}
              </View>
            </View>

            {Platform.OS !== 'web' ? (
              <SpringPressable
                accessibilityRole="switch"
                accessibilityState={{ checked: saveToCalendar }}
                accessibilityLabel={t('plans.addToDeviceCalendar')}
                pressScale={0.985}
                haptic="selection"
                onPress={() => setSaveToCalendar((prev) => !prev)}
                style={[styles.calToggle, saveToCalendar && styles.calToggleActive]}
              >
                <Ionicons
                  name={saveToCalendar ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={saveToCalendar ? '#9E7F60' : colors.secondaryText}
                />
                <AppText style={styles.calToggleText}>
                  {t('plans.addToDeviceCalendar')}
                </AppText>
              </SpringPressable>
            ) : null}

            <Button
              label={isEditing ? t('sharing.save') : t('plans.savePlan')}
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={() => void handleSubmit()}
            />
            <Button label={t('items.cancel')} variant="ghost" onPress={onClose} />
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 16, 0.36)',
  },
  sheet: {
    maxHeight: '88%',
    padding: spacing.xl,
    paddingBottom: spacing.section,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    ...shadows.elevated,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(17, 17, 16, 0.16)',
    marginBottom: spacing.md,
  },
  scrollContent: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  selectorGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectorCard: {
    flex: 1.35,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
    ...shadows.card,
  },
  timeSelectorCard: {
    flex: 1,
  },
  selectorCardActive: {
    backgroundColor: '#FAF5EE',
    borderColor: '#9E7F60',
  },
  selectorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  selectorLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectorEyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A5E42',
  },
  selectorValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  selectorSubvalue: {
    fontSize: 11.5,
    color: colors.secondaryText,
  },
  pickerPanel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  iosSpinner: {
    width: '100%',
    height: 176,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  section: {
    gap: spacing.xs + 2,
  },
  reminderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  reminderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reminderChipActive: {
    borderColor: '#9E7F60',
    backgroundColor: '#FAF5EE',
  },
  reminderText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  reminderTextActive: {
    color: '#5F4932',
  },
  calToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  calToggleActive: {
    borderColor: '#D4BEA4',
    backgroundColor: '#FAF5EE',
  },
  calToggleText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.primaryText,
  },
});
