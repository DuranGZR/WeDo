import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SLIDE_SPRING } from '@/components/motion/springs';

function ProgressPill({
  filled,
  active,
  reducedMotion,
}: {
  filled: boolean;
  active: boolean;
  reducedMotion: boolean;
}) {
  const fill = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    const target = filled ? 1 : 0;
    if (reducedMotion) {
      fill.set(target);
    } else {
      fill.set(withSpring(target, SLIDE_SPRING));
    }
  }, [fill, filled, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.get(),
    transform: [{ scaleX: Math.max(0.01, fill.get()) }],
  }));

  return (
    <View style={[styles.track, active && styles.trackActive]}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

export function OnboardingProgress({
  step,
  total = 4,
}: {
  step: number;
  total?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step }}
      style={styles.row}
    >
      {Array.from({ length: total }, (_, index) => {
        const position = index + 1;
        return (
          <ProgressPill
            key={position}
            filled={position <= step}
            active={position === step}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 148,
    alignSelf: 'center',
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: 'rgba(17, 17, 16, 0.08)',
  },
  trackActive: {
    backgroundColor: 'rgba(158, 127, 96, 0.18)',
  },
  fill: {
    width: '100%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#9E7F60',
  },
});
