// D. 出生時間不確定性示意：在時間範圍內，類型、權威、人生角色與各啟動點於何時改變。
// 資料由排圖引擎逐點計算，不做內插。圖下附文字版。

import { useId, useMemo } from 'react';
import { buildTimeline, type Timeline, type TimelineSample } from '../lib/timeline';

const LABEL_W = 118;
const PLOT_W = 560;
const ROW_H = 26;
const TOP = 34;

function tickIndices(n: number, marker: number | null): number[] {
  const set = new Set<number>([0, n - 1]);
  for (let k = 1; k < 4; k++) set.add(Math.round(((n - 1) * k) / 4));
  if (marker !== null) set.add(marker);
  return [...set].sort((a, b) => a - b);
}

export function UncertaintyTimeline({ samples, markerIndex, caption }: { samples: TimelineSample[]; markerIndex: number | null; caption: string }) {
  const uid = useId().replace(/:/g, '');
  const tl: Timeline = useMemo(() => buildTimeline(samples, markerIndex), [samples, markerIndex]);
  const n = tl.labels.length;
  const cw = PLOT_W / n;
  const height = TOP + tl.rows.length * ROW_H + 10;
  const width = LABEL_W + PLOT_W + 12;
  const summary = tl.rows
    .filter((r) => r.kind === 'summary')
    .map((r) => `${r.label}${r.segments.length === 1 ? '在整個範圍內不變' : `在範圍內改變 ${r.segments.length - 1} 次`}`)
    .join('；');

  return (
    <figure className="timeline-wrap" data-figure="uncertainty-timeline">
      <div className="timeline-scroll" tabIndex={0} role="region" aria-label="時間軸（窄螢幕可左右捲動）">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-labelledby={`${uid}-t`}
          className="timeline-figure"
        >
          <title id={`${uid}-t`}>{`${caption}。${summary}。另有 ${tl.stableActivations} 個啟動點在範圍內不變。文字版在圖下方。`}</title>
          {tickIndices(n, tl.markerIndex).map((i) => (
            <g key={i} className={`tl-tick${i === tl.markerIndex ? ' is-marker' : ''}`}>
              <line x1={LABEL_W + (i + 0.5) * cw} y1={TOP - 6} x2={LABEL_W + (i + 0.5) * cw} y2={height - 8} />
              <text x={LABEL_W + (i + 0.5) * cw} y={TOP - 12} textAnchor="middle">
                {tl.labels[i]}
              </text>
            </g>
          ))}
          {tl.rows.map((row, r) => {
            const y = TOP + r * ROW_H;
            return (
              <g key={row.key} className={`tl-row is-${row.kind}`} data-row={row.key} data-segments={row.segments.length}>
                <text x={LABEL_W - 8} y={y + ROW_H / 2} textAnchor="end" dominantBaseline="central" className="tl-label">
                  {row.label}
                </text>
                {row.segments.map((s, k) => {
                  const x = LABEL_W + s.from * cw;
                  const w = (s.to - s.from + 1) * cw;
                  const fits = w > [...s.value].length * 9 + 6;
                  return (
                    <g key={`${s.from}-${s.value}`} className={`tl-seg${k % 2 ? ' is-alt' : ''}`}>
                      <rect x={x + 0.5} y={y + 3} width={Math.max(1, w - 1)} height={ROW_H - 6} rx="3" />
                      {fits && (
                        <text x={x + w / 2} y={y + ROW_H / 2} textAnchor="middle" dominantBaseline="central">
                          {s.value}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        <p className="muted small">{caption}。灰階交替的色塊代表不同的值；標示「輸入時刻」的直線是你輸入的時間。只列出在範圍內會改變的啟動點，另有 {tl.stableActivations} 個不變。</p>
        <details className="more">
          <summary>時間軸的文字版</summary>
          <ul>
            {tl.rows.map((row) => (
              <li key={row.key}>
                {row.label}：
                {row.segments.length === 1
                  ? `${row.segments[0].value}（整個範圍不變）`
                  : row.segments.map((s) => `${s.value}（${tl.labels[s.from]} 至 ${tl.labels[s.to]}）`).join('、')}
              </li>
            ))}
          </ul>
        </details>
      </figcaption>
    </figure>
  );
}
