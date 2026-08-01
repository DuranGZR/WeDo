import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function ScreenMotion({ children }: { children: React.ReactNode }) {
  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
      return () => cancelAnimation(progress);
    }, [progress]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
