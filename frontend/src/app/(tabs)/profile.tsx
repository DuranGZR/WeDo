import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Screen } from '@/components/ui';
import { ScreenMotion } from '@/components/motion/ScreenMotion';
import { colors, mono, spacing } from '@/design-system';
import { useSpaces } from '@/features/spaces/hooks';
import { useAuthStore } from '@/store/auth-store';

type MenuTone = 'default' | 'danger';

function MenuRow({
  icon,
  label,
  description,
  onPress,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  tone?: MenuTone;
}) {
  const danger = tone === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={19} color={danger ? mono.danger : mono.ink} />
      </View>
      <View style={styles.rowCopy}>
        <AppText style={danger && styles.dangerText}>{label}</AppText>
        {description ? (
          <AppText variant="caption" muted style={styles.rowDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? mono.danger : colors.tertiaryText}
      />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const spaces = useSpaces();
  const activeSpaceCount = spaces.data?.data.length ?? 0;

  const confirmSignOut = () =>
    Alert.alert(
      'Çıkış yapılsın mı?',
      'Bu cihaz dahil tüm açık WeDo oturumların kapatılacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çıkış yap',
          style: 'destructive',
          onPress: () => void signOut().then(() => router.replace('/(auth)/sign-in')),
        },
      ],
    );

  return (
    <ScreenMotion>
      <Screen scroll backgroundColor={mono.background}>
        <View style={styles.contourTop} pointerEvents="none" />
        <View style={styles.contourBottom} pointerEvents="none" />
        <View style={styles.content}>
          <View style={styles.pageHeader}>
            <AppText variant="pageTitle" style={styles.title}>
              Profil
            </AppText>
            <AppText muted style={styles.subtitle}>
              Hesabını ve WeDo deneyimini yönet.
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil bilgilerini düzenle"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
          >
            <Avatar name={user?.display_name} size={66} />
            <View style={styles.identity}>
              <AppText variant="sectionTitle">
                {user?.display_name ?? 'WeDo kullanıcısı'}
              </AppText>
              <AppText muted numberOfLines={1}>
                {user?.email}
              </AppText>
              <View style={styles.profileStatus}>
                <Ionicons name="person-outline" size={13} color={mono.ink} />
                <AppText style={styles.profileStatusText}>Baş harf avatarı</AppText>
              </View>
            </View>
            <View style={styles.editIcon}>
              <Ionicons name="pencil" size={16} color={mono.paper} />
            </View>
          </Pressable>

          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              HESAP
            </AppText>
            <View style={styles.menuCard}>
              <MenuRow
                icon="person-outline"
                label="Profil bilgileri"
                description="Görünen adın ve e-posta adresin"
                onPress={() => router.push('/settings')}
              />
              <View style={styles.divider} />
              <MenuRow
                icon="lock-closed-outline"
                label="Güvenlik"
                description="Şifre değiştir ve oturumlarını yönet"
                onPress={() => router.push('/settings/security' as never)}
              />
              <View style={styles.divider} />
              <MenuRow
                icon="notifications-outline"
                label="Bildirimler"
                description="Telefon ve partner bildirimleri"
                onPress={() => router.push('/notifications')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              WE DO
            </AppText>
            <View style={styles.menuCard}>
              <MenuRow
                icon="layers-outline"
                label="Alanlarımı yönet"
                description={`${activeSpaceCount} aktif alan`}
                onPress={() => router.push('/space/manage')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              BİLGİ VE DESTEK
            </AppText>
            <View style={styles.menuCard}>
              <MenuRow
                icon="shield-checkmark-outline"
                label="Gizlilik"
                description="Verilerin ve alanların nasıl korunuyor"
                onPress={() => router.push('/settings/privacy' as never)}
              />
              <View style={styles.divider} />
              <MenuRow
                icon="help-circle-outline"
                label="Yardım ve kullanım"
                description="WeDo’yu birlikte kullanma rehberi"
                onPress={() => router.push('/settings/help' as never)}
              />
            </View>
          </View>

          <View style={styles.menuCard}>
            <MenuRow
              icon="log-out-outline"
              label="Tüm cihazlardan çıkış yap"
              onPress={confirmSignOut}
              tone="danger"
            />
          </View>
        </View>
      </Screen>
    </ScreenMotion>
  );
}

const styles = StyleSheet.create({
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
  contourBottom: {
    position: 'absolute',
    bottom: -180,
    left: -190,
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: 126,
  },
  pageHeader: { gap: spacing.xs, paddingTop: spacing.xs },
  title: { fontWeight: '800' },
  subtitle: { fontSize: 14 },
  profileCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    ...Platform.select({ web: { boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)' } }),
  },
  identity: { flex: 1, gap: 3 },
  profileStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  profileStatusText: { fontSize: 11, fontWeight: '700' },
  editIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    marginLeft: spacing.xs,
    color: mono.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  menuCard: {
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    ...Platform.select({ web: { boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)' } }),
  },
  row: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  rowIconDanger: { backgroundColor: '#F4E1DF' },
  rowCopy: { flex: 1, gap: 2 },
  rowDescription: { fontSize: 11, lineHeight: 15 },
  divider: { height: 1, backgroundColor: mono.line, opacity: 0.3 },
  dangerText: { color: mono.danger },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
});
