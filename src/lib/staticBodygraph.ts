// 靜態 BodyGraph 的 SVG 字串渲染器：用於報告封面、中心小圖與匯出檔。
// 顏色使用網站的 CSS 變數，並附淺色模式的備用值，讓匯出的獨立 HTML 也能正確顯示。
// 每個元素都帶 data-* 屬性，供測試核對圖與排圖資料一致。

import { CENTER_ORDER, CENTERS, CHANNELS, type CenterId } from '../data/structure';
import { GEOMETRY, VIEWBOX, polygonPath } from '../data/geometry';
import { channelFull, channelHalves, gateLabelPoint } from './bodygraphDraw';
import type { GateSource } from './chart';

/** 靜態圖的中心狀態。uncertain 用於只知道出生日期時無法確定的中心。 */
export type StaticCenterState = 'defined' | 'notDefined' | 'uncertain' | 'neutral';

export interface StaticBodygraphOptions {
  centerStates?: Partial<Record<CenterId, StaticCenterState>>;
  gateSources?: Map<number, GateSource>;
  /** 只強調一個中心（中心小圖用），其他中心淡化。 */
  focus?: CenterId;
  showGateNumbers?: boolean;
  showCenterLabels?: boolean;
  /** 套用在最外層 <g> 的 transform，用於嵌入較大的 SVG。 */
  transform?: string;
}

export const COLOR = {
  centerFill: 'var(--center-fill, #ffffff)',
  centerStroke: 'var(--center-stroke, #6b665c)',
  definedFill: 'var(--defined-fill, #d9a441)',
  definedStroke: 'var(--defined-stroke, #6d4c0f)',
  tube: 'var(--tube, #b7b1a4)',
  tubeInner: 'var(--tube-inner, #ffffff)',
  personality: 'var(--line-on, #2c2a26)',
  design: 'var(--design, #b3261e)',
  accent: 'var(--accent, #0f5c63)',
  ink: 'var(--ink, #1f1d1a)',
  onDark: '#ffffff',
  surface: 'var(--surface, #ffffff)',
  muted: 'var(--muted, #625d54)',
} as const;

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function centerStyle(state: StaticCenterState, dim: boolean): string {
  const opacity = dim ? ' opacity="0.35"' : '';
  switch (state) {
    case 'defined':
      return `fill="${COLOR.definedFill}" stroke="${COLOR.definedStroke}" stroke-width="2.5"${opacity}`;
    case 'notDefined':
      return `fill="${COLOR.centerFill}" stroke="${COLOR.centerStroke}" stroke-width="2" stroke-dasharray="7 4"${opacity}`;
    case 'uncertain':
      return `fill="${COLOR.centerFill}" stroke="${COLOR.centerStroke}" stroke-width="2" stroke-dasharray="1.5 4" stroke-linecap="round"${opacity}`;
    default:
      return `fill="${COLOR.centerFill}" stroke="${COLOR.centerStroke}" stroke-width="1.5"${opacity}`;
  }
}

/** 回傳一組 <g> 元素（不含外層 <svg>），座標系為 BodyGraph 的 viewBox（400×700）。 */
export function bodygraphGroup(opts: StaticBodygraphOptions = {}): string {
  const states = opts.centerStates ?? {};
  const sources = opts.gateSources ?? new Map<number, GateSource>();
  const parts: string[] = [];
  parts.push(`<g${opts.transform ? ` transform="${opts.transform}"` : ''} data-figure="bodygraph">`);

  // 通道：底色管線 + 兩半依閘門來源上色
  for (const c of CHANNELS) {
    const [h0, h1] = channelHalves(c);
    const dim = opts.focus ? !CENTERS[opts.focus].gates.some((g) => c.gates.includes(g)) : false;
    parts.push(`<g data-channel="${c.id}"${dim ? ' opacity="0.35"' : ''}>`);
    parts.push(`<path d="${channelFull(c)}" fill="none" stroke="${COLOR.tube}" stroke-width="8" stroke-linecap="round"/>`);
    for (const [d, g] of [[h0, c.gates[0]], [h1, c.gates[1]]] as const) {
      const src = sources.get(g);
      const color = src === 'design' || src === 'both' ? COLOR.design : src === 'personality' ? COLOR.personality : COLOR.tubeInner;
      parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="5" data-half="${g}" data-on="${src ? 1 : 0}"/>`);
      if (src === 'both') parts.push(`<path d="${d}" fill="none" stroke="${COLOR.personality}" stroke-width="5" stroke-dasharray="4 4"/>`);
    }
    parts.push('</g>');
  }

  for (const id of CENTER_ORDER) {
    const state = states[id] ?? 'neutral';
    const dim = opts.focus ? opts.focus !== id : false;
    const focusRing = opts.focus === id ? ` <polygon points="${polygonPath(GEOMETRY[id].points)}" fill="none" stroke="${COLOR.accent}" stroke-width="7" stroke-linejoin="round"/>` : '';
    parts.push(
      `<g data-center="${id}" data-state="${state}">${focusRing}<polygon points="${polygonPath(GEOMETRY[id].points)}" ${centerStyle(state, dim)} stroke-linejoin="round"/>`,
    );
    if (opts.showCenterLabels) {
      const l = GEOMETRY[id].label;
      parts.push(`<text x="${l.x}" y="${l.y}" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="${state === 'defined' ? '#1f1d1a' : COLOR.ink}">${CENTERS[id].shortName}</text>`);
    }
    parts.push('</g>');
  }

  for (const [gate, src] of sources) {
    const pt = gateLabelPoint[gate];
    const fill = src === 'design' ? COLOR.design : COLOR.personality;
    const ring = src === 'both' ? ` stroke="${COLOR.design}" stroke-width="2.5"` : '';
    parts.push(`<g data-gate="${gate}" data-source="${src}"><circle cx="${pt.x}" cy="${pt.y}" r="7" fill="${fill}"${ring}/>`);
    if (opts.showGateNumbers !== false) {
      parts.push(`<text x="${pt.x}" y="${pt.y}" font-size="8.5" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${src === 'design' ? COLOR.onDark : 'var(--gate-on-ink, #ffffff)'}">${gate}</text>`);
    }
    parts.push('</g>');
  }
  parts.push('</g>');
  return parts.join('');
}

export function staticBodygraphSvg(opts: StaticBodygraphOptions & { title: string; width?: number }): string {
  const w = opts.width ?? 120;
  const h = Math.round((w * VIEWBOX.height) / VIEWBOX.width);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.width} ${VIEWBOX.height}" width="${w}" height="${h}" role="img" aria-label="${escapeXml(opts.title)}" data-figure="static-bodygraph"><title>${escapeXml(opts.title)}</title>${bodygraphGroup(opts)}</svg>`;
}
