import { renderToStaticMarkup } from 'react-dom/server';
import { computeChart } from '../lib/chart';
import { computeDayRange } from '../lib/dayRange';
import { buildReport } from '../lib/report';
import { reportToHtml } from '../lib/exportReport';
import { staticBodygraphSvg } from '../lib/staticBodygraph';
import { coverFromChart, coverFromDay, coverSvg, COVER_NOTICE_LINES } from '../lib/reportCover';
import { approxSamples, buildTimeline, daySamples } from '../lib/timeline';
import { longitudeToGateLine } from '../lib/mandala';
import { DESIGN_ARC_DEG } from '../lib/designSolver';
import { ASTRONOMY_ENGINE } from '../lib/ephemeris';
import { CENTER_ORDER, CHANNELS } from '../data/structure';
import { MANDALA_RULES } from '../data/rules/mandala';
import { AUTHORITIES, TYPES } from '../data/content/types';
import { BodyGraph } from '../components/BodyGraph';
import { GateWheel, wheelSegments } from './GateWheel';
import { ChartingFlow, FLOW_STEPS } from './ChartingFlow';
import { CenterGlyph, CentersAtlas } from './CenterGlyph';
import { UncertaintyTimeline } from './UncertaintyTimeline';

const chart = computeChart(new Date('1990-05-05T03:20:00Z'));
const definedCenters = CENTER_ORDER.filter((id) => chart.derivation.centerStates[id] === 'defined');
const attrs = (html: string, re: RegExp) => [...html.matchAll(re)].map((m) => m.slice(1));

describe('靜態 BodyGraph 與排圖資料一致', () => {
  const svg = staticBodygraphSvg({
    title: 't',
    centerStates: Object.fromEntries(CENTER_ORDER.map((id) => [id, chart.derivation.centerStates[id] === 'defined' ? 'defined' : 'notDefined'])),
    gateSources: chart.gateSources,
  });
  it('有定義的中心完全相同', () => {
    const defined = attrs(svg, /data-center="(\w+)" data-state="defined"/g).map((m) => m[0]);
    expect(defined.sort()).toEqual([...definedCenters].sort());
  });
  it('畫出的啟動閘門與來源（人格／設計／兩者）完全相同', () => {
    const gates = attrs(svg, /data-gate="(\d+)" data-source="(\w+)"/g).map(([g, s]) => `${g}:${s}`).sort();
    expect(gates).toEqual([...chart.gateSources].map(([g, s]) => `${g}:${s}`).sort());
  });
  it('每條通道的兩半，只有被啟動的閘門那一半上色', () => {
    const halves = attrs(svg, /data-half="(\d+)" data-on="(\d)"/g);
    expect(halves).toHaveLength(CHANNELS.length * 2);
    for (const [g, on] of halves) expect(on === '1').toBe(chart.gateSources.has(Number(g)));
  });
});

