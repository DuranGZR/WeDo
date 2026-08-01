import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Screen } from '@/components/ui';
import { colors, spacing, radius } from '@/design-system';

const options = [
  { label: 'Gidilecek Yerler', emoji: '📍' },
  { label: 'İzlenecekler', emoji: '🍿' },
  { label: 'Alınacaklar', emoji: '🛒' },
  { label: 'Yapılacaklar', emoji: '📝' },
  { label: 'Tarifler', emoji: '🍳' },
  { label: 'Seyahat', emoji: '✈️' },
  { label: 'Etkinlikler', emoji: '🎟️' },
  { label: 'Okunacaklar', emoji: '📚' },
];

export default function ListTemplatesScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length < 4
          ? [...current, value]
          : current,
    );
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
        {/* Title Section */}
        <View style={styles.header}>
          <AppText variant="pageTitle" style={styles.title}>
            En çok neleri birlikte kaydediyorsunuz?
          </AppText>
          <AppText muted style={styles.subtitle}>
            En fazla dört seçenek seçebilirsin.
          </AppText>
        </View>

        {/* Choice Grid */}
        <View style={styles.grid}>
          {options.map((option) => {
            const active = selected.includes(option.label);
            return (
              <Pressable
                key={option.label}
                onPress={() => toggle(option.label)}
                style={styles.pressableCard}
              >
                <Card style={[styles.optionCard, active && styles.selectedCard]}>
                  <View style={styles.cardContent}>
                    <AppText style={styles.emoji}>{option.emoji}</AppText>
                    <AppText
                      variant="cardTitle"
                      style={[styles.cardLabel, active && styles.selectedLabel]}
                    >
                      {option.label}
                    </AppText>
                  </View>
                  {active && (
                    <View style={styles.checkIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Action Button */}
        <Pressable
          onPress={() => router.push('/space/create')}
          disabled={!selected.length}
          style={({ pressed }) => [
            styles.primaryBtn,
            (!selected.length || pressed) && styles.btnDisabled,
          ]}
        >
          <AppText style={styles.primaryBtnText}>Alanımı oluştur</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.surface} />
        </Pressable>
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
    top: -100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accent,
    opacity: 0.08,
    ...Platform.select({
      web: { filter: 'blur(80px)' },
    }),
  },
  blobSand: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#A5A29B',
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(90px)' },
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
    gap: spacing.xl,
    maxWidth: 480,
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.secondaryText,
    paddingHorizontal: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  pressableCard: {
    width: '47%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    height: 80,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 4px 20px rgba(20, 20, 18, 0.04)',
        transition: 'all 0.2s ease',
      },
    }),
  },
  selectedCard: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 24px rgba(200, 103, 75, 0.12)',
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  emoji: {
    fontSize: 22,
  },
  cardLabel: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.accent,
    fontWeight: '700',
  },
  checkIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 54,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    width: '100%',
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
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.5,
    backgroundColor: colors.accentSoft,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
    }),
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
