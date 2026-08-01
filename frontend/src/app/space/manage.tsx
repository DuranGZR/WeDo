import { useState } from 'react';
import { router } from 'expo-router';
import {
  StyleSheet,
  View,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, TextField, Card, Badge } from '@/components/ui';
import { colors, mono, spacing, radius } from '@/design-system';
import { useSpaces, useUpdateSpace, useDeleteSpace } from '@/features/spaces/hooks';
import type { Space } from '@/features/spaces/types';

export default function ManageSpacesScreen() {
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
      Alert.alert('Hata', 'Alan adı en az 2 karakter olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      await updateSpace.mutateAsync({ spaceId: editingSpace.id, name: editName.trim() });
      Alert.alert('Başarılı', 'Alan adı güncellendi.');
      cancelEditing();
      refetch();
    } catch {
      Alert.alert('Hata', 'Alan adı güncellenemedi.');
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
        Alert.alert('Başarılı', 'Alan başarıyla silindi.');
        cancelEditing();

        // If it was the last space, redirect to onboarding
        if (spaces.length <= 1) {
          router.replace('/(onboarding)/usage-type');
        } else {
          refetch();
        }
      } catch {
        Alert.alert(
          'Hata',
          'Alan silinemedi. Sadece alan sahibi olan yöneticiler alanı silebilir.',
        );
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmWeb = window.confirm(
        `"${editingSpace.name}" alanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      );
      if (confirmWeb) void performDelete();
    } else {
      Alert.alert(
        'Alanı Sil',
        `"${editingSpace.name}" alanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Alanı Sil',
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
    <Screen scroll={true} backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />

      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="arrow-back" size={22} color={mono.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="pageTitle" style={styles.title}>
              Alanlarımı Yönet
            </AppText>
            <AppText muted style={styles.subtitle}>
              Oluşturduğun veya katıldığın ortak alanları düzenle veya sil.
            </AppText>
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={mono.ink} />
            </View>
          ) : editingSpace ? (
            /* Editing Space Sub-view */
            <Card style={styles.glassCard}>
              <AppText variant="sectionTitle" style={styles.cardTitle}>
                Alanı Düzenle
              </AppText>

              <View style={styles.editForm}>
                <TextField
                  label="Alan Adı"
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Alan adı girin"
                />

                <Pressable
                  onPress={handleSaveName}
                  disabled={saving || editName.trim() === editingSpace.name}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (pressed || saving || editName.trim() === editingSpace.name) &&
                      styles.btnPressed,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color={mono.paper} />
                  ) : (
                    <>
                      <AppText style={styles.primaryBtnText}>
                        Değişiklikleri Kaydet
                      </AppText>
                      <Ionicons name="checkmark" size={18} color={mono.paper} />
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleDeleteSpace}
                  disabled={deleting}
                  style={({ pressed }) => [
                    styles.dangerBtn,
                    (pressed || deleting) && styles.btnPressed,
                  ]}
                >
                  {deleting ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <>
                      <AppText style={styles.dangerBtnText}>Alanı Sil</AppText>
                      <Ionicons name="trash-outline" size={18} color={colors.surface} />
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={cancelEditing}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <AppText style={styles.secondaryBtnText}>Vazgeç</AppText>
                </Pressable>
              </View>
            </Card>
          ) : (
            /* Spaces List View */
            <View style={styles.listContainer}>
              <Card style={styles.glassCard}>
                <View style={styles.listHeader}>
                  <AppText variant="sectionTitle" style={styles.cardTitle}>
                    Mevcut Alanlar
                  </AppText>
                  <Badge label={`${spaces.length} Alan`} tone="accent" />
                </View>

                {spaces.length === 0 ? (
                  <AppText muted style={styles.emptyText}>
                    Henüz bir alanın bulunmuyor.
                  </AppText>
                ) : (
                  <View style={styles.list}>
                    {spaces.map((space, index) => (
                      <Pressable
                        key={space.id}
                        onPress={() => startEditing(space)}
                        style={({ pressed }) => [
                          styles.spaceRow,
                          index < spaces.length - 1 && styles.borderBottom,
                          pressed && styles.rowPressed,
                        ]}
                      >
                        <View style={styles.rowLeft}>
                          <View style={styles.iconWrapper}>
                            <Ionicons
                              name="people-outline"
                              size={20}
                              color={mono.paper}
                            />
                          </View>
                          <View>
                            <AppText variant="cardTitle" style={styles.spaceName}>
                              {space.name}
                            </AppText>
                            <AppText variant="caption" muted>
                              {space.member_count} Üye
                            </AppText>
                          </View>
                        </View>
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={colors.secondaryText}
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </Card>

              {/* Create New Space trigger */}
              <Pressable
                onPress={() => router.push('/(onboarding)/usage-type')}
                style={({ pressed }) => [styles.createBtn, pressed && styles.btnPressed]}
              >
                <Ionicons name="add-circle-outline" size={22} color={mono.ink} />
                <AppText style={styles.createBtnText}>Yeni Alan Oluştur</AppText>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerBar: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mono.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: mono.ink,
  },
  scrollContent: {
    flexGrow: 1,
  },
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
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: mono.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: mono.muted,
    paddingHorizontal: spacing.xl,
  },
  loaderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: spacing.xl,
    ...Platform.select({
      web: {
        boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)',
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: mono.ink,
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
    backgroundColor: mono.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: mono.ink,
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
    backgroundColor: mono.paper,
    ...Platform.select({
      web: {
        transition: 'background-color 0.2s ease',
      },
    }),
  },
  rowPressed: {
    backgroundColor: mono.soft,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: mono.soft,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceName: {
    color: mono.ink,
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
    backgroundColor: mono.ink,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 0px rgba(0, 0, 0, 0.16)',
        transition: 'all 0.2s ease',
      },
      default: {
        shadowColor: mono.ink,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  primaryBtnText: {
    color: mono.paper,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 20px rgba(184, 84, 84, 0.25)',
        transition: 'all 0.2s ease',
      },
      default: {
        shadowColor: colors.error,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  dangerBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: mono.ink,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
      },
    }),
  },
  secondaryBtnText: {
    color: mono.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: mono.ink,
    borderStyle: 'solid',
    gap: spacing.sm,
    width: '100%',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
      },
    }),
  },
  createBtnText: {
    color: mono.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
