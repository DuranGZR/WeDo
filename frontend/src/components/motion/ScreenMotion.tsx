import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ENTER_EASING } from './springs';

/** Gently settles a screen once on mount without flashing blank on stack pop-back. */
export function ScreenMotion({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, {
      duration: 240,
      easing: ENTER_EASING,
    });
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 6 }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
