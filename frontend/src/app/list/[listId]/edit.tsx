import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, TextField } from '@/components/ui';
import { collaborationApi } from '@/features/collaboration/api';
import { useList } from '@/features/lists/hooks';
import { mono, spacing } from '@/design-system';

export default function EditListScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const list = useList(listId);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const currentName = name || list.data?.name || '';
  async function save() {
    if (!currentName.trim()) return;
    setSaving(true);
    try {
      await collaborationApi.updateList(listId, { name: currentName.trim() });
      router.back();
    } catch {
      Alert.alert('Liste güncellenemedi', 'Bağlantıyı kontrol edip tekrar dene.');
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    setSaving(true);
    try {
      await collaborationApi.deleteList(listId);
      router.replace('/lists');
    } catch {
      Alert.alert('Liste silinemedi', 'Varsayılan listeler silinemez.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen scroll={true} backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />
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
        <View style={styles.glassCard}>
          <AppText variant="pageTitle">Listeyi düzenle</AppText>
          <AppText muted>Liste adını ve görünümünü güncelle.</AppText>

          <View style={{ height: spacing.lg }} />

          <TextField
            label="Liste adı"
            value={currentName}
            onChangeText={setName}
            placeholder="Liste adı"
          />

          <View style={{ height: spacing.lg }} />

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={() => void save()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={mono.paper} />
            ) : (
              <AppText style={styles.primaryBtnText}>Kaydet</AppText>
            )}
          </Pressable>

          <View style={{ height: spacing.md }} />

          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.btnPressed]}
            onPress={() =>
              Alert.alert('Listeyi sil?', 'Bu işlem geri alınamaz.', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: () => void remove() },
              ])
            }
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={mono.danger} />
            ) : (
              <AppText style={styles.deleteBtnText}>Listeyi sil</AppText>
            )}
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles: any = StyleSheet.create({
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
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' },
    }),
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 0px rgba(0, 0, 0, 0.16)',
      },
    }),
  },
  primaryBtnText: {
    color: mono.paper,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.danger,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
  },
  deleteBtnText: { color: mono.danger, fontSize: 14, fontWeight: '700' },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
