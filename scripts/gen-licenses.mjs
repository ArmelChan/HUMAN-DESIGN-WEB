// 從 node_modules 讀取打包進網站的第三方套件授權原文，產生 src/data/licenses.generated.ts。
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const BUNDLED = ['react', 'react-dom', 'scheduler', 'astronomy-engine'];

function licenseText(name) {
  const file = `node_modules/${name}/LICENSE`;
  if (existsSync(file)) return readFileSync(file, 'utf8').trim();
  // astronomy-engine 的 npm 套件沒有 LICENSE 檔，授權聲明在 astronomy.js 開頭的註解中。
  const src = readFileSync(`node_modules/${name}/astronomy.js`, 'utf8');
  const m = src.match(/MIT License[\s\S]*?SOFTWARE\./);
  if (!m) throw new Error(`找不到 ${name} 的授權聲明`);
  return m[0].split('\n').map((l) => l.replace(/^\s{4}/, '')).join('\n').trim();
}

const entries = BUNDLED.map((name) => {
  const pkg = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
  return { name, version: pkg.version, license: pkg.license, text: licenseText(name) };
});

writeFileSync(
  'src/data/licenses.generated.ts',
  `// 由 scripts/gen-licenses.mjs 產生，請勿手動修改。\nexport const THIRD_PARTY_LICENSES = ${JSON.stringify(entries, null, 2)} as const;\n`,
);
console.log(entries.map((e) => `${e.name}@${e.version} ${e.license} (${e.text.length} chars)`).join('\n'));
