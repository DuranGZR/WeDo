import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/components/motion/ScreenMotion';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, Avatar, Screen } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
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
  useTranslation();
  const danger = tone === 'danger';
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      pressScale={0.985}
      haptic="selection"
      onPress={onPress}
      style={styles.row}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons
          name={icon}
          size={19}
          color={danger ? colors.error : colors.primaryText}
        />
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
        color={danger ? colors.error : colors.tertiaryText}
      />
    </SpringPressable>
  );
}

export default function ProfileScreen() {
  useTranslation();
  const { user, signOut } = useAuthStore();
  const spaces = useSpaces();
  const activeSpaceCount = spaces.data?.data.length ?? 0;

  const confirmSignOut = () =>
    Alert.alert(
      t('home.signOut'),
      t('home.thisWillSignYouOutOfEveryWedoSessionIncluding'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.signOut_8d1ab'),
          style: 'destructive',
          onPress: () => void signOut().then(() => router.replace('/(auth)/sign-in')),
        },
      ],
    );

  return (
    <ScreenMotion>
      <Screen scroll edges={['top']}>
        <View style={styles.content}>
          <View style={styles.pageHeader}>
            <AppText variant="largeTitle" style={styles.title}>
              {t('common.profile')}
            </AppText>
            <AppText muted style={styles.subtitle}>
              {t('home.manageYourAccountAndYourWedoExperience')}
            </AppText>
          </View>

          <SpringPressable
            accessibilityRole="button"
            accessibilityLabel={t('home.editProfile')}
            pressScale={0.98}
            haptic="selection"
            onPress={() => router.push('/settings')}
            style={styles.profileCard}
          >
            <Avatar name={user?.display_name} size={62} />
            <View style={styles.identity}>
              <AppText variant="sectionTitle">
                {user?.display_name ?? t('home.wedoUser')}
              </AppText>
              <AppText muted numberOfLines={1}>
                {user?.email}
              </AppText>
              <View style={styles.profileStatus}>
                <Ionicons name="person-outline" size={13} color={colors.secondaryText} />
                <AppText style={styles.profileStatusText}>
                  {t('home.initialAvatar')}
                </AppText>
              </View>
            </View>
            <View style={styles.editIcon}>
              <Ionicons name="pencil" size={16} color={colors.primaryText} />
            </View>
          </SpringPressable>

          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              {t('home.account')}
            </AppText>
            <View style={styles.menuCard}>
              <MenuRow
                icon="person-outline"
                label={t('home.profileDetails')}
                description={t('home.yourDisplayNameAndEmailAddress')}
                onPress={() => router.push('/settings')}
              />
              <View style={styles.divider} />
              <MenuRow
                icon="lock-closed-outline"
                label={t('home.security')}
                description={t('home.changeYourPasswordAndManageSessions')}
                onPress={() => router.push('/settings/security' as never)}
              />
              <View style={styles.divider} />
              <MenuRow
                icon="notifications-outline"
                label={t('common.notifications')}
                description={t('home.phoneAndPartnerNotifications')}
                onPress={() => router.push('/notifications')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              {t('home.weDo')}
            </AppText>
            <View style={styles.menuCard}>
              <MenuRow
                icon="layers-outline"
                label={t('home.manageMySpaces')}
                description={t('spaces.activeCount', { count: activeSpaceCount })}
                onPress={() => router.push('/space/manage')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              {t('home.helpInformation')}
            </AppText>
            <View style={styles.menuCard}>
              <MenuRow
                icon="shield-checkmark-outline"
                label={t('common.privacy')}
                description={t('home.howYourDataAndSpacesAreProtected')}
                onPress={() => router.push('/settings/privacy' as never)}
              />
              <View style={styles.divider} />
              <MenuRow
                icon="help-circle-outline"
                label={t('home.helpGettingStarted')}
                description={t('home.yourGuideToUsingWedoTogether')}
                onPress={() => router.push('/settings/help' as never)}
              />
            </View>
          </View>

          <View style={styles.menuCard}>
            <MenuRow
              icon="log-out-outline"
              label={t('home.signOutOfAllDevices')}
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
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: 108,
  },
  pageHeader: { gap: spacing.xs, paddingTop: spacing.xs },
  title: { fontWeight: '700' },
  subtitle: { fontSize: 14, color: colors.secondaryText },
  profileCard: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    ...shadows.card,
  },
  identity: { flex: 1, gap: 3 },
  profileStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  profileStatusText: { fontSize: 11, fontWeight: '600', color: colors.secondaryText },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassElevated,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.glass,
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    marginLeft: spacing.xs,
    color: colors.secondaryText,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  menuCard: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    ...shadows.card,
  },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  rowIconDanger: { backgroundColor: colors.errorSoft },
  rowCopy: { flex: 1, gap: 2 },
  rowDescription: { fontSize: 12, lineHeight: 16 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(17, 17, 16, 0.06)',
    marginLeft: 38 + spacing.md,
  },
  dangerText: { color: colors.error },
});
