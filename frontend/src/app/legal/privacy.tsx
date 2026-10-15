import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { mono, radius, spacing } from '@/design-system';

export default function LegalPrivacyScreen() {
  return (
    <Screen scroll={true} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <AppText variant="screenTitle" style={styles.title}>
            Gizlilik Politikası
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
          Son Güncelleme: 15 Ekim 2026
        </AppText>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            1. Genel Bakış ve Taahhüdümüz
          </AppText>
          <AppText style={styles.paragraph}>
            WeDo (&quot;Uygulama&quot;), birlikte içerik kaydetmek, planlamak ve ortak kararlar almak
            isteyen kullanıcılar için tasarlanmış özel bir alandır. WeDo herkese açık bir sosyal ağ
            değildir. Gizliliğinize ve kişisel verilerinizin korunmasına en üst düzeyde önem veririz.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            2. Toplanan Bilgiler
          </AppText>
          <AppText style={styles.paragraph}>
            Uygulamayı kullanırken toplanan veriler şunlardır:
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>Hesap Bilgileri:</AppText> E-posta adresi, görünen ad ve
            şifreli hesaplar için şifre özeti (hash). E-posta ile kayıtta adres doğrulaması için
            süreli kod gönderilir; kodun güvenli özeti ve deneme bilgileri sunucuda tutulur.
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>Apple ile Giriş:</AppText> Apple kimliğiyle oturum açıldığında,
            Apple tarafından sağlanan anonim kullanıcı kimliği ve seçiminize bağlı olarak e-posta/ad bilgisi.
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>Google ile Giriş:</AppText> Google kullanıcı kimliği,
            doğrulanmış e-posta adresi ve profil adı hesap oluşturma ve oturum doğrulama için
            kullanılır. Google şifreniz alınmaz; Gmail, Drive veya Takvim erişimi istenmez.
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>Destek ve Silme Talepleri:</AppText> Formda paylaştığınız
            e-posta ve açıklama destek posta kutusuna iletilir; talebin değerlendirilmesi ve
            hesap sahipliğinin doğrulanması için kullanılır.
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>Ortak İçerikler:</AppText> Kaydettiğiniz bağlantılar,
            notlar, oluşturduğunuz listeler, oylar ve ortak alanlara eklediğiniz anı fotoğrafları.
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>Cihaz ve Bildirim Verileri:</AppText> Yalnızca ortak alanınızdaki
            etkinliklerden haberdar olmanız için bildirim belirteçleri (push tokens).
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            3. İzinler (Kamera ve Galeri)
          </AppText>
          <AppText style={styles.paragraph}>
            Uygulama, ortak anılarınıza veya kayıtlarınıza fotoğraf ekleyebilmeniz için Fotoğraf Galerisi
            ve Kamera erişim izni talep eder. Bu izinler yalnızca sizin açık seçiminizle içerik eklemek
            için kullanılır; arka planda otomatik tarama yapılmaz.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            4. Veri Paylaşımı ve Üçüncü Taraflar
          </AppText>
          <AppText style={styles.paragraph}>
            WeDo, kişisel verilerinizi reklam verenlere veya üçüncü taraf veri simsarlarına kesinlikle
            satmaz veya kiralamaz. Ortak içerikleriniz açıkça davet ettiğiniz alan üyeleriyle
            paylaşılır. Seçtiğiniz giriş yönteminde Google veya Apple kimlik doğrulama hizmetleri
            kullanılır. Web destek taleplerindeki e-posta ve açıklama, Resend üzerinden Google
            Workspace destek posta kutusuna iletilir.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            5. Hesap ve Veri Silme Hakkı (Apple Standardı)
          </AppText>
          <AppText style={styles.paragraph}>
            Apple App Store kuralları ve veri koruma yasaları uyarınca, hesabınızı ve ilişkili tüm
            verilerinizi istediğiniz zaman doğrudan uygulama içinden (Ayarlar &gt; Hesabı Sil) kalıcı
            olarak silebilirsiniz. Apple ile oturum açan kullanıcılar için herhangi bir şifre gerekmez;
            onay vermeniz halinde tüm açık oturumlarınız ve kimlik bilgileriniz derhal silinir.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            6. İletişim
          </AppText>
          <AppText style={styles.paragraph}>
            Gizlilik politikamızla ilgili soru, talep veya geri bildirimleriniz için bize{' '}
            <AppText style={styles.bold}>contact@durangezer.com</AppText> adresinden ulaşabilirsiniz.
          </AppText>
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
    fontSize: 26,
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
  pressed: {
    opacity: 0.7,
  },
});
