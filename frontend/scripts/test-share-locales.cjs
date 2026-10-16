const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { withXcodeProject } = require('expo/config-plugins');
const withShareLocales = require('../plugins/withShareLocales');
const sharePluginRoot = path.dirname(require.resolve('expo-share-intent/package.json'));
const { writeShareExtensionFiles } = require(
  path.join(sharePluginRoot, 'plugin/build/ios/writeIosShareExtensionFiles'),
);

test('localizes generated extension files after Xcode mods, including repeated runs', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wedo-share-'));
  try {
    const extensionName = 'WeDoShare';
    let config = { name: 'WeDo', ios: { bundleIdentifier: 'com.durangezer.wedo' } };
    config = withXcodeProject(config, async (mod) => {
      await writeShareExtensionFiles(
        root,
        'wedo',
        config.ios.bundleIdentifier,
        {
          iosShareExtensionName: extensionName,
        },
        config.name,
      );
      return mod;
    });
    config = withShareLocales(config, { extensionName });
    const filename = path.join(root, extensionName, 'ShareExtension-Info.plist');
    await assert.rejects(fs.readFile(filename), { code: 'ENOENT' });
    const modConfig = { ...config, modRequest: { platformProjectRoot: root } };
    await config.mods.ios.xcodeproj(modConfig);
    for (let run = 0; run < 2; run += 1) {
      await config.mods.ios.finalized(modConfig);
      const content = await fs.readFile(filename, 'utf8');
      assert.match(content, /<key>CFBundleDisplayName<\/key>\s*<string>WeDo<\/string>/);
      assert.match(
        content,
        /<key>CFBundleDevelopmentRegion<\/key>\s*<string>en<\/string>/,
      );
      assert.match(
        content,
        /<key>CFBundleLocalizations<\/key>\s*<array><string>tr<\/string><string>en<\/string><\/array>/,
      );
      assert.equal(content.match(/<key>CFBundleLocalizations<\/key>/g).length, 1);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
