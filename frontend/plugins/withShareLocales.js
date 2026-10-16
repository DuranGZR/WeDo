const { withXcodeProject } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

// expo-share-intent writes this plist in its Xcode project mod. Register this
// plugin after it so system-owned Share sheet controls support both languages.
module.exports = (config) =>
  withXcodeProject(config, async (mod) => {
    const filename = path.join(
      mod.modRequest.platformProjectRoot,
      'WeDo',
      'ShareExtension-Info.plist',
    );
    let content = await fs.readFile(filename, 'utf8');
    content = content.replace(
      /(<key>CFBundleDevelopmentRegion<\/key>\s*<string>)[^<]*(<\/string>)/,
      '$1en$2',
    );
    if (!content.includes('<key>CFBundleLocalizations</key>')) {
      content = content.replace(
        '<key>NSExtension</key>',
        '<key>CFBundleLocalizations</key>\n<array><string>tr</string><string>en</string></array>\n<key>NSExtension</key>',
      );
    }
    await fs.writeFile(filename, content);
    return mod;
  });
