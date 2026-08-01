/**
 * Keeps Expo Router on the incoming share route while expo-share-intent
 * retrieves the payload from the native iOS extension or Android intent.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('dataUrl=')) return '/(share)/compose';
  return path;
}
