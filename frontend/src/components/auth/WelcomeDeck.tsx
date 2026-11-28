import { Ionicons } from '@expo/vector-icons';
import { t } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { colors, radius } from '@/design-system';
import { haptic } from '@/lib/haptics';

const DRAG_DISTANCE_PX = 160;

const ORBIT_SPRING = {
  damping: 20,
  stiffness: 180,
  mass: 0.85,
} as const;

export const WELCOME_PREVIEW_CARDS = [
  {
    id: 'ramen',
    source: 'instagram.com',
    icon: 'logo-instagram' as const,
    iconColor: '#D62976',
    title: 'Nomo Ramen 🍜',
    get detail() {
      return t('auth.canAddedThis2hAgo');
    },
    image:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
    get tag() {
      return t('auth.youBothWantThis');
    },
  },
  {
    id: 'shopping',
    source: 'trendyol.com',
    icon: 'bag-handle' as const,
    iconColor: '#9E7F60',
    get title() {
      return t('auth.nikeShoes');
    },
    get detail() {
      return t('auth.pekAddedThisToday');
    },
    image:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop',
    get tag() {
      return t('common.shopping');
    },
  },
  {
    id: 'watchlist',
    source: 'instagram.com',
    icon: 'film' as const,
    iconColor: '#111110',
    get title() {
      return t('auth.shallWeWatchThisMovie');
    },
    get detail() {
      return t('auth.canAddedThisYesterday');
    },
    image:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
    get tag() {
      return t('common.watchlist');
    },
  },
] as const;

type PreviewCard = (typeof WELCOME_PREVIEW_CARDS)[number];

const CARD_COUNT = WELCOME_PREVIEW_CARDS.length;

