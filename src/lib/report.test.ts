import { buildReport, isMinorOn, type Report } from './report';
import { computeChart, sensitivity } from './chart';
import { computeDayRange } from './dayRange';
import { reportToHtml, reportToText, BIRTH_DATA_WARNING, USAGE_NOTE, type ExportOptions } from './exportReport';
import { DISCLAIMER } from '../data/disclaimer';
import { VALIDATION_CASES } from '../data/validation/cases';
import { localToUtc } from './timezone';

const chart = computeChart(new Date('1990-05-05T03:20:00Z'));
const exact = () => buildReport({ mode: 'exact', chart }, { subjectIsMinor: false });

function allText(r: Report): string {
  return [
    r.notice,
    ...r.calculation.map((i) => i.heading + i.text),
    ...r.system.map((i) => i.heading + i.text),
    ...r.reflection.map((i) => i.text),
    r.health.intro, ...r.health.practices, r.health.mentalHealth, ...r.health.seekHelp, r.health.chartBoundary,
    ...r.health.bodyClaims.map((b) => b.text),
    ...r.direction.map((i) => i.heading + i.text),
    ...r.limits,
  ].join('\n');
}

// 報告中不可出現的句型
const FORBIDDEN: [string, RegExp][] = [
  ['精神或身體診斷', /你(患有|罹患|確診|有)(抑鬱|憂鬱|躁鬱|雙相|ADHD|過動|焦慮症|人格障礙|疾病|癌)/],
  ['疾病風險或器官功能推論', /(容易|可能會)(罹患|得到|生病)|器官(功能)?(較弱|不好|有問題)|生育(能力)?(較低|有問題)/],
  ['用藥或治療指示', /(停藥|減藥|加藥|劑量|禁食|服用)/],
  ['確定性預言', /注定|一定會|必然會|保證(會|你)|你(將|會)在\s*\d+\s*歲/],
  ['死亡、災難預測', /(死亡|過世|災難|意外)(的)?(時間|年齡|年份)/],
  ['恐懼誘導付費', /化解|改運|付費解鎖|購買.*(才能|即可)/],
  ['科學背書', /科學(證實|證明|驗證了)/],
];

describe('報告結構', () => {
  it('包含七個部分，且必要提示存在', () => {
    const r = exact();
    expect(r.calculation.length).toBeGreaterThan(4);
    expect(r.system.length).toBeGreaterThan(9);
    expect(r.reflection.length).toBeGreaterThan(8);
    expect(r.health.seekHelp.length).toBeGreaterThan(0);
    expect(r.direction.length).toBeGreaterThan(1);
    expect(r.limits.length).toBeGreaterThan(5);
    expect(r.sources.length).toBeGreaterThan(3);
    expect(r.notice).toBe(DISCLAIMER);
  });

  it('類型描述使用「依本工具採用的人類圖規則」的說法', () => {
    expect(exact().calculation[0].text).toMatch(/^依本工具採用的人類圖規則/);
  });

  it('反思問題涵蓋情緒、關係、工作、人生方向', () => {
    const areas = new Set(exact().reflection.map((p) => p.area));
    expect([...areas].sort()).toEqual(['direction', 'emotion', 'relationship', 'work']);
  });

  it('每段體系解釋都標示依據（不以泛用描述冒充獨有洞察）', () => {
    for (const i of exact().system) expect(i.basis.length).toBeGreaterThan(1);
  });
});

describe('內容邊界（30 組測例全部檢查）', () => {
  const reports: Report[] = [];
  for (const c of VALIDATION_CASES) {
    const [y, m, d] = c.input.date.split('-').map(Number);
    const [h, mi] = c.input.time.split(':').map(Number);
    const conv = localToUtc({ year: y, month: m, day: d, hour: h, minute: mi }, c.input.tz);
    if (conv.kind === 'ok') {
      reports.push(buildReport({ mode: 'exact', chart: computeChart(conv.utc) }, { subjectIsMinor: false }));
    }
  }
  it('產生至少 25 份報告', () => expect(reports.length).toBeGreaterThanOrEqual(25));
  for (const [label, re] of FORBIDDEN) {
    it(`不出現：${label}`, () => {
      for (const r of reports) expect(allText(r)).not.toMatch(re);
    });
  }
});

