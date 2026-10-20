import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { collaborationApi } from '@/features/collaboration/api';
import { useSpaces } from '@/features/spaces/hooks';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';
import { t } from '@/i18n';

export default function LeaveSpaceScreen() {
  useTranslation();
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
        <ActivityIndicator />
      ) : members.isError ? (
        <AccountCard>
          <AppText accessibilityRole="alert">{members.error.message}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void members.refetch()}
            style={accountStyles.secondaryButton}
          >
            <AppText>{t('common.retry')}</AppText>
          </Pressable>
        </AccountCard>
      ) : (
        <AccountCard>
          {spaceName ? <AppText variant="sectionTitle">{spaceName}</AppText> : null}
          {needsSuccessor ? (
            <>
              <AppText>{t('members.chooseSuccessor')}</AppText>
              {candidates.map((candidate) => (
                <Pressable
                  key={candidate.id}
                  accessibilityRole="radio"
                  accessibilityLabel={candidate.display_name}
                  accessibilityState={{ checked: selected?.id === candidate.id }}
                  disabled={pending}
                  onPress={() => setSuccessorId(candidate.user_id)}
                  style={
                    selected?.id === candidate.id
                      ? accountStyles.primaryButton
                      : accountStyles.secondaryButton
                  }
                >
                  <AppText
                    style={
                      selected?.id === candidate.id
                        ? accountStyles.primaryButtonText
                        : accountStyles.secondaryButtonText
                    }
                  >
                    {candidate.display_name}
                  </AppText>
                </Pressable>
              ))}
            </>
          ) : (
            <AppText>{warning}</AppText>
          )}
          {selected ? <AppText>{warning}</AppText> : null}
          {error ? <AppText accessibilityRole="alert">{error}</AppText> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('members.leave')}
            disabled={pending || !ownMember || (needsSuccessor && !selected)}
            onPress={confirm}
            style={[
              accountStyles.secondaryButton,
              accountStyles.dangerButton,
              (pending || !ownMember || (needsSuccessor && !selected)) && {
                opacity: 0.5,
              },
            ]}
          >
            {pending ? <ActivityIndicator /> : null}
            <AppText style={accountStyles.dangerButtonText}>{t('members.leave')}</AppText>
          </Pressable>
        </AccountCard>
      )}
    </AccountScaffold>
  );
}
