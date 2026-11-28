import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, Button, Skeleton, SkeletonCard } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system';
import {
  AccountCard,
  AccountScaffold,
} from '@/features/account/components/AccountScaffold';
import { collaborationApi } from '@/features/collaboration/api';
import { SafetyActions } from '@/features/safety/SafetyActions';
import { formatLocale, t } from '@/i18n';
import { useAuthStore } from '@/store/auth-store';

export default function SpaceMembersScreen() {
  useTranslation();
  const locale = formatLocale();
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
        <View style={styles.skeletonList}>
          {[1, 2].map((key) => (
            <SkeletonCard key={key} style={styles.skeletonCard}>
              <View style={styles.memberHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="55%" height={16} borderRadius={6} />
                  <Skeleton width="30%" height={12} borderRadius={6} />
                </View>
              </View>
            </SkeletonCard>
          ))}
        </View>
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
        <>
          {(members.data?.pages.flatMap((page) => page.data) ?? []).map((member) => {
            const initial = member.display_name
              .trim()
              .charAt(0)
              .toLocaleUpperCase(locale);
            const isOwn = member.user_id === ownId;
            return (
              <AccountCard key={member.id}>
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityLabel={t('members.viewProfile', {
                    name: member.display_name,
                  })}
                  pressScale={0.985}
                  haptic="selection"
                  onPress={() =>
                    router.push(`/space/${spaceId}/member/${member.id}` as never)
                  }
                  style={styles.memberRow}
                >
                  <View style={[styles.avatarBadge, isOwn && styles.avatarBadgeOwn]}>
                    <AppText
                      style={[styles.avatarInitial, isOwn && styles.avatarInitialOwn]}
                    >
                      {initial}
                    </AppText>
                  </View>
                  <View style={styles.memberCopy}>
                    <AppText variant="sectionTitle">{member.display_name}</AppText>
                    {isOwn ? <AppText muted>{t('safety.you')}</AppText> : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.tertiaryText}
                  />
                </SpringPressable>
                {!isOwn ? (
                  <SafetyActions
                    userId={member.user_id}
                    displayName={member.display_name}
                    spaceId={spaceId}
                  />
                ) : null}
              </AccountCard>
            );
          })}
          {members.hasNextPage ? (
            <Button
              variant="secondary"
              loading={members.isFetchingNextPage}
              disabled={members.isFetchingNextPage}
              label={t('safety.loadMore')}
              onPress={() => void members.fetchNextPage()}
            />
          ) : null}
          <Button
            variant="danger"
            label={t('members.leave')}
            onPress={() => router.push(`/space/${spaceId}/leave` as never)}
          />
        </>
      )}
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  skeletonList: {
    gap: spacing.md,
  },
  skeletonCard: {
    padding: spacing.lg,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeOwn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7A5E42',
  },
  avatarInitialOwn: {
    color: colors.onAccent,
  },
  memberCopy: {
    flex: 1,
    gap: 2,
  },
});
