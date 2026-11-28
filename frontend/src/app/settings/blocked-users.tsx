import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { safetyApi } from '@/features/safety/api';
import { t } from '@/i18n';

export default function BlockedUsersScreen() {
  useTranslation();
  const client = useQueryClient();
  const blocks = useInfiniteQuery({
    queryKey: ['safety', 'blocks'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => safetyApi.blocks(pageParam),
    getNextPageParam: (page) =>
      page.pagination.has_more ? page.pagination.page + 1 : undefined,
  });
  const unblock = useMutation({
    mutationFn: safetyApi.unblock,
    onSuccess: () => client.invalidateQueries({ queryKey: ['safety', 'blocks'] }),
    onError: (error) => Alert.alert(t('safety.actionFailed'), error.message),
  });
  return (
    <AccountScaffold
      title={t('safety.blockedUsers')}
      subtitle={t('safety.unblockDescription')}
    >
      {blocks.isLoading ? (
        <ActivityIndicator />
      ) : blocks.isError ? (
        <AccountCard>
          <AppText accessibilityRole="alert">{blocks.error.message}</AppText>
          <SpringPressable
            accessibilityRole="button"
            haptic="light"
            onPress={() => void blocks.refetch()}
            style={accountStyles.secondaryButton}
          >
            <AppText>{t('common.retry')}</AppText>
          </SpringPressable>
        </AccountCard>
      ) : (
        <>
          {(blocks.data?.pages.flatMap((page) => page.data) ?? []).map((user) => (
            <AccountCard key={user.user_id}>
              <AppText variant="sectionTitle">{user.display_name}</AppText>
              <SpringPressable
                accessibilityRole="button"
                haptic="medium"
                disabled={unblock.isPending}
                onPress={() => unblock.mutate(user.user_id)}
                style={accountStyles.secondaryButton}
              >
                {unblock.isPending && unblock.variables === user.user_id ? (
                  <ActivityIndicator />
                ) : null}
                <AppText>{t('safety.unblock')}</AppText>
              </SpringPressable>
            </AccountCard>
          ))}
          {blocks.data?.pages[0]?.data.length === 0 ? (
            <AccountCard>
              <AppText>{t('safety.noBlockedUsers')}</AppText>
            </AccountCard>
          ) : null}
          {blocks.hasNextPage ? (
            <View>
              <SpringPressable
                accessibilityRole="button"
                haptic="selection"
                disabled={blocks.isFetchingNextPage}
                onPress={() => void blocks.fetchNextPage()}
                style={accountStyles.secondaryButton}
              >
                <AppText>{t('safety.loadMore')}</AppText>
              </SpringPressable>
            </View>
          ) : null}
        </>
      )}
    </AccountScaffold>
  );
}
