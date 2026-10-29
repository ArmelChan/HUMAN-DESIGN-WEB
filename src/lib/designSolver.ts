// 設計時刻求根：找出生前、太陽視黃經比出生時少 88° 的時刻。
// 不以「出生日期減 88 天」代替；以夾擠區間內的割線法搭配二分法保底，並記錄殘差與停止條件。

import type { EphemerisEngine } from './ephemeris';
import { normalize, wrap180 } from './mandala';

export const DESIGN_ARC_DEG = 88;

export interface SolverReport {
  method: string;
  targetLongitude: number;
  /** 起始夾擠區間（出生前天數）。 */
  bracketDaysBefore: [number, number];
  iterations: number;
  /** 解上的 wrap180(太陽黃經 − 目標)，單位度。 */
  residualDeg: number;
  /** 最後一步的時間變化，單位秒。 */
  lastStepSeconds: number;
  stopReason: 'residual' | 'step' | 'maxIterations';
  tolerance: { residualDeg: number; stepSeconds: number; maxIterations: number };
}

const DAY = 86400000;
const TOL = { residualDeg: 1e-8, stepSeconds: 1e-3, maxIterations: 60 };

export function solveDesignMoment(birth: Date, engine: EphemerisEngine): { design: Date; report: SolverReport } {
  const target = normalize(engine.sunLongitude(birth) - DESIGN_ARC_DEG);
  // f 在區間內單調遞增（太陽每天前進約 0.95°–1.02°），wrap180 處理 0°/360° 的跨越。
  const f = (ms: number) => wrap180(engine.sunLongitude(new Date(ms)) - target);
  const bracket: [number, number] = [96, 82];
  let a = birth.getTime() - bracket[0] * DAY;
  let b = birth.getTime() - bracket[1] * DAY;
  let fa = f(a);
  let fb = f(b);
  if (!(fa < 0 && fb > 0)) throw new Error(`設計時刻求根失敗：夾擠區間兩端同號（${fa.toFixed(4)}, ${fb.toFixed(4)}）`);

  let x = b;
  let fx = fb;
  let step = Infinity;
  let i = 0;
  let stopReason: SolverReport['stopReason'] = 'maxIterations';
  for (; i < TOL.maxIterations; i++) {
    // 割線（regula falsi）候選，落在區間外或收斂太慢時改用二分。
    let next = b - (fb * (b - a)) / (fb - fa);
    if (!(next > a && next < b) || i % 4 === 3) next = (a + b) / 2;
    const fn = f(next);
    step = Math.abs(next - x) / 1000;
    x = next;
    fx = fn;
    if (Math.abs(fn) < TOL.residualDeg) {
      stopReason = 'residual';
      i++;
      break;
    }
    if (step < TOL.stepSeconds) {
      stopReason = 'step';
      i++;
      break;
    }
    if (fn < 0) {
      a = next;
      fa = fn;
    } else {
      b = next;
      fb = fn;
    }
  }
  return {
    design: new Date(x),
    report: {
      method: '割線法（regula falsi）＋ 每 4 步二分保底，於出生前 82–96 天的夾擠區間內',
      targetLongitude: target,
      bracketDaysBefore: bracket,
      iterations: i,
      residualDeg: fx,
      lastStepSeconds: step,
      stopReason,
      tolerance: TOL,
    },
  };
}
