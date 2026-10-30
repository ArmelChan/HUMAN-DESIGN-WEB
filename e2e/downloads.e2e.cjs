// 報告下載的瀏覽器測試：模擬 claude.ai 檢視器提供（或不提供）平台下載功能。
// 用法：
//   npm run build && npx vite preview --port 4173 --strictPort &
//   NODE_PATH=$(npm root -g) node e2e/downloads.e2e.cjs
// 模擬的檢視器只實作 claude.use('downloads') 與 save()，行為依平台型別定義（downloads.d.ts）。

const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173/';
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra && !ok ? '  — ' + extra : ''}`);

/** mode: 'grant' | 'declined' | 'unavailable' | 'extension_not_enabled' | 'rate_limited' | 'null' */
function hostScript(mode) {
  return `
    window.__saves = [];
    window.claude = Object.freeze({
      use: (name) => new Promise((resolve) => setTimeout(() => {
        if (name !== 'downloads' || ${JSON.stringify(mode)} === 'null') return resolve(null);
        resolve(Object.freeze({
          save: async (req) => {
            const text = typeof req.data === 'string' ? req.data : await req.data.text();
            window.__saves.push({ filename: req.filename, text, keys: Object.keys(req).sort().join(',') });
            if (${JSON.stringify(mode)} === 'grant') return { status: 'saved' };
            throw { code: ${JSON.stringify(mode)}, message: 'mock' };
          },
        }));
      }, 30)),
    });
  `;
}

async function openExport(page) {
  await page.goto(BASE + '#/chart');
  await page.waitForSelector('#birth-date');
  await page.fill('#birth-date', '1990-05-05');
  await page.locator('.radio', { hasText: '精確' }).locator('input').check();
  await page.fill('#birth-time', '11:20');
  const sel = page.locator('.zone-pick select');
  if (!(await sel.locator('option[value="Asia/Taipei"]').count())) await page.locator('.zone-pick button').click();
  await sel.selectOption('Asia/Taipei');
  await page.check('#consent-terms');
  await page.click('#generate');
  await page.waitForSelector('#export-h');
  await page.check('#export-confirm');
}

const statusText = (page) => page.locator('.export [role=status]').innerText();

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  async function run(mode) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    await ctx.addInitScript(hostScript(mode));
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${mode}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${mode} console: ${m.text()}`));
    const requests = [];
    page.on('request', (r) => requests.push(r.url()));
    const downloads = [];
    page.on('download', (d) => downloads.push(d));
    await openExport(page);
    requests.length = 0;
    return { ctx, page, requests, downloads };
  }

  // 1. 檢視器提供下載功能且使用者接受
  {
    const { ctx, page, requests, downloads } = await run('grant');
    await page.click('#export-download');
    await page.waitForFunction(() => window.__saves.length === 1);
    await page.waitForFunction(() => document.querySelector('.export [role=status]').textContent.includes('已交給'));
    const saved = await page.evaluate(() => window.__saves[0]);
    check('平台下載：檔名為 human-design-report.html', saved.filename === 'human-design-report.html', saved.filename);
    check('平台下載：只傳 filename 與 data（不帶 request）', saved.keys === 'data,filename', saved.keys);
    check(
      '平台下載：內容是完整報告（封面、聲明、限制、驗證狀態）',
      saved.text.startsWith('<!doctype html>') && saved.text.includes('data-figure="report-cover"') && (saved.text.split('不保證事件發生').length - 1) >= 2 && saved.text.includes('pending_external_validation'),
      saved.text.slice(0, 80),
    );
    check('平台下載：沒有再觸發瀏覽器下載', downloads.length === 0);
    check('平台下載：狀態訊息', (await statusText(page)).includes('已交給瀏覽器存檔'));
    check('平台下載：沒有任何網路請求', requests.filter((u) => !u.startsWith('blob:')).length === 0, JSON.stringify(requests));

    // 與一般瀏覽器下載的內容一致（排除產生時間）
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    const p2 = await ctx2.newPage();
    await openExport(p2);
    const [dl] = await Promise.all([p2.waitForEvent('download'), p2.click('#export-download')]);
    const plain = require('fs').readFileSync(await dl.path(), 'utf8');
    const norm = (s) => s.replace(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+Z)?/g, 'T').replace(/產生日期 \d{4}-\d{2}-\d{2}/g, '產生日期');
    check('平台下載與一般下載的報告內容相同', norm(plain) === norm(saved.text));
    await ctx2.close();
    await ctx.close();
  }

  // 2. 使用者在確認視窗按取消
  {
    const { ctx, page, downloads } = await run('declined');
    await page.click('#export-download');
    await page.waitForFunction(() => document.querySelector('.export [role=status]').textContent.includes('取消'));
    check('取消：顯示已取消、沒有存檔', (await statusText(page)).includes('已取消下載'));
    check('取消：下載按鈕仍可再按（不自動重試）', (await page.locator('#export-download').isEnabled()) && (await page.evaluate(() => window.__saves.length)) === 1);
    check('取消：沒有改用瀏覽器下載', downloads.length === 0);
    await ctx.close();
  }

  // 3. 這個檢視環境無法下載
  {
    const { ctx, page } = await run('unavailable');
    await page.click('#export-download');
    await page.waitForFunction(() => document.querySelector('.export [role=status]').textContent.includes('無法下載'));
    check('無法下載：隱藏下載按鈕', (await page.locator('#export-download').count()) === 0);
    check('無法下載：仍可複製純文字', await page.locator('.export button', { hasText: '複製純文字' }).isEnabled());
    await ctx.close();
  }

  // 4. 這個檢視環境不允許 HTML 檔
  {
    const { ctx, page } = await run('extension_not_enabled');
    await page.click('#export-download');
    await page.waitForFunction(() => document.querySelector('.export [role=status]').textContent.includes('不允許'));
    check('不允許 HTML：說明並建議複製純文字', (await statusText(page)).includes('不允許下載 HTML 檔'));
    await ctx.close();
  }

  // 5. 已有確認視窗開著
  {
    const { ctx, page } = await run('rate_limited');
    await page.click('#export-download');
    await page.waitForFunction(() => document.querySelector('.export [role=status]').textContent.includes('稍後再試'));
    check('確認視窗已開著：請使用者稍後再試', true);
    await ctx.close();
  }

  // 6. 檢視器存在但沒有提供下載功能 → 一般瀏覽器下載
  {
    const { ctx, page } = await run('null');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export-download')]);
    check('檢視器未提供：改用一般瀏覽器下載', dl.suggestedFilename() === 'human-design-report.html');
    check('檢視器未提供：狀態訊息提到可改用純文字', (await statusText(page)).includes('複製純文字'));
    await ctx.close();
  }

  // 7. 不在檢視器中（一般靜態主機）
  {
    const ctx = await browser.newContext({ acceptDownloads: true });
    const page = await ctx.newPage();
    await openExport(page);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export-download')]);
    check('一般主機：瀏覽器下載', dl.suggestedFilename() === 'human-design-report.html');
    await ctx.close();
  }

  await browser.close();
  for (const r of results) console.log(r);
  const passed = results.filter((r) => r.startsWith('PASS')).length;
  console.log(`${passed}/${results.length} passed`);
  console.log('ERRORS', JSON.stringify(errors));
  process.exit(passed === results.length && errors.length === 0 ? 0 : 1);
})();
