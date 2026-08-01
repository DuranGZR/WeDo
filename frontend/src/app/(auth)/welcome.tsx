import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { radius, spacing } from '@/design-system';

const onboardingColors = {
  background: '#CFCFCD',
  ink: '#090909',
  paper: '#FFFFFF',
  line: '#8D8D8B',
} as const;

const previewCards = [
  {
    source: 'instagram.com',
    title: 'Nomo Ramen 🍜',
    detail: 'Can ekledi · 2 sa önce',
    image:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop',
    tag: 'İkiniz de istiyorsunuz',
  },
  {
    source: 'trendyol.com',
    title: 'Nike ayakkabı',
    detail: 'Duran ekledi · bugün',
    image:
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500&auto=format&fit=crop',
    tag: 'Alınacaklar',
  },
  {
    source: 'instagram.com',
    title: 'Bu filmi izleyelim mi?',
    detail: 'Can ekledi · dün',
    image:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop',
    tag: 'İzlenecekler',
  },
] as const;

type CardPose = {
  opacity: number;
  rotate: number;
  scale: number;
  translateY: number;
  zIndex: number;
};

function cardPose(index: number, activeIndex: number): CardPose {
  const position = (index - activeIndex + previewCards.length) % previewCards.length;
  if (position === 0) return { opacity: 1, rotate: -2, scale: 1, translateY: 10, zIndex: 3 };
  if (position === 1) return { opacity: 0.84, rotate: 6, scale: 0.95, translateY: -7, zIndex: 2 };
  return { opacity: 0.55, rotate: -9, scale: 0.88, translateY: -28, zIndex: 1 };
}

