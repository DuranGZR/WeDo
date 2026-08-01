import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SELECTED_SPACE_KEY = 'wedo.selected-space';

type SpaceState = {
  selectedSpaceId?: string;
  setSelectedSpaceId: (spaceId: string) => void;
};

export const useSpaceStore = create<SpaceState>((set) => ({
  selectedSpaceId: undefined,
  setSelectedSpaceId: (selectedSpaceId) => {
    set({ selectedSpaceId });
    void AsyncStorage.setItem(SELECTED_SPACE_KEY, selectedSpaceId);
  },
}));

void AsyncStorage.getItem(SELECTED_SPACE_KEY)
  .then((selectedSpaceId) => {
    if (selectedSpaceId) useSpaceStore.setState({ selectedSpaceId });
  })
  .catch(() => {
    // Alan seçimi saklanamasa da uygulama varsayılan alanla çalışmaya devam eder.
  });
