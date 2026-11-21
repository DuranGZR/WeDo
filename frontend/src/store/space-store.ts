import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SELECTED_SPACE_KEY = 'wedo.selected-space';
let hydration: Promise<void> | null = null;
let selectionChanged = false;

type SpaceState = {
  selectedSpaceId?: string;
  hydrate: () => Promise<void>;
  setSelectedSpaceId: (spaceId?: string) => void;
};

export const useSpaceStore = create<SpaceState>((set) => ({
  selectedSpaceId: undefined,
  hydrate() {
    if (!hydration) {
      hydration = AsyncStorage.getItem(SELECTED_SPACE_KEY)
        .then((selectedSpaceId) => {
          // A late storage read must not undo a new selection or an account reset.
          if (!selectionChanged && selectedSpaceId) set({ selectedSpaceId });
        })
        .catch(() => {
          // Keep the default space usable when device storage is unavailable.
        });
    }
    return hydration;
  },
  setSelectedSpaceId: (selectedSpaceId) => {
    selectionChanged = true;
    set({ selectedSpaceId });
    void (
      selectedSpaceId
        ? AsyncStorage.setItem(SELECTED_SPACE_KEY, selectedSpaceId)
        : AsyncStorage.removeItem(SELECTED_SPACE_KEY)
    ).catch(() => {
      // The current selection still works if saving it fails.
    });
  },
}));
