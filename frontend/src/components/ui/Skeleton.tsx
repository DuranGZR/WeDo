import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
  type DimensionValue,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, shadows, spacing } from '@/design-system';

export function Skeleton({
  height = 18,
  width = '100%',
  borderRadius = radius.sm,
  style,
}: {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(reducedMotion ? 0.55 : 0.35);

  useEffect(() => {
    if (reducedMotion) {
      pulse.set(0.55);
      return;
    }
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(0.84, { duration: 820, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0.36, { duration: 820, easing: Easing.inOut(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );
  }, [pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.get(),
  }));

  return (
    <Animated.View
      accessibilityLabel={t('common.loading')}
      style={[styles.base, { height, width, borderRadius }, style, pulseStyle]}
    />
  );
}

export function SkeletonCard({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  useTranslation();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function HomeScreenSkeleton() {
  useTranslation();
  return (
    <View style={styles.skeletonContainer}>
      {/* Top Bar Skeleton */}
      <View style={styles.topBarSkeleton}>
        <View style={styles.spaceSelectorSkeleton}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={{ gap: 6 }}>
            <Skeleton width={110} height={15} borderRadius={6} />
            <Skeleton width={70} height={11} borderRadius={6} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>
      </View>

      {/* Hero / Stat Card Skeleton */}
      <SkeletonCard style={{ gap: 12, padding: spacing.lg }}>
        <Skeleton width="45%" height={14} borderRadius={6} />
        <Skeleton width="85%" height={24} borderRadius={8} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Skeleton width={88} height={30} borderRadius={radius.pill} />
          <Skeleton width={108} height={30} borderRadius={radius.pill} />
        </View>
      </SkeletonCard>

      {/* Lists Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Skeleton width={90} height={20} borderRadius={6} />
        <Skeleton width={50} height={16} borderRadius={6} />
      </View>

      {/* List Cards */}
      <View style={{ gap: spacing.md }}>
        {[1, 2, 3].map((key) => (
          <SkeletonCard key={key} style={styles.listCardSkeleton}>
            <Skeleton width={44} height={44} borderRadius={16} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="60%" height={16} borderRadius={6} />
              <Skeleton width="35%" height={12} borderRadius={6} />
            </View>
            <Skeleton width={20} height={20} borderRadius={10} />
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

export function ListDetailSkeleton() {
  useTranslation();
  return (
    <View style={styles.skeletonContainer}>
      {/* Header bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <Skeleton width={76} height={38} borderRadius={radius.pill} />
      </View>

      {/* Identity Card */}
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: spacing.lg }}>
        <Skeleton width={64} height={64} borderRadius={32} />
        <Skeleton width={160} height={24} borderRadius={8} />
        <Skeleton width={90} height={20} borderRadius={radius.pill} />
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Skeleton width="48%" height={46} borderRadius={radius.pill} />
        <Skeleton width="48%" height={46} borderRadius={radius.pill} />
      </View>

      {/* Items list */}
      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        {[1, 2, 3, 4].map((key) => (
          <SkeletonCard key={key} style={styles.itemRowSkeleton}>
            <Skeleton width={74} height={74} borderRadius={16} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="30%" height={14} borderRadius={radius.pill} />
              <Skeleton width="80%" height={16} borderRadius={6} />
              <Skeleton width="50%" height={12} borderRadius={6} />
            </View>
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

export function ItemDetailSkeleton() {
  useTranslation();
  return (
    <View style={styles.skeletonContainer}>
      {/* Top Back */}
      <Skeleton width={44} height={44} borderRadius={22} />

      {/* Main Cover Image */}
      <Skeleton width="100%" height={240} borderRadius={24} />

      {/* Item info card */}
      <SkeletonCard style={{ gap: 14, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={64} height={22} borderRadius={radius.pill} />
          <Skeleton width={90} height={22} borderRadius={radius.pill} />
        </View>
        <Skeleton width="90%" height={26} borderRadius={8} />
        <Skeleton width="100%" height={16} borderRadius={6} />
        <Skeleton width="75%" height={16} borderRadius={6} />
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width={110} height={14} borderRadius={6} />
          <Skeleton width={70} height={14} borderRadius={6} />
        </View>
      </SkeletonCard>

      {/* Reactions bar */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton width="48%" height={50} borderRadius={radius.pill} />
        <Skeleton width="48%" height={50} borderRadius={radius.pill} />
      </View>
    </View>
  );
}

export function ShareComposeSkeleton() {
  useTranslation();
  return (
    <View style={styles.skeletonContainer}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={{ gap: 6, marginVertical: spacing.sm }}>
        <Skeleton width={180} height={28} borderRadius={8} />
        <Skeleton width={240} height={16} borderRadius={6} />
      </View>

      <SkeletonCard style={{ gap: 16, padding: spacing.lg }}>
        <Skeleton width="100%" height={56} borderRadius={16} />
        <View style={{ gap: 8 }}>
          <Skeleton width={80} height={14} borderRadius={6} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Skeleton width={90} height={36} borderRadius={radius.pill} />
            <Skeleton width={110} height={36} borderRadius={radius.pill} />
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Skeleton width={80} height={14} borderRadius={6} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Skeleton width={100} height={36} borderRadius={radius.pill} />
            <Skeleton width={120} height={36} borderRadius={radius.pill} />
          </View>
        </View>
      </SkeletonCard>

      <Skeleton
        width="100%"
        height={50}
        borderRadius={radius.pill}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#E5DFD6',
  },
  skeletonContainer: {
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  topBarSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  spaceSelectorSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  listCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  itemRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    gap: spacing.md,
  },
});
