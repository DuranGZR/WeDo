import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { mono } from '@/design-system';
import type { SpaceMember } from '@/features/collaboration/api';
import { formatLocale, t } from '@/i18n';

export function MemberLinks({
  spaceId,
  members,
  onOpen,
  avatars = false,
}: {
  spaceId: string;
  members: SpaceMember[];
  onOpen?: () => void;
  avatars?: boolean;
}) {
  useTranslation();
  return (
    <View style={styles.members}>
      {members.map((member) => (
        <Pressable
          key={member.id}
          accessibilityRole="button"
          accessibilityLabel={t('members.viewProfile', { name: member.display_name })}
          onPress={() => {
            onOpen?.();
            router.push(`/space/${spaceId}/member/${member.id}` as never);
          }}
          style={({ pressed }) => [styles.member, pressed && styles.pressed]}
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
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flexShrink: 1, minWidth: 0 },
  member: {
    minHeight: 32,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 7,
    backgroundColor: mono.soft,
    maxWidth: 145,
  },
  name: { fontSize: 12, color: mono.ink, flexShrink: 1 },
  pressed: { opacity: 0.7 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 10, fontWeight: '800', color: mono.paper },
});
