import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import {
  AppText,
  Badge,
  Card,
  Screen,
  ScreenHeader,
  Skeleton,
  SkeletonCard,
  TextField,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { useSpaces, useUpdateSpace, useDeleteSpace } from '@/features/spaces/hooks';
import type { Space } from '@/features/spaces/types';

export default function ManageSpacesScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const { data: spacesPage, isLoading, refetch } = useSpaces();
  const spaces = spacesPage?.data ?? [];

  const updateSpace = useUpdateSpace();
  const deleteSpace = useDeleteSpace();

  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEditing = (space: Space) => {
    setEditingSpace(space);
    setEditName(space.name);
  };

  const cancelEditing = () => {
    setEditingSpace(null);
    setEditName('');
  };

  async function handleSaveName() {
    if (!editingSpace) return;
    if (editName.trim().length < 2) {
      Alert.alert(t('items.error'), t('spaces.theSpaceNameMustBeAtLeast2Characters'));
      return;
    }
    setSaving(true);
    try {
      await updateSpace.mutateAsync({ spaceId: editingSpace.id, name: editName.trim() });
      Alert.alert(t('spaces.success'), t('spaces.spaceNameUpdated'));
      cancelEditing();
      refetch();
    } catch {
      Alert.alert(t('items.error'), t('spaces.couldnTUpdateSpaceName'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSpace() {
    if (!editingSpace) return;

    const performDelete = async () => {
      setDeleting(true);
      try {
        await deleteSpace.mutateAsync(editingSpace.id);
        Alert.alert(t('spaces.success'), t('spaces.spaceDeleted'));
        cancelEditing();

        // If it was the last space, redirect to onboarding
        if (spaces.length <= 1) {
          router.replace('/(onboarding)/usage-type');
        } else {
          refetch();
        }
      } catch {
        Alert.alert(
          t('items.error'),
          t('spaces.couldnTDeleteSpaceOnlyTheOwnerCanDeleteIt'),
        );
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmWeb = window.confirm(
        t('spaces.areYouSureYouWantToDeleteValueThisCan', { value0: editingSpace.name }),
      );
      if (confirmWeb) void performDelete();
    } else {
      Alert.alert(
        t('spaces.deleteSpace'),
        t('spaces.areYouSureYouWantToDeleteValueThisCan', { value0: editingSpace.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('spaces.deleteSpace'),
            style: 'destructive',
            onPress: () => void performDelete(),
          },
        ],
      );
    }
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <Screen scroll={true}>
      <ScreenHeader onBack={handleBack} fallbackHref="/(tabs)/profile" />

      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="largeTitle" style={styles.title}>
            {t('spaces.manageMySpaces')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('spaces.editOrDeleteTheSharedSpacesYouVeCreatedOr')}
          </AppText>
        </View>

        {isLoading ? (
          <View style={styles.listContainer}>
            {[1, 2].map((key) => (
              <SkeletonCard key={key} style={styles.spaceSkeleton}>
                <Skeleton width={38} height={38} borderRadius={19} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="55%" height={16} borderRadius={6} />
                  <Skeleton width="30%" height={12} borderRadius={6} />
                </View>
              </SkeletonCard>
            ))}
          </View>
        ) : editingSpace ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(220)}
            layout={reducedMotion ? undefined : LAYOUT_SPRING}
          >
            <Card style={styles.glassCard}>
              <AppText variant="sectionTitle" style={styles.cardTitle}>
                {t('spaces.editSpace')}
              </AppText>

              <View style={styles.editForm}>
                <SpringPressable
                  accessibilityRole="button"
                  haptic="selection"
                  pressScale={0.975}
                  style={styles.secondaryBtn}
                  onPress={() => router.push(`/space/${editingSpace.id}/leave` as never)}
                >
                  <Ionicons name="exit-outline" size={18} color={colors.primaryText} />
                  <AppText style={styles.secondaryBtnText}>{t('members.leave')}</AppText>
                </SpringPressable>
                <SpringPressable
                  accessibilityRole="button"
                  haptic="selection"
                  pressScale={0.975}
                  style={styles.secondaryBtn}
                  onPress={() =>
                    router.push(`/space/${editingSpace.id}/members` as never)
                  }
                >
                  <Ionicons name="people-outline" size={18} color={colors.primaryText} />
                  <AppText style={styles.secondaryBtnText}>{t('safety.members')}</AppText>
                </SpringPressable>
                <TextField
                  label={t('spaces.spaceName')}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('spaces.enterASpaceName')}
                />

                <SpringPressable
                  haptic="light"
                  onPress={handleSaveName}
                  disabled={saving || editName.trim() === editingSpace.name}
                  style={[
                    styles.primaryBtn,
                    (saving || editName.trim() === editingSpace.name) &&
                      styles.btnDisabled,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.onAccent} />
                  ) : (
                    <>
                      <AppText style={styles.primaryBtnText}>
                        {t('spaces.saveChanges')}
                      </AppText>
                      <Ionicons name="checkmark" size={18} color={colors.onAccent} />
                    </>
                  )}
                </SpringPressable>

                <SpringPressable
                  haptic="medium"
                  onPress={handleDeleteSpace}
                  disabled={deleting}
                  style={[styles.dangerBtn, deleting && styles.btnDisabled]}
                >
                  {deleting ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <>
                      <AppText style={styles.dangerBtnText}>
                        {t('spaces.deleteSpace')}
                      </AppText>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </>
                  )}
                </SpringPressable>

                <SpringPressable
                  haptic="selection"
                  onPress={cancelEditing}
                  style={styles.secondaryBtn}
                >
                  <AppText style={styles.secondaryBtnText}>{t('common.cancel')}</AppText>
                </SpringPressable>
              </View>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(220)}
            layout={reducedMotion ? undefined : LAYOUT_SPRING}
            style={styles.listContainer}
          >
            <Card style={styles.glassCard}>
              <View style={styles.listHeader}>
                <AppText variant="sectionTitle" style={styles.cardTitle}>
                  {t('spaces.yourSpaces')}
                </AppText>
                <Badge
                  label={t('spaces.spaceCount', { count: spaces.length })}
                  tone="accent"
                />
              </View>

              {spaces.length === 0 ? (
                <AppText muted style={styles.emptyText}>
                  {t('spaces.youDonTHaveAnySpacesYet')}
                </AppText>
              ) : (
                <View style={styles.list}>
                  {spaces.map((space, index) => (
                    <SpringPressable
                      key={space.id}
                      pressScale={0.985}
                      haptic="selection"
                      onPress={() => startEditing(space)}
                      style={[
                        styles.spaceRow,
                        index < spaces.length - 1 && styles.borderBottom,
                      ]}
                    >
                      <View style={styles.rowLeft}>
                        <View style={styles.iconWrapper}>
                          <Ionicons
                            name="people-outline"
                            size={19}
                            color={colors.primaryText}
                          />
                        </View>
                        <View>
                          <AppText variant="cardTitle" style={styles.spaceName}>
                            {space.name}
                          </AppText>
                          <AppText variant="caption" muted>
                            {t('spaces.memberCount', { count: space.member_count })}
                          </AppText>
                        </View>
                      </View>
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={colors.secondaryText}
                      />
                    </SpringPressable>
                  ))}
                </View>
              )}
            </Card>

            <SpringPressable
              haptic="light"
              onPress={() => router.push('/(onboarding)/usage-type')}
              style={styles.createBtn}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primaryText} />
              <AppText style={styles.createBtnText}>{t('spaces.createNewSpace')}</AppText>
            </SpringPressable>
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.xl,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.huge,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  title: {
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.secondaryText,
    paddingHorizontal: spacing.xl,
  },
  spaceSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  btnDisabled: {
    opacity: 0.48,
  },
  glassCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xl,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listContainer: {
    gap: spacing.lg,
  },
  list: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: 'transparent',
  },
  rowPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17, 17, 16, 0.06)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceName: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  editForm: {
    gap: spacing.md,
    marginTop: spacing.md,
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
    marginTop: spacing.sm,
    ...shadows.pillAction,
  },
  primaryBtnText: {
    color: colors.onAccent,
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
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  dangerBtnText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassElevated,
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.glass,
  },
  secondaryBtnText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassElevated,
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    width: '100%',
    ...shadows.glass,
  },
  createBtnText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
});
