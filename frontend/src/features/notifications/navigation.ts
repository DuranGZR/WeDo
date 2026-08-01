import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export function handleNotificationData(data: Record<string, unknown>) {
  const itemId = typeof data.item_id === 'string' ? data.item_id : undefined;
  const planId = typeof data.plan_id === 'string' ? data.plan_id : undefined;
  const spaceId = typeof data.space_id === 'string' ? data.space_id : undefined;
  if (itemId) router.push(`/item/${itemId}`);
  else if (planId) router.push('/(tabs)/lists');
  else if (spaceId) router.push(`/space/${spaceId}`);
}
export function parseDeepLink(url: string) {
  const parsed = Linking.parse(url);
  return { path: parsed.path, queryParams: parsed.queryParams };
}
