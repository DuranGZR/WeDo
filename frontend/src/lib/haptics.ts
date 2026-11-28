import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const PRESS_COOLDOWN_MS = 32;
const OUTCOME_COOLDOWN_MS = 60;

let hapticsEnabled = true;
let lastPressAt = 0;
let lastOutcomeAt = 0;

export type HapticStyle =
  'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' | 'none';

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

function canFirePress(): boolean {
  if (!isNative || !hapticsEnabled) return false;
  const now = Date.now();
  if (now >= lastPressAt && now - lastPressAt < PRESS_COOLDOWN_MS) return false;
  lastPressAt = now;
  return true;
}

function canFireOutcome(): boolean {
  if (!isNative || !hapticsEnabled) return false;
  const now = Date.now();
  if (now >= lastOutcomeAt && now - lastOutcomeAt < OUTCOME_COOLDOWN_MS) return false;
  lastOutcomeAt = now;
  return true;
}

export const haptic = {
  selection() {
    if (!canFirePress()) return;
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics unavailable on simulator/unsupported hardware
    }
  },

  light() {
    if (!canFirePress()) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // noop
    }
  },

  medium() {
    if (!canFirePress()) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // noop
    }
  },

  heavy() {
    if (!canFirePress()) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // noop
    }
  },

  success() {
    if (!canFireOutcome()) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // noop
    }
  },

  warning() {
    if (!canFireOutcome()) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // noop
    }
  },

  error() {
    if (!canFireOutcome()) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // noop
    }
  },

  trigger(style: HapticStyle = 'light') {
    if (style === 'none') return;
    switch (style) {
      case 'light':
        this.light();
        break;
      case 'medium':
        this.medium();
        break;
      case 'heavy':
        this.heavy();
        break;
      case 'selection':
        this.selection();
        break;
      case 'success':
        this.success();
        break;
      case 'warning':
        this.warning();
        break;
      case 'error':
        this.error();
        break;
    }
  },
};