describe('互動 BodyGraph（React）與排圖資料一致', () => {
  const html = renderToStaticMarkup(
    <BodyGraph
      selection={null}
      onSelect={() => {}}
      centerStates={chart.derivation.centerStates}
      activeGates={new Set(chart.gateSources.keys())}
      gateSources={chart.gateSources}
      title="t"
      description="d"
    />,
  );
  it('有定義的中心', () => {
    const n = (html.match(/class="bg-center state-defined/g) || []).length;
    expect(n).toBe(definedCenters.length);
  });
  it('啟動的閘門數量與來源', () => {
    expect((html.match(/class="bg-gate is-on/g) || []).length).toBe(chart.gateSources.size);
    const design = [...chart.gateSources.values()].filter((s) => s === 'design').length;
    expect((html.match(/bg-gate is-on src-design/g) || []).length).toBe(design);
  });
  it('成立的通道：兩半都上色', () => {
    const onHalves = (html.match(/class="ch-half is-on/g) || []).length;
    const expected = CHANNELS.reduce((n, c) => n + c.gates.filter((g) => chart.gateSources.has(g)).length, 0);
    expect(onHalves).toBe(expected);
  });
});

describe('A. 閘門輪', () => {
  it('64 個分段的閘門順序取自規則表，且每段中點換算回同一個閘門', () => {
    const segs = wheelSegments();
    expect(segs.map((s) => s.gate)).toEqual([...MANDALA_RULES.gateOrder.value]);
    for (const s of segs) expect(longitudeToGateLine((s.a0 + s.a1) / 2).gate).toBe(s.gate);
  });
  it('標出的太陽閘門與排圖引擎一致，SVG 有可讀標題', () => {
    const at = new Date('2026-10-29T00:00:00Z');
    const lon = ASTRONOMY_ENGINE.sunLongitude(at);
    const s = longitudeToGateLine(lon);
    const e = longitudeToGateLine(lon + 180);
    const html = renderToStaticMarkup(<GateWheel highlight={{ sun: { gate: s.gate, line: s.line, longitude: lon }, earth: { gate: e.gate, line: e.line }, at }} />);
    expect(html).toMatch(new RegExp(`data-wheel-gate="${s.gate}" class="gw-gate[^"]*is-sun`));
    expect(html).toMatch(new RegExp(`data-wheel-gate="${e.gate}" class="gw-gate[^"]*is-earth`));
    expect(html).toMatch(/role="img"/);
    expect(html).toContain(`閘門 ${s.gate} 第 ${s.line} 爻`);
  });
});

describe('B. 排圖流程圖', () => {
  it('文字說明與實際規則一致（302°、88°、5.625°）', () => {
    const t = FLOW_STEPS.join('');
    expect(t).toContain(`${MANDALA_RULES.startLongitude.value}°`);
    expect(t).toContain(`${DESIGN_ARC_DEG}°`);
    expect(t).toContain('5.625°');
  });
  it('寬、窄兩種版面都有 role="img" 與說明', () => {
    const html = renderToStaticMarkup(<ChartingFlow />);
    expect((html.match(/data-figure="charting-flow"/g) || []).length).toBe(2);
    expect((html.match(/role="img"/g) || []).length).toBe(2);
    expect(html).toContain('流程圖的文字說明');
  });
});

describe('C. 中心圖解', () => {
  it('小圖為裝飾（aria-hidden），中心名稱以 HTML 文字呈現', () => {
    const html = renderToStaticMarkup(<CentersAtlas />);
    expect((html.match(/class="center-glyph" aria-hidden="true"/g) || []).length).toBe(9);
    expect((html.match(/href="#\/centers\//g) || []).length).toBe(9);
  });
  it('小圖的狀態與傳入的狀態一致，只強調一個中心', () => {
    const html = renderToStaticMarkup(<CenterGlyph id="solarPlexus" state="defined" />);
    expect(html).toContain('data-center="solarPlexus" data-state="defined"');
    expect((html.match(/data-state="defined"/g) || []).length).toBe(2); // 外層 span 與中心本身
  });
});

describe('D. 出生時間不確定性時間軸', () => {
  it('約略模式：每一段的值與該取樣點的重新計算一致，且各段首尾相接', () => {
    const { samples, markerIndex } = approxSamples(chart.birthUtc, 120);
    const tl = buildTimeline(samples, markerIndex);
    expect(tl.labels[markerIndex]).toBe('輸入時刻');
    for (const row of tl.rows) {
      expect(row.segments[0].from).toBe(0);
      expect(row.segments[row.segments.length - 1].to).toBe(samples.length - 1);
      for (let k = 1; k < row.segments.length; k++) expect(row.segments[k].from).toBe(row.segments[k - 1].to + 1);
    }
    const moon = tl.rows.find((r) => r.key === 'personality-moon');
    if (moon) {
      for (const s of moon.segments) {
        for (const i of [s.from, s.to]) {
          const a = samples[i].chart.personality.find((x) => x.body === 'moon')!;
          expect(`${a.gate}.${a.line}`).toBe(s.value);
        }
      }
    }
    const typeRow = tl.rows.find((r) => r.key === 'type')!;
    expect(typeRow.segments.map((s) => s.value)).toContain(TYPES[chart.derivation.type].name);
  });
  it('只知道日期：48 個取樣，夏令時間重複時段標示第一次、第二次', () => {
    expect(daySamples(computeDayRange('1990-05-05', 'Asia/Taipei'))).toHaveLength(48);
    const labels = daySamples(computeDayRange('2021-11-07', 'America/Vancouver')).map((s) => s.label);
    expect(labels).toContain('01:00（第一次）');
    expect(labels).toContain('01:30（第二次）');
  });
  it('SVG 有標題，且附文字版', () => {
    const { samples, markerIndex } = approxSamples(chart.birthUtc, 30);
    const html = renderToStaticMarkup(<UncertaintyTimeline samples={samples} markerIndex={markerIndex} caption="測試" />);
    expect(html).toMatch(/role="img"/);
    expect(html).toContain('時間軸的文字版');
  });
});

describe('E. 報告封面', () => {
  const model = coverFromChart(chart, { birthLine: '1990-05-05 11:20・Asia/Taipei', modeLabel: '出生時間精確', generatedAt: new Date('2026-10-29T00:00:00Z') });
  const svg = coverSvg(model);
  it('封面上的類型、權威與中心狀態和排圖資料一致', () => {
    expect(svg).toContain(`data-fact="類型">${TYPES[chart.derivation.type].name}<`);
    expect(svg).toContain(`data-fact="內在權威">${AUTHORITIES[chart.derivation.authority].name}<`);
    expect(svg).toContain(`${chart.profile.conscious}/${chart.profile.unconscious}`);
    const defined = attrs(svg, /data-center="(\w+)" data-state="defined"/g).map((m) => m[0]);
    expect(defined.sort()).toEqual([...definedCenters].sort());
  });
  it('封面一定帶有非診斷、非預測的提示（兩行都在）', () => {
    for (const l of COVER_NOTICE_LINES) expect(svg).toContain(l);
  });
  it('所有欄位截斷後都不超出右側邊界（以中文字寬約等於字級估算）', () => {
    const long = coverSvg({ ...model, title: '非常非常長的報告標題超過十五個字元的情況下', birthLine: '1990-05-05 11:20・America/Argentina/ComodRivadavia・UTC−03:00' });
    for (const [, size, text] of long.matchAll(/<text x="300"[^>]*font-size="(\d+)"[^>]*>([^<]*)</g)) {
      const width = [...text].reduce((w, ch) => w + (/[\x00-\x7f]/.test(ch) ? 0.6 : 1) * Number(size), 0);
      expect(300 + width, text).toBeLessThanOrEqual(760);
    }
  });
  it('一般長度的出生資料不會被截斷', () => {
    const typical = coverSvg({ ...model, birthLine: '1990-05-05 11:20・Asia/Taipei・UTC+08:00' });
    expect(typical).toContain('>1990-05-05 11:20・Asia/Taipei・UTC+08:00<');
  });
  it('使用者輸入的標題會被跳脫', () => {
    const bad = coverSvg({ ...model, title: '<script>alert(1)</script>' });
    expect(bad).not.toContain('<script>');
  });
  it('匯出 HTML 內嵌與網頁相同的封面', () => {
    const report = buildReport({ mode: 'exact', chart }, { subjectIsMinor: false });
    const html = reportToHtml(report, { includeReflection: false, reflection: {}, provenance: chart.provenance, birthSummary: 'x', generatedAt: new Date(0), coverSvg: svg });
    expect(html).toContain(svg);
  });
  it('只知道日期：無法確定的項目顯示「無法確定」，中心以三種狀態呈現', () => {
    const day = computeDayRange('1990-05-05', 'Asia/Taipei');
    const m = coverFromDay(day, { birthLine: '1990-05-05', generatedAt: new Date(0) });
    const s = coverSvg(m);
    if (!day.type) expect(s).toContain('data-fact="類型">無法確定<');
    for (const id of day.alwaysDefined) expect(s).toContain(`data-center="${id}" data-state="defined"`);
  });
});
