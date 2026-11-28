import { useCallback } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { haptic, type HapticStyle } from '@/lib/haptics';
import { PRESS_SPRING } from './springs';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SpringPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  pressOpacity?: number;
  haptic?: HapticStyle;
};

/** Physical UI-thread spring pressable that degrades cleanly when Reduce Motion is active. */
export function SpringPressable({
  style,
  pressScale = 0.965,
  pressOpacity = 0.92,
  haptic: hapticStyle,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...props
}: SpringPressableProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn: NonNullable<PressableProps['onPressIn']> = useCallback(
    (event) => {
      if (!disabled) {
        if (hapticStyle && hapticStyle !== 'none') {
          haptic.trigger(hapticStyle);
        }
        if (reducedMotion) {
          opacity.set(pressOpacity);
        } else {
          cancelAnimation(scale);
          cancelAnimation(opacity);
          scale.set(withSpring(pressScale, PRESS_SPRING));
          opacity.set(withSpring(pressOpacity, PRESS_SPRING));
        }
      }
      onPressIn?.(event);
    },
    [
      disabled,
      hapticStyle,
      onPressIn,
      opacity,
      pressOpacity,
      pressScale,
      reducedMotion,
      scale,
    ],
  );

  const handlePressOut: NonNullable<PressableProps['onPressOut']> = useCallback(
    (event) => {
      if (reducedMotion) {
        opacity.set(1);
      } else {
        scale.set(withSpring(1, PRESS_SPRING));
        opacity.set(withSpring(1, PRESS_SPRING));
      }
      onPressOut?.(event);
    },
    [onPressOut, opacity, reducedMotion, scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: opacity.get(),
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
