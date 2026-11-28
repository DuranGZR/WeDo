import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { PRESS_SPRING } from '@/components/motion/springs';
import { colors, radius, shadows, spacing } from '@/design-system';
import { t } from '@/i18n';
import { useHapticsStore } from '@/store/haptics-store';
import { AppText } from './AppText';

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6;

export function HapticsToggle() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const enabled = useHapticsStore((state) => state.enabled);
  const setEnabled = useHapticsStore((state) => state.setEnabled);
  const progress = useSharedValue(enabled ? 1 : 0);

  useEffect(() => {
    const target = enabled ? 1 : 0;
    if (reducedMotion) {
      progress.set(target);
    } else {
      progress.set(withSpring(target, PRESS_SPRING));
    }
  }, [enabled, progress, reducedMotion]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], ['#E5DFD6', '#9E7F60']),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * THUMB_TRAVEL }],
  }));

  return (
    <SpringPressable
      accessibilityRole="switch"
      accessibilityLabel={t('settings.hapticFeedback')}
      accessibilityState={{ checked: enabled }}
      pressScale={0.985}
      haptic="none"
      onPress={() => void setEnabled(!enabled)}
      style={styles.row}
    >
      <View style={styles.iconBadge}>
        <Ionicons name="radio-outline" size={18} color="#9E7F60" />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title}>{t('settings.hapticFeedback')}</AppText>
        <AppText variant="caption" muted style={styles.description}>
          {t('settings.hapticFeedbackDescription')}
        </AppText>
      </View>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    ...shadows.glass,
  },
});
