/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const languages = ['tr', 'en'];
const catalogs = Object.fromEntries(
  languages.map((lang) => [
    lang,
    JSON.parse(
      fs.readFileSync(path.join(root, 'src/i18n/resources', `${lang}.json`), 'utf8'),
    ),
  ]),
);
const errors = [];
const parameters = (text) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');
for (const key of new Set(languages.flatMap((lang) => Object.keys(catalogs[lang])))) {
  for (const lang of languages)
    if (typeof catalogs[lang][key] !== 'string' || !catalogs[lang][key].trim())
      errors.push(`${lang}: missing ${key}`);
  if (
    languages.every((lang) => catalogs[lang][key] != null) &&
    parameters(catalogs.tr[key]) !== parameters(catalogs.en[key])
  )
    errors.push(`Parameters differ: ${key}`);
}
const exists = (key) =>
  key in catalogs.en || (`${key}_one` in catalogs.en && `${key}_other` in catalogs.en);
let calls = 0;
const inventory = [];
const properNames = new Set([
  'W',
  'D',
  'C',
  'WeDo',
  'WeDo.',
  'WE DO',
  'Instagram',
  'TikTok',
  'Web',
  'Nomo Ramen 🍜',
  'contact@durangezer.com',
]);
const technicalText = (value) =>
  /^(https?:|mailto:|\/|\[WeDo\]|Bearer$|device-|empty-)/.test(value) || value === 'deg';
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (!['__tests__', 'i18n'].includes(entry.name)) walk(filename);
      continue;
    }
    if (!/\.tsx?$/.test(filename)) continue;
    const source = ts.createSourceFile(
      filename,
      fs.readFileSync(filename, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const initialCalls = calls;
    function checkLiteral(text) {
      const value = text.replace(/\s+/g, ' ').trim();
      if (
        /[a-zA-ZğüşöçıİĞÜŞÖÇ]/.test(value) &&
        !properNames.has(value) &&
        !technicalText(value)
      )
        errors.push(`${path.relative(root, filename)}: untranslated UI text ${value}`);
    }
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === 't' &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        calls++;
        if (!exists(node.arguments[0].text))
          errors.push(
            `${path.relative(root, filename)}: unknown ${node.arguments[0].text}`,
          );
      }
      if (
        ts.isJsxAttribute(node) &&
        node.name.getText(source) === 'i18nKey' &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      ) {
        calls++;
        if (!exists(node.initializer.text))
          errors.push(`Unknown Trans key: ${node.initializer.text}`);
      }
      if (ts.isJsxText(node)) checkLiteral(node.text);
      if (
        ts.isJsxExpression(node) &&
        node.expression &&
        (ts.isStringLiteral(node.expression) ||
          ts.isNoSubstitutionTemplateLiteral(node.expression))
      )
        checkLiteral(node.expression.text);
      if (
        ts.isJsxAttribute(node) &&
        /^(title|label|description|placeholder|accessibilityLabel)$/.test(
          node.name.getText(source),
        ) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      )
        checkLiteral(node.initializer.text);
      if (
        ts.isPropertyAssignment(node) &&
        /^(title|label|subtitle|description|message)$/.test(node.name.getText(source)) &&
        ts.isStringLiteral(node.initializer)
      )
        checkLiteral(node.initializer.text);
      if (ts.isTemplateExpression(node))
        checkLiteral(
          node.head.text + node.templateSpans.map((span) => span.literal.text).join(' '),
        );
      ts.forEachChild(node, visit);
    }
    visit(source);
    if (filename.includes(`${path.sep}app${path.sep}`))
      inventory.push({
        file: path.relative(root, filename).replaceAll('\\', '/'),
        calls: calls - initialCalls,
      });
  }
}
walk(path.join(root, 'src'));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `TR/EN catalogs match: ${Object.keys(catalogs.en).length} keys, ${calls} translation calls checked.`,
  );
if (!errors.length && process.argv.includes('--write-inventory')) {
  const rows = inventory
    .map(({ file, calls }) => `| \`${file}\` | ${calls} |`)
    .join('\n');
  fs.writeFileSync(
    path.join(root, '../docs/LOCALIZATION_COVERAGE.md'),
    '# Çeviri kaynak kapsamı\n\n`frontend/scripts/check-locales.cjs --write-inventory` ile üretilir. Sayılar kaynak kodundaki çeviri çağrılarını gösterir; görsel veya gerçek cihaz testi anlamına gelmez. Ortak bileşenlerin çevirileri ekran sayılarına dahil değildir.\n\n| Rota / layout | Çeviri çağrısı |\n| --- | ---: |\n' +
      rows +
      '\n',
  );
}
