import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountRow,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { mono, spacing } from '@/design-system';
import { useAuthStore } from '@/store/auth-store';

export default function SecurityScreen() {
  const { signOut } = useAuthStore();

  const signOutEverywhere = () =>
    Alert.alert(
      'Tüm cihazlardan çıkış yapılsın mı?',
      'Bu cihaz dahil açık olan tüm WeDo oturumların kapatılacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Tümünden çıkış yap',
          style: 'destructive',
          onPress: () => void signOut().then(() => router.replace('/(auth)/sign-in')),
        },
      ],
    );

  return (
    <AccountScaffold title="Güvenlik" subtitle="Hesabına erişimi sen kontrol et.">
      <AccountCard>
        <View style={styles.securityLead}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={mono.paper} />
          </View>
          <View style={styles.leadCopy}>
            <AppText variant="sectionTitle">Hesabın korumada</AppText>
            <AppText muted style={accountStyles.note}>
              Kritik değişikliklerde mevcut şifren istenir ve tüm oturumlar kapatılır.
            </AppText>
          </View>
        </View>
      </AccountCard>

      <AccountCard>
        <AccountRow
          icon="key-outline"
          title="Şifremi değiştir"
          description="Yeni şifreni belirle; ardından tekrar giriş yap"
          onPress={() => router.push('/settings/password' as never)}
        />
      </AccountCard>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          OTURUMLAR
        </AppText>
        <AppText muted style={accountStyles.note}>
          Telefonunu kaybedersen veya ortak olmayan bir cihazda giriş yaptıysan tüm
          erişimleri anında kapatabilirsin.
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tüm cihazlardan çıkış yap"
          onPress={signOutEverywhere}
          style={({ pressed }) => [
            accountStyles.secondaryButton,
            pressed && accountStyles.pressed,
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={mono.ink} />
          <AppText style={accountStyles.secondaryButtonText}>
            Tüm cihazlardan çıkış yap
          </AppText>
        </Pressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  securityLead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadCopy: { flex: 1, gap: spacing.xs },
});
