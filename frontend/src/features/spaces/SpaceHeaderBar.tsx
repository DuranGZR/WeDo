import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, IconButton } from '@/components/ui';
import { colors, spacing } from '@/design-system';
import type { SpaceMember } from '@/features/collaboration/api';
import { useUnreadNotificationCount } from '@/features/notifications/hooks';
import { MemberLinks } from '@/features/spaces/MemberLinks';
import { formatLocale, t } from '@/i18n';

function FallbackSpaceAvatar({ name }: { name: string }) {
  return (
    <View
      accessible
      accessibilityLabel={t('home.avatarForValue', { value0: name })}
      style={styles.fallbackAvatar}
    >
      <AppText style={styles.fallbackInitial}>
        {name.trim().charAt(0).toLocaleUpperCase(formatLocale()) || 'W'}
      </AppText>
    </View>
  );
}

function PendingPartnerAvatar() {
  return (
    <View
      accessible
      accessibilityLabel={t('home.partnerAvatarInvitationPending')}
      style={styles.pendingAvatar}
    >
      <AppText style={styles.pendingInitial}>?</AppText>
    </View>
  );
}

/** Shared editorial header bar with space identity, member stack, notifications, and add action. */
export function SpaceHeaderBar({
  spaceId,
  spaceName,
  fallbackUserName,
  members,
  needsInvite,
  onOpenSpaceSwitcher,
  onPressAdd,
  addLabel,
}: {
  spaceId?: string;
  spaceName?: string;
  fallbackUserName?: string | null;
  members: SpaceMember[];
  needsInvite: boolean;
  onOpenSpaceSwitcher: () => void;
  onPressAdd: () => void;
  addLabel: string;
}) {
  useTranslation();
  const unreadQuery = useUnreadNotificationCount();
  const unreadCount = unreadQuery.data ?? 0;
  const visibleMembers = members.slice(0, 2);
  const memberNames = visibleMembers.map((member) => member.display_name);
  const subtitle =
    memberNames.length > 0
      ? needsInvite
        ? `${memberNames[0]} · ${t('home.invitationPending')}`
        : memberNames.join(' · ')
      : needsInvite
        ? t('home.invitationPending')
        : t('spaces.sharedSpace');

  return (
    <View style={styles.topBar}>
      <View style={styles.spaceIdentity}>
        <View style={styles.spaceAvatarStack}>
          {spaceId ? (
            visibleMembers.length > 0 ? (
              <MemberLinks
                variant="avatarStack"
                spaceId={spaceId}
                members={visibleMembers}
              />
            ) : (
              <FallbackSpaceAvatar name={spaceName ?? 'W'} />
            )
          ) : (
            <FallbackSpaceAvatar name={fallbackUserName ?? 'W'} />
          )}
          {needsInvite ? (
            <View
              style={[
                styles.headerPendingWrap,
                visibleMembers.length > 0 && styles.headerPendingOverlap,
              ]}
            >
              <PendingPartnerAvatar />
            </View>
          ) : null}
        </View>

        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('home.switchSpace')}
          onPress={onOpenSpaceSwitcher}
          hitSlop={6}
          pressScale={0.96}
          pressOpacity={0.84}
          haptic="selection"
          style={styles.spaceTrigger}
        >
          <View style={styles.spaceTitleRow}>
            <AppText variant="cardTitle" numberOfLines={1} style={styles.spaceTitle}>
              {spaceName ?? t('spaces.sharedSpace')}
            </AppText>
            <Ionicons name="chevron-down" size={14} color={colors.secondaryText} />
          </View>
          <AppText variant="caption" numberOfLines={1} style={styles.spaceSubtitle}>
            {subtitle}
          </AppText>
        </SpringPressable>
      </View>

      <View style={styles.topActions}>
        <IconButton
          tone="glass"
          size={42}
          label={t('lists.searchSpace')}
          icon={<Ionicons name="search-outline" size={19} color={colors.primaryText} />}
          onPress={() => router.push('/search')}
        />
        <View style={styles.bellWrap}>
          <IconButton
            tone="glass"
            size={42}
            label={t('common.notifications')}
            icon={
              <Ionicons
                name="notifications-outline"
                size={19}
                color={colors.primaryText}
              />
            }
            onPress={() => router.push('/notifications')}
          />
          {unreadCount > 0 ? (
            <View pointerEvents="none" style={styles.unreadBadge}>
              <AppText style={styles.unreadBadgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </AppText>
            </View>
          ) : null}
        </View>
        <IconButton
          tone="dark"
          size={42}
          label={addLabel}
          icon={<Ionicons name="add" size={22} color={colors.onAccent} />}
          onPress={onPressAdd}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: spacing.md,
  },
  spaceIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spaceAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerPendingWrap: {
    zIndex: 1,
  },
  headerPendingOverlap: {
    marginLeft: -10,
  },
  fallbackAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  fallbackInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onAccent,
  },
  pendingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderFocus,
  },
  pendingInitial: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  spaceTrigger: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 1,
  },
  spaceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spaceTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.primaryText,
    flexShrink: 1,
  },
  spaceSubtitle: {
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.secondaryText,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bellWrap: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: '#9E7F60',
    borderWidth: 1.5,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
