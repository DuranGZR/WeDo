import { t } from '@/i18n';

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { ApiClientError } from '@/api/client/api-client';
import { useToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import {
  AppText,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  ShareComposeSkeleton,
  TextField,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { useCreateItem } from '@/features/items/hooks';
import { useLists } from '@/features/lists/hooks';
import { queueShare } from '@/features/sharing/queue';
import { sharePayloadSchema } from '@/features/sharing/types';
import { useSpaces } from '@/features/spaces/hooks';
import { haptic } from '@/lib/haptics';
import { useSpaceStore } from '@/store/space-store';

const findUrl = (value?: string | null) => value?.match(/https?:\/\/[^\s]+/i)?.[0];

export default function ShareComposeScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const params = useLocalSearchParams<{
    url?: string;
    sharedText?: string;
    imageUri?: string;
    sourceApp?: string;
  }>();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const spaces = useSpaces();
  const { showToast } = useToast();
  const [spaceId, setSpaceId] = useState<string | undefined>();
  const lists = useLists(spaceId ?? '');
  const [listId, setListId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const create = useCreateItem();

  const sharedText =
    params.sharedText ?? (hasShareIntent ? (shareIntent.text ?? undefined) : undefined);
  const sharedUrl =
    params.url ??
    (hasShareIntent ? (shareIntent.webUrl ?? findUrl(shareIntent.text)) : undefined);
  const imageUri =
    params.imageUri ??
    (hasShareIntent
      ? shareIntent.files?.find((file) => file.mimeType.startsWith('image/'))?.path
      : undefined);
  const defaultTitle = useMemo(
    () =>
      (hasShareIntent ? shareIntent.meta?.title : undefined) ??
      sharedText?.replace(/https?:\/\/[^\s]+/i, '').trim() ??
      '',
    [hasShareIntent, shareIntent.meta?.title, sharedText],
  );
  const payload = sharePayloadSchema.safeParse({
    url: sharedUrl,
    sharedText,
    imageUri,
    sourceApp: params.sourceApp,
  });
  const share = payload.success ? payload.data : null;
  const space = spaces.data?.data.find((entry) => entry.id === spaceId);
  const list = lists.data?.data.find((entry) => entry.id === listId);

  useEffect(() => {
    if (!spaces.data?.data.length) return;
    setSpaceId((current) =>
      spaces.data?.data.some((entry) => entry.id === current)
        ? current
        : (spaces.data?.data.find((entry) => entry.id === selectedSpaceId)?.id ??
          spaces.data.data[0]?.id),
    );
  }, [selectedSpaceId, spaces.data?.data]);

  useEffect(() => {
    setListId(lists.data?.data[0]?.id);
  }, [spaceId, lists.data?.data]);

  useEffect(() => {
    setTitle(defaultTitle.slice(0, 120));
  }, [defaultTitle]);

  function leaveShareFlow() {
    haptic.light();
    resetShareIntent();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  async function save() {
    if (!share || !space || !list) return;
    const originalUrl = share.url ?? findUrl(share.sharedText);
    if (!originalUrl) {
      haptic.warning();
      Alert.alert(
        t('sharing.noLinkFound'),
        t('sharing.thereSNoLinkToSaveInThisSharedContent'),
      );
      return;
    }
    const input = {
      space_id: space.id,
      list_id: list.id,
      original_url: originalUrl,
      title: title.trim() || undefined,
    };

    try {
      await create.mutateAsync(input);
      resetShareIntent();
      showToast({
        type: 'success',
        title: t('sharing.itemSaved'),
        message: t('sharing.addedToList', { value0: list.name }),
      });
      router.replace(`/list/${list.id}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        haptic.warning();
        Alert.alert(
          t('sharing.thisLinkIsAlreadySaved'),
          t('sharing.thisLinkIsAlreadyInValue', { value0: list.name }),
          [
            { text: t('legal.close'), style: 'cancel' },
            {
              text: t('lists.goToList'),
              onPress: () => {
                resetShareIntent();
                router.replace(`/list/${list.id}`);
              },
            },
          ],
        );
        return;
      }
      if (error instanceof ApiClientError && error.status < 500) {
        showToast({
          type: 'error',
          title: t('settings.couldnTSave'),
          message: error.message,
        });
        return;
      }
      queueShare(
        { ...share, url: originalUrl, sharedText: title.trim() || share.sharedText },
        space.id,
        list.id,
      );
      resetShareIntent();
      showToast({
        type: 'warning',
        title: t('sharing.savedOffline'),
        message: t('sharing.weLlSyncItAutomaticallyWhenYouReBackOnline'),
      });
      router.replace('/(tabs)');
    }
  }

  if (spaces.isLoading || (spaceId && lists.isLoading)) {
    return (
      <Screen scroll={true}>
        <ShareComposeSkeleton />
      </Screen>
    );
  }

  if (!share) {
    return (
      <Screen>
        <ScreenHeader
          onBack={leaveShareFlow}
          backIcon="close"
          backLabel={t('sharing.cancel')}
        />
        <EmptyState
          title={t('sharing.nothingToShare')}
          description={t('sharing.tryAgainWithALinkTextOrAnImage')}
        />
      </Screen>
    );
  }

  const saveDisabled = !space || !list || create.isPending;

  return (
    <Screen>
      <ScreenHeader
        onBack={leaveShareFlow}
        backIcon="close"
        backLabel={t('sharing.cancel')}
      />

      <View style={styles.content}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(260)}
          style={styles.heading}
        >
          <AppText variant="largeTitle" style={styles.headingTitle}>
            {t('sharing.saveToWedo')}
          </AppText>
          <AppText muted>{t('sharing.chooseWhereToSaveThisLink')}</AppText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(65).duration(280)}
          layout={reducedMotion ? undefined : LAYOUT_SPRING}
        >
          <Card style={styles.card}>
            <View style={styles.linkRow}>
              <View style={styles.linkIconWrap}>
                <Ionicons name="link-outline" size={18} color={colors.primaryText} />
              </View>
              <AppText numberOfLines={2} style={styles.linkText}>
                {sharedUrl ?? sharedText ?? t('sharing.sharedContent')}
              </AppText>
            </View>

            <AppText style={styles.label}>{t('sharing.space')}</AppText>
            <View style={styles.optionList}>
              {spaces.data?.data.map((entry) => {
                const selected = entry.id === spaceId;
                return (
                  <SpringPressable
                    key={entry.id}
                    pressScale={0.98}
                    haptic="selection"
                    onPress={() => setSpaceId(entry.id)}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <AppText
                      style={selected ? styles.optionSelectedText : styles.optionText}
                    >
                      {entry.name}
                    </AppText>
                    {selected && (
                      <Ionicons name="checkmark" size={18} color={colors.onAccent} />
                    )}
                  </SpringPressable>
                );
              })}
            </View>

            <AppText style={styles.label}>{t('sharing.list')}</AppText>
            <View style={styles.optionList}>
              {lists.data?.data.map((entry) => {
                const selected = entry.id === listId;
                return (
                  <SpringPressable
                    key={entry.id}
                    pressScale={0.98}
                    haptic="selection"
                    onPress={() => setListId(entry.id)}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <AppText
                      style={selected ? styles.optionSelectedText : styles.optionText}
                    >
                      {entry.name}
                    </AppText>
                    {selected && (
                      <Ionicons name="checkmark" size={18} color={colors.onAccent} />
                    )}
                  </SpringPressable>
                );
              })}
            </View>

            <TextField
              label={t('sharing.title')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('sharing.giveThisItemATitle')}
              maxLength={120}
            />

            <SpringPressable
              disabled={saveDisabled}
              haptic="light"
              onPress={() => void save()}
              style={[styles.saveButton, saveDisabled && styles.disabled]}
            >
              {create.isPending ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <>
                  <AppText style={styles.saveText}>{t('sharing.save')}</AppText>
                  <Ionicons name="arrow-forward" size={19} color={colors.onAccent} />
                </>
              )}
            </SpringPressable>
          </Card>
        </Animated.View>
      </View>
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
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.huge,
  },
  heading: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  headingTitle: {
    letterSpacing: -0.6,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    ...shadows.card,
  },
  linkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  linkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryText,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  optionList: { gap: spacing.xs },
  option: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    ...shadows.glass,
  },
  optionText: {
    color: colors.primaryText,
    fontWeight: '500',
  },
  optionSelectedText: {
    color: colors.onAccent,
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 50,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.pillAction,
  },
  saveText: { color: colors.onAccent, fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
