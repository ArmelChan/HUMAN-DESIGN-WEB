// 瀏覽器端到端測試。用法：
//   npm run build && npx vite preview --port 4173 --strictPort &
//   NODE_PATH=$(npm root -g) node e2e/site.e2e.cjs [截圖輸出目錄]
// 需要全域安裝的 playwright（本專案不把它列為相依套件）。

const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173/';
const OUT = process.argv[2] || null;
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra && !ok ? '  — ' + extra : ''}`);

async function fillBirth(page, { date, time, mode = 'exact', tz = 'Asia/Taipei' }) {
  await page.fill('#birth-date', date);
  await page.locator('.radio', { hasText: { exact: '精確', approx: '約略', dateOnly: '只知道日期' }[mode] }).locator('input').check();
  if (mode !== 'dateOnly') await page.fill('#birth-time', time);
  if (tz) {
    const sel = page.locator('.zone-pick select');
    if (!(await sel.locator(`option[value="${tz}"]`).count())) await page.locator('.zone-pick button').click();
    await sel.selectOption(tz);
  }
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const watch = (p, tag) => {
    p.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
    p.on('console', (m) => m.type() === 'error' && errors.push(`${tag} console: ${m.text()}`));
  };

  // ---------- 桌面：完整排圖流程 ----------
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  watch(p, 'desktop');
  await p.goto(BASE + '#/chart');
  await p.waitForSelector('#birth-date');
  const requests = [];
  p.on('request', (r) => requests.push(r.url()));

  check('同意選項預設不勾選', !(await p.isChecked('#consent-terms')) && !(await p.isChecked('#consent-local')));
  await p.locator('.terms-full summary').click();
  const termsText = await p.locator('.terms-full').innerText();
  check('勾選前可完整閱讀條款（9 節）', (termsText.match(/^\d\. /gm) || []).length >= 9 || termsText.includes('9. 條款更新與聯絡'), termsText.slice(0, 80));
  check('AI 與行銷不是可勾選項目，說明未提供', (await p.locator('.consent-static').count()) === 2 && (await p.locator('.consent-choices input[type=checkbox]').count()) === 2);

  await fillBirth(p, { date: '1990-05-05', time: '11:20' });
  const preview = await p.locator('#utc-preview').innerText();
  check('即時 UTC 預覽', preview.includes('1990-05-05 03:20 UTC') && preview.includes('UTC+08:00'), preview);

  await p.click('#generate');
  check('未接受條款時不產生結果', (await p.locator('.form-error').innerText()).includes('使用條款') && (await p.locator('#result').count()) === 0);

  await p.check('#consent-terms');
  await p.click('#generate');
  await p.waitForSelector('#report-h');
  check('結果頁顯示簡明聲明', (await p.locator('#result .report-notice').first().innerText()).includes('不保證事件發生'));
  for (const id of ['rep-calc', 'rep-system', 'rep-reflect', 'rep-health', 'rep-direction', 'rep-limits', 'rep-sources']) {
    check(`報告段落 ${id} 存在`, (await p.locator(`#${id}`).count()) === 1);
  }
  check('限制與來源不收合、直接可見', (await p.locator('#rep-limits li').first().isVisible()) && (await p.locator('#rep-sources li').first().isVisible()));
  check('類型說明使用體系規則句式', (await p.locator('#rep-calc').innerText()).includes('依本工具採用的人類圖規則'));
  check('預設不寫入本機儲存', (await p.evaluate(() => localStorage.length)) === 0);

  // 圖像互動與同步
  await p.locator('#result g.bg-center[aria-label^="G 中心"] .center-shape').click();
  check('點圖上中心：說明顯示你的圖中的狀態', (await p.locator('#result .detail').innerText()).includes('你的圖中的狀態：有定義'));
  await p.locator('#result .explorer-panel .pill', { hasText: /^13$/ }).click();
  check('點閘門：顯示由哪個啟動點啟動', /由 設計太陽（13\.4）/.test(await p.locator('#result .detail').innerText()), await p.locator('#result .detail').innerText());
  await p.locator('#result .explorer-panel .pill', { hasText: '13-33' }).click();
  check('點通道：顯示是否成立', (await p.locator('#result .detail').innerText()).includes('這條通道成立'));
  await p.locator('#rep-system .report-item', { hasText: '喉嚨中心' }).locator('button', { hasText: '在圖上查看' }).click();
  await p.waitForTimeout(200);
  check('報告「在圖上查看」與圖上選取同步', (await p.locator('#result .current').innerText()).includes('喉嚨中心'));
  await p.locator('#result g.bg-center').first().focus();
  await p.keyboard.press('Enter');
  check('鍵盤 Enter 可選取圖上中心', (await p.locator('#result .current').innerText()).includes('頭頂中心'));

  // 反思不改變結果
  const calcBefore = await p.locator('#rep-calc').innerText();
  const firstItem = p.locator('.reflect-item').first();
  await firstItem.locator('.radio-pill', { hasText: '不符合' }).locator('input').check();
  await firstItem.locator('textarea').nth(1).fill('上週其實很平穩');
  check('不同意解讀後計算結果不變', (await p.locator('#rep-calc').innerText()) === calcBefore);
  check('反思計數更新並說明不代表有錯', (await p.locator('#rep-reflect [role=status]').innerText()).includes('不代表你或圖表有錯'));
  check('未勾選保存時反思不寫入本機', (await p.evaluate(() => localStorage.length)) === 0);

  // 匯出
  check('匯出按鈕在確認前停用', await p.locator('.export button').first().isDisabled());
  await p.check('#export-confirm');
  const [download] = await Promise.all([p.waitForEvent('download'), p.locator('.export button', { hasText: '下載 HTML' }).click()]);
  const path = await download.path();
  const html = require('fs').readFileSync(path, 'utf8');
  check('匯出 HTML 保留聲明（首尾）、限制、驗證狀態、使用範圍', (html.split('不保證事件發生').length - 1) >= 2 && html.includes('計算與解讀限制') && html.includes('pending_external_validation') && html.includes('商業轉售'));
  check('匯出預設不含反思筆記', !html.includes('上週其實很平穩'));
  await p.check('#export-reflection');
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.locator('.export button', { hasText: '下載 HTML' }).click()]);
  check('勾選後匯出包含反思筆記', require('fs').readFileSync(await dl2.path(), 'utf8').includes('上週其實很平穩'));
  check('整個排圖與匯出流程沒有網路請求', requests.filter((u) => !u.startsWith('blob:')).length === 0, JSON.stringify(requests));
  check('網址不含出生資料', !/1990|11:20/.test(p.url()), p.url());
  if (OUT) await p.screenshot({ path: `${OUT}/chart-report.png`, fullPage: false });

  // 結果中的提問指引（情境 E）
  await p.locator('#ask-in-chart-h').scrollIntoViewIfNeeded();
  await p.locator('.question-guide .pill', { hasText: '請生成我的個人圖並解釋中心' }).first().click();
  check('情境 E（有圖）：列出有定義的中心', (await p.locator('.question-guide .ask-answer').first().innerText()).includes('有定義的中心是'));

  // 約略與只知道日期
  await p.goto(BASE + '#/');
  await p.goto(BASE + '#/chart');
  await p.waitForSelector('#birth-date');
  await fillBirth(p, { date: '1990-05-05', time: '11:20', mode: 'approx' });
  await p.selectOption('#uncertainty', '120');
  await p.check('#consent-terms');
  await p.click('#generate');
  await p.waitForSelector('#sens-h');
  check('約略模式：顯示誤差檢查與標註', (await p.locator('#sens-h').innerText()).includes('±120') && (await p.locator('#rep-limits').innerText()).includes('±120'));

  await p.goto(BASE + '#/');
  await p.goto(BASE + '#/chart');
  await p.waitForSelector('#birth-date');
  await fillBirth(p, { date: '1990-05-05', mode: 'dateOnly' });
  check('只知道日期：預覽說明全天取樣', (await p.locator('#utc-preview').innerText()).includes('00:00 到 23:30'));
  await p.check('#consent-terms');
  await p.click('#generate');
  await p.waitForSelector('#report-h');
  // 時間軸的刻度本來就會出現 12:00，所以排除時間軸後再檢查「沒有以中午代表全天」
  const dayText = await p.locator('#result').evaluate((el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('[data-figure="uncertainty-timeline"]').forEach((n) => n.remove());
    return c.textContent;
  });
  check('只知道日期：48 個時刻、不以中午代表', dayText.includes('共 48 個時刻') && !dayText.includes('12:00') && dayText.includes('無法確定'), dayText.slice(0, 200));

  // 本機保存、重新載入、取消、版本更新、清除
  await p.goto(BASE + '#/');
  await p.goto(BASE + '#/chart');
  await p.waitForSelector('#birth-date');
  await fillBirth(p, { date: '1990-05-05', time: '11:20' });
  await p.check('#consent-terms');
  await p.check('#consent-local');
  await p.click('#generate');
  await p.waitForSelector('#report-h');
  await p.locator('.reflect-item').first().locator('.radio-pill', { hasText: '符合' }).first().locator('input').check();
  await p.waitForTimeout(150);
  const keys = await p.evaluate(() => Object.keys(localStorage).sort());
  check('勾選保存後寫入三類資料', JSON.stringify(keys) === JSON.stringify(['hd-birth-input-v1', 'hd-consent-v1', 'hd-reflection-v1']), JSON.stringify(keys));
  const consent = JSON.parse(await p.evaluate(() => localStorage.getItem('hd-consent-v1')));
  check('接受紀錄只含版本與時間', JSON.stringify(Object.keys(consent).sort()) === '["acceptedAt","termsVersion"]');
  await p.reload();
  await p.waitForSelector('#birth-date');
  check('重新載入：帶回輸入並記得已接受條款', (await p.inputValue('#birth-date')) === '1990-05-05' && (await p.locator('.consent-done').count()) === 1);
  await p.uncheck('#consent-local');
  await p.waitForTimeout(150);
  check('取消保存後立即刪除', (await p.evaluate(() => localStorage.length)) === 0);
  await p.evaluate(() => {
    localStorage.setItem('hd-consent-v1', JSON.stringify({ termsVersion: 'terms-draft-0.0', acceptedAt: '2026-01-01T00:00:00Z' }));
    localStorage.setItem('hd-birth-input-v1', JSON.stringify({ date: '1990-05-05', time: '11:20' }));
  });
  await p.reload();
  await p.waitForSelector('#birth-date');
  check('條款版本更新：顯示更新提示並要求重新勾選', (await p.locator('.consent').innerText()).includes('terms-draft-0.0') && (await p.locator('#consent-terms').count()) === 1 && !(await p.isChecked('#consent-terms')));
  await p.click('#clear-device');
  check('清除這台裝置上的資料', (await p.evaluate(() => localStorage.length)) === 0 && (await p.inputValue('#birth-date')) === '');

  // 提問指引：情境 A–G 與危機
  await p.goto(BASE + '#/ask');
  await p.waitForSelector('#ask-page-h');
  const expect = [
    ['我的圖是否代表我有抑鬱症？', /^不代表/],
    ['我可否按圖表停藥？', /^不可以/],
    ['我的閘門顯示我會幾歲死亡？', /^不會/],
    ['請提供情緒觀察問題，不要診斷。', /^以下是一些觀察問題/],
    ['請生成我的個人圖並解釋中心。', /^可以。請到「個人排圖」/],
    ['我不同意傳送給 AI，是否仍可使用？', /^可以。本站目前沒有任何 AI 功能/],
    ['我可否商業轉售報告？', /^目前不行/],
  ];
  for (const [q, re] of expect) {
    await p.locator('.question-guide .pill', { hasText: q }).click();
    const first = await p.locator('.ask-answer p').first().innerText();
    check(`提問指引：${q}`, re.test(first), first);
  }
  check('情境 D 提供實際問題', (await (async () => {
    await p.locator('.question-guide .pill', { hasText: '請提供情緒觀察問題' }).click();
    return p.locator('.ask-answer li').count();
  })()) >= 5);
  await p.fill('#ask-page-h-input', '我現在不想活了，我的權威怎麼說');
  await p.locator('.ask-form button').click();
  const crisis = await p.locator('.ask-answer').innerText();
  check('危機訊號：停止解讀、提示當地緊急服務、不編造電話', (await p.locator('.ask-answer.is-crisis').count()) === 1 && crisis.includes('緊急服務') && !/\d{3,}/.test(crisis));

  // 法律頁與素材登錄
  await p.goto(BASE + '#/terms');
  const terms = await p.locator('main').innerText();
  check('使用條款頁：草稿標示、待填欄位、保留法定權利', terms.includes('草稿') && terms.includes('［待營運者填寫］') && terms.includes('不得排除或限制的任何責任'));
  check('使用條款頁：沒有「概不負責」類用語', !/概不負責|放棄一切/.test(terms));
  await p.goto(BASE + '#/privacy');
  const priv = await p.locator('main').innerText();
  check('隱私聲明頁：資料流程表與 AI 說明', (await p.locator('main table tbody tr').count()) >= 5 && priv.includes('沒有任何 AI 功能'));
  await p.goto(BASE + '#/copyright');
  const rows = await p.locator('table.registry tbody tr').count();
  check('版權頁：素材登錄 22 項，含待確認', rows === 22 && (await p.locator('table.registry .vstatus-pending').count()) > 0, String(rows));
  await p.goto(BASE + '#/sources');
  check('來源頁：第三方授權全文仍在', (await p.locator('#licenses').innerText()).includes('astronomy-engine 2.1.19'));
  await p.goto(BASE + '#/verification');
  await p.waitForSelector('#ref-h');
  check('驗證頁：130/130 與工程一致性說明', (await p.locator('#ref-h').innerText()).includes('130/130') && (await p.locator('main').innerText()).includes('工程測試通過，只代表'));

  // ---------- 手機 ----------
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  watch(m, 'mobile');
  for (const h of ['#/chart', '#/terms', '#/privacy', '#/copyright', '#/ask', '#/verification', '#/']) {
    await m.goto(BASE + h);
    await m.waitForTimeout(300);
    const w = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    check(`手機 ${h} 無水平捲動`, w[0] <= 390 && w[1] === 390, w.join(' vs '));
  }
  await m.goto(BASE + '#/chart');
  await m.waitForSelector('#birth-date');
  await fillBirth(m, { date: '1990-05-05', time: '11:20' });
  await m.locator('#consent-terms').tap();
  await m.locator('#generate').tap();
  await m.waitForSelector('#report-h');
  await m.waitForTimeout(300);
  const mw = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  check('手機：排圖報告產生且無水平捲動', mw[0] <= 390 && mw[1] === 390, mw.join(' vs '));
  await m.locator('#result g.bg-center[aria-label^="薦骨中心"] .center-shape').tap();
  await m.waitForTimeout(300);
  check('手機：觸控選取中心並展開說明', (await m.locator('#result .sheet-current').innerText()).includes('薦骨中心'));
  if (OUT) {
    await m.evaluate(() => document.querySelector('#result-graph').scrollIntoView({ behavior: 'instant' }));
    await m.screenshot({ path: `${OUT}/m-chart.png` });
  }

  console.log(results.join('\n'));
  const fails = results.filter((r) => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - fails}/${results.length} passed`);
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
  process.exit(fails || errors.length ? 1 : 0);
})();
