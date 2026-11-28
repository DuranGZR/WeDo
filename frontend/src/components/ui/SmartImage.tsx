import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ImageStyle, type StyleProp, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/design-system';
import { t } from '@/i18n';
import { AppText } from './AppText';

type SmartImageProps = {
  uri: string;
  fallbackUri?: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  pending?: boolean;
  compact?: boolean;
};

/** Memory+disk cached image with fallback URL recovery and pending-metadata shimmer overlay. */
export function SmartImage({
  uri,
  fallbackUri,
  style,
  contentFit = 'cover',
  pending = false,
  compact = false,
}: SmartImageProps) {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const pulse = useSharedValue(0.42);

  const hasErrorForCurrent = failedUri === uri;
  const resolvedUri = hasErrorForCurrent && fallbackUri ? fallbackUri : uri;

  useEffect(() => {
    if (!pending) return;
    if (reducedMotion) {
      pulse.set(0.68);
      return;
    }
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(0.86, { duration: 780, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0.38, { duration: 780, easing: Easing.inOut(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );
  }, [pending, pulse, reducedMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: pulse.get(),
  }));

  return (
    <View style={[styles.wrap, style]}>
      <ExpoImage
        source={{ uri: resolvedUri }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        transition={220}
        onError={() => {
          if (!hasErrorForCurrent) setFailedUri(uri);
        }}
      />
      {pending ? (
        <Animated.View pointerEvents="none" style={[styles.pendingOverlay, shimmerStyle]}>
          <View style={[styles.pendingPill, compact && styles.pendingPillCompact]}>
            <Ionicons name="sparkles-outline" size={compact ? 11 : 12} color="#FFFFFF" />
            {!compact ? (
              <AppText style={styles.pendingText} numberOfLines={1}>
                {t('items.previewLoading')}
              </AppText>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(158, 127, 96, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(17, 17, 16, 0.66)',
  },
  pendingPillCompact: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
});
