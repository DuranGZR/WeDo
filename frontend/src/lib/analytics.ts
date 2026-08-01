type AnalyticsProperties = Record<string, string | number | boolean | null>;
export function track(event: string, properties?: AnalyticsProperties) {
  if (__DEV__) console.info('wedo.analytics', event, properties);
}
