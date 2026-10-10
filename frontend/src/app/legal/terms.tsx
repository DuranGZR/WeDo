import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { mono, radius, spacing } from '@/design-system';

export default function LegalTermsScreen() {
  return (
    <Screen scroll={true} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <AppText variant="screenTitle" style={styles.title}>
            Kullanım Koşulları ve EULA
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={22} color={mono.ink} />
          </Pressable>
        </View>
        <AppText muted style={styles.date}>
          Son Güncelleme: 1 Ocak 2026
        </AppText>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            1. Sözleşmenin Kabulü
          </AppText>
          <AppText style={styles.paragraph}>
            WeDo uygulamasını indirerek, hesap oluşturarak veya kullanarak bu Kullanım Koşulları
            ve Son Kullanıcı Lisans Sözleşmesi&apos;ni (EULA) kabul etmiş sayılırsınız. Şartları kabul
            etmiyorsanız lütfen uygulamayı kullanmayınız.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            2. Kullanıcı İçeriği ve Sıfır Tolerans Politikası (Apple Standardı)
          </AppText>
          <AppText style={styles.paragraph}>
            WeDo, kullanıcıların ortak alanlarda bağlantı, not, fotoğraf ve liste paylaşmasına olanak tanır.
            Uygulamamızda sakıncalı içeriğe ve kötü niyetli kullanıcılara karşı <AppText style={styles.bold}>SIFIR TOLERANS</AppText> politikası uygulanmaktadır.
          </AppText>
          <AppText style={styles.paragraph}>
            Aşağıdaki nitelikteki içeriklerin paylaşılması kesinlikle yasaktır:
          </AppText>
          <AppText style={styles.bullet}>
            • Taciz, nefret söylemi, ayrımcılık veya tehdit içeren paylaşımlar.
          </AppText>
          <AppText style={styles.bullet}>
            • Müstehcen, pornografik veya şiddet içerikli görseller ve metinler.
          </AppText>
          <AppText style={styles.bullet}>
            • Başkalarının telif haklarını veya fikri mülkiyetini ihlal eden materyaller.
          </AppText>
          <AppText style={styles.bullet}>
            • Yasa dışı faaliyetleri teşvik eden içerikler.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            3. Şikayet ve Denetim Mekanizması
          </AppText>
          <AppText style={styles.paragraph}>
            Herhangi bir uygunsuz içerik veya rahatsız edici kullanıcı davranışı ile karşılaşırsanız,
            uygulama içindeki Yardım menüsünden veya doğrudan <AppText style={styles.bold}>destek@wedo.app</AppText> adresinden bildirimde bulunabilirsiniz.
            Şikayet edilen içerikler en geç 24 saat içinde incelenir, sakıncalı içerikler kaldırılır ve kural ihlali yapan kullanıcıların hesapları askıya alınır veya kalıcı olarak sonlandırılır.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            4. Hesap Güvenliği ve Fesih
          </AppText>
          <AppText style={styles.paragraph}>
            Kullanıcılar hesap güvenliklerinden sorumludur. Hesabınızı dilediğiniz zaman Ayarlar &gt; Hesabı Sil bölümünden tamamen kapatabilirsiniz. Koşulları ihlal eden hesapları önceden bildirmeksizin durdurma veya silme hakkımız saklıdır.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            5. Destek ve İletişim
          </AppText>
          <AppText style={styles.paragraph}>
            Kullanım koşulları veya destek ile ilgili her türlü konuyu görüşmek için:
          </AppText>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL('mailto:destek@wedo.app?subject=WeDo%20Kullanim%20Kosullari%20ve%20Destek')}
            style={({ pressed }) => [styles.emailLink, pressed && styles.pressed]}
          >
            <Ionicons name="mail-outline" size={17} color={mono.ink} />
            <AppText style={styles.emailText}>destek@wedo.app</AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: mono.background,
  },
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: mono.ink,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: mono.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontSize: 13,
  },
  content: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: mono.ink,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: mono.muted,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 21,
    color: mono.muted,
    paddingLeft: spacing.xs,
  },
  bold: {
    fontWeight: '700',
    color: mono.ink,
  },
  emailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: mono.ink,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
