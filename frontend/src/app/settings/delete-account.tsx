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
  const { user, deleteAccount } = useAuthStore();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const hasPassword = user?.has_password ?? true;

  const removeAccount = () =>
    Alert.alert(
      'Hesabı kalıcı olarak sil?',
      'Bu işlem geri alınamaz. Giriş yapamayacak ve hesabına erişemeyeceksin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabı sil',
          style: 'destructive',
          onPress: () => void submit(),
        },
      ],
    );

  const submit = async () => {
    if (hasPassword && !password) {
      showToast({
        title: 'Şifren gerekli',
        message: 'Hesabını silmek için mevcut şifreni gir.',
      });
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount(hasPassword ? password : undefined);
      showToast({
        title: 'Hesap devre dışı bırakıldı',
        message: 'Oturumların kapatıldı.',
      });
      router.replace('/(auth)/welcome');
    } catch (error) {
      showToast({
        title: 'Hesap silinemedi',
        message: error instanceof Error ? error.message : 'Tekrar dene.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AccountScaffold
      title="Hesabı sil"
      subtitle="Bu işlem geri alınamaz; devam etmeden önce dikkatlice oku."
    >
      <AccountCard danger>
        <View style={styles.warningTitle}>
          <Ionicons name="warning-outline" size={23} color={mono.danger} />
          <AppText variant="sectionTitle" style={styles.dangerText}>
            Kalıcı işlem
          </AppText>
        </View>
        <AppText muted style={styles.copy}>
          Hesabın devre dışı bırakılır, bütün açık oturumların kapatılır ve {"WeDo'ya"}{' '}
          tekrar erişemezsin.
        </AppText>
        {hasPassword ? (
          <PasswordField
            label="Mevcut şifre"
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
              Hesabınız Apple ile korunuyor. Silmek için şifre gerekmez.
            </AppText>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hesabı kalıcı olarak sil"
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
            Hesabı kalıcı olarak sil
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
