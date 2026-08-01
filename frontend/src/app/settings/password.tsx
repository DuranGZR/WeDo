import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { AppText } from '@/components/ui';
import { mono, spacing } from '@/design-system';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { PasswordField } from '@/features/auth/PasswordField';
import { isStrongPassword } from '@/features/auth/password-strength';
import { useAuthStore } from '@/store/auth-store';

export default function ChangePasswordScreen() {
  const { changePassword } = useAuthStore();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (newPassword !== confirmation) {
      showToast({
        title: 'Şifreler eşleşmiyor',
        message: 'Yeni şifreni iki alanda da aynı gir.',
      });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      showToast({
        title: 'Daha güçlü bir şifre seç',
        message: 'En az 8 karakter; büyük harf, küçük harf ve rakam kullan.',
      });
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast({
        title: 'Şifren değiştirildi',
        message: 'Güvenlik için tüm oturumların kapatıldı.',
      });
      router.replace('/(auth)/sign-in');
    } catch (error) {
      showToast({
        title: 'Şifre değiştirilemedi',
        message: error instanceof Error ? error.message : 'Tekrar dene.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountScaffold
      title="Şifreyi değiştir"
      subtitle="Yeni şifrenle tüm cihazlarda tekrar giriş yapacaksın."
    >
      <AccountCard>
        <PasswordField
          label="Mevcut şifre"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          autoComplete="current-password"
          textContentType="password"
        />
        <PasswordField
          label="Yeni şifre"
          value={newPassword}
          onChangeText={setNewPassword}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <PasswordField
          label="Yeni şifre tekrar"
          value={confirmation}
          onChangeText={setConfirmation}
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={() => void submit()}
        />
        <View style={styles.ruleBox}>
          <Ionicons name="information-circle-outline" size={17} color={mono.ink} />
          <AppText muted style={styles.ruleText}>
            En az 8 karakter; büyük harf, küçük harf ve rakam kullan. Eski şifreni tekrar
            kullanamazsın.
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Şifreyi değiştir"
          disabled={saving}
          onPress={() => void submit()}
          style={({ pressed }) => [
            accountStyles.primaryButton,
            (pressed || saving) && accountStyles.pressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={mono.paper} />
          ) : (
            <Ionicons name="key" size={18} color={mono.paper} />
          )}
          <AppText style={accountStyles.primaryButtonText}>Şifreyi değiştir</AppText>
        </Pressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  ruleBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: mono.soft,
  },
  ruleText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
