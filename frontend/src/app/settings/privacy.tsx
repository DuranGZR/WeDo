import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { mono, spacing } from '@/design-system';

const principles = [
  {
    icon: 'people-outline' as const,
    title: 'Alanların davetlidir',
    text: 'Bir alanı yalnızca sahibi ve açıkça davet edilen üyeler görebilir.',
  },
  {
    icon: 'link-outline' as const,
    title: 'Kayıtların korunur',
    text: 'Eklediğin bağlantılar, notlar ve tamamlanma durumu herkese açık değildir.',
  },
  {
    icon: 'key-outline' as const,
    title: 'Erişimini sen yönetirsin',
    text: 'Şifreni değiştirebilir veya tek işlemle tüm cihazlardaki oturumlarını kapatabilirsin.',
  },
];

export default function PrivacyScreen() {
  return (
    <AccountScaffold
      title="Gizlilik"
      subtitle="WeDo’daki ortak kararların senin kontrolünde kalır."
    >
      <AccountCard>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark" size={27} color={mono.paper} />
        </View>
        <AppText variant="sectionTitle">Varsayılan olarak özel</AppText>
        <AppText muted style={styles.intro}>
          WeDo bir açık sosyal ağ değildir. Alanların, listelerin ve kayıtların yalnızca
          seçtiğin kişilerle paylaşılır.
        </AppText>
      </AccountCard>

      <View style={styles.list}>
        {principles.map((principle) => (
          <AccountCard key={principle.title}>
            <View style={styles.itemHeader}>
              <View style={styles.itemIcon}>
                <Ionicons name={principle.icon} size={19} color={mono.ink} />
              </View>
              <AppText style={styles.itemTitle}>{principle.title}</AppText>
            </View>
            <AppText muted style={accountStyles.note}>
              {principle.text}
            </AppText>
          </AccountCard>
        ))}
      </View>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          VERİLERİN
        </AppText>
        <AppText muted style={accountStyles.note}>
          Profilinde yalnızca görünen adın ve e-posta adresin tutulur. Profil görseli
          yerine uygulama genelinde baş harfin kullanılır.
        </AppText>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  intro: { fontSize: 14, lineHeight: 20 },
  list: { gap: spacing.md },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  itemTitle: { fontWeight: '800' },
});
