import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Skeleton, SkeletonCard } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system';
import {
  AccountCard,
  AccountScaffold,
} from '@/features/account/components/AccountScaffold';
import { collaborationApi } from '@/features/collaboration/api';
import { SafetyActions } from '@/features/safety/SafetyActions';
import { memberRoleLabel } from '@/features/spaces/member-label';
import { formatDate, formatLocale, t } from '@/i18n';
import { useAuthStore } from '@/store/auth-store';

export default function MemberProfileScreen() {
  useTranslation();
  const locale = formatLocale();
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
        <SkeletonCard style={styles.skeletonCard}>
          <View style={styles.headerRow}>
            <Skeleton width={52} height={52} borderRadius={26} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={22} borderRadius={8} />
              <Skeleton width="35%" height={14} borderRadius={6} />
            </View>
          </View>
          <Skeleton width="75%" height={16} borderRadius={6} />
          <Skeleton width="65%" height={16} borderRadius={6} />
        </SkeletonCard>
      ) : member.isError ? (
        <AccountCard>
          <AppText accessibilityRole="alert">{member.error.message}</AppText>
          <Button
            variant="secondary"
            label={t('common.retry')}
            onPress={() => void member.refetch()}
          />
        </AccountCard>
      ) : (
        <AccountCard>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.avatarBadge,
                member.data.user_id === ownId && styles.avatarBadgeOwn,
              ]}
            >
              <AppText
                style={[
                  styles.avatarInitial,
                  member.data.user_id === ownId && styles.avatarInitialOwn,
                ]}
              >
                {member.data.display_name.trim().charAt(0).toLocaleUpperCase(locale)}
              </AppText>
            </View>
            <View style={styles.identityCopy}>
              <AppText variant="pageTitle">{member.data.display_name}</AppText>
              {member.data.user_id === ownId ? (
                <AppText muted>{t('safety.you')}</AppText>
              ) : null}
            </View>
          </View>

          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#9E7F60" />
              </View>
              <AppText style={styles.metaText}>
                {t('members.role', { role: memberRoleLabel(member.data.role) })}
              </AppText>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="calendar-outline" size={16} color="#9E7F60" />
              </View>
              <AppText style={styles.metaText}>
                {t('members.joined', { date: formatDate(member.data.joined_at) })}
              </AppText>
            </View>
          </View>

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

const styles = StyleSheet.create({
  skeletonCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarBadge: {
    width: 52,
    height: 52,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#7A5E42',
  },
  avatarInitialOwn: {
    color: colors.onAccent,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  metaList: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    flex: 1,
    color: colors.primaryText,
  },
});
