import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { t } from '@/i18n';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';
import { safetyApi } from './api';

export function SafetyActions({
  userId,
  displayName,
  itemId,
  spaceId,
}: {
  userId: string;
  displayName: string;
  itemId?: string;
  spaceId: string;
}) {
  useTranslation();
  const ownId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const canBlock = userId !== ownId;

  const block = async () => {
    setPending(true);
    try {
      await safetyApi.block(userId);
      // Clear shared data that this account may no longer have permission to see.
      await queryClient.cancelQueries();
      useSpaceStore.getState().setSelectedSpaceId(undefined);
      void queryClient.resetQueries();
      router.replace('/(tabs)');
      Alert.alert(t('safety.blocked'), t('safety.blockedDescription'));
    } catch (error) {
      Alert.alert(
        t('safety.actionFailed'),
        error instanceof Error ? error.message : t('common.tryAgainShort'),
      );
    } finally {
      setPending(false);
    }
  };

  const confirmBlock = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('safety.blockWarning'))) void block();
      return;
    }
    Alert.alert(t('safety.blockUser'), t('safety.blockWarning'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('safety.blockUser'), style: 'destructive', onPress: () => void block() },
    ]);
  };

  return (
    <View style={styles.actions}>
      <SpringPressable
        accessibilityRole="button"
        accessibilityLabel={t('safety.report')}
        disabled={pending}
        pressScale={0.97}
        haptic="light"
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: '/settings/report' as never,
            params: {
              targetType: itemId ? 'item' : 'user',
              targetId: itemId ?? userId,
              spaceId,
              name: displayName,
            },
          })
        }
      >
        <Ionicons name="flag-outline" size={16} color={colors.primaryText} />
        <AppText style={styles.buttonText}>{t('safety.report')}</AppText>
      </SpringPressable>
      {canBlock && (
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('safety.blockUser')}
          disabled={pending}
          pressScale={0.97}
          haptic="medium"
          style={[styles.button, styles.dangerButton]}
          onPress={confirmBlock}
        >
          {pending ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Ionicons name="ban-outline" size={16} color={colors.error} />
          )}
          <AppText style={styles.danger}>{t('safety.blockUser')}</AppText>
        </SpringPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.xs + 2 },
  button: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceCard,
    ...shadows.glass,
  },
  dangerButton: {
    backgroundColor: colors.errorSoft,
    borderColor: 'rgba(184, 74, 66, 0.18)',
  },
  buttonText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.primaryText,
  },
  danger: {
    color: colors.error,
    fontSize: 13.5,
    fontWeight: '500',
  },
});
