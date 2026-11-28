import { Ionicons } from '@expo/vector-icons';
import { useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, GlassSurface } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { outboxSummary, retryFailedEntries, subscribeOutbox } from '@/database/outbox';
import { syncOutbox } from '@/features/sharing/sync';
import { haptic } from '@/lib/haptics';
import { t } from '@/i18n';
import { useAuthStore } from '@/store/auth-store';

/** Surfaces pending or failed offline shares stored in the local outbox with one-tap retry. */
export function OutboxStatusBanner() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const ownerId = useAuthStore((state) => state.user?.id ?? '');
  const [syncingNow, setSyncingNow] = useState(false);

  const countsKey = useSyncExternalStore(
    subscribeOutbox,
    () => {
      const next = outboxSummary(ownerId);
      return `${next.pending}:${next.failed}`;
    },
    () => '0:0',
  );
  const [pendingCount, failedCount] = countsKey.split(':').map(Number);
  const summary = {
    pending: pendingCount || 0,
    failed: failedCount || 0,
  };

  if (summary.pending === 0 && summary.failed === 0) return null;

  const hasFailed = summary.failed > 0;
  const label = hasFailed
    ? t('sharing.outboxFailed', { count: summary.failed })
    : t('sharing.outboxPending', { count: summary.pending });

  const handleRetry = async () => {
    if (syncingNow || !ownerId) return;
    setSyncingNow(true);
    try {
      if (hasFailed) retryFailedEntries(ownerId);
      await syncOutbox();
      const next = outboxSummary(ownerId);
      if (next.pending === 0 && next.failed === 0) {
        haptic.success();
      }
    } finally {
      setSyncingNow(false);
    }
  };

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(220)}
      layout={reducedMotion ? undefined : LAYOUT_SPRING}
      style={styles.wrap}
    >
      <GlassSurface
        elevated
        tintColor={hasFailed ? 'rgba(184, 74, 66, 0.09)' : 'rgba(158, 127, 96, 0.12)'}
        fallbackBackgroundColor={hasFailed ? colors.errorSoft : '#FAF5EE'}
        style={[styles.banner, hasFailed && styles.bannerError]}
      >
        <View style={[styles.iconWrap, hasFailed && styles.iconWrapError]}>
          <Ionicons
            name={hasFailed ? 'cloud-offline-outline' : 'cloud-upload-outline'}
            size={17}
            color={hasFailed ? colors.error : '#9E7F60'}
          />
        </View>
        <View style={styles.copy}>
          <AppText style={[styles.text, hasFailed && styles.textError]} numberOfLines={2}>
            {label}
          </AppText>
        </View>
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={
            hasFailed ? t('sharing.retryFailed') : t('sharing.retrySync')
          }
          pressScale={0.94}
          haptic="medium"
          disabled={syncingNow}
          onPress={() => void handleRetry()}
          style={[styles.actionBtn, syncingNow && styles.actionDisabled]}
        >
          <AppText style={styles.actionText}>
            {hasFailed ? t('sharing.retryFailed') : t('sharing.retrySync')}
          </AppText>
        </SpringPressable>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D4BEA4',
    ...shadows.glass,
  },
  bannerError: {
    borderColor: 'rgba(184, 74, 66, 0.28)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapError: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F4932',
  },
  textError: {
    color: colors.error,
  },
  actionBtn: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: {
    opacity: 0.55,
  },
  actionText: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '600',
  },
});
