const { withFinalizedMod } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

// Xcode project mods run in reverse registration order. Wait until all native
// files have been generated before updating the extension's localization.
module.exports = (config, { extensionName }) =>
  withFinalizedMod(config, [
    'ios',
    async (mod) => {
      const filename = path.join(
        mod.modRequest.platformProjectRoot,
        extensionName,
        'ShareExtension-Info.plist',
      );
      let content = await fs.readFile(filename, 'utf8');
      content = content.replace(
        /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
        '$1WeDo$2',
      );
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
    },
  ]);
