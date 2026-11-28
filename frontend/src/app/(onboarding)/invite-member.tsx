import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useOptionalToast } from '@/components/feedback/AppToast';
import { InviteQrSheet } from '@/components/invite/InviteQrSheet';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { AppText, BrandLogo, Card, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';
import { haptic } from '@/lib/haptics';
import { useSpaceStore } from '@/store/space-store';

export default function InviteMemberScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const toast = useOptionalToast();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const [sending, setSending] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<{ invite_url: string } | null>(null);

  function goToHome() {
    if (spaceId) {
      useSpaceStore.getState().setSelectedSpaceId(spaceId);
    }
    router.replace('/(tabs)');
  }

  async function ensureInviteUrl(): Promise<string | null> {
    if (!spaceId) {
      haptic.warning();
      Alert.alert(
        t('onboarding.spaceNotFound'),
        t('onboarding.chooseASpaceBeforeCreatingAnInvitation'),
      );
      return null;
    }
    if (createdInvite?.invite_url) return createdInvite.invite_url;
    const invitation = await collaborationApi.invite(spaceId);
    if (!invitation.invite_url) {
      throw new Error(t('onboarding.weCouldnTCreateAnInviteLink'));
    }
    setCreatedInvite({ invite_url: invitation.invite_url });
    return invitation.invite_url;
  }

  async function shareInvitation(fromModal = false) {
    setSending(true);
    try {
      const inviteUrl = await ensureInviteUrl();
      if (!inviteUrl) return;
      if (fromModal) {
        setQrVisible(false);
        await new Promise((resolve) => setTimeout(resolve, 220));
      }
      const message = t('sharing.inviteMessage', { value0: inviteUrl });
      await Share.share(
        Platform.OS === 'ios'
          ? {
              url: inviteUrl,
              message,
            }
          : {
              message,
            },
      );
      haptic.success();
      goToHome();
    } catch {
      haptic.error();
      Alert.alert(
        t('onboarding.couldnTShareInvitation'),
        t('common.checkTheLinkAndTryAgain'),
      );
    } finally {
      setSending(false);
    }
  }

  async function copyInvitation() {
    setSending(true);
    try {
      const inviteUrl = await ensureInviteUrl();
      if (!inviteUrl) return;
      await Clipboard.setStringAsync(inviteUrl);
      haptic.success();
      toast?.showToast({ type: 'success', title: t('invite.linkCopied') });
    } catch {
      haptic.error();
      Alert.alert(
        t('onboarding.couldnTShareInvitation'),
        t('common.checkTheLinkAndTryAgain'),
      );
    } finally {
      setSending(false);
    }
  }

  async function openQrSheet() {
    setSending(true);
    try {
      const inviteUrl = await ensureInviteUrl();
      if (!inviteUrl) return;
      setQrVisible(true);
    } catch {
      haptic.error();
      Alert.alert(
        t('onboarding.couldnTShareInvitation'),
        t('common.checkTheLinkAndTryAgain'),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen scroll={true}>
      <ScreenHeader
        backIcon="close"
        backLabel={t('onboarding.goToHome')}
        onBack={goToHome}
      />
      <View style={styles.content}>
        <OnboardingProgress step={3} total={4} />

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(260)}
          style={styles.heading}
        >
          <BrandLogo animated />
          <AppText variant="largeTitle" style={styles.title}>
            {t('onboarding.inviteYourPartner')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('onboarding.shareTheInviteLinkUsingAnyAppOnceYourPartner')}
          </AppText>
        </Animated.View>
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(90).duration(280)}
        >
          <Card style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name="people-outline" size={26} color="#9E7F60" />
            </View>
            <AppText variant="cardTitle">{t('onboarding.singleUseInvitation')}</AppText>
            <AppText muted style={styles.cardCopy}>
              {t('onboarding.theLinkIsValidFor7DaysAndCanBe')}
            </AppText>
            <SpringPressable
              accessibilityRole="button"
              haptic="medium"
              onPress={() => void shareInvitation()}
              disabled={sending}
              style={[styles.primaryButton, sending && styles.disabled]}
            >
              {sending ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <>
                  <AppText style={styles.primaryText}>
                    {t('onboarding.shareInviteLink')}
                  </AppText>
                  <Ionicons name="share-outline" size={18} color={colors.onAccent} />
                </>
              )}
            </SpringPressable>
            <View style={styles.quickActionRow}>
              <SpringPressable
                accessibilityRole="button"
                accessibilityLabel={t('invite.copyLink')}
                haptic="selection"
                disabled={sending}
                onPress={() => void copyInvitation()}
                style={[styles.quickActionPill, sending && styles.disabled]}
              >
                <Ionicons name="copy-outline" size={16} color="#5F4932" />
                <AppText style={styles.quickActionText}>{t('invite.copyLink')}</AppText>
              </SpringPressable>
              <SpringPressable
                accessibilityRole="button"
                accessibilityLabel={t('invite.showQr')}
                haptic="selection"
                disabled={sending}
                onPress={() => void openQrSheet()}
                style={[styles.quickActionPill, sending && styles.disabled]}
              >
                <Ionicons name="qr-code-outline" size={16} color="#5F4932" />
                <AppText style={styles.quickActionText}>{t('invite.showQr')}</AppText>
              </SpringPressable>
            </View>
            <SpringPressable
              accessibilityRole="button"
              haptic="selection"
              onPress={goToHome}
              style={styles.secondaryButton}
            >
              <AppText style={styles.secondaryText}>{t('onboarding.skipForNow')}</AppText>
            </SpringPressable>
          </Card>
        </Animated.View>
      </View>
      <InviteQrSheet
        visible={qrVisible}
        inviteUrl={createdInvite?.invite_url ?? ''}
        onClose={() => setQrVisible(false)}
        onCopy={() => void copyInvitation()}
        onShare={() => void shareInvitation(true)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  title: { fontWeight: '700', color: colors.primaryText, textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 20, color: colors.secondaryText },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    ...shadows.card,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(158, 127, 96, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(158, 127, 96, 0.25)',
  },
  cardCopy: { textAlign: 'center', lineHeight: 20 },
  primaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...shadows.pillAction,
  },
  primaryText: { color: colors.onAccent, fontWeight: '700' },
  secondaryButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glassElevated,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glass,
  },
  secondaryText: { color: colors.primaryText, fontWeight: '700' },
  quickActionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionPill: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5F4932',
  },
  disabled: { opacity: 0.55 },
});
