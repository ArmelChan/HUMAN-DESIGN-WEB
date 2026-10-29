// 30 組合成測例：檢查不靠本引擎就能得知的預期值，並與內部快照做回歸比對。
// 更新快照：UPDATE_SNAPSHOT=1 npx vitest run src/lib/validation.test.ts

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { VALIDATION_CASES, type ValidationCase } from '../data/validation/cases';
import { CENTER_ORDER } from '../data/structure';
import { PROFILES } from '../data/content/profiles';
import { computeChart, startDivergenceSensitive, type Chart } from './chart';
import { localToUtc, type Conversion } from './timezone';
import { MANDALA_RULES } from '../data/rules/mandala';

const SNAPSHOT = 'src/data/validation/internal-snapshot.json';
const validProfiles = new Set(PROFILES.map((p) => p.id));

function convert(c: ValidationCase): Conversion {
  const [year, month, day] = c.input.date.split('-').map(Number);
  const [hour, minute] = c.input.time.split(':').map(Number);
  return localToUtc({ year, month, day, hour, minute }, c.input.tz);
}

function summarize(chart: Chart, offsetMinutes: number) {
  const gl = (list: Chart['personality']) => list.map((a) => `${a.gate}.${a.line}`);
  return {
    utc: chart.birthUtc.toISOString(),
    offsetMinutes,
    designUtc: chart.designUtc.toISOString(),
    solverResidualDeg: Number(chart.provenance.solver.residualDeg.toExponential(2)),
    type: chart.derivation.type,
    authority: chart.derivation.authority,
    profile: `${chart.profile.conscious}/${chart.profile.unconscious}`,
    definition: chart.derivation.definition,
    definedCenters: CENTER_ORDER.filter((id) => chart.derivation.centerStates[id] === 'defined'),
    personality: gl(chart.personality),
    design: gl(chart.design),
    nearLineBoundary: [...chart.personality.map((a) => ['P', a] as const), ...chart.design.map((a) => ['D', a] as const)]
      .filter(([, a]) => a.boundaryDistance * 60 < MANDALA_RULES.precision.nearLineArcmin)
      .map(([s, a]) => `${s}.${a.body}`),
  };
}

const snapshot: Record<string, unknown> = {};

describe('30 組合成驗證測例', () => {
  it('恰好 30 組，id 不重複', () => {
    expect(VALIDATION_CASES).toHaveLength(30);
    expect(new Set(VALIDATION_CASES.map((c) => c.id)).size).toBe(30);
  });

  for (const c of VALIDATION_CASES) {
    it(`${c.id}：${c.label}`, () => {
      const conv = convert(c);
      if (c.expect.kind) expect(conv.kind).toBe(c.expect.kind);
      if (conv.kind === 'invalid' || conv.kind === 'nonexistent') {
        snapshot[c.id] = { conversion: conv.kind };
        return;
      }
      const options = conv.kind === 'ambiguous' ? conv.options : [conv];
      if (c.expect.offsets) expect(options.map((o) => o.offsetMinutes)).toEqual(c.expect.offsets);
      if (c.expect.utc) expect(options[0].utc.toISOString()).toBe(c.expect.utc);

      const variants = options.map((o) => {
        const chart = computeChart(o.utc);
        // 共通不變量
        expect(Math.abs(chart.provenance.solver.residualDeg)).toBeLessThan(1e-7);
        expect(validProfiles.has(`${chart.profile.conscious}/${chart.profile.unconscious}`)).toBe(true);
        const find = (side: 'personality' | 'design', body: string) => chart[side].find((a) => a.body === body)!;
        if (c.expect.activation) {
          const a = find(c.expect.activation.side, c.expect.activation.body);
          expect(`${a.gate}.${a.line}`).toBe(c.expect.activation.gateLine);
        }
        if (c.expect.nearLineBoundary) {
          const a = find(c.expect.nearLineBoundary.side, c.expect.nearLineBoundary.body);
          expect(a.boundaryDistance * 60).toBeLessThan(MANDALA_RULES.precision.nearLineArcmin);
        }
        if (c.expect.startDivergenceSensitive) {
          const a = find(c.expect.startDivergenceSensitive.side, c.expect.startDivergenceSensitive.body);
          expect(startDivergenceSensitive(a)).toBe(true);
        }
        if (c.expect.type) expect(chart.derivation.type).toBe(c.expect.type);
        if (c.expect.authority) expect(chart.derivation.authority).toBe(c.expect.authority);
        if (c.expect.definition) expect(chart.derivation.definition).toBe(c.expect.definition);
        return summarize(chart, o.offsetMinutes);
      });
      snapshot[c.id] = { conversion: conv.kind, variants };
      expect(c.external.status).toBe('pending_external_validation');
    });
  }

  afterAll(() => {
    if (process.env.UPDATE_SNAPSHOT === '1' || !existsSync(SNAPSHOT)) {
      writeFileSync(SNAPSHOT, JSON.stringify(snapshot, null, 1) + '\n');
    }
  });

  it('與已提交的內部快照一致（回歸比對，不代表正確性）', () => {
    if (!existsSync(SNAPSHOT) || process.env.UPDATE_SNAPSHOT === '1') return;
    const saved = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
    expect(snapshot).toEqual(saved);
  });
});
