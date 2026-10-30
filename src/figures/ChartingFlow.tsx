// B. 排圖流程圖：說明網站實際的計算步驟。寬螢幕用橫向版面，窄螢幕用直向版面；兩者內容相同。
// 不含任何個人資料。文字等價說明以 <ol> 呈現。

import { useId } from 'react';

interface Node {
  id: string;
  title: string;
  lines: string[];
  tone?: 'personality' | 'design';
}

const NODES: Node[] = [
  { id: 'local', title: '出生當地時間', lines: ['日期、時間', '準確程度'] },
  { id: 'utc', title: '換算 UTC', lines: ['IANA 時區資料', '處理夏令時間'] },
  { id: 'p', title: '人格：出生時刻', lines: ['13 個啟動點'], tone: 'personality' },
  { id: 'd', title: '設計：太陽 −88°', lines: ['數值求根', '約 88–89 天前'], tone: 'design' },
  { id: 'lon', title: '26 個黃經', lines: ['回歸黃道', '地心視位置'] },
  { id: 'gate', title: '閘門．爻', lines: ['閘門輪 302° 起', '左閉右開'] },
  { id: 'derive', title: '通道 → 中心', lines: ['類型・權威', '人生角色'] },
];

export const FLOW_STEPS = [
  '輸入出生當地的日期、時間與時間準確程度。',
  '依 IANA 時區資料（或自訂時差）換算成 UTC，並處理夏令時間的重複與跳過時段。',
  '人格取出生時刻；設計取太陽視黃經比出生時少 88° 的時刻，以數值求根求得，約在出生前 88–89 天。',
  '兩個時刻各計算 13 個啟動點（太陽、地球、南北交點、月亮、水星到冥王星），共 26 個地心回歸黃道經度。',
  '依閘門輪規則（閘門 41 起於 302°，每個閘門 5.625°、每爻 0.9375°，區間左閉右開）換算成閘門與爻。',
  '兩端閘門都被啟動的通道成立，連到成立通道的中心有定義，再依規則推導類型、內在權威與人生角色。',
];

type Box = { x: number; y: number; w: number; h: number };

const WIDE: { w: number; h: number; boxes: Record<string, Box> } = {
  w: 860,
  h: 250,
  boxes: {
    local: { x: 10, y: 88, w: 118, h: 74 },
    utc: { x: 150, y: 88, w: 118, h: 74 },
    p: { x: 292, y: 22, w: 144, h: 74 },
    d: { x: 292, y: 140, w: 144, h: 92 },
    lon: { x: 460, y: 88, w: 118, h: 74 },
    gate: { x: 600, y: 88, w: 118, h: 74 },
    derive: { x: 740, y: 88, w: 112, h: 74 },
  },
};

const NARROW: { w: number; h: number; boxes: Record<string, Box> } = {
  w: 360,
  h: 560,
  boxes: {
    local: { x: 30, y: 10, w: 300, h: 60 },
    utc: { x: 30, y: 96, w: 300, h: 60 },
    p: { x: 30, y: 182, w: 142, h: 76 },
    d: { x: 188, y: 182, w: 142, h: 76 },
    lon: { x: 30, y: 284, w: 300, h: 60 },
    gate: { x: 30, y: 370, w: 300, h: 60 },
    derive: { x: 30, y: 456, w: 300, h: 60 },
  },
};

const EDGES: [string, string][] = [
  ['local', 'utc'],
  ['utc', 'p'],
  ['utc', 'd'],
  ['p', 'lon'],
  ['d', 'lon'],
  ['lon', 'gate'],
  ['gate', 'derive'],
];

function edgePath(a: Box, b: Box, vertical: boolean): string {
  if (vertical) {
    const x1 = a.x + a.w / 2;
    const y1 = a.y + a.h;
    const x2 = b.x + b.w / 2;
    const y2 = b.y - 4;
    const my = (y1 + y2) / 2;
    return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
  }
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x - 4;
  const y2 = b.y + b.h / 2;
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

function Layout({ layout, vertical, uid }: { layout: typeof WIDE; vertical: boolean; uid: string }) {
  const marker = `${uid}-${vertical ? 'v' : 'h'}-arrow`;
  return (
    <svg
      className={`flow-figure ${vertical ? 'is-narrow' : 'is-wide'}`}
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      width={layout.w}
      height={layout.h}
      role="img"
      aria-label={`排圖流程：${NODES.map((n) => n.title).join('，')}。完整文字說明在圖下方。`}
      data-figure="charting-flow"
    >
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="flow-arrowhead" />
        </marker>
      </defs>
      {EDGES.map(([a, b]) => (
        <path key={`${a}-${b}`} d={edgePath(layout.boxes[a], layout.boxes[b], vertical)} className="flow-edge" markerEnd={`url(#${marker})`} />
      ))}
      {NODES.map((n, i) => {
        const b = layout.boxes[n.id];
        const lines = vertical && b.w > 200 ? [n.lines.join('・')] : n.lines;
        return (
          <g key={n.id} className={`flow-box${n.tone ? ` tone-${n.tone}` : ''}`}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="9" />
            <text x={b.x + 10} y={b.y + 22} className="flow-step">
              {i < 2 ? i + 1 : i < 4 ? 3 : i}
            </text>
            <text x={b.x + 28} y={b.y + 22} className="flow-title">
              {n.title}
            </text>
            {lines.map((l, j) => (
              <text key={l} x={b.x + 12} y={b.y + 44 + j * 18} className="flow-line">
                {l}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function ChartingFlow() {
  const uid = useId().replace(/:/g, '');
  return (
    <figure className="flow-wrap">
      <Layout layout={WIDE} vertical={false} uid={uid} />
      <Layout layout={NARROW} vertical={true} uid={uid} />
      <figcaption>
        <details className="more">
          <summary>流程圖的文字說明</summary>
          <ol>
            {FLOW_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </details>
      </figcaption>
    </figure>
  );
}
