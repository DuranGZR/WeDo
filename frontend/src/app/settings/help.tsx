import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { mono, spacing } from '@/design-system';

const topics = [
  {
    title: 'WeDo ne işe yarar?',
    text: 'Gördüğün bir bağlantıyı ortak alanına kaydedersin. Sonra birlikte karar verir, tamamlandığında işaretlersiniz.',
  },
  {
    title: 'Birini nasıl davet ederim?',
    text: 'Ana sayfadaki “Partnerini davet et” kartından davet bağlantısını paylaş. Bağlantıyı açan kişi hesap açtıktan sonra alana katılır.',
  },
  {
    title: 'Bağlantı nasıl eklenir?',
    text: 'İstediğin uygulamada Paylaş’a basıp WeDo’yu seçebilirsin. İstersen bir listenin içinden “Bağlantı Ekle” ile de ekleyebilirsin.',
  },
  {
    title: 'Bir kaydı tamamlandı olarak nasıl işaretlerim?',
    text: 'Liste içindeki kayda dokun ve tamamlandı durumunu seç. Böylece ortak listenizde neyi gerçekten yaptığınızı takip edersiniz.',
  },
];

function HelpTopic({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen((value) => !value)}
      style={({ pressed }) => [styles.topic, pressed && styles.pressed]}
    >
      <View style={styles.topicHeader}>
        <AppText style={styles.topicTitle}>{title}</AppText>
        <Ionicons name={open ? 'remove' : 'add'} size={20} color={mono.ink} />
      </View>
      {open ? (
        <AppText muted style={styles.topicText}>
          {text}
        </AppText>
      ) : null}
    </Pressable>
  );
}

export default function HelpScreen() {
  return (
    <AccountScaffold title="Yardım & Destek" subtitle="WeDo’yu birlikte kullanmanın en kısa yolu.">
      <AccountCard>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={25} color={mono.paper} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="sectionTitle">Birlikte karar verin</AppText>
            <AppText muted style={styles.heroText}>
              Kaydet, paylaş, seç ve tamamla.
            </AppText>
          </View>
        </View>
      </AccountCard>

      <View style={styles.topics}>
        {topics.map((topic) => (
          <HelpTopic key={topic.title} {...topic} />
        ))}
      </View>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          İLETİŞİM & DESTEK
        </AppText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Destek e-postası gönder"
          onPress={() => void Linking.openURL('mailto:destek@wedo.app')}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="mail-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>destek@wedo.app</AppText>
          </View>
          <Ionicons name="open-outline" size={16} color={mono.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Uygunsuz içerik veya kullanıcı bildirimi"
          onPress={() =>
            void Linking.openURL(
              'mailto:destek@wedo.app?subject=WeDo%20Uygunsuz%20Icerik%20ve%20Kullanici%20Bildirimi'
            )
          }
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="flag-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>İçerik / Kullanıcı Şikayet Et</AppText>
          </View>
          <Ionicons name="open-outline" size={16} color={mono.muted} />
        </Pressable>
      </AccountCard>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          YASAL
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gizlilik Politikası sayfasını aç"
          onPress={() => router.push('/legal/privacy' as never)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="document-text-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>Gizlilik Politikası</AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={mono.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kullanım Koşulları ve EULA sayfasını aç"
          onPress={() => router.push('/legal/terms' as never)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="shield-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>Kullanım Koşulları ve EULA</AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={mono.muted} />
        </Pressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  heroCopy: { flex: 1, gap: 2 },
  heroText: { fontSize: 13 },
  topics: { gap: spacing.sm },
  topic: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: mono.ink,
    borderRadius: 14,
    backgroundColor: mono.paper,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  topicTitle: { flex: 1, fontWeight: '800' },
  topicText: { fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.84 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: mono.ink,
  },
});
