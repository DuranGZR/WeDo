import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { AppText, TextField } from '@/components/ui';
import {
  AccountCard,
  AccountRow,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { mono, spacing } from '@/design-system';
import { useAuthStore } from '@/store/auth-store';

export default function SettingsScreen() {
  const { user, updateProfile } = useAuthStore();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setDisplayName(user?.display_name ?? ''), [user?.display_name]);

  const isDirty = displayName.trim() !== (user?.display_name ?? '');
  const saveProfile = async () => {
    if (displayName.trim().length < 2) {
      showToast({
        title: 'Adını kontrol et',
        message: 'Görünen ad en az 2 karakter olmalı.',
      });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ displayName });
      showToast({ title: 'Profil güncellendi', message: 'Görünen adın kaydedildi.' });
    } catch (error) {
      showToast({
        title: 'Kaydedilemedi',
        message: error instanceof Error ? error.message : 'Lütfen tekrar dene.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountScaffold
      title="Hesap ayarları"
      subtitle="Kimliğini, güvenliğini ve tercihlerini yönet."
    >
      <AccountCard>
        <View style={styles.identityHeader}>
          <View style={styles.initialAvatar}>
            <AppText style={styles.initialText}>
              {user?.display_name?.trim().charAt(0).toUpperCase() ?? 'W'}
            </AppText>
          </View>
          <View style={styles.identityCopy}>
            <AppText variant="sectionTitle">Profilin</AppText>
            <AppText muted style={styles.identityHint}>
              WeDo’da yalnızca baş harfin görünür.
            </AppText>
          </View>
        </View>
        <TextField
          label="Görünen ad"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          maxLength={80}
          placeholder="Adın"
          returnKeyType="done"
        />
        <View style={styles.emailBox}>
          <Ionicons name="mail-outline" size={18} color={mono.ink} />
          <View style={styles.emailCopy}>
            <AppText variant="caption" muted>
              E-posta adresi
            </AppText>
            <AppText numberOfLines={1}>{user?.email ?? '—'}</AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil değişikliklerini kaydet"
          disabled={!isDirty || saving}
          onPress={() => void saveProfile()}
          style={({ pressed }) => [
            accountStyles.primaryButton,
            (!isDirty || saving) && styles.disabledButton,
            (pressed || saving) && accountStyles.pressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={mono.paper} />
          ) : (
            <Ionicons name="checkmark" size={19} color={mono.paper} />
          )}
          <AppText style={accountStyles.primaryButtonText}>
            {isDirty ? 'Değişiklikleri kaydet' : 'Değişiklikler kaydedildi'}
          </AppText>
        </Pressable>
      </AccountCard>

      <View style={styles.sectionGroup}>
        <AppText variant="caption" style={accountStyles.label}>
          HESAP VE GÜVENLİK
        </AppText>
        <AccountCard>
          <AccountRow
            icon="lock-closed-outline"
            title="Şifre ve oturumlar"
            description="Şifreni değiştir veya tüm cihazlardan çıkış yap"
            onPress={() => router.push('/settings/security' as never)}
          />
          <View style={accountStyles.divider} />
          <AccountRow
            icon="notifications-outline"
            title="Bildirimler"
            description="Partner ve telefon bildirimlerini yönet"
            onPress={() => router.push('/notifications')}
          />
        </AccountCard>
      </View>

      <View style={styles.sectionGroup}>
        <AppText variant="caption" style={accountStyles.label}>
          BİLGİ VE DESTEK
        </AppText>
        <AccountCard>
          <AccountRow
            icon="shield-checkmark-outline"
            title="Gizlilik"
            description="Verilerin ve ortak alanların nasıl korunduğu"
            onPress={() => router.push('/settings/privacy' as never)}
          />
          <View style={accountStyles.divider} />
          <AccountRow
            icon="help-circle-outline"
            title="Yardım ve kullanım"
            description="WeDo’yu birlikte kullanma rehberi"
            onPress={() => router.push('/settings/help' as never)}
          />
        </AccountCard>
      </View>

      <View style={styles.sectionGroup}>
        <AppText variant="caption" style={accountStyles.label}>
          HESAP İŞLEMLERİ
        </AppText>
        <AccountCard danger>
          <AccountRow
            icon="trash-outline"
            title="Hesabı sil"
            description="Şifre onayıyla kalıcı olarak devre dışı bırak"
            onPress={() => router.push('/settings/delete-account' as never)}
            danger
          />
        </AccountCard>
      </View>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  identityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  initialAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: { color: mono.paper, fontSize: 22, fontWeight: '800' },
  identityCopy: { flex: 1, gap: 2 },
  identityHint: { fontSize: 12, lineHeight: 17 },
  emailBox: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.line,
    backgroundColor: mono.soft,
  },
  emailCopy: { flex: 1, gap: 1 },
  disabledButton: { opacity: 0.48 },
  sectionGroup: { gap: spacing.sm },
});
