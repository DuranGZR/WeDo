import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Card } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import type { Item } from '@/features/items/types';
import { usePlanAction, useSpacePlans } from '@/features/plans/hooks';
import { decodePlanNote } from '@/features/plans/note-meta';
import { formatPlanDateTime, t } from '@/i18n';
import {
  addPlanToDeviceCalendar,
  openInAppleMaps,
  openInGoogleCalendar,
  openInGoogleMaps,
} from '@/lib/external-apps';
import { useAuthStore } from '@/store/auth-store';

export function UpcomingPlansSection({
  spaceId,
  items,
}: {
  spaceId: string;
  items: Item[];
}) {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const ownId = useAuthStore((state) => state.user?.id);
  const { showToast } = useToast();
  const plansQuery = useSpacePlans(spaceId);
  const planAction = usePlanAction(spaceId);

  const itemMap = useMemo(() => {
    const map = new Map<string, Item>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const [mountCutoffMs, setMountCutoffMs] = useState(
    () => Date.now() - 24 * 60 * 60 * 1000,
  );

  useEffect(() => {
    const timer = setInterval(
      () => {
        setMountCutoffMs(Date.now() - 24 * 60 * 60 * 1000);
      },
      60 * 60 * 1000,
    );
    return () => clearInterval(timer);
  }, []);

  const cutoffMs =
    typeof plansQuery.dataUpdatedAt === 'number' && plansQuery.dataUpdatedAt > 0
      ? plansQuery.dataUpdatedAt - 24 * 60 * 60 * 1000
      : mountCutoffMs;

  const activePlans = useMemo(() => {
    return (plansQuery.data?.data ?? [])
      .filter(
        (plan) =>
          (plan.status === 'proposed' || plan.status === 'approved') &&
          new Date(plan.scheduled_at).getTime() >= cutoffMs,
      )
      .sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      )
      .slice(0, 5);
  }, [plansQuery.data?.data, cutoffMs]);

  if (activePlans.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{t('plans.upcomingPlans')}</AppText>
      <View style={styles.stack}>
        {activePlans.map((plan) => {
          const linked = itemMap.get(plan.item_id);
          const { location, note } = decodePlanNote(plan.note);
          const planTitle = linked?.title ?? t('common.savedItem');
          const approved = plan.status === 'approved';
          const createdByOther = Boolean(plan.created_by && plan.created_by !== ownId);

          return (
            <Animated.View
              key={plan.id}
              entering={reducedMotion ? undefined : FadeInDown.duration(180)}
              layout={reducedMotion ? undefined : LAYOUT_SPRING}
            >
              <Card style={styles.card}>
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityLabel={planTitle}
                  pressScale={0.98}
                  haptic="light"
                  onPress={() => router.push(`/item/${plan.item_id}`)}
                  style={styles.topRow}
                >
                  <View style={styles.calendarIcon}>
                    <Ionicons name="calendar" size={17} color="#9E7F60" />
                  </View>
                  <View style={styles.copy}>
                    <AppText numberOfLines={1} style={styles.title}>
                      {planTitle}
                    </AppText>
                    <AppText variant="caption" style={styles.dateText}>
                      {formatPlanDateTime(plan.scheduled_at)}
                    </AppText>
                  </View>
                  <View style={[styles.statusBadge, approved && styles.statusApproved]}>
                    <AppText
                      style={[styles.statusText, approved && styles.statusTextApproved]}
                    >
                      {approved ? t('plans.statusApproved') : t('plans.statusProposed')}
                    </AppText>
                  </View>
                </SpringPressable>

                {location || note ? (
                  <View style={styles.metaBox}>
                    {location ? (
                      <AppText variant="caption" style={styles.locationLine}>
                        {location}
                      </AppText>
                    ) : null}
                    {note ? (
                      <AppText variant="caption" muted>
                        {note}
                      </AppText>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  {Platform.OS !== 'web' ? (
                    <SpringPressable
                      accessibilityRole="button"
                      pressScale={0.94}
                      haptic="selection"
                      onPress={() =>
                        void addPlanToDeviceCalendar({
                          itemId: plan.item_id,
                          scheduledAt: plan.scheduled_at,
                          reminderMinutesBefore: plan.reminder_minutes_before,
                        }).then((res) => {
                          showToast({
                            type: res.status === 'saved' ? 'success' : 'warning',
                            title:
                              res.status === 'saved'
                                ? t('plans.addedToCalendar')
                                : t('plans.calendarPermissionDenied'),
                          });
                        })
                      }
                      style={styles.miniPill}
                    >
                      <Ionicons name="calendar-outline" size={13} color="#5F4932" />
                      <AppText style={styles.miniPillText}>
                        {t('plans.addToAppleCalendar')}
                      </AppText>
                    </SpringPressable>
                  ) : null}
                  <SpringPressable
                    accessibilityRole="button"
                    pressScale={0.94}
                    haptic="selection"
                    onPress={() =>
                      void openInGoogleCalendar({
                        itemId: plan.item_id,
                        scheduledAt: plan.scheduled_at,
                      })
                    }
                    style={styles.miniPill}
                  >
                    <Ionicons name="logo-google" size={12} color="#5F4932" />
                    <AppText style={styles.miniPillText}>
                      {t('plans.addToGoogleCalendar')}
                    </AppText>
                  </SpringPressable>

                  {location ? (
                    <>
                      {Platform.OS === 'ios' ? (
                        <SpringPressable
                          accessibilityRole="button"
                          pressScale={0.94}
                          haptic="selection"
                          onPress={() =>
                            void openInAppleMaps(location, linked?.original_url)
                          }
                          style={styles.miniPill}
                        >
                          <Ionicons name="map-outline" size={13} color="#5F4932" />
                          <AppText style={styles.miniPillText}>
                            {t('items.openAppleMaps')}
                          </AppText>
                        </SpringPressable>
                      ) : null}
                      <SpringPressable
                        accessibilityRole="button"
                        pressScale={0.94}
                        haptic="selection"
                        onPress={() =>
                          void openInGoogleMaps(location, linked?.original_url)
                        }
                        style={styles.miniPill}
                      >
                        <Ionicons name="navigate-outline" size={13} color="#5F4932" />
                        <AppText style={styles.miniPillText}>
                          {t('items.openGoogleMaps')}
                        </AppText>
                      </SpringPressable>
                    </>
                  ) : null}
                </View>

                <View style={styles.decisionRow}>
                  {plan.status === 'proposed' && createdByOther ? (
                    <>
                      <SpringPressable
                        accessibilityRole="button"
                        pressScale={0.95}
                        haptic="medium"
                        disabled={planAction.isPending}
                        onPress={() =>
                          planAction.mutate(
                            { planId: plan.id, action: 'approve' },
                            {
                              onSuccess: () =>
                                showToast({
                                  type: 'success',
                                  title: t('plans.planUpdated'),
                                }),
                            },
                          )
                        }
                        style={styles.approveBtn}
                      >
                        <Ionicons name="checkmark" size={14} color={colors.onAccent} />
                        <AppText style={styles.approveText}>{t('plans.approve')}</AppText>
                      </SpringPressable>
                      <SpringPressable
                        accessibilityRole="button"
                        pressScale={0.95}
                        haptic="warning"
                        disabled={planAction.isPending}
                        onPress={() =>
                          planAction.mutate({ planId: plan.id, action: 'reject' })
                        }
                        style={styles.declineBtn}
                      >
                        <AppText style={styles.declineText}>{t('plans.decline')}</AppText>
                      </SpringPressable>
                    </>
                  ) : plan.status === 'proposed' ? (
                    <SpringPressable
                      accessibilityRole="button"
                      pressScale={0.95}
                      haptic="warning"
                      disabled={planAction.isPending}
                      onPress={() =>
                        planAction.mutate(
                          { planId: plan.id, action: 'cancel' },
                          {
                            onSuccess: () =>
                              showToast({
                                type: 'info',
                                title: t('plans.cancelledToast'),
                              }),
                          },
                        )
                      }
                      style={styles.declineBtn}
                    >
                      <AppText style={styles.declineText}>
                        {t('plans.cancelPlan')}
                      </AppText>
                    </SpringPressable>
                  ) : (
                    <SpringPressable
                      accessibilityRole="button"
                      pressScale={0.95}
                      haptic="medium"
                      disabled={planAction.isPending}
                      onPress={() =>
                        planAction.mutate(
                          { planId: plan.id, action: 'complete' },
                          {
                            onSuccess: () =>
                              showToast({
                                type: 'success',
                                title: t('plans.planUpdated'),
                              }),
                          },
                        )
                      }
                      style={styles.approveBtn}
                    >
                      <Ionicons name="checkmark-done" size={14} color={colors.onAccent} />
                      <AppText style={styles.approveText}>{t('plans.complete')}</AppText>
                    </SpringPressable>
                  )}
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.35,
    color: colors.primaryText,
  },
  stack: {
    gap: spacing.sm + 2,
  },
  card: {
    borderRadius: 22,
    padding: spacing.md + 2,
    gap: spacing.sm + 2,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  calendarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.primaryText,
  },
  dateText: {
    color: '#7A5E42',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
  },
  statusApproved: {
    backgroundColor: colors.successSoft,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  statusTextApproved: {
    color: colors.success,
  },
  metaBox: {
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  locationLine: {
    color: '#5F4932',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
  },
  miniPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#5F4932',
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  approveText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.onAccent,
  },
  declineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.errorSoft,
  },
  declineText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.error,
  },
});
