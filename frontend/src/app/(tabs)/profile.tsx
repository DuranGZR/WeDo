import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Screen } from '@/components/ui';
import { ScreenMotion } from '@/components/motion/ScreenMotion';
import { colors, mono, spacing } from '@/design-system';
import { useSpaces } from '@/features/spaces/hooks';
import { useAuthStore } from '@/store/auth-store';

type MenuTone = 'account' | 'collaboration' | 'support' | 'danger';

function MenuRow({
  icon,
  label,
  description,
  onPress,
  tone = 'account',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  tone?: MenuTone;
}) {
  const isDanger = tone === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.btnPressed]}
    >
      <View style={[styles.rowIcon, styles[`${tone}Icon`]]}>
        <Ionicons name={icon} size={19} color={styles[`${tone}Color`].color} />
      </View>
      <View style={styles.rowContent}>
        <AppText style={isDanger && styles.dangerText}>{label}</AppText>
        {description ? (
          <AppText variant="caption" muted style={styles.rowDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={17}
        color={colors.tertiaryText}
        style={styles.chevron}
      />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const spaces = useSpaces();
  const activeSpaceCount = spaces.data?.data.length ?? 0;
  const activeSpaceLabel = `${activeSpaceCount} aktif alan`;
  return (
    <ScreenMotion>
      <Screen scroll={true} backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.content}>
        <AppText variant="pageTitle">Profil</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil bilgilerini düzenle"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [
            styles.glassCard,
            styles.profile,
            pressed && styles.btnPressed,
          ]}
        >
          <View style={styles.avatarWrap}>
            <Avatar name={user?.display_name} size={64} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color={colors.surface} />
            </View>
          </View>
          <View style={styles.identity}>
            <AppText variant="sectionTitle">{user?.display_name}</AppText>
            <AppText muted>{user?.email}</AppText>
          </View>
          <View style={styles.editAction}>
            <AppText variant="caption" style={styles.editActionText}>
              Düzenle
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </View>
        </Pressable>

        <AppText variant="caption" muted style={styles.groupLabel}>
          HESAP
        </AppText>
        <View style={[styles.glassCard, styles.menu]}>
          <MenuRow
            icon="person-outline"
            label="Profil bilgileri"
            description="Adın ve e-posta adresin"
            onPress={() => router.push('/settings')}
            tone="account"
          />
          <MenuRow
            icon="notifications-outline"
            label="Bildirimler"
            description="Açık"
            onPress={() => router.push('/notifications')}
            tone="account"
          />
        </View>

        <AppText variant="caption" muted style={styles.groupLabel}>
          WE DO
        </AppText>
        <View style={[styles.glassCard, styles.menu]}>
          <MenuRow
            icon="layers-outline"
            label="Alanlarımı yönet"
            description={activeSpaceLabel}
            onPress={() => router.push('/space/manage')}
            tone="collaboration"
          />
          <MenuRow
            icon="settings-outline"
            label="Ayarlar"
            onPress={() => router.push('/settings')}
            tone="collaboration"
          />
        </View>

        <AppText variant="caption" muted style={styles.groupLabel}>
          DESTEK
        </AppText>
        <View style={[styles.glassCard, styles.menu]}>
          <MenuRow
            icon="help-circle-outline"
            label="Yardım ve kullanım"
            onPress={() => undefined}
            tone="support"
          />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Gizlilik"
            description="Hesabın korumada"
            onPress={() => undefined}
            tone="support"
          />
        </View>

        <View style={[styles.glassCard, styles.menu]}>
          <MenuRow
            icon="log-out-outline"
            label="Çıkış yap"
            onPress={() => void signOut()}
            tone="danger"
          />
        </View>
      </View>
      </Screen>
    </ScreenMotion>
  );
}

const styles: any = StyleSheet.create({
  contourTop: {
    position: 'absolute',
    top: -165,
    right: -165,
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: spacing.xl,
    ...Platform.select({
      web: {
        boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)',
      },
    }),
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
  },
  avatarWrap: { position: 'relative' },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
    borderWidth: 2,
    borderColor: mono.paper,
  },
  identity: { gap: spacing.xs },
  editAction: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 1 },
  editActionText: { color: mono.ink, fontWeight: '700' },
  groupLabel: { marginBottom: 0, marginLeft: spacing.xs, letterSpacing: 0.8 },
  menu: { paddingVertical: spacing.xs, marginBottom: 0 },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  rowContent: { flex: 1, gap: 1 },
  rowDescription: { fontSize: 11, lineHeight: 14 },
  accountIcon: { backgroundColor: mono.soft },
  accountColor: { color: mono.ink },
  collaborationIcon: { backgroundColor: mono.soft },
  collaborationColor: { color: mono.ink },
  supportIcon: { backgroundColor: mono.soft },
  supportColor: { color: mono.ink },
  dangerIcon: { backgroundColor: '#F5E1E1' },
  dangerColor: { color: colors.error },
  dangerText: { color: colors.error },
  chevron: { marginLeft: 'auto' },
});