function GalleryDeckCard({
  card,
  index,
  isFront,
  stepPos,
  dragShift,
  spread,
  idleFloat,
  reducedMotion,
}: {
  card: PreviewCard;
  index: number;
  isFront: boolean;
  stepPos: SharedValue<number>;
  dragShift: SharedValue<number>;
  spread: SharedValue<number>;
  idleFloat: SharedValue<number>;
  reducedMotion: boolean;
}) {
  const badgeScale = useSharedValue(1);
  const wasFront = useSharedValue(isFront);

  useEffect(() => {
    const justArrived = isFront && !wasFront.get();
    wasFront.set(isFront);
    if (justArrived && !reducedMotion) {
      badgeScale.set(
        withSequence(
          withDelay(120, withSpring(1.09, { damping: 12, stiffness: 320, mass: 0.55 })),
          withSpring(1, { damping: 16, stiffness: 250, mass: 0.7 }),
        ),
      );
    }
  }, [badgeScale, isFront, reducedMotion, wasFront]);

  // Keep cards fully opaque with no rotateY so iOS zIndex layers cleanly without bleed-through.
  const cardStyle = useAnimatedStyle(() => {
    const spreadVal = spread.get();
    const pos = stepPos.get() + dragShift.get();
    let diff = (((index - pos) % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
    if (diff > 1.5) diff -= CARD_COUNT;

    const absDiff = Math.abs(diff);

    const orbitX = interpolate(
      diff,
      [-1.5, -1, 0, 1, 1.5],
      [0, -56, 0, 56, 0],
      Extrapolation.CLAMP,
    );
    const orbitY = interpolate(absDiff, [0, 1, 1.5], [0, 14, 24], Extrapolation.CLAMP);
    const orbitRotZ = interpolate(
      diff,
      [-1.5, -1, 0, 1, 1.5],
      [0, -6.5, 0, 6.5, 0],
      Extrapolation.CLAMP,
    );
    const orbitScale = interpolate(
      absDiff,
      [0, 1, 1.5],
      [1, 0.86, 0.76],
      Extrapolation.CLAMP,
    );

    const floatWeight = interpolate(absDiff, [0, 0.45], [1, 0], Extrapolation.CLAMP);
    const floatOffset = idleFloat.get() * floatWeight;
    const zIndex = absDiff < 0.48 ? 30 : absDiff < 1.15 ? 20 : 5;

    return {
      opacity: spreadVal,
      zIndex,
      transform: [
        { translateX: orbitX * spreadVal },
        { translateY: interpolate(spreadVal, [0, 1], [18, orbitY]) + floatOffset },
        { rotateZ: `${orbitRotZ * spreadVal}deg` },
        { scale: interpolate(spreadVal, [0, 1], [0.88, orbitScale]) },
      ],
    };
  });

  const parallaxImageStyle = useAnimatedStyle(() => {
    const pos = stepPos.get() + dragShift.get();
    let diff = (((index - pos) % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
    if (diff > 1.5) diff -= CARD_COUNT;
    const absDiff = Math.abs(diff);
    return {
      transform: [
        { translateX: interpolate(diff, [-1, 0, 1], [10, 0, -10], Extrapolation.CLAMP) },
        { scale: interpolate(absDiff, [0, 1], [1.04, 1.1], Extrapolation.CLAMP) },
      ],
    };
  });

  const footerFadeStyle = useAnimatedStyle(() => {
    const pos = stepPos.get() + dragShift.get();
    let diff = (((index - pos) % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
    if (diff > 1.5) diff -= CARD_COUNT;
    const absDiff = Math.abs(diff);
    return {
      opacity: interpolate(absDiff, [0, 0.38, 1], [1, 0.25, 0.08], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(absDiff, [0, 0.6], [0, 5], Extrapolation.CLAMP) },
      ],
    };
  });

  const sideVeilStyle = useAnimatedStyle(() => {
    const pos = stepPos.get() + dragShift.get();
    let diff = (((index - pos) % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
    if (diff > 1.5) diff -= CARD_COUNT;
    const absDiff = Math.abs(diff);
    return {
      opacity: interpolate(absDiff, [0, 0.35, 1], [0, 0.2, 0.38], Extrapolation.CLAMP),
    };
  });

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.get() }],
  }));

  return (
    <Animated.View style={[styles.galleryCard, cardStyle]}>
      <View style={styles.mediaWindow}>
        <Animated.Image
          source={{ uri: card.image }}
          style={[styles.mediaImage, parallaxImageStyle]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(17, 17, 16, 0)', 'rgba(17, 17, 16, 0.56)']}
          locations={[0.56, 1]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[styles.mediaTopRow, footerFadeStyle]}>
          <View style={styles.sourcePill}>
            <Ionicons name={card.icon} size={11} color={card.iconColor} />
            <AppText style={styles.sourceText}>{card.source}</AppText>
          </View>
          <View style={styles.bookmarkCircle}>
            <Ionicons name="bookmark" size={11} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.mediaBottomRow, footerFadeStyle]}>
          <AppText style={styles.metaCaption} numberOfLines={1}>
            {card.detail}
          </AppText>
        </Animated.View>
      </View>

      <Animated.View style={[styles.cardFooter, footerFadeStyle]}>
        <AppText style={styles.cardTitle} numberOfLines={1}>
          {card.title}
        </AppText>
        <View style={styles.actionRow}>
          <View style={styles.avatarPair}>
            <View style={[styles.avatar, styles.avatarPrimary]}>
              <AppText style={styles.avatarPrimaryText}>D</AppText>
            </View>
            <View style={[styles.avatar, styles.avatarPartner]}>
              <AppText style={styles.avatarPartnerText}>C</AppText>
            </View>
          </View>

          <Animated.View style={[styles.agreementPill, badgeStyle]}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={10} color="#111110" />
            </View>
            <AppText style={styles.agreementText} numberOfLines={1}>
              {card.tag}
            </AppText>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.sideVeil, sideVeilStyle]}
      />
    </Animated.View>
  );
}

