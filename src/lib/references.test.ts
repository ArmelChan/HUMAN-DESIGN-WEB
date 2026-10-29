import { REFERENCE_CHARTS, REFERENCE_ORDER } from '../data/validation/references';
import { CENTER_ORDER } from '../data/structure';
import { computeChart } from './chart';
import { localToUtc } from './timezone';

function chartFor(local: { date: string; time: string; tz: string }) {
  const [year, month, day] = local.date.split('-').map(Number);
  const [hour, minute] = local.time.split(':').map(Number);
  const conv = localToUtc({ year, month, day, hour, minute }, local.tz);
  if (conv.kind !== 'ok') throw new Error(`${local.date} ${local.time} ${local.tz}: ${conv.kind}`);
  return computeChart(conv.utc);
}

describe('第三方轉錄參照圖（二手參照，非直接跨軟體驗證）', () => {
  let exact = 0;
  let total = 0;

  for (const ref of REFERENCE_CHARTS) {
    it(`${ref.label}：26 個啟動點的閘門.爻`, () => {
      const c = chartFor(ref.local);
      const mismatches: string[] = [];
      for (const [side, list] of [['personality', ref.personality], ['design', ref.design]] as const) {
        REFERENCE_ORDER.forEach((body, i) => {
          const a = c[side].find((x) => x.body === body)!;
          const got = `${a.gate}.${a.line}`;
          total++;
          if (got === list[i]) exact++;
          else mismatches.push(`${side}.${body}: ${got} ≠ ${list[i]}`);
        });
      }
      expect(mismatches).toEqual([]);
    });

    if (ref.derivedFromScreenshot) {
      const exp = ref.derivedFromScreenshot;
      it(`${ref.label}：類型、權威、人生角色、有定義中心`, () => {
        const c = chartFor(ref.local);
        expect(c.derivation.type).toBe(exp.type);
        expect(c.derivation.authority).toBe(exp.authority);
        expect(`${c.profile.conscious}/${c.profile.unconscious}`).toBe(exp.profile);
        expect(CENTER_ORDER.filter((id) => c.derivation.centerStates[id] === 'defined').sort()).toEqual([...exp.definedCenters].sort());
      });
    }
  }

  it('合計 130 個啟動點全部一致', () => {
    expect(total).toBe(130);
    expect(exact).toBe(130);
  });
});
