// 由 UTC 出生時刻計算人類圖：人格（出生時）與設計（太陽回推 88°）各 13 個啟動點，
// 再交給 derive() 依規則推導。每張圖附帶可追溯的計算紀錄。

import { ASTRONOMY_ENGINE, BODY_ORDER, engineSettings, type BodyId, type EngineSettings, type EphemerisEngine, type NodeMode } from './ephemeris';
import { solveDesignMoment, type SolverReport } from './designSolver';
import { longitudeToGateLine, type GateLine } from './mandala';
import { derive, type Derivation } from './derive';
import { MANDALA_RULES } from '../data/rules/mandala';

export interface Activation extends GateLine {
  body: BodyId;
  longitude: number;
}

export type GateSource = 'personality' | 'design' | 'both';

export interface Provenance {
  appVersion: string;
  input?: {
    localDateTime: string;
    zone: string;
    offset: string;
    precision: string;
  };
  birthUtc: string;
  designUtc: string;
  daysBetween: number;
  engine: { id: string; name: string; version: string; license: string; dataFiles: string };
  settings: EngineSettings;
  rules: { version: string; startLongitude: number; interval: string };
  solver: SolverReport;
  externalValidation: 'pending_external_validation';
}

export interface Chart {
  birthUtc: Date;
  designUtc: Date;
  nodeMode: NodeMode;
  personality: Activation[];
  design: Activation[];
  gateSources: Map<number, GateSource>;
  derivation: Derivation;
  profile: { conscious: number; unconscious: number };
  crossGates: [number, number, number, number];
  provenance: Provenance;
}

export const APP_VERSION = '0.3.0';

function activations(date: Date, nodeMode: NodeMode, engine: EphemerisEngine): Activation[] {
  const lons = engine.longitudes(date, nodeMode);
  return BODY_ORDER.map((body) => ({ body, longitude: lons[body], ...longitudeToGateLine(lons[body]) }));
}

export function computeChart(
  birthUtc: Date,
  nodeMode: NodeMode = 'osculating',
  engine: EphemerisEngine = ASTRONOMY_ENGINE,
): Chart {
  const { design: designUtc, report } = solveDesignMoment(birthUtc, engine);
  const personality = activations(birthUtc, nodeMode, engine);
  const design = activations(designUtc, nodeMode, engine);

  const gateSources = new Map<number, GateSource>();
  for (const a of personality) gateSources.set(a.gate, 'personality');
  for (const a of design) {
    const prev = gateSources.get(a.gate);
    gateSources.set(a.gate, prev === 'personality' || prev === 'both' ? 'both' : 'design');
  }

  const get = (list: Activation[], body: BodyId) => list.find((a) => a.body === body)!;
  return {
    birthUtc,
    designUtc,
    nodeMode,
    personality,
    design,
    gateSources,
    derivation: derive(gateSources.keys()),
    profile: { conscious: get(personality, 'sun').line, unconscious: get(design, 'sun').line },
    crossGates: [get(personality, 'sun').gate, get(personality, 'earth').gate, get(design, 'sun').gate, get(design, 'earth').gate],
    provenance: {
      appVersion: APP_VERSION,
      birthUtc: birthUtc.toISOString(),
      designUtc: designUtc.toISOString(),
      daysBetween: (birthUtc.getTime() - designUtc.getTime()) / 86400000,
      engine: {
        id: engine.id,
        name: engine.name,
        version: engine.version,
        license: engine.license,
        dataFiles: engine.dataFiles,
      },
      settings: engineSettings(nodeMode),
      rules: {
        version: MANDALA_RULES.version,
        startLongitude: MANDALA_RULES.startLongitude.value,
        interval: '[a, b)',
      },
      solver: report,
      externalValidation: 'pending_external_validation',
    },
  };
}

export interface SensitivityReport {
  rangeMinutes: number;
  typeStable: boolean;
  authorityStable: boolean;
  profileStable: boolean;
  definitionStable: boolean;
  changing: { side: 'personality' | 'design'; body: BodyId; values: string[] }[];
  samples: number;
}

export function sensitivity(birthUtc: Date, rangeMinutes: number, nodeMode: NodeMode = 'osculating'): SensitivityReport {
  const step = rangeMinutes <= 30 ? 5 : rangeMinutes <= 120 ? 10 : 30;
  const charts: Chart[] = [];
  for (let m = -rangeMinutes; m <= rangeMinutes; m += step) {
    charts.push(computeChart(new Date(birthUtc.getTime() + m * 60000), nodeMode));
  }
  const same = <T,>(f: (c: Chart) => T) => new Set(charts.map((c) => String(f(c)))).size === 1;
  const changing: SensitivityReport['changing'] = [];
  for (const side of ['personality', 'design'] as const) {
    for (const body of BODY_ORDER) {
      const values = [...new Set(charts.map((c) => {
        const a = c[side].find((x) => x.body === body)!;
        return `${a.gate}.${a.line}`;
      }))];
      if (values.length > 1) changing.push({ side, body, values });
    }
  }
  return {
    rangeMinutes,
    typeStable: same((c) => c.derivation.type),
    authorityStable: same((c) => c.derivation.authority),
    profileStable: same((c) => `${c.profile.conscious}/${c.profile.unconscious}`),
    definitionStable: same((c) => c.derivation.definition),
    changing,
    samples: charts.length,
  };
}

/** 以規則表列出的每個替代起點重算一次；只要任一起點給出不同的閘門或爻，就標記為起點分歧敏感。 */
export function startDivergenceSensitive(a: Activation): boolean {
  return MANDALA_RULES.startLongitude.alternatives.some((alt) => {
    const g = longitudeToGateLine(a.longitude, alt.value);
    return g.gate !== a.gate || g.line !== a.line;
  });
}
