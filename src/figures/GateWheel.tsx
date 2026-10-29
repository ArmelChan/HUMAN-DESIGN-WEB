// A. 首頁主視覺：64 個閘門沿黃經排列的閘門輪，依規則表繪製；標出「現在」太陽與地球所在的閘門。
// 中央的 BodyGraph 輪廓只是裝飾（aria-hidden），可互動的圖在下方。
// 天文計算在掛載後以延遲載入取得，主視覺本身不需要等計算完成。

import { useEffect, useId, useState } from 'react';
import { MANDALA_RULES } from '../data/rules/mandala';
import { GEOMETRY, polygonPath } from '../data/geometry';
import { CENTER_ORDER } from '../data/structure';

const SIZE = 360;
const C = SIZE / 2;
const R_OUT = 160;
const R_GATE_IN = 128;
const R_SIGN_IN = 106;
const SIGNS = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];
const SPAN = 360 / 64;

/** 黃經 → 畫面座標：0° 在右側，逆時針增加。 */
function pt(lonDeg: number, r: number) {
  const a = (lonDeg * Math.PI) / 180;
  return { x: +(C + r * Math.cos(a)).toFixed(2), y: +(C - r * Math.sin(a)).toFixed(2) };
}

function sector(a0: number, a1: number, r0: number, r1: number): string {
  const p0 = pt(a0, r1);
  const p1 = pt(a1, r1);
  const p2 = pt(a1, r0);
  const p3 = pt(a0, r0);
  return `M${p0.x},${p0.y} A${r1},${r1} 0 0 0 ${p1.x},${p1.y} L${p2.x},${p2.y} A${r0},${r0} 0 0 1 ${p3.x},${p3.y} Z`;
}

/** 閘門輪的分段：每個閘門的起訖黃經，直接取自規則表。 */
export function wheelSegments(): { gate: number; a0: number; a1: number }[] {
  const start = MANDALA_RULES.startLongitude.value;
  return MANDALA_RULES.gateOrder.value.map((gate, i) => ({ gate, a0: start + i * SPAN, a1: start + (i + 1) * SPAN }));
}

export interface WheelHighlight {
  sun: { gate: number; line: number; longitude: number };
  earth: { gate: number; line: number };
  at: Date;
}

/** 依目前時刻計算太陽與地球的閘門。天文模組延遲載入，不放進首頁主程式包。 */
export function useCurrentSunGate(): WheelHighlight | null {
  const [h, setH] = useState<WheelHighlight | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([import('../lib/ephemeris'), import('../lib/mandala')])
      .then(([eph, man]) => {
        const at = new Date();
        const lon = eph.ASTRONOMY_ENGINE.sunLongitude(at);
        const s = man.longitudeToGateLine(lon);
        const e = man.longitudeToGateLine(lon + 180);
        if (alive) setH({ sun: { gate: s.gate, line: s.line, longitude: lon }, earth: { gate: e.gate, line: e.line }, at });
      })
      .catch(() => {
        /* 計算模組載入失敗時只顯示閘門輪本身 */
      });
    return () => {
      alive = false;
    };
  }, []);
  return h;
}

export function GateWheel({ highlight }: { highlight: WheelHighlight | null }) {
  const uid = useId().replace(/:/g, '');
  const start = MANDALA_RULES.startLongitude.value;

  return (
    <svg
      className="gate-wheel"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      data-figure="gate-wheel"
    >
      <title id={`${uid}-t`}>閘門輪：64 個閘門沿黃道的排列</title>
      <desc id={`${uid}-d`}>
        {`外圈依規則表 ${MANDALA_RULES.version} 由閘門 41（黃經 ${start}°）起逆時針排列 64 個閘門，內圈為黃道十二星座的範圍。`}
        {highlight ? `目前太陽位於閘門 ${highlight.sun.gate} 第 ${highlight.sun.line} 爻，地球位於閘門 ${highlight.earth.gate} 第 ${highlight.earth.line} 爻。` : ''}
      </desc>

      <g className="gw-gates">
        {wheelSegments().map(({ gate, a0, a1 }, i) => {
          const mid = pt((a0 + a1) / 2, (R_OUT + R_GATE_IN) / 2);
          const isSun = highlight?.sun.gate === gate;
          const isEarth = highlight?.earth.gate === gate;
          return (
            <g key={gate} data-wheel-gate={gate} className={`gw-gate${i % 2 ? ' is-alt' : ''}${isSun ? ' is-sun' : ''}${isEarth ? ' is-earth' : ''}`}>
              <path d={sector(a0, a1, R_GATE_IN, R_OUT)} />
              <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central">
                {gate}
              </text>
            </g>
          );
        })}
      </g>

      <g className="gw-signs" aria-hidden="true">
        {SIGNS.map((name, k) => {
          const a0 = k * 30;
          const p0 = pt(a0, R_SIGN_IN);
          const p1 = pt(a0, R_GATE_IN);
          const mid = pt(a0 + 15, (R_SIGN_IN + R_GATE_IN) / 2);
          return (
            <g key={name}>
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} />
              <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central">
                {name}
              </text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r={R_SIGN_IN} />
      </g>

      {highlight && (
        <g className="gw-marker" aria-hidden="true">
          {(() => {
            const tip = pt(highlight.sun.longitude, R_OUT + 2);
            const b1 = pt(highlight.sun.longitude - 2.2, R_OUT + 14);
            const b2 = pt(highlight.sun.longitude + 2.2, R_OUT + 14);
            return <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} />;
          })()}
        </g>
      )}

      {/* 裝飾：BodyGraph 輪廓，不表示任何人的狀態 */}
      <g className="gw-silhouette" aria-hidden="true" transform={`translate(${C - 54} ${C - 94.5}) scale(0.27)`}>
        {CENTER_ORDER.map((id) => (
          <polygon key={id} points={polygonPath(GEOMETRY[id].points)} />
        ))}
      </g>
    </svg>
  );
}

export function HeroWheel() {
  const highlight = useCurrentSunGate();
  const dateText = highlight
    ? `${highlight.at.getFullYear()}-${String(highlight.at.getMonth() + 1).padStart(2, '0')}-${String(highlight.at.getDate()).padStart(2, '0')} ${String(highlight.at.getHours()).padStart(2, '0')}:${String(highlight.at.getMinutes()).padStart(2, '0')}`
    : '';
  return (
    <figure className="hero-wheel">
      <GateWheel highlight={highlight} />
      <figcaption>
        <span className="hero-now" role="status" aria-live="polite">
          {highlight
            ? `現在（你的裝置時間 ${dateText}）太陽位於閘門 ${highlight.sun.gate} 第 ${highlight.sun.line} 爻，地球位於閘門 ${highlight.earth.gate} 第 ${highlight.earth.line} 爻。`
            : '正在計算現在太陽所在的閘門…'}
        </span>
        <span className="muted small">
          閘門輪依規則表 {MANDALA_RULES.version} 繪製：黃經 0° 在右側、逆時針增加；起點在不同實作之間存在分歧（見<a href="#/verification">計算驗證</a>）。這是天文位置對應到體系規則的結果，不代表任何人的人類圖。
        </span>
      </figcaption>
    </figure>
  );
}
