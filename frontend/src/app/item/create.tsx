import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  View,
  Pressable,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Screen, TextField, Card } from '@/components/ui';
import { useCreateItem } from '@/features/items/hooks';
import { useList, useLists } from '@/features/lists/hooks';
import { useSpaces } from '@/features/spaces/hooks';
import { colors, mono, spacing } from '@/design-system';

const { width } = Dimensions.get('window');

export default function CreateItemScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const singleList = useList(listId || '');
  const spaces = useSpaces();

  const spaceId = listId
    ? singleList.data?.space_id || ''
    : spaces.data?.data[0]?.id || '';
  const lists = useLists(spaceId);
  const listEntries = useMemo(() => lists.data?.data ?? [], [lists.data?.data]);

  const create = useCreateItem();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [listPickerOpen, setListPickerOpen] = useState(false);

  const selectedList = listEntries.find((l) => l.id === selectedListId) || listEntries[0];

  useEffect(() => {
    if (listId) {
      setSelectedListId(listId);
    } else if (listEntries.length > 0 && !selectedListId) {
      setSelectedListId(listEntries[0]?.id || '');
    }
  }, [listId, listEntries, selectedListId]);

  async function submit() {
    if (!selectedList || !url.trim()) {
      Alert.alert('Hata', 'Lütfen bir bağlantı adresi (URL) girin.');
      return;
    }
    try {
      const item = await create.mutateAsync({
        space_id: selectedList.space_id,
        list_id: selectedList.id,
        original_url: url.trim(),
        title: title.trim() || undefined,
      });
      router.replace(`/item/${item.id}`);
    } catch {
      Alert.alert('İçerik eklenemedi', 'Bağlantıyı kontrol edip tekrar dene.');
    }
  }

  const isLoading =
    (listId && singleList.isLoading) || spaces.isLoading || lists.isLoading;

  if (isLoading) {
    return (
      <Screen backgroundColor={mono.background}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={mono.ink} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={true} backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />

      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={mono.ink} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.header}>
          <AppText variant="largeTitle" style={styles.title}>
            İçerik Ekle
          </AppText>
          <AppText muted style={styles.subtitle}>
            İnternette beğendiğin bir içeriğin bağlantısını elle girerek ortak alanına
            aktarabilirsin.
          </AppText>
        </View>

        {/* Glassmorphic Form Card */}
        <Card style={styles.formCard}>
          <View style={styles.form}>
            {/* List Selector */}
            <View style={styles.pickerWrapper}>
              <AppText style={styles.fieldLabel}>Kaydedilecek Liste</AppText>
              <Pressable
                onPress={() => setListPickerOpen(true)}
                style={({ pressed }) => [
                  styles.pickerTrigger,
                  pressed && styles.pickerTriggerPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Liste seç"
              >
                <Ionicons name="list" size={18} color={mono.ink} />
                <AppText style={styles.pickerValueText}>
                  {selectedList?.name || 'Lütfen liste seçin...'}
                </AppText>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.tertiaryText}
                  style={{ marginLeft: 'auto' }}
                />
              </Pressable>
            </View>

            {/* URL Input */}
            <TextField
              label="Bağlantı Adresi (URL)"
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* Title Input */}
            <TextField
              label="Başlık (İsteğe bağlı)"
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Akşam yemeği için gitmek istediğimiz yer"
            />

            {/* Action Button */}
            <Pressable
              onPress={() => void submit()}
              disabled={create.isPending || !selectedList || !url.trim()}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || create.isPending || !selectedList || !url.trim()) &&
                  styles.btnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="İçeriği kaydet"
            >
              {create.isPending ? (
                <ActivityIndicator color={mono.paper} />
              ) : (
                <>
                  <AppText style={styles.primaryBtnText}>İçeriği kaydet</AppText>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={mono.paper}
                    style={styles.btnIcon}
                  />
                </>
              )}
            </Pressable>
          </View>
        </Card>
      </View>

      {/* List Selector Bottom Sheet Modal */}
      <Modal
        visible={listPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setListPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setListPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <AppText variant="sectionTitle" style={styles.sheetTitle}>
              Liste Seçin
            </AppText>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {listEntries.map((l) => {
                const isSelected = l.id === selectedListId;
                return (
                  <Pressable
                    key={l.id}
                    style={styles.sheetRow}
                    onPress={() => {
                      setSelectedListId(l.id);
                      setListPickerOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${l.name} listesini seç`}
                  >
                    <View
                      style={[styles.listIcon, isSelected && styles.listIconSelected]}
                    >
                      <Ionicons
                        name="list-outline"
                        size={18}
                        color={isSelected ? colors.surface : colors.accent}
                      />
                    </View>
                    <AppText
                      style={[
                        styles.sheetRowText,
                        isSelected && { fontWeight: '700', color: colors.accent },
                      ]}
                    >
                      {l.name}
                    </AppText>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.accent}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Button
              label="İptal"
              variant="secondary"
              onPress={() => setListPickerOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
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
    fontSize: width > 400 ? 26 : 22,
    lineHeight: width > 400 ? 32 : 28,
    fontWeight: '800',
    color: mono.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: mono.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)',
      },
    }),
  },
  form: {
    gap: spacing.md,
  },
  pickerWrapper: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: mono.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  pickerTrigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: mono.ink,
    borderRadius: 10,
    backgroundColor: mono.paper,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerTriggerPressed: {
    opacity: 0.85,
    backgroundColor: mono.soft,
  },
  pickerValueText: {
    fontSize: 16,
    color: mono.ink,
    fontWeight: '500',
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
    backgroundColor: mono.ink,
    minHeight: 52,
    borderRadius: 12,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  primaryBtnText: {
    color: mono.paper,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnIcon: {
    marginTop: 1,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24,24,23,0.3)',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: mono.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: mono.ink,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    color: mono.ink,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sheetScroll: {
    maxHeight: 280,
  },
  sheetRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderWidth: 1,
    borderColor: mono.ink,
    borderRadius: 11,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  listIconSelected: {
    backgroundColor: mono.ink,
  },
  sheetRowText: {
    fontSize: 15,
    color: mono.ink,
    fontWeight: '500',
  },
});
