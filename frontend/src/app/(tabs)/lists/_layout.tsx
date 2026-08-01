import { Stack } from 'expo-router';
export default function ListsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'ios_from_right',
        animationTypeForReplace: 'push',
      }}
    />
  );
}