describe('偏誤與一致性', () => {
  it('同一張圖重算兩次，報告完全相同', () => {
    expect(exact()).toEqual(exact());
  });

  it('報告產生器不接受身分資訊；匯出時更換標題（例如姓名、性別、職業），除檔首外內容完全相同', () => {
    const r = exact();
    const base: ExportOptions = { includeReflection: false, reflection: {}, provenance: chart.provenance, birthSummary: 'x', generatedAt: new Date(0) };
    const a = reportToText(r, { ...base, title: '王小明（男，工程師）' }).split('\n').slice(1).join('\n');
    const b = reportToText(r, { ...base, title: '陳美華（女，護理師）' }).split('\n').slice(1).join('\n');
    expect(a).toBe(b);
  });

  it('使用者不同意或同意解讀，都不會改變報告', () => {
    const r = exact();
    const ids = r.reflection.map((p) => p.id);
    const disagreeAll = Object.fromEntries(ids.map((id) => [id, { answer: 'disagree' as const, example: '', counterExample: '完全不像我' }]));
    const agreeAll = Object.fromEntries(ids.map((id) => [id, { answer: 'agree' as const, example: '很準', counterExample: '' }]));
    const opts = (reflection: ExportOptions['reflection']): ExportOptions => ({ includeReflection: false, reflection, provenance: chart.provenance, birthSummary: 'x', generatedAt: new Date(0) });
    expect(reportToText(r, opts(disagreeAll))).toBe(reportToText(r, opts(agreeAll)));
    // 同意不會增加宿命式敘述
    const withAgree = reportToText(r, { ...opts(agreeAll), includeReflection: true });
    expect(withAgree).not.toMatch(/注定|一定會|命中/);
  });

  it('未滿 18 歲：不提供健康與心理教育的延伸內容，但保留求助提示', () => {
    const r = buildReport({ mode: 'exact', chart }, { subjectIsMinor: true });
    expect(r.health.restricted).toBe(true);
    expect(r.health.practices).toEqual([]);
    expect(r.health.bodyClaims).toEqual([]);
    expect(r.health.seekHelp.join('')).toMatch(/監護人/);
    // 核心分類不因年齡改變
    expect(r.calculation).toEqual(exact().calculation);
  });

  it('isMinorOn 以生日計算年齡', () => {
    expect(isMinorOn('2010-11-01', new Date('2028-10-31T12:00:00'))).toBe(true);
    expect(isMinorOn('2010-10-29', new Date('2028-10-29T12:00:00'))).toBe(false);
  });
});

describe('時間準確度模式', () => {
  it('約略：誤差範圍內會變的項目被標註', () => {
    const s = sensitivity(chart.birthUtc, 720);
    const r = buildReport({ mode: 'approx', chart, uncertaintyMinutes: 720, sensitivity: s }, { subjectIsMinor: false });
    expect(r.limits[0]).toMatch(/±720 分鐘/);
    if (!s.typeStable) expect(r.calculation[0].text).toMatch(/可能改變/);
  });

  it('只知道日期：不以單一時刻代表出生時間；只採全天不變的結果', () => {
    const day = computeDayRange('1990-05-05', 'Asia/Taipei');
    expect(day.samples).toBe(48);
    const r = buildReport({ mode: 'dateOnly', day }, { subjectIsMinor: false });
    expect(r.limits[0]).toMatch(/沒有以任何單一時刻代表/);
    // 月亮一天移動約 13°，不會全天相同
    expect(day.variable.some((v) => v.body === 'moon')).toBe(true);
    if (!day.type) expect(r.calculation[0].text).toMatch(/無法確定/);
    expect(allText(r)).not.toMatch(/12:00/);
  });

  it('只知道日期：夏令時間跳過的時段略過，重複的時段兩個都算', () => {
    const gap = computeDayRange('2021-03-14', 'America/Vancouver');
    expect(gap.samples).toBe(46);
    const overlap = computeDayRange('2021-11-07', 'America/Vancouver');
    expect(overlap.samples).toBe(50);
  });
});

describe('匯出報告', () => {
  const r = exact();
  const opts: ExportOptions = { includeReflection: false, reflection: {}, provenance: chart.provenance, birthSummary: '1990-05-05 11:20 Asia/Taipei', generatedAt: new Date('2026-10-29T00:00:00Z') };

  it('HTML 與文字版都保留聲明（開頭與結尾）、限制、驗證狀態、來源與使用範圍', () => {
    for (const out of [reportToHtml(r, opts), reportToText(r, opts)]) {
      expect(out.split(DISCLAIMER).length - 1).toBeGreaterThanOrEqual(2);
      expect(out).toContain(BIRTH_DATA_WARNING);
      expect(out).toContain('計算與解讀限制');
      expect(out).toContain('pending_external_validation');
      expect(out).toContain(USAGE_NOTE);
      expect(out).toContain('一般健康與心理教育');
    }
  });

  it('預設不包含反思筆記；勾選後才包含', () => {
    const id = r.reflection[0].id;
    const reflection = { [id]: { answer: 'unsure' as const, example: '上週開會時', counterExample: '' } };
    expect(reportToText(r, { ...opts, reflection })).not.toContain('上週開會時');
    expect(reportToText(r, { ...opts, reflection, includeReflection: true })).toContain('上週開會時');
  });

  it('HTML 會跳脫使用者輸入', () => {
    const html = reportToHtml(r, { ...opts, title: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert');
  });
});
