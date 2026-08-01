import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Image,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, TextField, Card } from '@/components/ui';
import { colors, spacing, radius } from '@/design-system';
import { useCreateSpace } from '@/features/spaces/hooks';

const suggestions = ['Bizim Alanımız', 'Hafta Sonu Planları', 'Birlikte Yapacaklarımız'];

export default function CreateSpaceScreen() {
  const [name, setName] = useState('');
  const create = useCreateSpace();

  async function submit() {
    if (name.trim().length < 2) {
      Alert.alert('Alan adı gerekli', 'En az iki karakter kullan.');
      return;
    }
    try {
      const space = await create.mutateAsync({ name: name.trim(), type: 'couple' });
      // Redirect to invite screen for this newly created space
      router.replace(`/(onboarding)/invite-member?spaceId=${space.id}`);
    } catch {
      Alert.alert('Alan oluşturulamadı', 'Bağlantını kontrol edip tekrar dene.');
    }
  }

  return (
    <Screen scroll={true}>
      {/* Ambient Glow Background Blobs */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={styles.blobCoral} />
        <View style={styles.blobSand} />
      </View>

      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.brandHeader}>
          <Image
            source={require('../../../assets/TekLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <AppText variant="pageTitle" style={styles.title}>
            Ortak alanına bir isim ver
          </AppText>
          <AppText muted style={styles.subtitle}>
            Bu isim yalnızca alan üyeleri tarafından görülür.
          </AppText>
        </View>

        {/* Glassmorphic Form Card */}
        <Card style={styles.formCard}>
          <View style={styles.form}>
            <TextField
              autoFocus
              label="Alan Adı"
              placeholder="Örn. İpek & Can"
              value={name}
              onChangeText={setName}
            />

            {/* Interactive Suggestions Chips */}
            <View style={styles.suggestionsContainer}>
              <AppText variant="caption" muted style={styles.suggestionsLabel}>
                Öneriler:
              </AppText>
              <View style={styles.chipsWrapper}>
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => setName(suggestion)}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      name === suggestion && styles.activeChip,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        name === suggestion && styles.activeChipText,
                      ]}
                    >
                      {suggestion}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => void submit()}
              disabled={create.isPending || !name.trim()}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || create.isPending || !name.trim()) && styles.btnPressed,
              ]}
            >
              {create.isPending ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <AppText style={styles.primaryBtnText}>Alanı oluştur</AppText>
                  <Ionicons name="arrow-forward" size={18} color={colors.surface} />
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
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  blobCoral: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accent,
    opacity: 0.08,
    ...Platform.select({
      web: { filter: 'blur(90px)' },
    }),
  },
  blobSand: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#A5A29B',
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(80px)' },
    }),
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.huge,
  },
  brandHeader: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.secondaryText,
    paddingHorizontal: spacing.lg,
  },
  formCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        boxShadow: '0px 12px 36px rgba(20, 20, 18, 0.08)',
      },
    }),
  },
  form: {
    gap: spacing.md,
  },
  suggestionsContainer: {
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  activeChipText: {
    color: colors.accent,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 54,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 20px rgba(200, 103, 75, 0.25)',
        transition: 'all 0.2s ease',
      },
      default: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
