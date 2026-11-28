import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import { colors, radius } from '@/design-system';
import type { SpaceMember } from '@/features/collaboration/api';
import { formatLocale, t } from '@/i18n';

export function MemberLinks({
  spaceId,
  members,
  onOpen,
  avatars = false,
  variant = 'default',
}: {
  spaceId: string;
  members: SpaceMember[];
  onOpen?: () => void;
  avatars?: boolean;
  variant?: 'default' | 'avatarStack';
}) {
  useTranslation();
  if (variant === 'avatarStack') {
    return (
      <View style={styles.avatarStack}>
        {members.map((member, index) => (
          <SpringPressable
            key={member.id}
            accessibilityRole="button"
            accessibilityLabel={t('members.viewProfile', { name: member.display_name })}
            hitSlop={4}
            pressScale={0.9}
            pressOpacity={0.86}
            haptic="selection"
            onPress={() => {
              onOpen?.();
              router.push(`/space/${spaceId}/member/${member.id}` as never);
            }}
            style={[
              styles.stackCircle,
              index > 0 && styles.stackCircleOverlap,
              index > 0 && styles.stackCircleSecondary,
            ]}
          >
            <AppText style={styles.stackInitial}>
              {member.display_name.trim().charAt(0).toLocaleUpperCase(formatLocale())}
            </AppText>
          </SpringPressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.members}>
      {members.map((member) => (
        <SpringPressable
          key={member.id}
          accessibilityRole="button"
          accessibilityLabel={t('members.viewProfile', { name: member.display_name })}
          hitSlop={4}
          pressScale={0.94}
          pressOpacity={0.86}
          haptic="selection"
          onPress={() => {
            onOpen?.();
            router.push(`/space/${spaceId}/member/${member.id}` as never);
          }}
          style={[styles.member, !avatars && styles.memberRelaxed]}
        >
          {avatars ? (
            <View style={styles.avatar}>
              <AppText style={styles.initial}>
                {member.display_name.trim().charAt(0).toLocaleUpperCase(formatLocale())}
              </AppText>
            </View>
          ) : null}
          <AppText numberOfLines={1} style={styles.name}>
            {avatars ? member.display_name.split(' ')[0] : member.display_name}
          </AppText>
        </SpringPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flexShrink: 1, minWidth: 0 },
  member: {
    minHeight: 26,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    maxWidth: 140,
  },
  memberRelaxed: {
    minHeight: 32,
    paddingHorizontal: 10,
  },
  name: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.primaryText,
    flexShrink: 1,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 9, fontWeight: '700', color: colors.onAccent },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackCircleSecondary: {
    backgroundColor: '#5B544E',
  },
  stackCircleOverlap: {
    marginLeft: -10,
  },
  stackInitial: { fontSize: 12.5, fontWeight: '700', color: colors.onAccent },
});
