import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Card, Screen } from '@/components/ui';
import { mono, spacing } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';

export default function InviteMemberScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const [sending, setSending] = useState(false);

  async function shareInvitation() {
    if (!spaceId) {
      Alert.alert('Alan bulunamadı', 'Davet oluşturmak için önce bir alan seç.');
      return;
    }
    setSending(true);
    try {
      const invitation = await collaborationApi.invite(spaceId);
      if (!invitation.invite_url) throw new Error('Davet bağlantısı oluşturulamadı.');
      await Share.share({
        message: `WeDo'da birlikte kaydedelim. Daveti kabul et: ${invitation.invite_url}`,
        url: invitation.invite_url,
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Davet gönderilemedi', 'Bağlantıyı kontrol edip tekrar dene.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Geri git"
      >
        <Ionicons name="arrow-back" size={22} color={mono.ink} />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Image
            source={require('../../../assets/TekLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <AppText variant="pageTitle" style={styles.title}>
            Partnerini davet et
          </AppText>
          <AppText muted style={styles.subtitle}>
            Davet bağlantısını seçtiğin uygulamadan paylaş. Partnerin kabul edince bu alan
            ortak olur.
          </AppText>
        </View>
        <Card style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="people-outline" size={26} color={mono.ink} />
          </View>
          <AppText variant="cardTitle">Tek kullanımlık davet</AppText>
          <AppText muted style={styles.cardCopy}>
            Bağlantı 7 gün geçerli olur ve yalnızca bir kişi katılabilir.
          </AppText>
          <Pressable
            onPress={() => void shareInvitation()}
            disabled={sending}
            style={[styles.primaryButton, sending && styles.disabled]}
          >
            {sending ? (
              <ActivityIndicator color={mono.paper} />
            ) : (
              <>
                <AppText style={styles.primaryText}>Davet bağlantısını paylaş</AppText>
                <Ionicons name="share-outline" size={18} color={mono.paper} />
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.secondaryButton}
          >
            <AppText style={styles.secondaryText}>Şimdilik geç</AppText>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.huge,
  },
  heading: { alignItems: 'center', gap: spacing.xs },
  logo: { width: 64, height: 64 },
  title: { fontSize: 25, fontWeight: '800', color: mono.ink, textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 20, color: mono.muted },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    ...Platform.select({ web: { boxShadow: '0px 7px 0px rgba(0,0,0,0.14)' } }),
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  cardCopy: { textAlign: 'center', lineHeight: 20 },
  primaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: mono.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryText: { color: mono.paper, fontWeight: '800' },
  secondaryButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: mono.ink, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
