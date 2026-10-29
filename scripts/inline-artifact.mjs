// 把 dist-artifact 的 CSS 與 JS 內嵌成單一 HTML（不含 doctype/head/body，由發布平台包裝）。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact/assets';
const files = readdirSync(dir);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
const jsFiles = files.filter((f) => f.endsWith('.js'));
if (jsFiles.length !== 1) throw new Error(`預期一個 JS 檔，實際為 ${jsFiles.length}`);
const js = readFileSync(join(dir, jsFiles[0]), 'utf8').replace(/<\/script/gi, '<\\/script');
const html = `<title>人類圖圖解</title>
<meta name="description" content="以互動 BodyGraph 認識人類圖的中心、通道、閘門、類型與內在權威，並可在瀏覽器內依出生資料排圖。">
<style>
${css}
</style>
<div id="root"></div>
<noscript>這個網站的圖像探索需要啟用 JavaScript。</noscript>
<script type="module">
${js}
</script>
`;
writeFileSync('dist-artifact/human-design.html', html);
console.log('wrote dist-artifact/human-design.html', (html.length / 1024).toFixed(0), 'KB');
