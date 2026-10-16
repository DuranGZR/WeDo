import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import {
  Animated,
  type DimensionValue,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, mono, radius, spacing } from '@/design-system';

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
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      accessibilityLabel={t('common.loading')}
      style={[
        styles.base,
        {
          height,
          width,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
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
          <Skeleton width={38} height={38} borderRadius={12} />
          <View style={{ gap: 6 }}>
            <Skeleton width={110} height={16} borderRadius={4} />
            <Skeleton width={70} height={12} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Hero / Stat Card Skeleton */}
      <SkeletonCard style={{ gap: 12, padding: spacing.lg }}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="85%" height={24} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Skeleton width={80} height={28} borderRadius={radius.pill} />
          <Skeleton width={100} height={28} borderRadius={radius.pill} />
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
        <Skeleton width={90} height={20} />
        <Skeleton width={50} height={16} />
      </View>

      {/* List Cards */}
      <View style={{ gap: spacing.md }}>
        {[1, 2, 3].map((key) => (
          <SkeletonCard key={key} style={styles.listCardSkeleton}>
            <Skeleton width={44} height={44} borderRadius={14} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="35%" height={12} />
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
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={72} height={36} borderRadius={18} />
      </View>

      {/* Identity Card */}
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: spacing.lg }}>
        <Skeleton width={64} height={64} borderRadius={32} />
        <Skeleton width={160} height={24} borderRadius={6} />
        <Skeleton width={90} height={18} borderRadius={radius.pill} />
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Skeleton width="48%" height={46} borderRadius={radius.md} />
        <Skeleton width="48%" height={46} borderRadius={radius.md} />
      </View>

      {/* Items list */}
      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        {[1, 2, 3, 4].map((key) => (
          <SkeletonCard key={key} style={styles.itemRowSkeleton}>
            <Skeleton width={72} height={72} borderRadius={12} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="30%" height={12} borderRadius={radius.pill} />
              <Skeleton width="80%" height={16} />
              <Skeleton width="50%" height={12} />
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
      <Skeleton width={40} height={40} borderRadius={20} />

      {/* Main Cover Image */}
      <Skeleton width="100%" height={240} borderRadius={18} />

      {/* Item info card */}
      <SkeletonCard style={{ gap: 14, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={64} height={22} borderRadius={radius.pill} />
          <Skeleton width={90} height={22} borderRadius={radius.pill} />
        </View>
        <Skeleton width="90%" height={26} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="75%" height={16} />
        <View style={{ height: 1, backgroundColor: '#E7E7E5', marginVertical: 4 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width={110} height={14} />
          <Skeleton width={70} height={14} />
        </View>
      </SkeletonCard>

      {/* Reactions bar */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton width="48%" height={48} borderRadius={radius.md} />
        <Skeleton width="48%" height={48} borderRadius={radius.md} />
      </View>
    </View>
  );
}

export function ShareComposeSkeleton() {
  useTranslation();
  return (
    <View style={styles.skeletonContainer}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={{ gap: 6, marginVertical: spacing.sm }}>
        <Skeleton width={180} height={28} />
        <Skeleton width={240} height={16} />
      </View>

      <SkeletonCard style={{ gap: 16, padding: spacing.lg }}>
        <Skeleton width="100%" height={56} borderRadius={12} />
        <View style={{ gap: 8 }}>
          <Skeleton width={80} height={14} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Skeleton width={90} height={36} borderRadius={radius.pill} />
            <Skeleton width={110} height={36} borderRadius={radius.pill} />
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Skeleton width={80} height={14} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Skeleton width={100} height={36} borderRadius={radius.pill} />
            <Skeleton width={120} height={36} borderRadius={radius.pill} />
          </View>
        </View>
      </SkeletonCard>

      <Skeleton
        width="100%"
        height={52}
        borderRadius={radius.md}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#C5C5C3',
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
    backgroundColor: mono.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#090909',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 3,
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
    padding: spacing.sm,
    gap: spacing.md,
  },
});
