import { useInfiniteQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
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
import { useAuthStore } from '@/store/auth-store';
import { t } from '@/i18n';

export default function SpaceMembersScreen() {
  useTranslation();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const ownId = useAuthStore((state) => state.user?.id);
  const members = useInfiniteQuery({
    queryKey: ['spaces', spaceId, 'members', 'pages'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => collaborationApi.members(spaceId, pageParam),
    getNextPageParam: (page) =>
      page.pagination.has_more ? page.pagination.page + 1 : undefined,
    enabled: Boolean(spaceId),
  });
  return (
    <AccountScaffold
      title={t('safety.members')}
      subtitle={t('safety.membersDescription')}
    >
      {members.isLoading ? (
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
        <>
          {(members.data?.pages.flatMap((page) => page.data) ?? []).map((member) => (
            <AccountCard key={member.id}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('members.viewProfile', {
                  name: member.display_name,
                })}
                onPress={() =>
                  router.push(`/space/${spaceId}/member/${member.id}` as never)
                }
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <AppText variant="sectionTitle">{member.display_name}</AppText>
              </Pressable>
              {member.user_id !== ownId ? (
                <SafetyActions
                  userId={member.user_id}
                  displayName={member.display_name}
                  spaceId={spaceId}
                />
              ) : (
                <AppText muted>{t('safety.you')}</AppText>
              )}
            </AccountCard>
          ))}
          {members.hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              disabled={members.isFetchingNextPage}
              onPress={() => void members.fetchNextPage()}
              style={accountStyles.secondaryButton}
            >
              <AppText>{t('safety.loadMore')}</AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/space/${spaceId}/leave` as never)}
            style={[accountStyles.secondaryButton, accountStyles.dangerButton]}
          >
            <AppText style={accountStyles.dangerButtonText}>{t('members.leave')}</AppText>
          </Pressable>
        </>
      )}
    </AccountScaffold>
  );
}
