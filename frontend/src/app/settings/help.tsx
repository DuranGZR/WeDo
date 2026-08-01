import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
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
    <AccountScaffold title="Yardım" subtitle="WeDo’yu birlikte kullanmanın en kısa yolu.">
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
});
