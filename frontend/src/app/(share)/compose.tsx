import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useShareIntentContext } from 'expo-share-intent';

import { AppText, EmptyState, Screen, ShareComposeSkeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system';
import { useCreateItem } from '@/features/items/hooks';
import { useLists } from '@/features/lists/hooks';
import { queueShare } from '@/features/sharing/queue';
import { sharePayloadSchema } from '@/features/sharing/types';
import { useSpaces } from '@/features/spaces/hooks';
import { useSpaceStore } from '@/store/space-store';
import { ApiClientError } from '@/api/client/api-client';
import { useToast } from '@/components/feedback/AppToast';
import { haptic } from '@/lib/haptics';

const findUrl = (value?: string | null) => value?.match(/https?:\/\/[^\s]+/i)?.[0];

export default function ShareComposeScreen() {
  useTranslation();
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
        <Pressable
          onPress={leaveShareFlow}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
        <EmptyState
          title={t('sharing.nothingToShare')}
          description={t('sharing.tryAgainWithALinkTextOrAnImage')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable
        onPress={leaveShareFlow}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('sharing.cancel')}
      >
        <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
      </Pressable>

      <View style={styles.heading}>
        <AppText variant="pageTitle">{t('sharing.saveToWedo')}</AppText>
        <AppText muted>{t('sharing.chooseWhereToSaveThisLink')}</AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.linkRow}>
          <Ionicons name="link-outline" size={20} color={colors.primaryText} />
          <AppText numberOfLines={2} style={styles.linkText}>
            {sharedUrl ?? sharedText ?? t('sharing.sharedContent')}
          </AppText>
        </View>

        <AppText style={styles.label}>{t('sharing.space')}</AppText>
        <View style={styles.optionList}>
          {spaces.data?.data.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => {
                haptic.selection();
                setSpaceId(entry.id);
              }}
              style={[styles.option, entry.id === spaceId && styles.optionSelected]}
            >
              <AppText
                style={entry.id === spaceId ? styles.optionSelectedText : undefined}
              >
                {entry.name}
              </AppText>
              {entry.id === spaceId && (
                <Ionicons name="checkmark" size={18} color={colors.surface} />
              )}
            </Pressable>
          ))}
        </View>

        <AppText style={styles.label}>{t('sharing.list')}</AppText>
        <View style={styles.optionList}>
          {lists.data?.data.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => {
                haptic.selection();
                setListId(entry.id);
              }}
              style={[styles.option, entry.id === listId && styles.optionSelected]}
            >
              <AppText
                style={entry.id === listId ? styles.optionSelectedText : undefined}
              >
                {entry.name}
              </AppText>
              {entry.id === listId && (
                <Ionicons name="checkmark" size={18} color={colors.surface} />
              )}
            </Pressable>
          ))}
        </View>

        <AppText style={styles.label}>{t('sharing.title')}</AppText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('sharing.giveThisItemATitle')}
          placeholderTextColor={colors.tertiaryText}
          maxLength={120}
          style={styles.input}
        />

        <Pressable
          disabled={!space || !list || create.isPending}
          onPress={() => void save()}
          style={[
            styles.saveButton,
            (!space || !list || create.isPending) && styles.disabled,
          ]}
        >
          {create.isPending ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <AppText style={styles.saveText}>{t('sharing.save')}</AppText>
              <Ionicons name="arrow-forward" size={20} color={colors.surface} />
            </>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryText,
  },
  heading: { gap: spacing.xs, marginTop: spacing.xxl, marginBottom: spacing.xl },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.primaryText,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  linkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
  },
  linkText: { flex: 1, fontSize: 13, lineHeight: 18 },
  label: { marginTop: spacing.sm, fontSize: 13, fontWeight: '700' },
  optionList: { gap: spacing.xs },
  option: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: colors.primaryText,
    borderColor: colors.primaryText,
  },
  optionSelectedText: { color: colors.surface, fontWeight: '700' },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.primaryText,
    fontSize: 15,
  },
  saveButton: {
    minHeight: 52,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primaryText,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveText: { color: colors.surface, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
