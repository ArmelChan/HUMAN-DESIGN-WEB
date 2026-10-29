// BodyGraph 繪圖幾何：互動圖（BodyGraph.tsx）與靜態圖（staticBodygraph.ts）共用，確保兩者畫出同一張圖。

import { GATES, type ChannelStructure } from '../data/structure';
import { CHANNEL_BENDS, GATE_POINTS, GEOMETRY, centroid, type Point } from '../data/geometry';

const LABEL_INSET = 11;

/** 閘門號碼的顯示位置：由錨點往中心內縮一點。 */
export const gateLabelPoint: Record<number, Point> = (() => {
  const out: Record<number, Point> = {};
  for (const gate of GATES) {
    const a = GATE_POINTS[gate.number];
    const c = centroid(GEOMETRY[gate.center].points);
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    out[gate.number] = { x: a.x + (dx / len) * LABEL_INSET, y: a.y + (dy / len) * LABEL_INSET };
  }
  return out;
})();

/** 把通道切成兩半，各半屬於一個閘門。有彎曲的通道以二次貝茲曲線切分。 */
export function channelHalves(c: ChannelStructure): [string, string] {
  const a = GATE_POINTS[c.gates[0]];
  const b = GATE_POINTS[c.gates[1]];
  const bend = CHANNEL_BENDS[c.id];
  if (!bend) {
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return [`M${a.x},${a.y} L${m.x},${m.y}`, `M${b.x},${b.y} L${m.x},${m.y}`];
  }
  const p01 = { x: (a.x + bend.x) / 2, y: (a.y + bend.y) / 2 };
  const p12 = { x: (bend.x + b.x) / 2, y: (bend.y + b.y) / 2 };
  const m = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 };
  return [`M${a.x},${a.y} Q${p01.x},${p01.y} ${m.x},${m.y}`, `M${b.x},${b.y} Q${p12.x},${p12.y} ${m.x},${m.y}`];
}

export function channelFull(c: ChannelStructure): string {
  const a = GATE_POINTS[c.gates[0]];
  const b = GATE_POINTS[c.gates[1]];
  const bend = CHANNEL_BENDS[c.id];
  return bend ? `M${a.x},${a.y} Q${bend.x},${bend.y} ${b.x},${b.y}` : `M${a.x},${a.y} L${b.x},${b.y}`;
}
