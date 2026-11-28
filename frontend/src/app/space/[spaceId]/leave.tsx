import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, Button, Skeleton, SkeletonCard } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system';
import {
  AccountCard,
  AccountScaffold,
} from '@/features/account/components/AccountScaffold';
import { collaborationApi } from '@/features/collaboration/api';
import { useSpaces } from '@/features/spaces/hooks';
import { formatLocale, t } from '@/i18n';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';

export default function LeaveSpaceScreen() {
  useTranslation();
  const locale = formatLocale();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const ownId = useAuthStore((state) => state.user?.id);
  const spaces = useSpaces();
  const spaceName = spaces.data?.data.find((space) => space.id === spaceId)?.name;
  const client = useQueryClient();
  const [successorId, setSuccessorId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const members = useQuery({
    queryKey: ['spaces', spaceId, 'members', 'all'],
    queryFn: () => collaborationApi.allMembers(spaceId),
    enabled: Boolean(spaceId),
  });
  const ownMember = members.data?.data.find((member) => member.user_id === ownId);
  const owner = ownMember?.role === 'owner';
  const candidates =
    members.data?.data.filter((member) => member.user_id !== ownId && member.is_active) ??
    [];
  const needsSuccessor = owner && candidates.length > 0;
  const selected = candidates.find((member) => member.user_id === successorId);
  const warning = owner
    ? needsSuccessor
      ? t('members.transferWarning', { name: selected?.display_name ?? '' })
      : t('members.lastOwnerWarning')
    : t('members.leaveWarning');

  const leave = async () => {
    setPending(true);
    setError('');
    try {
      await collaborationApi.leaveSpace(
        spaceId,
        needsSuccessor ? selected?.user_id : undefined,
      );
      await client.cancelQueries();
      if (useSpaceStore.getState().selectedSpaceId === spaceId) {
        useSpaceStore.getState().setSelectedSpaceId(undefined);
      }
      void client.resetQueries();
      router.replace('/(tabs)');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('common.tryAgainShort'));
    } finally {
      setPending(false);
    }
  };
  const confirm = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(warning)) void leave();
      return;
    }
    Alert.alert(
      spaceName ? t('members.leaveNamed', { name: spaceName }) : t('members.leave'),
      warning,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('members.leave'), style: 'destructive', onPress: () => void leave() },
      ],
    );
  };
  return (
    <AccountScaffold title={t('members.leave')} subtitle={t('members.leaveDescription')}>
      {members.isPending ? (
        <SkeletonCard style={styles.skeletonCard}>
          <Skeleton width="50%" height={20} borderRadius={8} />
          <Skeleton width="100%" height={48} borderRadius={16} />
          <Skeleton width="100%" height={50} borderRadius={radius.pill} />
        </SkeletonCard>
      ) : members.isError ? (
        <AccountCard>
          <AppText accessibilityRole="alert">{members.error.message}</AppText>
          <Button
            variant="secondary"
            label={t('common.retry')}
            onPress={() => void members.refetch()}
          />
        </AccountCard>
      ) : (
        <AccountCard danger>
          {spaceName ? <AppText variant="sectionTitle">{spaceName}</AppText> : null}
          {needsSuccessor ? (
            <>
              <AppText>{t('members.chooseSuccessor')}</AppText>
              <View style={styles.candidates}>
                {candidates.map((candidate) => {
                  const isSelected = selected?.id === candidate.id;
                  const initial = candidate.display_name
                    .trim()
                    .charAt(0)
                    .toLocaleUpperCase(locale);
                  return (
                    <SpringPressable
                      key={candidate.id}
                      accessibilityRole="radio"
                      accessibilityLabel={candidate.display_name}
                      accessibilityState={{ checked: isSelected }}
                      disabled={pending}
                      pressScale={0.98}
                      haptic="selection"
                      onPress={() => setSuccessorId(candidate.user_id)}
                      style={[
                        styles.candidateCard,
                        isSelected && styles.candidateCardActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.candidateAvatar,
                          isSelected && styles.candidateAvatarActive,
                        ]}
                      >
                        <AppText
                          style={[
                            styles.candidateInitial,
                            isSelected && styles.candidateInitialActive,
                          ]}
                        >
                          {initial}
                        </AppText>
                      </View>
                      <AppText
                        style={[
                          styles.candidateName,
                          isSelected && styles.candidateNameActive,
                        ]}
                      >
                        {candidate.display_name}
                      </AppText>
                      {isSelected ? (
                        <Animated.View entering={ZoomIn.duration(180)}>
                          <Ionicons name="checkmark-circle" size={20} color="#9E7F60" />
                        </Animated.View>
                      ) : (
                        <View style={styles.radioCircle} />
                      )}
                    </SpringPressable>
                  );
                })}
              </View>
            </>
          ) : (
            <AppText>{warning}</AppText>
          )}
          {selected ? <AppText>{warning}</AppText> : null}
          {error ? (
            <AppText accessibilityRole="alert" style={styles.errorText}>
              {error}
            </AppText>
          ) : null}
          <Button
            variant="danger"
            label={t('members.leave')}
            loading={pending}
            disabled={pending || !ownMember || (needsSuccessor && !selected)}
            onPress={confirm}
          />
        </AccountCard>
      )}
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  candidates: {
    gap: spacing.sm,
  },
  candidateCard: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  candidateCardActive: {
    borderColor: '#9E7F60',
    backgroundColor: '#FAF5EE',
  },
  candidateAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(17, 17, 16, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateAvatarActive: {
    backgroundColor: '#9E7F60',
  },
  candidateInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  candidateInitialActive: {
    color: '#FFFFFF',
  },
  candidateName: {
    flex: 1,
    fontWeight: '600',
    color: colors.primaryText,
  },
  candidateNameActive: {
    color: '#5F4932',
    fontWeight: '700',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderFocus,
  },
  errorText: {
    color: colors.error,
  },
});
