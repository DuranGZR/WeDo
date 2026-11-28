import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ListsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'ios_from_right' : 'default',
        animationTypeForReplace: 'push',
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
      }}
    />
  );
}
