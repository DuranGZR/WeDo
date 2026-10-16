const { withAndroidManifest, withInfoPlist } = require('expo/config-plugins');

const withShareIntegration = (config) => {
  config = withInfoPlist(config, (mod) => {
    const groups = mod.modResults['com.apple.security.application-groups'] || [];
    mod.modResults['com.apple.security.application-groups'] = [
      ...new Set([...groups, `group.${config.ios.bundleIdentifier}`]),
    ];
    return mod;
  });
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) return mod;
    application.activity = application.activity || [];
    const exists = application.activity.some(
      (activity) =>
        activity['$']?.['android:name'] === 'com.wedo.share.ShareReceiverActivity',
    );
    if (!exists) {
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
    }
    return mod;
  });
};

module.exports = withShareIntegration;
