import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { collaborationApi } from '@/features/collaboration/api';
import { SafetyActions } from '@/features/safety/SafetyActions';
import { memberRoleLabel } from '@/features/spaces/member-label';
import { useAuthStore } from '@/store/auth-store';
import { formatDate, t } from '@/i18n';

export default function MemberProfileScreen() {
  useTranslation();
  const { spaceId, memberId } = useLocalSearchParams<{
    spaceId: string;
    memberId: string;
  }>();
  const ownId = useAuthStore((state) => state.user?.id);
  const member = useQuery({
    queryKey: ['spaces', spaceId, 'member', memberId],
    queryFn: () => collaborationApi.member(spaceId, memberId),
    enabled: Boolean(spaceId && memberId),
  });
  return (
    <AccountScaffold
      title={t('members.profile')}
      subtitle={t('members.profileDescription')}
    >
      {member.isPending ? (
        <ActivityIndicator />
      ) : member.isError ? (
        <AccountCard>
          <AppText accessibilityRole="alert">{member.error.message}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void member.refetch()}
            style={accountStyles.secondaryButton}
          >
            <AppText>{t('common.retry')}</AppText>
          </Pressable>
        </AccountCard>
      ) : (
        <AccountCard>
          <AppText variant="pageTitle">{member.data.display_name}</AppText>
          {member.data.user_id === ownId ? (
            <AppText muted>{t('safety.you')}</AppText>
          ) : null}
          <AppText>
            {t('members.role', { role: memberRoleLabel(member.data.role) })}
          </AppText>
          <AppText>
            {t('members.joined', { date: formatDate(member.data.joined_at) })}
          </AppText>
          {!member.data.is_active ? (
            <AppText muted>{t('members.inactive')}</AppText>
          ) : null}
          {member.data.user_id !== ownId && member.data.is_active ? (
            <SafetyActions
              userId={member.data.user_id}
              displayName={member.data.display_name}
              spaceId={spaceId}
            />
          ) : null}
        </AccountCard>
      )}
    </AccountScaffold>
  );
}
