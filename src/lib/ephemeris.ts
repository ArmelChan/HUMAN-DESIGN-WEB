// 星曆適配層。排圖流程只依賴 EphemerisEngine 介面，不直接呼叫特定函式庫，
// 日後若更換或並列其他星曆引擎（須先確認授權），只需新增一個實作。

import {
  Body,
  Ecliptic,
  GeoMoonState,
  GeoVector,
  MakeTime,
  RotateState,
  Rotation_EQJ_ECT,
  SunPosition,
} from 'astronomy-engine';
import { normalize } from './mandala';

export type BodyId =
  | 'sun' | 'earth' | 'northNode' | 'southNode' | 'moon' | 'mercury' | 'venus'
  | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

export const BODY_ORDER: BodyId[] = [
  'sun', 'earth', 'northNode', 'southNode', 'moon', 'mercury', 'venus',
  'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

export const BODY_LABEL: Record<BodyId, string> = {
  sun: '太陽', earth: '地球', northNode: '北交點', southNode: '南交點', moon: '月亮',
  mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星',
  uranus: '天王星', neptune: '海王星', pluto: '冥王星',
};

/**
 * 交點算法：
 * - osculating：密切（瞬時）交點，由月球位置與速度向量求軌道面與黃道的交線，與 Swiss Ephemeris 的 TRUE_NODE 定義相同。
 * - mean：平均交點（Meeus 第 47 章）。
 */
export type NodeMode = 'osculating' | 'mean';

export const NODE_MODE_LABEL: Record<NodeMode, string> = {
  osculating: '真交點（密切交點）',
  mean: '平均交點',
};

export interface EngineSettings {
  zodiac: 'tropical';
  frame: 'geocentric, true ecliptic and equinox of date';
  apparent: true;
  nodeMode: NodeMode;
  timeScale: 'UTC input, TT internally (ΔT from engine)';
}

export interface EphemerisEngine {
  id: string;
  name: string;
  version: string;
  license: string;
  /** 星曆資料：本引擎內建解析理論，不需外部資料檔。 */
  dataFiles: string;
  longitudes(date: Date, nodeMode: NodeMode): Record<BodyId, number>;
  sunLongitude(date: Date): number;
}

const rad = Math.PI / 180;

export function meanNode(T: number): number {
  return normalize(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T ** 4) / 60616000);
}

/** 密切交點：h = r × v，升交點方向為 (−h_y, h_x)。座標為當日真黃道。 */
export function osculatingNode(date: Date): number {
  const t = MakeTime(date);
  const s = RotateState(Rotation_EQJ_ECT(t), GeoMoonState(t));
  const hx = s.y * s.vz - s.z * s.vy;
  const hy = s.z * s.vx - s.x * s.vz;
  return normalize(Math.atan2(hx, -hy) / rad);
}

const PLANETS: [BodyId, Body][] = [
  ['moon', Body.Moon], ['mercury', Body.Mercury], ['venus', Body.Venus], ['mars', Body.Mars],
  ['jupiter', Body.Jupiter], ['saturn', Body.Saturn], ['uranus', Body.Uranus],
  ['neptune', Body.Neptune], ['pluto', Body.Pluto],
];

export const ASTRONOMY_ENGINE: EphemerisEngine = {
  id: 'astronomy-engine',
  name: 'Astronomy Engine',
  // 與 package.json 鎖定的版本一致；chart.test.ts 會檢查。
  version: '2.1.19',
  license: 'MIT',
  dataFiles: '無（內建 VSOP87 截斷理論與月球理論，不讀取外部檔案）',
  sunLongitude(date) {
    return normalize(SunPosition(MakeTime(date)).elon);
  },
  longitudes(date, nodeMode) {
    const time = MakeTime(date);
    const sun = normalize(SunPosition(time).elon);
    const node = nodeMode === 'osculating' ? osculatingNode(date) : meanNode(time.tt / 36525);
    const out = {
      sun,
      earth: normalize(sun + 180),
      northNode: node,
      southNode: normalize(node + 180),
    } as Record<BodyId, number>;
    for (const [id, body] of PLANETS) out[id] = normalize(Ecliptic(GeoVector(body, time, true)).elon);
    return out;
  },
};

export function engineSettings(nodeMode: NodeMode): EngineSettings {
  return {
    zodiac: 'tropical',
    frame: 'geocentric, true ecliptic and equinox of date',
    apparent: true,
    nodeMode,
    timeScale: 'UTC input, TT internally (ΔT from engine)',
  };
}
