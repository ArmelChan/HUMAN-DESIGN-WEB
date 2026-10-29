// 只知道出生日期時：在當地 00:00–23:30 每 30 分鐘取樣，只保留全天都不變的結果。
// 不以任何單一時刻（例如中午）代表出生時間。

import { CENTER_ORDER, type CenterId } from '../data/structure';
import { BODY_ORDER, type BodyId } from './ephemeris';
import { computeChart, type Chart } from './chart';
import { localToUtc } from './timezone';
import type { AuthorityId, DefinitionKind, TypeId } from './derive';

export interface DayRangeResult {
  date: string;
  zone: string;
  samples: number;
  /** 取樣涵蓋的 UTC 範圍。 */
  firstUtc: Date;
  lastUtc: Date;
  type: TypeId | null;
  authority: AuthorityId | null;
  profile: string | null;
  definition: DefinitionKind | null;
  /** 全天每個取樣點都有定義的中心。 */
  alwaysDefined: CenterId[];
  /** 全天每個取樣點都沒有定義的中心。 */
  neverDefined: CenterId[];
  stable: { side: 'personality' | 'design'; body: BodyId; gateLine: string }[];
  variable: { side: 'personality' | 'design'; body: BodyId; values: string[] }[];
  /** 全天不變的啟動點所在閘門，供圖上顯示。 */
  stableGates: Map<number, 'personality' | 'design' | 'both'>;
  charts: Chart[];
}

export function computeDayRange(date: string, zone: string, offsetMinutes?: number): DayRangeResult {
  const [year, month, day] = date.split('-').map(Number);
  const charts: Chart[] = [];
  for (let m = 0; m < 24 * 60; m += 30) {
    const local = { year, month, day, hour: Math.floor(m / 60), minute: m % 60 };
    if (offsetMinutes !== undefined) {
      const wall = Date.UTC(year, month - 1, day, local.hour, local.minute);
      charts.push(computeChart(new Date(wall - offsetMinutes * 60000)));
      continue;
    }
    const conv = localToUtc(local, zone);
    if (conv.kind === 'ok') charts.push(computeChart(conv.utc));
    else if (conv.kind === 'ambiguous') for (const o of conv.options) charts.push(computeChart(o.utc));
    else if (conv.kind === 'invalid') throw new Error(conv.reason);
    // nonexistent：夏令時間跳過的時段沒有對應時刻，略過。
  }
  if (charts.length === 0) throw new Error('這一天在該時區沒有可計算的時刻');

  const one = <T,>(f: (c: Chart) => T): T | null => {
    const set = new Set(charts.map((c) => JSON.stringify(f(c))));
    return set.size === 1 ? (JSON.parse([...set][0]) as T) : null;
  };

  const stable: DayRangeResult['stable'] = [];
  const variable: DayRangeResult['variable'] = [];
  const stableGates = new Map<number, 'personality' | 'design' | 'both'>();
  for (const side of ['personality', 'design'] as const) {
    for (const body of BODY_ORDER) {
      const values = [...new Set(charts.map((c) => {
        const a = c[side].find((x) => x.body === body)!;
        return `${a.gate}.${a.line}`;
      }))];
      if (values.length === 1) {
        stable.push({ side, body, gateLine: values[0] });
        const gate = Number(values[0].split('.')[0]);
        const prev = stableGates.get(gate);
        stableGates.set(gate, prev && prev !== side ? 'both' : side);
      } else variable.push({ side, body, values });
    }
  }

  const sorted = [...charts].sort((a, b) => a.birthUtc.getTime() - b.birthUtc.getTime());
  return {
    date,
    zone,
    samples: charts.length,
    firstUtc: sorted[0].birthUtc,
    lastUtc: sorted[sorted.length - 1].birthUtc,
    type: one((c) => c.derivation.type),
    authority: one((c) => c.derivation.authority),
    profile: one((c) => `${c.profile.conscious}/${c.profile.unconscious}`),
    definition: one((c) => c.derivation.definition),
    alwaysDefined: CENTER_ORDER.filter((id) => charts.every((c) => c.derivation.centerStates[id] === 'defined')),
    neverDefined: CENTER_ORDER.filter((id) => charts.every((c) => c.derivation.centerStates[id] !== 'defined')),
    stable,
    variable,
    stableGates,
    charts,
  };
}
