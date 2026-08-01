import {
  withAndroidManifest,
  withInfoPlist,
  type ConfigPlugin,
} from 'expo/config-plugins';

const withShareIntegration: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (mod) => {
    const groups =
      (mod.modResults['com.apple.security.application-groups'] as string[] | undefined) ??
      [];
    mod.modResults['com.apple.security.application-groups'] = [
      ...new Set([...groups, 'group.com.wedo.app']),
    ];
    return mod;
  });
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) return mod;
    application.activity = application.activity ?? [];
    const exists = application.activity.some(
      (activity) =>
        activity['$']?.['android:name'] === 'com.wedo.share.ShareReceiverActivity',
    );
    if (!exists)
      application.activity.push({
        $: {
          'android:name': 'com.wedo.share.ShareReceiverActivity',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
            category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
            data: [{ $: { 'android:mimeType': 'text/plain' } }],
          },
        ],
      });
    return mod;
  });
};

export default withShareIntegration;
