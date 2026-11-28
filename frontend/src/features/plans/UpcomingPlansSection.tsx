import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useToast } from '@/components/feedback/AppToast';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/design-system';
import type { Plan } from '@/features/collaboration/api';
import type { Item } from '@/features/items/types';
import { PlanCard } from '@/features/plans/PlanCard';
import { PlanSheet } from '@/features/plans/PlanSheet';
import { usePlanAction, useSpacePlans } from '@/features/plans/hooks';
import { t } from '@/i18n';

function buildFallbackItem(plan: Plan): Item {
  return {
    id: plan.item_id,
    space_id: plan.space_id,
    list_id: '',
    created_by: plan.created_by,
    created_by_name: t('common.user'),
    title: t('common.savedItem'),
    description: null,
    status: 'planned',
    type: 'link',
    original_url: null,
    canonical_url: null,
    preview_image_url: null,
    source_app: null,
    source_domain: null,
    shared_text: null,
    metadata_status: 'ready',
    client_item_id: null,
    completed_at: null,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

export function UpcomingPlansSection({
  spaceId,
  items,
}: {
  spaceId: string;
  items: Item[];
}) {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();
  const plansQuery = useSpacePlans(spaceId);
  const planAction = usePlanAction(spaceId);
  const [editingTarget, setEditingTarget] = useState<{ plan: Plan; item: Item } | null>(
    null,
  );

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
          const linkedItem = itemMap.get(plan.item_id) ?? buildFallbackItem(plan);
          return (
            <Animated.View
              key={plan.id}
              entering={reducedMotion ? undefined : FadeInDown.duration(180)}
              layout={reducedMotion ? undefined : LAYOUT_SPRING}
            >
              <PlanCard
                plan={plan}
                item={linkedItem}
                variant="home"
                isActionPending={planAction.isPending}
                onPress={() => router.push(`/item/${plan.item_id}`)}
                onEdit={() => setEditingTarget({ plan, item: linkedItem })}
                onAction={(action) => {
                  planAction.mutate(
                    { planId: plan.id, action },
                    {
                      onSuccess: () =>
                        showToast({
                          type: action === 'cancel' ? 'info' : 'success',
                          title:
                            action === 'cancel'
                              ? t('plans.cancelledToast')
                              : t('plans.planUpdated'),
                        }),
                    },
                  );
                }}
              />
            </Animated.View>
          );
        })}
      </View>

      {editingTarget ? (
        <PlanSheet
          visible={Boolean(editingTarget)}
          item={editingTarget.item}
          existingPlan={editingTarget.plan}
          onClose={() => setEditingTarget(null)}
        />
      ) : null}
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
});
