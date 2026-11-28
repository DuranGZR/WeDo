import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountRow,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { colors, spacing } from '@/design-system';
import { useAuthStore } from '@/store/auth-store';

export default function SecurityScreen() {
  useTranslation();
  const { signOut } = useAuthStore();

  const signOutEverywhere = () =>
    Alert.alert(
      t('settings.signOutOfAllDevices'),
      t('settings.thisWillEndAllActiveWedoSessionsIncludingThisDevice'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOutEverywhere'),
          style: 'destructive',
          onPress: () => void signOut().then(() => router.replace('/(auth)/sign-in')),
        },
      ],
    );

  return (
    <AccountScaffold
      title={t('home.security')}
      subtitle={t('settings.youReInControlOfWhoCanAccessYourAccount')}
    >
      <AccountCard>
        <View style={styles.securityLead}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={colors.onAccent} />
          </View>
          <View style={styles.leadCopy}>
            <AppText variant="sectionTitle">
              {t('settings.yourAccountIsProtected')}
            </AppText>
            <AppText muted style={accountStyles.note}>
              {t('settings.yourCurrentPasswordIsRequiredForSensitiveChangesWhichAlso')}
            </AppText>
          </View>
        </View>
      </AccountCard>

      <AccountCard>
        <AccountRow
          icon="key-outline"
          title={t('settings.changeMyPassword')}
          description={t('settings.chooseANewPasswordThenSignInAgain')}
          onPress={() => router.push('/settings/password' as never)}
        />
      </AccountCard>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          {t('settings.sessions')}
        </AppText>
        <AppText muted style={accountStyles.note}>
          {t('settings.lostYourPhoneOrSignedInOnASharedDevice')}
        </AppText>
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('home.signOutOfAllDevices')}
          haptic="warning"
          onPress={signOutEverywhere}
          style={accountStyles.secondaryButton}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.primaryText} />
          <AppText style={accountStyles.secondaryButtonText}>
            {t('home.signOutOfAllDevices')}
          </AppText>
        </SpringPressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  securityLead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadCopy: { flex: 1, gap: spacing.xs },
});
