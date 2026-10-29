// 黃道經度 → 閘門、爻、色、調、基底。規則數值取自 src/data/rules/mandala.ts。

import { BASES_PER_CIRCLE, MANDALA_RULES, WIDTH_DEG } from '../data/rules/mandala';

export const WHEEL_START = MANDALA_RULES.startLongitude.value;
export const GATE_WHEEL = MANDALA_RULES.gateOrder.value;
export const GATE_SPAN = WIDTH_DEG.gate;
export const LINE_SPAN = WIDTH_DEG.line;

const S = MANDALA_RULES.subdivisions;

export interface GateLine {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  /** 距離最近的爻邊界（度）。 */
  boundaryDistance: number;
  /** 距離最近的閘門邊界（度）。 */
  gateBoundaryDistance: number;
}

export function normalize(deg: number): number {
  const r = ((deg % 360) + 360) % 360;
  return r === 360 ? 0 : r;
}

/** 有號的最短角距，範圍 (-180, 180]。 */
export function wrap180(deg: number): number {
  const r = normalize(deg + 180) - 180;
  return r === -180 ? 180 : r;
}

export function longitudeToGateLine(longitude: number, start: number = WHEEL_START): GateLine {
  const offset = normalize(longitude - start);
  // 以基底為單位的整數索引；加上極小的 epsilon，讓恰好落在邊界上的值穩定歸入後一段（左閉右開）。
  const units = (offset / 360) * BASES_PER_CIRCLE;
  let idx = Math.floor(units + MANDALA_RULES.precision.epsilonDeg / WIDTH_DEG.base);
  if (idx >= BASES_PER_CIRCLE) idx -= BASES_PER_CIRCLE;
  const perTone = S.base;
  const perColor = perTone * S.tone;
  const perLine = perColor * S.color;
  const perGate = perLine * S.line;
  const gateIndex = Math.floor(idx / perGate);
  const inGate = idx % perGate;
  const line = Math.floor(inGate / perLine) + 1;
  const color = Math.floor((inGate % perLine) / perColor) + 1;
  const tone = Math.floor((inGate % perColor) / perTone) + 1;
  const base = (inGate % perTone) + 1;

  const inLineDeg = offset - (gateIndex * perGate + (line - 1) * perLine) * WIDTH_DEG.base;
  const inGateDeg = offset - gateIndex * WIDTH_DEG.gate;
  return {
    gate: GATE_WHEEL[gateIndex],
    line,
    color,
    tone,
    base,
    boundaryDistance: Math.max(0, Math.min(inLineDeg, LINE_SPAN - inLineDeg)),
    gateBoundaryDistance: Math.max(0, Math.min(inGateDeg, GATE_SPAN - inGateDeg)),
  };
}

export function gateStartLongitude(gate: number): number {
  const i = GATE_WHEEL.indexOf(gate);
  if (i < 0) throw new Error(`沒有閘門 ${gate}`);
  return normalize(WHEEL_START + i * GATE_SPAN);
}

const SIGNS = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];

export function formatZodiac(longitude: number): string {
  const lon = normalize(longitude);
  let sign = Math.floor(lon / 30);
  const within = lon - sign * 30;
  let deg = Math.floor(within);
  let min = Math.round((within - deg) * 60);
  if (min === 60) {
    deg += 1;
    min = 0;
  }
  if (deg === 30) {
    deg = 0;
    sign = (sign + 1) % 12;
  }
  return `${SIGNS[sign]}座 ${deg}°${String(min).padStart(2, '0')}′`;
}
