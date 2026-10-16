import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { AppText } from '@/components/ui';
import { mono, spacing } from '@/design-system';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { PasswordField } from '@/features/auth/PasswordField';
import { useAuthStore } from '@/store/auth-store';

export default function DeleteAccountScreen() {
  useTranslation();
  const { user, deleteAccount } = useAuthStore();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const hasPassword = user?.has_password ?? true;

  const removeAccount = () =>
    Alert.alert(
      t('settings.permanentlyDeleteYourAccount'),
      t('settings.thisCanTBeUndoneYouWonTBeAble'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccount'),
          style: 'destructive',
          onPress: () => void submit(),
        },
      ],
    );

  const submit = async () => {
    if (hasPassword && !password) {
      showToast({
        title: t('settings.passwordRequired'),
        message: t('settings.enterYourCurrentPasswordToDeleteYourAccount'),
      });
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount(hasPassword ? password : undefined);
      showToast({
        title: t('settings.accountDeactivated'),
        message: t('settings.youVeBeenSignedOutOfAllSessions'),
      });
      router.replace('/(auth)/welcome');
    } catch (error) {
      showToast({
        title: t('settings.couldnTDeleteAccount'),
        message: error instanceof Error ? error.message : t('common.tryAgainShort'),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AccountScaffold
      title={t('settings.deleteAccount')}
      subtitle={t('settings.thisCanTBeUndonePleaseReadCarefullyBeforeContinuing')}
    >
      <AccountCard danger>
        <View style={styles.warningTitle}>
          <Ionicons name="warning-outline" size={23} color={mono.danger} />
          <AppText variant="sectionTitle" style={styles.dangerText}>
            {t('settings.permanentAction')}
          </AppText>
        </View>
        <AppText muted style={styles.copy}>
          {t('settings.accountDeletionExplanation')}
        </AppText>
        {hasPassword ? (
          <PasswordField
            label={t('settings.currentPassword')}
            value={password}
            onChangeText={setPassword}
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={removeAccount}
          />
        ) : (
          <View style={styles.appleNotice}>
            <Ionicons name="logo-apple" size={18} color={mono.ink} />
            <AppText style={styles.appleNoticeText}>
              {t('settings.thisAccountUsesGoogleOrAppleSignInNoPassword')}
            </AppText>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.permanentlyDeleteAccount')}
          disabled={deleting}
          onPress={removeAccount}
          style={({ pressed }) => [
            accountStyles.secondaryButton,
            accountStyles.dangerButton,
            (pressed || deleting) && accountStyles.pressed,
          ]}
        >
          {deleting ? (
            <ActivityIndicator color={mono.danger} />
          ) : (
            <Ionicons name="trash-outline" size={18} color={mono.danger} />
          )}
          <AppText
            style={[accountStyles.secondaryButtonText, accountStyles.dangerButtonText]}
          >
            {t('settings.permanentlyDeleteAccount')}
          </AppText>
        </Pressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  warningTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dangerText: { color: mono.danger },
  copy: { fontSize: 13, lineHeight: 19 },
  appleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: mono.soft,
  },
  appleNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: mono.ink,
    fontWeight: '600',
  },
});
