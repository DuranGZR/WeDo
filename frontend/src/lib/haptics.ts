import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error'
  | 'none';

export const haptic = {
  selection() {
    if (!isNative) return;
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics unavailable on simulator/unsupported hardware
    }
  },

  light() {
    if (!isNative) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // noop
    }
  },

  medium() {
    if (!isNative) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // noop
    }
  },

  heavy() {
    if (!isNative) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // noop
    }
  },

  success() {
    if (!isNative) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // noop
    }
  },

  warning() {
    if (!isNative) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // noop
    }
  },

  error() {
    if (!isNative) return;
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
