// 個人報告封面：由排圖資料產生的 SVG 模板。網頁與匯出檔使用同一個字串，內容一致。

import { CENTER_ORDER, type CenterId } from '../data/structure';
import { AUTHORITIES, TYPES } from '../data/content/types';
import { LINES } from '../data/content/profiles';
import { MANDALA_RULES } from '../data/rules/mandala';
import type { Chart, GateSource } from './chart';
import type { DayRangeResult } from './dayRange';
import type { DefinitionKind } from './derive';
import { REPORT_VERSION } from './report';
import { COLOR, bodygraphGroup, escapeXml, type StaticCenterState } from './staticBodygraph';

const DEFINITION_LABEL: Record<DefinitionKind, string> = {
  none: '無定義',
  single: '一分人',
  split: '二分人',
  tripleSplit: '三分人',
  quadrupleSplit: '四分人',
};

export interface CoverModel {
  title: string;
  modeLabel: string;
  birthLine: string;
  facts: { label: string; value: string }[];
  centerStates: Record<CenterId, StaticCenterState>;
  gateSources: Map<number, GateSource>;
  generatedAt: string;
  versions: string;
}

export const COVER_NOTICE_LINES = ['依人類圖體系規則計算・非醫療或心理診斷', '象徵性解讀不保證事件發生・外部驗證待完成'] as const;
export const COVER_NOTICE = COVER_NOTICE_LINES.join('・');
const UNKNOWN = '無法確定';

export function coverFromChart(chart: Chart, opts: { title?: string; birthLine: string; modeLabel: string; generatedAt: Date }): CoverModel {
  const d = chart.derivation;
  const centerStates = {} as Record<CenterId, StaticCenterState>;
  for (const id of CENTER_ORDER) centerStates[id] = d.centerStates[id] === 'defined' ? 'defined' : 'notDefined';
  const p = chart.profile;
  return {
    title: opts.title?.trim() || '人類圖個人報告',
    modeLabel: opts.modeLabel,
    birthLine: opts.birthLine,
    facts: [
      { label: '類型', value: TYPES[d.type].name },
      { label: '內在權威', value: AUTHORITIES[d.authority].name },
      { label: '人生角色', value: `${p.conscious}/${p.unconscious}（${LINES[p.conscious - 1].name}／${LINES[p.unconscious - 1].name}）` },
      { label: '定義類型', value: DEFINITION_LABEL[d.definition] },
    ],
    centerStates,
    gateSources: chart.gateSources,
    generatedAt: opts.generatedAt.toISOString().slice(0, 10),
    versions: `${REPORT_VERSION}・${MANDALA_RULES.version}`,
  };
}

export function coverFromDay(day: DayRangeResult, opts: { title?: string; birthLine: string; generatedAt: Date }): CoverModel {
  const centerStates = {} as Record<CenterId, StaticCenterState>;
  for (const id of CENTER_ORDER) {
    centerStates[id] = day.alwaysDefined.includes(id) ? 'defined' : day.neverDefined.includes(id) ? 'notDefined' : 'uncertain';
  }
  return {
    title: opts.title?.trim() || '人類圖個人報告',
    modeLabel: '只知道出生日期・只顯示全天不變的部分',
    birthLine: opts.birthLine,
    facts: [
      { label: '類型', value: day.type ? TYPES[day.type].name : UNKNOWN },
      { label: '內在權威', value: day.authority ? AUTHORITIES[day.authority].name : UNKNOWN },
      { label: '人生角色', value: day.profile ?? UNKNOWN },
      { label: '定義類型', value: day.definition ? DEFINITION_LABEL[day.definition] : UNKNOWN },
    ],
    centerStates,
    gateSources: day.stableGates,
    generatedAt: opts.generatedAt.toISOString().slice(0, 10),
    versions: `${REPORT_VERSION}・${MANDALA_RULES.version}`,
  };
}

/** 估算字寬（以字級為單位）：ASCII 約 0.6 字寬，中文與全形符號約 1 字寬。 */
function charEm(ch: string): number {
  return /[\x00-\x7f]/.test(ch) ? 0.6 : 1;
}

/** 依估算寬度截斷，避免 SVG 文字超出版面（SVG 文字不會自動換行）。maxPx 為可用寬度。 */
function fit(s: string, fontSize: number, maxPx = TEXT_WIDTH): string {
  const chars = [...s];
  const max = maxPx / fontSize;
  if (chars.reduce((w, ch) => w + charEm(ch), 0) <= max) return s;
  // 超出時保留能和「…」一起放進可用寬度的最長前綴
  let w = 1;
  let n = 0;
  while (n < chars.length && w + charEm(chars[n]) <= max) w += charEm(chars[n++]);
  return chars.slice(0, n).join('') + '…';
}

export const COVER_SIZE = { width: 800, height: 460 };
/** 右欄文字從 x=300 起，右側留 40px 邊界。 */
const TEXT_WIDTH = COVER_SIZE.width - 40 - 300;

export function coverSvg(m: CoverModel): string {
  const W = COVER_SIZE.width;
  const H = COVER_SIZE.height;
  const facts = m.facts
    .map(
      (f, i) =>
        `<text x="300" y="${168 + i * 52}" font-size="14" fill="${COLOR.muted}">${escapeXml(f.label)}</text>` +
        `<text x="300" y="${192 + i * 52}" font-size="22" font-weight="700" fill="${COLOR.ink}" data-fact="${escapeXml(f.label)}">${escapeXml(fit(f.value, 22))}</text>`,
    )
    .join('');
  const label = [
    m.title,
    m.modeLabel,
    ...m.facts.map((f) => `${f.label}：${f.value}`),
    COVER_NOTICE,
  ].join('；');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(label)}" data-figure="report-cover" font-family="'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif">` +
    `<title>${escapeXml(m.title)}</title>` +
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${COLOR.surface}" stroke="${COLOR.centerStroke}" stroke-width="1.5"/>` +
    bodygraphGroup({ centerStates: m.centerStates, gateSources: m.gateSources, showGateNumbers: true, transform: 'translate(36 28) scale(0.56)' }) +
    `<text x="300" y="70" font-size="30" font-weight="700" fill="${COLOR.ink}" data-field="title">${escapeXml(fit(m.title, 30))}</text>` +
    `<text x="300" y="100" font-size="15" fill="${COLOR.accent}">${escapeXml(fit(m.modeLabel, 15))}</text>` +
    `<text x="300" y="124" font-size="14" fill="${COLOR.muted}">${escapeXml(fit(m.birthLine, 14))}</text>` +
    facts +
    `<g font-size="12" fill="${COLOR.muted}"><rect x="40" y="430" width="14" height="6" fill="${COLOR.personality}"/><text x="60" y="437">人格</text><rect x="100" y="430" width="14" height="6" fill="${COLOR.design}"/><text x="120" y="437">設計</text><text x="160" y="437">實心中心＝有定義</text></g>` +
    `<line x1="290" y1="368" x2="${W - 40}" y2="368" stroke="${COLOR.centerStroke}" stroke-width="1"/>` +
    `<text x="300" y="390" font-size="14" fill="${COLOR.ink}" data-field="notice">${COVER_NOTICE_LINES.map((l, i) => `<tspan x="300" dy="${i === 0 ? 0 : 20}">${escapeXml(l)}</tspan>`).join('')}</text>` +
    `<text x="300" y="437" font-size="12" fill="${COLOR.muted}">產生日期 ${escapeXml(m.generatedAt)}・${escapeXml(m.versions)}</text>` +
    `</svg>`
  );
}
