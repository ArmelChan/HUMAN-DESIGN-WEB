// 圖像整合的瀏覽器測試。用法同 site.e2e.cjs：
//   NODE_PATH=$(npm root -g) node e2e/figures.e2e.cjs [截圖輸出目錄]

const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:4173/';
const OUT = process.argv[2] || null;
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra && !ok ? '  — ' + extra : ''}`);

async function genChart(p, { mode = 'exact', time = '11:20', uncertainty } = {}) {
  await p.goto(BASE + '#/');
  await p.goto(BASE + '#/chart');
  await p.waitForSelector('#birth-date');
  await p.fill('#birth-date', '1990-05-05');
  await p.locator('.radio', { hasText: { exact: '精確', approx: '約略', dateOnly: '只知道日期' }[mode] }).locator('input').check();
  if (mode !== 'dateOnly') await p.fill('#birth-time', time);
  if (uncertainty) await p.selectOption('#uncertainty', String(uncertainty));
  await p.locator('.zone-pick select').selectOption('Asia/Taipei');
  if (await p.locator('#consent-terms').count()) await p.check('#consent-terms');
  await p.click('#generate');
  await p.waitForSelector('#report-h');
}

async function figureHealth(p, tag) {
  const r = await p.evaluate(() => {
    const imgs = [...document.images].map((i) => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0 }));
    const figs = [...document.querySelectorAll('svg[data-figure]')]
      .filter((s) => getComputedStyle(s).display !== 'none' && s.closest('[hidden]') === null)
      .map((s) => {
        const b = s.getBoundingClientRect();
        return { fig: s.getAttribute('data-figure'), w: b.width, h: b.height };
      });
    const unnamed = [...document.querySelectorAll('svg[role="img"]')].filter(
      (s) => !s.getAttribute('aria-label') && !s.getAttribute('aria-labelledby') && !s.querySelector('title'),
    ).length;
    return { imgs, figs, unnamed };
  });
  check(`${tag}：沒有破圖（<img> ${r.imgs.length} 個）`, r.imgs.every((i) => i.ok), JSON.stringify(r.imgs));
  check(`${tag}：顯示中的圖解都有尺寸`, r.figs.length > 0 && r.figs.every((f) => f.w > 10 && f.h > 10), JSON.stringify(r.figs));
  check(`${tag}：資訊圖都有可讀名稱`, r.unnamed === 0, String(r.unnamed));
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  // A. 首頁主視覺
  await p.goto(BASE + '#/');
  await p.waitForSelector('svg[data-figure="gate-wheel"]');
  await p.waitForFunction(() => /閘門 \d+ 第 \d 爻/.test(document.querySelector('.hero-now')?.textContent || ''), null, { timeout: 10000 });
  const caption = await p.locator('.hero-now').innerText();
  const capGate = caption.match(/太陽位於閘門 (\d+)/)[1];
  const segGate = await p.locator('.gw-gate.is-sun').getAttribute('data-wheel-gate');
  check('A 主視覺：圖上標出的太陽閘門與說明文字一致', capGate === segGate, `${capGate} vs ${segGate}`);
  check('A 主視覺：64 個閘門分段', (await p.locator('.gw-gate').count()) === 64);
  const heroBox = await p.locator('.hero-wheel').boundingBox();
  const explorerBox = await p.locator('.explorer').boundingBox();
  check('A 主視覺不遮蓋互動圖：互動 BodyGraph 在第一屏內開始', explorerBox.y < 900, JSON.stringify({ heroBox, explorerBox }));
  await figureHealth(p, '首頁');
  if (OUT) await p.screenshot({ path: `${OUT}/f-home.png` });

  // B. 排圖流程圖
  await p.goto(BASE + '#/chart');
  await p.waitForSelector('.flow-wrap');
  const wideShown = await p.locator('.flow-figure.is-wide').isVisible();
  const narrowShown = await p.locator('.flow-figure.is-narrow').isVisible();
  check('B 流程圖：桌面顯示橫向版、隱藏直向版', wideShown && !narrowShown);
  await p.locator('.flow-wrap summary').click();
  check('B 流程圖：文字說明 6 步', (await p.locator('.flow-wrap ol li').count()) === 6);
  if (OUT) await p.locator('.flow-wrap').screenshot({ path: `${OUT}/f-flow.png` });

  // E. 封面 + C. 中心小圖
  await genChart(p);
  const typeCard = (await p.locator('.summary-card').first().locator('.summary-v').innerText()).trim();
  const coverType = await p.locator('.report-cover [data-fact="類型"]').textContent();
  check('E 封面：類型與結果卡片一致', coverType === typeCard, `${coverType} vs ${typeCard}`);
  const definedText = await p.locator('.summary-card').nth(3).locator('.muted').innerText();
  const coverDefined = await p.$$eval('.report-cover [data-center][data-state="defined"]', (els) => els.map((e) => e.getAttribute('data-center')));
  const shortMap = { head: '頭頂', ajna: '邏輯', throat: '喉嚨', g: 'G', heart: '意志力', spleen: '直覺', solarPlexus: '情緒', sacral: '薦骨', root: '根部' };
  check('E 封面：有定義的中心與結果一致', coverDefined.every((c) => definedText.includes(shortMap[c])) && definedText.split('、').length === coverDefined.length, `${definedText} / ${coverDefined}`);
  const gateCount = await p.locator('.report-cover [data-gate]').count();
  const graphGates = await p.locator('#result-graph .bg-gate.is-on').count();
  check('E 封面：啟動閘門數與互動圖一致', gateCount === graphGates, `${gateCount} vs ${graphGates}`);
  const glyphs = await p.$$eval('.report-item.has-glyph > .center-glyph', (els) => els.map((e) => [e.getAttribute('data-glyph'), e.getAttribute('data-state')]));
  check('C 中心小圖：報告中 9 個中心都有小圖', glyphs.length === 9);
  check('C 中心小圖：狀態與封面一致', glyphs.every(([id, st]) => (st === 'defined') === coverDefined.includes(id)), JSON.stringify(glyphs));
  await p.check('#export-confirm');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('.export button', { hasText: '下載 HTML' }).click()]);
  const html = fs.readFileSync(await dl.path(), 'utf8');
  check('E 封面：匯出 HTML 內嵌同一張封面', html.includes('data-figure="report-cover"') && html.includes(`data-fact="類型">${typeCard}<`));
  await figureHealth(p, '排圖結果');
  if (OUT) await p.locator('.report-cover').screenshot({ path: `${OUT}/f-cover.png` });

  // D. 不確定性時間軸（約略模式：延遲掛載）
  await genChart(p, { mode: 'approx', uncertainty: 120 });
  check('D 時間軸：捲動到之前尚未繪製（延遲掛載）', (await p.locator('.lazy-mount[aria-busy="true"]').count()) === 1);
  await p.locator('#tl-h').scrollIntoViewIfNeeded();
  await p.waitForSelector('svg.timeline-figure', { timeout: 10000 });
  check('D 時間軸：捲動後繪製，標出輸入時刻', (await p.locator('.tl-tick.is-marker text').textContent()) === '輸入時刻');
  const rows = await p.$$eval('.tl-row', (els) => els.map((e) => e.getAttribute('data-row')));
  check('D 時間軸：含類型、權威、人生角色三列', ['type', 'authority', 'profile'].every((k) => rows.includes(k)));
  const sensText = await p.locator('#sens-h').locator('..').innerText();
  const moonChanges = sensText.includes('人格月亮');
  check('D 時間軸：月亮列與文字版的時間誤差檢查一致', rows.includes('personality-moon') === moonChanges);
  if (OUT) await p.locator('.timeline-wrap').screenshot({ path: `${OUT}/f-timeline.png` });

  await genChart(p, { mode: 'dateOnly' });
  const dayTicks = await p.$$eval('#tl-day-h ~ * .tl-tick text, .timeline-wrap .tl-tick text', (els) => els.map((e) => e.textContent));
  check('D 時間軸（只知道日期）：涵蓋 00:00 到 23:30', dayTicks.includes('00:00') && dayTicks.includes('23:30'), JSON.stringify(dayTicks));
  const coverModeText = await p.locator('.report-cover svg').textContent();
  check('E 封面（只知道日期）：標示只顯示全天不變的部分', coverModeText.includes('只知道出生日期'));

  // C. 中心總覽：鍵盤操作
  await p.goto(BASE + '#/centers');
  await p.waitForSelector('.centers-atlas');
  check('C 中心總覽：9 張卡片', (await p.locator('.atlas-card').count()) === 9);
  await p.locator('.atlas-card').first().focus();
  await p.keyboard.press('Tab');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(200);
  check('C 中心總覽：鍵盤 Tab + Enter 進入第二個中心', p.url().endsWith('#/centers/ajna'), p.url());
  await p.goto(BASE + '#/centers');
  await figureHealth(p, '中心總覽');

  // 深色模式
  const dark = await browser.newContext({ viewport: { width: 1366, height: 900 }, colorScheme: 'dark' });
  const d = await dark.newPage();
  d.on('pageerror', (e) => errors.push('dark: ' + e.message));
  await d.goto(BASE + '#/');
  await d.waitForSelector('.gw-gate.is-sun', { timeout: 10000 });
  const darkColors = await d.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const t = getComputedStyle(document.querySelector('.gw-gate:not(.is-sun) text')).fill;
    const sunText = getComputedStyle(document.querySelector('.gw-gate.is-sun text')).fill;
    const sunBg = getComputedStyle(document.querySelector('.gw-gate.is-sun path')).fill;
    return { bg, t, sunText, sunBg };
  });
  check('深色模式：閘門輪文字與背景不同色', darkColors.t !== darkColors.bg && darkColors.sunText !== darkColors.sunBg, JSON.stringify(darkColors));
  if (OUT) await d.screenshot({ path: `${OUT}/f-home-dark.png` });
  await genChart(d);
  const coverInk = await d.evaluate(() => getComputedStyle(document.querySelector('.report-cover [data-field="title"]')).fill);
  const coverBg = await d.evaluate(() => getComputedStyle(document.querySelector('.report-cover rect')).fill);
  check('深色模式：封面文字與底色不同', coverInk !== coverBg, `${coverInk} / ${coverBg}`);
  if (OUT) await d.locator('.report-cover').screenshot({ path: `${OUT}/f-cover-dark.png` });

  // 手機
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
  for (const h of ['#/', '#/chart', '#/centers', '#/copyright']) {
    await m.goto(BASE + h);
    await m.waitForTimeout(400);
    const w = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    check(`手機 ${h} 無水平捲動`, w[0] <= 390 && w[1] === 390, w.join(' vs '));
  }
  await m.goto(BASE + '#/chart');
  await m.waitForSelector('.flow-wrap');
  check('B 流程圖：手機顯示直向版', (await m.locator('.flow-figure.is-narrow').isVisible()) && !(await m.locator('.flow-figure.is-wide').isVisible()));
  if (OUT) await m.locator('.flow-wrap').screenshot({ path: `${OUT}/f-flow-mobile.png` });
  await genChart(m, { mode: 'approx', uncertainty: 60 });
  await m.locator('#tl-h').scrollIntoViewIfNeeded();
  await m.waitForSelector('svg.timeline-figure', { timeout: 10000 });
  const mw = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  check('手機：時間軸在自己的容器內捲動，頁面不水平捲動', mw[0] <= 390, mw.join(' vs '));
  await m.goto(BASE + '#/');
  await m.waitForSelector('.gw-gate.is-sun', { timeout: 10000 });
  if (OUT) await m.screenshot({ path: `${OUT}/f-home-mobile.png` });

  console.log(results.join('\n'));
  const fails = results.filter((r) => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - fails}/${results.length} passed`);
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
  process.exit(fails || errors.length ? 1 : 0);
})();
