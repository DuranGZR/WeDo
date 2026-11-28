import { t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ListAppearancePicker } from '@/components/lists/ListAppearancePicker';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';
import { formatListIcon, getListAppearance } from '@/features/lists/appearance';
import { useList } from '@/features/lists/hooks';

export default function EditListScreen() {
  useTranslation();
  const client = useQueryClient();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const list = useList(listId);
  const [name, setName] = useState<string | null>(null);
  const [iconToken, setIconToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentName = name ?? list.data?.name ?? '';
  const currentIcon = iconToken ?? list.data?.icon ?? undefined;

  async function save() {
    if (!currentName.trim()) return;
    setSaving(true);
    try {
      const resolved = getListAppearance(
        currentName.trim(),
        Boolean(list.data?.is_default),
        currentIcon,
      );
      await collaborationApi.updateList(listId, {
        name: currentName.trim(),
        icon: currentIcon ?? formatListIcon(resolved.icon, resolved.backgroundColor),
      });
      await client.invalidateQueries({ queryKey: ['lists'] });
      router.back();
    } catch {
      Alert.alert(t('lists.couldnTUpdateList'), t('common.checkTheLinkAndTryAgain'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await collaborationApi.deleteList(listId);
      await client.invalidateQueries({ queryKey: ['lists'] });
      router.replace('/lists');
    } catch {
      Alert.alert(t('lists.deleteFailed'), t('lists.defaultListsCanTBeDeleted'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll={true}>
      <ScreenHeader />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(240)} layout={LAYOUT_SPRING}>
          <Card style={styles.formCard}>
            <View style={styles.headerBlock}>
              <View style={styles.iconBadge}>
                <Ionicons name="create-outline" size={20} color="#9E7F60" />
              </View>
              <AppText variant="largeTitle" style={styles.title}>
                {t('lists.editList')}
              </AppText>
              <AppText muted style={styles.subtitle}>
                {t('lists.updateYourListSNameAndAppearance')}
              </AppText>
            </View>

            <TextField
              label={t('lists.listName_48d9b')}
              value={currentName}
              onChangeText={setName}
              placeholder={t('lists.listName_48d9b')}
            />

            <ListAppearancePicker
              name={currentName}
              value={currentIcon}
              onChange={setIconToken}
            />

            <View style={styles.actions}>
              <Button
                label={t('sharing.save')}
                variant="primary"
                loading={saving}
                disabled={saving}
                onPress={() => void save()}
              />
              <Button
                label={t('lists.deleteList')}
                variant="danger"
                disabled={saving}
                onPress={() =>
                  Alert.alert(t('lists.confirmDelete'), t('lists.thisCanTBeUndone'), [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('items.delete'),
                      style: 'destructive',
                      onPress: () => void remove(),
                    },
                  ])
                }
              />
            </View>
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
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  formCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  headerBlock: {
    gap: spacing.xs,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
});
