import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { AppText, Screen, TextField } from '@/components/ui';
import { mono, spacing } from '@/design-system';
import { useAuthStore } from '@/store/auth-store';

export default function SettingsScreen() {
  const { user, updateProfile, deleteAccount } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [partnerNotifications, setPartnerNotifications] = useState(
    user?.notify_partner_activity ?? true,
  );
  const [pushNotifications, setPushNotifications] = useState(
    user?.push_notifications_enabled ?? true,
  );

  useEffect(() => {
    setDisplayName(user?.display_name ?? '');
    setAvatarUrl(user?.avatar_url ?? '');
    setPartnerNotifications(user?.notify_partner_activity ?? true);
    setPushNotifications(user?.push_notifications_enabled ?? true);
  }, [
    user?.display_name,
    user?.avatar_url,
    user?.notify_partner_activity,
    user?.push_notifications_enabled,
  ]);

  const saveProfile = async () => {
    if (displayName.trim().length < 2) {
      Alert.alert('Adını kontrol et', 'Görünen ad en az 2 karakter olmalı.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        displayName,
        avatarUrl,
        notifyPartnerActivity: partnerNotifications,
        pushNotificationsEnabled: pushNotifications,
      });
      Alert.alert('Kaydedildi', 'Profil bilgilerin güncellendi.');
    } catch (error) {
      Alert.alert(
        'Kaydedilemedi',
        error instanceof Error ? error.message : 'Tekrar deneyin.',
      );
    } finally {
      setSaving(false);
    }
  };
  const saveNotificationPreference = async (kind: 'partner' | 'push', value: boolean) => {
    if (kind === 'partner') setPartnerNotifications(value);
    else setPushNotifications(value);
    try {
      await updateProfile({
        displayName,
        avatarUrl,
        notifyPartnerActivity: kind === 'partner' ? value : partnerNotifications,
        pushNotificationsEnabled: kind === 'push' ? value : pushNotifications,
      });
    } catch {
      if (kind === 'partner') setPartnerNotifications(!value);
      else setPushNotifications(!value);
      Alert.alert('Kaydedilemedi', 'Bildirim ayarın güncellenemedi.');
    }
  };

  const confirmDelete = () =>
    Alert.alert('Hesabı sil?', 'Bu işlem hesabını devre dışı bırakır ve geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Hesabı sil',
        style: 'destructive',
        onPress: () =>
          void deleteAccount()
            .then(() => router.replace('/(auth)/sign-in'))
            .catch(() => Alert.alert('İşlem tamamlanamadı', 'Lütfen tekrar dene.')),
      },
    ]);

  return (
    <Screen scroll={true} backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={mono.ink} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <AppText variant="pageTitle">Ayarlar</AppText>
        <AppText muted style={styles.intro}>
          Hesabını ve WeDo deneyimini yönet.
        </AppText>
        <View style={[styles.glassCard, styles.section]}>
          <View style={styles.sectionHeading}>
            <Ionicons name="person-outline" size={18} color={mono.paper} />
            <AppText variant="sectionTitle">Profil bilgileri</AppText>
          </View>
          <TextField
            label="Görünen ad"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Adın"
          />
          <TextField
            label="Profil görseli bağlantısı"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            autoCapitalize="none"
            placeholder="https://..."
          />
          <View style={styles.emailInfo}>
            <Ionicons name="mail-outline" size={17} color={mono.ink} />
            <View>
              <AppText variant="caption" style={styles.infoLabel}>
                E-posta
              </AppText>
              <AppText>{user?.email ?? '—'}</AppText>
            </View>
          </View>
          <Pressable
            onPress={() => void saveProfile()}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || saving) && styles.btnPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={mono.paper} />
            ) : (
              <>
                <AppText style={styles.primaryButtonText}>Değişiklikleri kaydet</AppText>
                <Ionicons name="checkmark" size={18} color={mono.paper} />
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [styles.rowButton, pressed && styles.btnPressed]}
          >
            <View style={styles.rowButtonIcon}>
              <Ionicons name="notifications-outline" size={18} color={mono.ink} />
            </View>
            <View style={styles.rowButtonBody}>
              <AppText>Bildirimler</AppText>
              <AppText variant="caption" muted>
                Güncellemelerini yönet
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={mono.ink} />
          </Pressable>
          <View style={styles.preferenceRow}>
            <View style={styles.rowButtonBody}>
              <AppText>Partner etkinlikleri</AppText>
              <AppText variant="caption" muted>
                Partnerin içerik eklediğinde haber ver
              </AppText>
            </View>
            <Switch
              value={partnerNotifications}
              onValueChange={(value) => void saveNotificationPreference('partner', value)}
            />
          </View>
          <View style={styles.preferenceRow}>
            <View style={styles.rowButtonBody}>
              <AppText>Anlık bildirimler</AppText>
              <AppText variant="caption" muted>
                Telefonuna bildirim gönder
              </AppText>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={(value) => void saveNotificationPreference('push', value)}
            />
          </View>
        </View>
        <View style={[styles.glassCard, styles.section]}>
          <View style={styles.sectionHeading}>
            <Ionicons name="shield-checkmark-outline" size={18} color={mono.paper} />
            <AppText variant="sectionTitle">Gizlilik</AppText>
          </View>
          <AppText muted>
            Alanların, listelerin ve içeriklerin varsayılan olarak özeldir.
          </AppText>
          <Pressable
            onPress={() =>
              Alert.alert(
                'Gizlilik',
                'Alanların, listelerin ve kayıtların yalnızca davet ettiğin kişilerle paylaşılır.',
              )
            }
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.btnPressed]}
          >
            <AppText style={styles.ghostBtnText}>Gizlilik hakkında</AppText>
          </Pressable>
        </View>
        <View style={[styles.glassCard, styles.section]}>
          <View style={styles.sectionHeading}>
            <Ionicons name="help-circle-outline" size={18} color={mono.paper} />
            <AppText variant="sectionTitle">Yardım</AppText>
          </View>
          <AppText muted>
            WeDo, birlikte kaydetmeyi ve gerçekten yapmayı kolaylaştırır.
          </AppText>
          <Pressable
            onPress={() =>
              Alert.alert(
                'Kullanım koşulları',
                'WeDo, birlikte kaydetmek ve karar vermek için tasarlanmıştır.',
              )
            }
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.btnPressed]}
          >
            <AppText style={styles.ghostBtnText}>Kullanım koşulları</AppText>
          </Pressable>
        </View>
        <View style={[styles.glassCard, styles.dangerSection]}>
          <AppText variant="sectionTitle">Hesap</AppText>
          <AppText muted>
            Hesabını silersen alanlarına ve kayıtlarına erişemezsin.
          </AppText>
          <Pressable
            onPress={confirmDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.btnPressed]}
          >
            <Ionicons name="trash-outline" size={18} color={mono.danger} />
            <AppText style={styles.deleteText}>Hesabı sil</AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles: any = StyleSheet.create({
  contourTop: {
    position: 'absolute',
    top: -150,
    right: -155,
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.75,
  },
  contourBottom: {
    position: 'absolute',
    bottom: -160,
    left: -185,
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.5,
  },
  headerBar: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mono.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: mono.ink,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
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
  intro: { marginVertical: spacing.md },
  section: { gap: spacing.md, marginBottom: spacing.md },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emailInfo: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: mono.ink,
    borderRadius: 10,
    backgroundColor: mono.soft,
  },
  infoLabel: { color: mono.muted, marginBottom: 2 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 11,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButtonText: { color: mono.paper, fontWeight: '800', fontSize: 14 },
  rowButton: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: mono.ink,
    borderRadius: 11,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  rowButtonBody: { flex: 1, gap: 2 },
  preferenceRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: mono.ink,
    borderRadius: 11,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  ghostBtn: {
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
  },
  ghostBtnText: {
    color: mono.ink,
    fontWeight: '600',
  },
  dangerSection: { gap: spacing.md, marginBottom: spacing.huge },
  deleteButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: mono.danger,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deleteText: { color: mono.danger, fontWeight: '800' },
});
