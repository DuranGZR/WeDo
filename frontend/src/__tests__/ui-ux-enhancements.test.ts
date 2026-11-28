import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { haptic, isHapticsEnabled, setHapticsEnabled } from '@/lib/haptics';
import { useHapticsStore } from '@/store/haptics-store';

describe('UI/UX Enhancements & Haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true);
    useHapticsStore.setState({ enabled: true, hydrated: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes safe haptic trigger methods for native and fallback environments', () => {
    expect(() => haptic.trigger('light')).not.toThrow();
    expect(() => haptic.trigger('medium')).not.toThrow();
    expect(() => haptic.trigger('heavy')).not.toThrow();
    expect(() => haptic.trigger('selection')).not.toThrow();
    expect(() => haptic.trigger('success')).not.toThrow();
    expect(() => haptic.trigger('warning')).not.toThrow();
    expect(() => haptic.trigger('error')).not.toThrow();
    expect(() => haptic.trigger('none')).not.toThrow();
  });

  it('throttles rapid consecutive press haptics while never swallowing outcome haptics', () => {
    let now = Date.now() + 1_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    haptic.selection();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

    // Within 32ms press cooldown: suppressed
    now += 10;
    haptic.light();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();

    // Outcome notification fires independently of press cooldown
    now += 5;
    haptic.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );

    // After cooldown expires: next press fires normally
    now += 50;
    haptic.medium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('silences haptics when disabled and persists preference via useHapticsStore', async () => {
    let now = Date.now() + 5_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    await useHapticsStore.getState().setEnabled(false);
    expect(isHapticsEnabled()).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('wedo.haptics-enabled', 'false');

    haptic.light();
    haptic.success();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();

    now += 100;
    await useHapticsStore.getState().setEnabled(true);
    expect(isHapticsEnabled()).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('wedo.haptics-enabled', 'true');
    // Re-enabling triggers a confirmation selection haptic
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });
});
