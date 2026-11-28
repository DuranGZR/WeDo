import { Easing, LinearTransition } from 'react-native-reanimated';

export const ENTER_EASING = Easing.out(Easing.cubic);

export const PRESS_SPRING = {
  damping: 24,
  stiffness: 340,
  mass: 0.75,
} as const;

export const SLIDE_SPRING = {
  damping: 30,
  stiffness: 300,
  mass: 0.85,
} as const;

export const SHEET_SPRING = {
  damping: 32,
  stiffness: 280,
  mass: 0.9,
} as const;

export const LAYOUT_SPRING = LinearTransition.duration(180).easing(ENTER_EASING);
