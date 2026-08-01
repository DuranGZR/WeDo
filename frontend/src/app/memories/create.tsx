import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, TextField } from '@/components/ui';
import { collaborationApi } from '@/features/collaboration/api';
import { colors, radius, spacing } from '@/design-system';

export default function CreateMemoryScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const [note, setNote] = useState('');
  const [rating, setRating] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    if (Platform.OS !== 'web') {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Fotoğraflarınıza erişim izni vermeniz gerekmektedir!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function save() {
    if (!itemId || !note.trim()) return;
    setSaving(true);
    try {
      await collaborationApi.createMemory(itemId, {
        note: note.trim(),
        ...(rating ? { rating: Number(rating) } : {}),
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const isSaveDisabled = !note.trim() || !itemId || saving;

  return (
    <Screen scroll={true}>
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={styles.blobCoral} />
        <View style={styles.blobSand} />
      </View>

      <View style={styles.headerBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <AppText variant="pageTitle">Anı ekle</AppText>

        <View style={styles.glassCard}>
          <TextField
            value={note}
            onChangeText={setNote}
            placeholder="Bu içerikle ilgili notun"
            multiline
          />
          <View style={{ height: spacing.md }} />
          <TextField
            value={rating}
            onChangeText={setRating}
            placeholder="Puan (1-5)"
            keyboardType="number-pad"
          />

          <View style={{ height: spacing.md }} />

          {/* Memory Photo Picker */}
          <AppText variant="caption" muted style={styles.photoSectionLabel}>
            ANI FOTOĞRAFI
          </AppText>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <Pressable onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              style={({ pressed }) => [
                styles.photoPickerBtn,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf ekle"
            >
              <Ionicons name="camera-outline" size={24} color={colors.accent} />
              <AppText style={styles.photoPickerText}>Fotoğraf Ekle</AppText>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !isSaveDisabled && styles.btnPressed,
            isSaveDisabled && { opacity: 0.5 },
          ]}
          onPress={() => {
            if (!isSaveDisabled) {
              save();
            }
          }}
          disabled={isSaveDisabled}
        >
          {saving ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <AppText style={styles.primaryBtnText}>Anıyı kaydet</AppText>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles: any = StyleSheet.create({
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  blobCoral: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accent,
    opacity: 0.08,
    ...Platform.select({
      web: { filter: 'blur(75px)' },
    }),
  },
  blobSand: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#A5A29B',
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(85px)' },
    }),
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
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' },
    }),
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
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
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  photoSectionLabel: {
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  photoPickerBtn: {
    height: 90,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  photoPickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(200, 103, 75, 0.15)',
      },
    }),
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
