import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
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
import { AppText, EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { collaborationApi } from '@/features/collaboration/api';
import { useLists } from '@/features/lists/hooks';
import { useSpaces } from '@/features/spaces/hooks';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '@/design-system';
import { haptic } from '@/lib/haptics';

export default function SpaceDetailScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const toast = useOptionalToast();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const spaces = useSpaces();
  const lists = useLists(spaceId);
  const space = spaces.data?.data.find((entry) => entry.id === spaceId);
  const [inviteUrl, setInviteUrl] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);

  const ensureInvite = async (): Promise<string | null> => {
    if (!spaceId) return null;
    if (inviteUrl) return inviteUrl;
    const res = await collaborationApi.invite(spaceId);
    if (!res.invite_url) return null;
    setInviteUrl(res.invite_url);
    return res.invite_url;
  };

  const handleCopyInvite = async () => {
    setInviteBusy(true);
    try {
      const url = await ensureInvite();
      if (!url) return;
      await Clipboard.setStringAsync(url);
      haptic.success();
      toast?.showToast({ type: 'success', title: t('invite.linkCopied') });
    } catch {
      Alert.alert(
        t('onboarding.couldnTShareInvitation'),
        t('common.checkTheLinkAndTryAgain'),
      );
    } finally {
      setInviteBusy(false);
    }
  };

  const handleOpenQr = async () => {
    setInviteBusy(true);
    try {
      const url = await ensureInvite();
      if (!url) return;
      setQrOpen(true);
    } catch {
      Alert.alert(
        t('onboarding.couldnTShareInvitation'),
        t('common.checkTheLinkAndTryAgain'),
      );
    } finally {
      setInviteBusy(false);
    }
  };

  const handleShareInvite = async () => {
    if (!inviteUrl) return;
    setQrOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 220));
    const message = t('sharing.inviteMessage', { value0: inviteUrl });
    await Share.share(Platform.OS === 'ios' ? { url: inviteUrl, message } : { message });
  };

  if (spaces.isLoading || lists.isLoading)
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );

  if (!space)
    return (
      <Screen>
        <EmptyState
          title={t('onboarding.spaceNotFound')}
          description={t('spaces.thisSpaceWasDeletedOrYouDonTHaveAccess')}
        />
      </Screen>
    );

  return (
    <Screen scroll={true}>
      <ScreenHeader fallbackHref="/(tabs)" />

      <View style={styles.content}>
        <AppText variant="largeTitle">{space.name}</AppText>

        <View style={styles.actions}>
          <SpringPressable
            accessibilityRole="button"
            haptic="light"
            style={styles.primaryBtn}
            onPress={() => router.push(`/(onboarding)/invite-member?spaceId=${spaceId}`)}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.onAccent} />
            <AppText style={styles.primaryBtnText}>{t('spaces.inviteAMember')}</AppText>
          </SpringPressable>
          <View style={styles.invitePillsRow}>
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t('invite.copyLink')}
              haptic="selection"
              disabled={inviteBusy}
              onPress={() => void handleCopyInvite()}
              style={styles.invitePillBtn}
            >
              <Ionicons name="copy-outline" size={16} color="#5F4932" />
              <AppText style={styles.invitePillText}>{t('invite.copyLink')}</AppText>
            </SpringPressable>
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t('invite.showQr')}
              haptic="selection"
              disabled={inviteBusy}
              onPress={() => void handleOpenQr()}
              style={styles.invitePillBtn}
            >
              <Ionicons name="qr-code-outline" size={16} color="#5F4932" />
              <AppText style={styles.invitePillText}>{t('invite.showQr')}</AppText>
            </SpringPressable>
          </View>
          <SpringPressable
            accessibilityRole="button"
            haptic="selection"
            onPress={() => router.push(`/space/${spaceId}/members` as never)}
            style={styles.secondaryBtn}
          >
            <Ionicons name="people-outline" size={19} color={colors.primaryText} />
            <AppText style={styles.secondaryBtnText}>{t('safety.members')}</AppText>
          </SpringPressable>
          <SpringPressable
            accessibilityRole="button"
            haptic="medium"
            onPress={() => router.push(`/space/${spaceId}/leave` as never)}
            style={styles.dangerBtn}
          >
            <Ionicons name="exit-outline" size={19} color={colors.error} />
            <AppText style={styles.dangerBtnText}>{t('members.leave')}</AppText>
          </SpringPressable>
        </View>

        {(lists.data?.data ?? []).length === 0 ? (
          <EmptyState
            title={t('spaces.noListsYet')}
            description={t('spaces.startByAddingAListToThisSpace')}
            action={t('spaces.createList')}
            onAction={() => router.push(`/list/create?spaceId=${spaceId}`)}
          />
        ) : (
          (lists.data?.data ?? []).map((list, index) => (
            <Animated.View
              key={list.id}
              entering={
                reducedMotion ? undefined : FadeInDown.delay(index * 40).duration(220)
              }
            >
              <SpringPressable
                pressScale={0.98}
                haptic="selection"
                onPress={() => router.push(`/list/${list.id}`)}
              >
                <View style={[styles.glassCard, { marginTop: 12 }]}>
                  <AppText variant="cardTitle">{list.name}</AppText>
                  <AppText muted>
                    {list.is_default ? t('spaces.default') : t('lists.sharedList')}
                  </AppText>
                </View>
              </SpringPressable>
            </Animated.View>
          ))
        )}
      </View>
      <InviteQrSheet
        visible={qrOpen}
        inviteUrl={inviteUrl}
        onClose={() => setQrOpen(false)}
        onCopy={() => void handleCopyInvite()}
        onShare={() => void handleShareInvite()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  actions: {
    gap: spacing.sm,
  },
  glassCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xl,
    ...shadows.card,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...shadows.pillAction,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
  invitePillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  invitePillBtn: {
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
  invitePillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5F4932',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassElevated,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...shadows.glass,
  },
  secondaryBtnText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: 'rgba(184, 74, 66, 0.25)',
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  dangerBtnText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
