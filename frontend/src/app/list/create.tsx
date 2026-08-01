import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  View,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, TextField, Card } from '@/components/ui';
import { useCreateList } from '@/features/lists/hooks';
import { mono, spacing } from '@/design-system';

const { width } = Dimensions.get('window');

export default function CreateListScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const [name, setName] = useState('');
  const create = useCreateList(spaceId ?? '');

  async function submit() {
    if (!spaceId || name.trim().length < 2) {
      Alert.alert('Hata', 'Lütfen en az 2 karakter uzunluğunda bir liste adı girin.');
      return;
    }
    try {
      const list = await create.mutateAsync(name.trim());
      router.replace(`/list/${list.id}`);
    } catch {
      Alert.alert('Liste oluşturulamadı', 'Bağlantıyı kontrol edip tekrar dene.');
    }
  }

  const isBtnDisabled = create.isPending || name.trim().length < 2;

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
            Yeni Liste
          </AppText>
          <AppText muted style={styles.subtitle}>
            Birlikte kaydetmek istediğiniz içerikler için yeni bir ortak liste oluşturun.
          </AppText>
        </View>

        {/* Glassmorphic Form Card */}
        <Card style={styles.formCard}>
          <View style={styles.form}>
            {/* List Icon Decoration */}
            <View style={styles.iconPreviewContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="list-outline" size={30} color={mono.paper} />
              </View>
            </View>

            {/* List Name Input */}
            <TextField
              label="Liste Adı"
              autoFocus
              value={name}
              onChangeText={setName}
              placeholder="Örn. Gidilecek yerler, Filmler, Yemekler..."
            />

            {/* Action Button */}
            <Pressable
              onPress={() => void submit()}
              disabled={isBtnDisabled}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || isBtnDisabled) && styles.btnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Listeyi oluştur"
            >
              {create.isPending ? (
                <ActivityIndicator color={mono.paper} />
              ) : (
                <>
                  <AppText style={styles.primaryBtnText}>Listeyi oluştur</AppText>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  contourTop: {
    position: 'absolute',
    top: -155,
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
    left: -180,
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
  iconPreviewContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
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
});
