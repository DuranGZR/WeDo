import { t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { ENTER_EASING, LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { useCreateItem } from '@/features/items/hooks';
import { useList, useLists } from '@/features/lists/hooks';
import { useSpaces } from '@/features/spaces/hooks';
import { haptic } from '@/lib/haptics';
import { useSpaceStore } from '@/store/space-store';

const { width } = Dimensions.get('window');

function normalizeInputUrl(raw: string): string {
  const trimmed = raw.trim();
  const embedded = trimmed.match(/https?:\/\/\S+/i)?.[0];
  if (embedded) return embedded.replace(/[),.;]+$/, '');
  if (/^[^:\s]+\.[^:\s]+/.test(trimmed)) return 'https://' + trimmed;
  return trimmed;
}

export default function CreateItemScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const singleList = useList(listId || '');
  const spaces = useSpaces();

  const spaceId = listId
    ? singleList.data?.space_id || ''
    : (spaces.data?.data.find((entry) => entry.id === selectedSpaceId)?.id ??
      spaces.data?.data[0]?.id ??
      '');
  const lists = useLists(spaceId);
  const listEntries = useMemo(() => lists.data?.data ?? [], [lists.data?.data]);

  const create = useCreateItem();
  const [url, setUrl] = useState('');
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [listPickerOpen, setListPickerOpen] = useState(false);

  const selectedList = listEntries.find((l) => l.id === selectedListId) || listEntries[0];

  const scanClipboard = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        const hasUrl = await Clipboard.hasUrlAsync();
        if (!hasUrl) {
          setClipboardUrl(null);
          return;
        }
      }
      const content = await Clipboard.getStringAsync();
      const match = content.match(/https?:\/\/\S+/i)?.[0];
      if (!match) {
        setClipboardUrl(null);
        return;
      }
      setClipboardUrl(match.replace(/[),.;]+$/, ''));
    } catch {
      setClipboardUrl(null);
    }
  }, []);

  useEffect(() => {
    void scanClipboard();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void scanClipboard();
    });
    return () => sub.remove();
  }, [scanClipboard]);

  const showClipboardBanner = Boolean(clipboardUrl && clipboardUrl !== url.trim());
  const clipboardHost = useMemo(() => {
    if (!clipboardUrl) return '';
    try {
      return new URL(clipboardUrl).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }, [clipboardUrl]);

  useEffect(() => {
    if (listId) {
      setSelectedListId(listId);
    } else if (listEntries.length > 0 && !selectedListId) {
      setSelectedListId(listEntries[0]?.id || '');
    }
  }, [listId, listEntries, selectedListId]);

  async function submit() {
    const normalizedUrl = normalizeInputUrl(url);
    if (!selectedList || !normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) {
      haptic.warning();
      Alert.alert(t('items.error'), t('items.pleaseEnterALinkUrl'));
      return;
    }
    try {
      const item = await create.mutateAsync({
        space_id: selectedList.space_id,
        list_id: selectedList.id,
        original_url: normalizedUrl,
        title: title.trim() || undefined,
      });
      router.replace(`/item/${item.id}`);
    } catch {
      haptic.error();
      Alert.alert(t('items.couldnTAddItem'), t('common.checkTheLinkAndTryAgain'));
    }
  }

  const isLoading =
    (listId && singleList.isLoading) || spaces.isLoading || lists.isLoading;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primaryText} />
        </View>
      </Screen>
    );
  }

  const isDisabled = create.isPending || !selectedList || !url.trim();

  return (
    <Screen scroll={true}>
      <ScreenHeader />

      <View style={styles.content}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(260)}
          style={styles.header}
        >
          <AppText variant="largeTitle" style={styles.title}>
            {t('items.addItem')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('items.pasteALinkToSomethingYouFoundOnlineToSave')}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(65).duration(280)}
          layout={reducedMotion ? undefined : LAYOUT_SPRING}
        >
          <Card style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.pickerWrapper}>
                <AppText style={styles.fieldLabel}>{t('items.saveToList')}</AppText>
                <SpringPressable
                  pressScale={0.98}
                  haptic="selection"
                  onPress={() => setListPickerOpen(true)}
                  style={styles.pickerTrigger}
                  accessibilityRole="button"
                  accessibilityLabel={t('items.chooseAList')}
                >
                  <Ionicons name="list" size={18} color={colors.primaryText} />
                  <AppText style={styles.pickerValueText}>
                    {selectedList?.name || t('items.pleaseChooseAList')}
                  </AppText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.secondaryText}
                    style={styles.chevronRight}
                  />
                </SpringPressable>
              </View>

              {showClipboardBanner ? (
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityLabel={t('items.pasteClipboardLink')}
                  pressScale={0.975}
                  haptic="selection"
                  onPress={() => {
                    if (clipboardUrl) setUrl(clipboardUrl);
                  }}
                  style={styles.clipboardPill}
                >
                  <View style={styles.clipboardIcon}>
                    <Ionicons name="clipboard-outline" size={16} color="#9E7F60" />
                  </View>
                  <View style={styles.clipboardCopy}>
                    <AppText style={styles.clipboardTitle}>
                      {t('items.pasteClipboardLink')}
                    </AppText>
                    {clipboardHost ? (
                      <AppText variant="caption" muted numberOfLines={1}>
                        {clipboardHost}
                      </AppText>
                    ) : null}
                  </View>
                  <Ionicons name="arrow-down-circle" size={18} color="#9E7F60" />
                </SpringPressable>
              ) : null}

              <TextField
                label={t('items.linkUrl')}
                value={url}
                onChangeText={setUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />

              <TextField
                label={t('items.titleOptional')}
                value={title}
                onChangeText={setTitle}
                placeholder={t('items.eGAPlaceWeDLikeToTryFor')}
              />

              <SpringPressable
                haptic="medium"
                onPress={() => void submit()}
                disabled={isDisabled}
                style={[styles.primaryBtn, isDisabled && styles.btnDisabled]}
                accessibilityRole="button"
                accessibilityLabel={t('items.saveItem')}
              >
                {create.isPending ? (
                  <ActivityIndicator color={colors.onAccent} />
                ) : (
                  <>
                    <AppText style={styles.primaryBtnText}>{t('items.saveItem')}</AppText>
                    <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
                  </>
                )}
              </SpringPressable>
            </View>
          </Card>
        </Animated.View>
      </View>

      <Modal
        visible={listPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setListPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setListPickerOpen(false)}>
          <Animated.View
            entering={
              reducedMotion ? undefined : SlideInDown.duration(220).easing(ENTER_EASING)
            }
            exiting={reducedMotion ? undefined : SlideOutDown.duration(160)}
            onStartShouldSetResponder={() => true}
            style={styles.sheet}
          >
            <View style={styles.sheetHandle} />
            <AppText variant="sectionTitle" style={styles.sheetTitle}>
              {t('items.chooseAList_62287')}
            </AppText>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {listEntries.map((l) => {
                const isSelected = l.id === selectedListId;
                return (
                  <SpringPressable
                    key={l.id}
                    pressScale={0.975}
                    haptic="selection"
                    style={[styles.sheetRow, isSelected && styles.sheetRowActive]}
                    onPress={() => {
                      setSelectedListId(l.id);
                      setListPickerOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('items.chooseValue', { value0: l.name })}
                  >
                    <View
                      style={[styles.listIcon, isSelected && styles.listIconSelected]}
                    >
                      <Ionicons
                        name="list-outline"
                        size={18}
                        color={isSelected ? colors.onAccent : colors.primaryText}
                      />
                    </View>
                    <AppText
                      style={[
                        styles.sheetRowText,
                        isSelected && styles.sheetRowTextSelected,
                      ]}
                    >
                      {l.name}
                    </AppText>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primaryText}
                        style={styles.chevronRight}
                      />
                    )}
                  </SpringPressable>
                );
              })}
            </ScrollView>

            <Button
              label={t('items.cancel')}
              variant="secondary"
              onPress={() => setListPickerOpen(false)}
            />
          </Animated.View>
        </Pressable>
      </Modal>
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
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  formCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.lg,
    ...shadows.card,
  },
  form: {
    gap: spacing.md,
  },
  pickerWrapper: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  pickerTrigger: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerValueText: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '500',
  },
  chevronRight: {
    marginLeft: 'auto',
  },
  clipboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#D4BEA4',
    backgroundColor: '#FAF5EE',
  },
  clipboardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboardCopy: {
    flex: 1,
    gap: 1,
  },
  clipboardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F4932',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...shadows.pillAction,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 16, 0.30)',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.xxl,
    paddingBottom: spacing.section,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    ...shadows.elevated,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(17, 17, 16, 0.16)',
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  sheetScroll: {
    maxHeight: 280,
  },
  sheetScrollContent: {
    gap: spacing.sm,
  },
  sheetRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
  },
  sheetRowActive: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderFocus,
  },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  listIconSelected: {
    backgroundColor: colors.accent,
  },
  sheetRowText: {
    fontSize: 15,
    color: colors.primaryText,
    fontWeight: '500',
  },
  sheetRowTextSelected: {
    fontWeight: '700',
  },
});
