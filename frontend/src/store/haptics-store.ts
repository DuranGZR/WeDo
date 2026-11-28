import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { haptic, setHapticsEnabled } from '@/lib/haptics';

const HAPTICS_ENABLED_KEY = 'wedo.haptics-enabled';
let hydration: Promise<void> | null = null;
let changedByUser = false;

type HapticsState = {
  enabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
};

export const useHapticsStore = create<HapticsState>((set) => ({
  enabled: true,
  hydrated: false,
  hydrate() {
    if (!hydration) {
      hydration = AsyncStorage.getItem(HAPTICS_ENABLED_KEY)
        .then((saved) => {
          if (changedByUser) {
            set({ hydrated: true });
            return;
          }
          const enabled = saved !== 'false';
          setHapticsEnabled(enabled);
          set({ enabled, hydrated: true });
        })
        .catch(() => {
          // Keep haptics usable even when persistent storage is unavailable.
          set({ hydrated: true });
        });
    }
    return hydration;
  },
  async setEnabled(enabled) {
    changedByUser = true;
    setHapticsEnabled(enabled);
    set({ enabled });
    if (enabled) {
      haptic.selection();
    }
    try {
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch {
      // Preference still applies for the active session if persistence fails.
    }
  },
}));