export default function WelcomeScreen() {
  const [deck, setDeck] = useState({ from: 0, to: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIndexRef = useRef(0);
  const cardProgress = useRef(new Animated.Value(1)).current;

  const showNextCard = useCallback(() => {
    const from = activeIndexRef.current;
    const to = (from + 1) % previewCards.length;
    activeIndexRef.current = to;
    cardProgress.stopAnimation();
    cardProgress.setValue(0);
    setDeck({ from, to });
    Animated.spring(cardProgress, {
      toValue: 1,
      speed: 16,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [cardProgress]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      showNextCard();
    }, 3500);
  }, [showNextCard]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const getCardStyle = (index: number) => {
    const from = cardPose(index, deck.from);
    const to = cardPose(index, deck.to);
    return {
      opacity: cardProgress.interpolate({ inputRange: [0, 1], outputRange: [from.opacity, to.opacity] }),
      transform: [
        {
          rotate: cardProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [`${from.rotate}deg`, `${to.rotate}deg`],
          }),
        },
        {
          translateY: cardProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [from.translateY, to.translateY],
          }),
        },
        { scale: cardProgress.interpolate({ inputRange: [0, 1], outputRange: [from.scale, to.scale] }) },
      ],
      zIndex: to.zIndex,
    };
  };

  return (
    <Screen
      scroll={true}
      backgroundColor={onboardingColors.background}
      style={styles.scroll}
      contentContainerStyle={styles.screen}
    >
      <View pointerEvents="none" style={styles.contourTop} />
      <View pointerEvents="none" style={styles.contourBottom} />

      <View style={styles.container}>
        <View style={styles.brand}>
          <AppText style={styles.brandName}>WeDo.</AppText>
          <View style={styles.brandMark}>
            <View style={[styles.markDot, styles.markDotOne]} />
            <View style={[styles.markDot, styles.markDotTwo]} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sonraki içerik kartını göster"
          onPress={() => {
            showNextCard();
            startTimer();
          }}
          style={styles.previewStage}
        >
          {previewCards.map((card, index) => (
            <Animated.View key={card.title} style={[styles.previewCard, getCardStyle(index)]}>
              <Image
                source={{ uri: card.image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardDetails}>
                <View style={styles.cardHeader}>
                  <View style={styles.sourcePill}>
                    <AppText style={styles.sourcePillText}>{card.source}</AppText>
                  </View>
                  <AppText style={styles.cardDetail} numberOfLines={1}>
                    {card.detail}
                  </AppText>
                </View>
                <AppText style={styles.previewTitle} numberOfLines={1}>
                  {card.title}
                </AppText>
                <View style={styles.previewFooter}>
                  <View style={styles.avatarPair}>
                    <View style={styles.avatar}>
                      <AppText style={styles.avatarText}>D</AppText>
                    </View>
                    <View style={[styles.avatar, styles.avatarOverlap]}>
                      <AppText style={styles.avatarText}>C</AppText>
                    </View>
                  </View>
                  <View style={styles.agreementPill}>
                    <Ionicons name="checkmark" size={12} color={onboardingColors.paper} />
                    <AppText style={styles.agreementText}>{card.tag}</AppText>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </Pressable>

        <View style={styles.copy}>
          <AppText style={styles.title}>Birlikte karar verin.</AppText>
          <AppText style={styles.subtitle}>
            Gördüğünüz her şeyi kaydedin, birlikte seçin ve planlayın.
          </AppText>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hesap oluştur"
            onPress={() => router.push('/(auth)/sign-up')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <AppText style={styles.primaryButtonText}>Başlayalım</AppText>
            <Ionicons name="arrow-forward" size={18} color={onboardingColors.paper} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Giriş yap"
            onPress={() => router.push('/(auth)/sign-in')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <AppText style={styles.secondaryButtonText}>Zaten bir hesabım var</AppText>
          </Pressable>
          <AppText style={styles.legal}>
            Devam ederek Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş
            olursunuz.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: onboardingColors.background },
  screen: { padding: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  container: {
    flex: 1,
    minHeight: 720,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  brandName: {
    color: onboardingColors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  brandMark: { flexDirection: 'row', gap: 3, transform: [{ rotate: '-38deg' }] },
  markDot: {
    width: 13,
    height: 28,
    borderRadius: 9,
    backgroundColor: onboardingColors.ink,
  },
  markDotOne: { transform: [{ translateY: 4 }] },
  markDotTwo: { transform: [{ translateY: -4 }] },
  previewStage: {
    height: 260,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  previewCard: {
    position: 'absolute',
    width: '88%',
    maxWidth: 360,
    height: 210,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: onboardingColors.paper,
    borderWidth: 1,
    borderColor: '#9C9C9A',
    ...Platform.select({
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 0,
        elevation: 5,
      },
    }),
  },
  cardImage: { width: '100%', height: 94 },
  cardDetails: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 4,
    backgroundColor: onboardingColors.paper,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  sourcePill: {
    maxWidth: 88,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: '#E8E8E6',
  },
  sourcePillText: { color: onboardingColors.ink, fontSize: 8, fontWeight: '700' },
  cardDetail: { flex: 1, color: '#666664', fontSize: 9, textAlign: 'right' },
  backCard: {
    position: 'absolute',
    width: '82%',
    height: 184,
    borderRadius: 20,
    padding: spacing.lg,
    backgroundColor: onboardingColors.ink,
    transform: [{ rotate: '-7deg' }, { translateY: -2 }],
  },
  backCardEyebrow: {
    color: onboardingColors.paper,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  backCardLine: {
    width: '56%',
    height: 8,
    marginTop: spacing.lg,
    borderRadius: 4,
    backgroundColor: '#4F4F4E',
  },
  backCardLineShort: {
    width: '32%',
    height: 8,
    marginTop: spacing.sm,
    borderRadius: 4,
    backgroundColor: '#4F4F4E',
  },
  frontCard: {
    width: '92%',
    maxWidth: 380,
    minHeight: 208,
    padding: spacing.lg,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: onboardingColors.paper,
    borderWidth: 1,
    borderColor: '#A6A6A4',
    ...Platform.select({
      web: { boxShadow: '0px 16px 0px rgba(0, 0, 0, 0.13)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 0,
        elevation: 7,
      },
    }),
  },
  inkWave: {
    position: 'absolute',
    width: 230,
    height: 100,
    left: -34,
    top: -52,
    borderRadius: 80,
    backgroundColor: onboardingColors.ink,
    transform: [{ rotate: '9deg' }],
  },
  waveCutout: {
    position: 'absolute',
    width: 146,
    height: 72,
    left: 56,
    top: -30,
    borderRadius: 50,
    backgroundColor: onboardingColors.paper,
    transform: [{ rotate: '-14deg' }],
  },
  previewHeader: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#E7E7E5',
  },
  previewPillText: {
    color: onboardingColors.ink,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  previewBody: { gap: 4, marginTop: spacing.md },
  previewTitle: {
    color: onboardingColors.ink,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  previewMeta: { color: '#666664', fontSize: 11, lineHeight: 15 },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  avatarPair: { flexDirection: 'row' },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7E7E5',
    borderWidth: 1.5,
    borderColor: onboardingColors.paper,
  },
  avatarOverlap: { marginLeft: -8, backgroundColor: '#B7B7B5' },
  avatarText: { color: onboardingColors.ink, fontSize: 10, fontWeight: '700' },
  agreementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '64%',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: onboardingColors.ink,
  },
  agreementText: { color: onboardingColors.paper, fontSize: 8, fontWeight: '600' },
  copy: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  title: {
    color: onboardingColors.ink,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 310,
    color: '#5F5F5D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: { gap: spacing.sm },
  primaryButton: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 9,
    backgroundColor: onboardingColors.ink,
  },
  primaryButtonText: { color: onboardingColors.paper, fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: onboardingColors.paper,
    borderWidth: 1,
    borderColor: '#A1A19F',
  },
  secondaryButtonText: { color: onboardingColors.ink, fontSize: 14, fontWeight: '700' },
  legal: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    color: '#5F5F5D',
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  contourTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    right: -136,
    top: -116,
    borderWidth: 1,
    borderColor: '#888886',
    borderRadius: 98,
    transform: [{ rotate: '28deg' }],
  },
  contourBottom: {
    position: 'absolute',
    width: 190,
    height: 230,
    left: -150,
    bottom: 94,
    borderWidth: 1,
    borderColor: '#888886',
    borderRadius: 90,
    transform: [{ rotate: '-28deg' }],
  },
});