function DeckDot({
  label,
  active,
  reducedMotion,
  onPress,
}: {
  label: string;
  active: boolean;
  reducedMotion: boolean;
  onPress: () => void;
}) {
  const width = useSharedValue(active ? 24 : 7);

  useEffect(() => {
    const target = active ? 24 : 7;
    if (reducedMotion) {
      width.set(target);
    } else {
      width.set(withSpring(target, { damping: 18, stiffness: 260, mass: 0.7 }));
    }
  }, [active, reducedMotion, width]);

  const dotStyle = useAnimatedStyle(() => ({
    width: width.get(),
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onPress}
    >
      <Animated.View style={[styles.dot, active && styles.dotActive, dotStyle]} />
    </Pressable>
  );
}

export function WelcomeDeck() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepPos = useSharedValue(0);
  const dragShift = useSharedValue(0);
  const spread = useSharedValue(reducedMotion ? 1 : 0);
  const idleFloat = useSharedValue(0);

  const stepBy = useCallback(
    (delta: number) => {
      const nextStep = stepPos.get() + delta;
      stepPos.set(nextStep);
      setActiveIndex(((nextStep % CARD_COUNT) + CARD_COUNT) % CARD_COUNT);

      if (reducedMotion) {
        dragShift.set(0);
      } else {
        dragShift.set(dragShift.get() - delta);
        dragShift.set(withSpring(0, ORBIT_SPRING));
      }
    },
    [dragShift, reducedMotion, stepPos],
  );

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      stepBy(1);
    }, 4200);
  }, [stepBy]);

  useEffect(() => {
    if (reducedMotion) {
      spread.set(1);
      idleFloat.set(0);
    } else {
      spread.set(
        withDelay(110, withSpring(1, { damping: 16, stiffness: 175, mass: 0.85 })),
      );
      idleFloat.set(
        withDelay(
          750,
          withRepeat(
            withSequence(
              withTiming(-3.5, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
              withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
            ),
            -1,
            false,
          ),
        ),
      );
    }
  }, [idleFloat, reducedMotion, spread]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const handleTapAdvance = useCallback(() => {
    haptic.selection();
    stepBy(1);
    resetTimer();
  }, [resetTimer, stepBy]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_evt, gesture) => {
          dragShift.set(-gesture.dx / DRAG_DISTANCE_PX);
        },
        onPanResponderRelease: (_evt, gesture) => {
          const swiped = Math.abs(gesture.dx) > 46 || Math.abs(gesture.vx) > 0.4;
          if (swiped) {
            const delta = gesture.dx < 0 ? 1 : -1;
            haptic.light();
            stepBy(delta);
            resetTimer();
          } else {
            dragShift.set(withSpring(0, ORBIT_SPRING));
          }
        },
        onPanResponderTerminate: () => {
          dragShift.set(withSpring(0, ORBIT_SPRING));
        },
      }),
    [dragShift, resetTimer, stepBy],
  );

  return (
    <View style={styles.wrapper}>
      <Pressable
        {...panResponder.panHandlers}
        accessibilityRole="button"
        accessibilityLabel={t('auth.showTheNextSavedItem')}
        onPress={handleTapAdvance}
        style={styles.previewStage}
      >
        {WELCOME_PREVIEW_CARDS.map((card, index) => (
          <GalleryDeckCard
            key={card.id}
            card={card}
            index={index}
            isFront={index === activeIndex}
            stepPos={stepPos}
            dragShift={dragShift}
            spread={spread}
            idleFloat={idleFloat}
            reducedMotion={reducedMotion}
          />
        ))}
      </Pressable>

      <View style={styles.dotsRow} accessibilityRole="tablist">
        {WELCOME_PREVIEW_CARDS.map((card, index) => (
          <DeckDot
            key={card.id}
            label={card.title}
            active={index === activeIndex}
            reducedMotion={reducedMotion}
            onPress={() => {
              const delta = index - activeIndex;
              if (delta === 0) return;
              haptic.selection();
              const shortest = delta === 2 ? -1 : delta === -2 ? 1 : delta;
              stepBy(shortest);
              resetTimer();
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 14,
  },
  previewStage: {
    height: 312,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  galleryCard: {
    position: 'absolute',
    width: 274,
    height: 290,
    padding: 9,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17, 17, 16, 0.08)',
    shadowColor: '#2E2318',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
  sideVeil: {
    backgroundColor: '#F3EFE9',
    borderRadius: 28,
  },
  mediaWindow: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#EFECE6',
    justifyContent: 'space-between',
    padding: 10,
  },
  mediaImage: {
    ...StyleSheet.absoluteFill,
  },
  mediaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  sourceText: {
    color: '#111110',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  bookmarkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#9E7F60',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  mediaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCaption: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 3,
    gap: 8,
  },
  cardTitle: {
    color: colors.primaryText,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarPair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarPrimary: {
    backgroundColor: '#A68462',
  },
  avatarPrimaryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarPartner: {
    marginLeft: -8,
    backgroundColor: '#EBE5DC',
  },
  avatarPartnerText: {
    color: '#111110',
    fontSize: 10,
    fontWeight: '700',
  },
  agreementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '72%',
    paddingLeft: 5,
    paddingRight: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D8BE9F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreementText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(17, 17, 16, 0.16)',
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
});
