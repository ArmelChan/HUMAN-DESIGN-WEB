import { CENTERS, CENTER_ORDER, CHANNELS, GATES, channelCenters } from '../data/structure';
import { GEOMETRY, GATE_POINTS } from '../data/geometry';
import { derive } from './derive';

describe('結構資料', () => {
  it('有 9 個中心、64 個閘門、36 條通道', () => {
    expect(CENTER_ORDER).toHaveLength(9);
    expect(GATES).toHaveLength(64);
    expect(CHANNELS).toHaveLength(36);
  });

  it('每個閘門恰好屬於一個中心', () => {
    const all = CENTER_ORDER.flatMap((c) => CENTERS[c].gates).sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
  });

  it('每個閘門至少出現在一條通道，且通道不重複', () => {
    const used = new Set(CHANNELS.flatMap((c) => c.gates));
    expect(used.size).toBe(64);
    expect(new Set(CHANNELS.map((c) => c.id)).size).toBe(36);
  });

  it('通道連接的是兩個不同的中心', () => {
    for (const c of CHANNELS) {
      const [a, b] = channelCenters(c);
      expect(a).not.toBe(b);
    }
  });

  it('只有 10、20、34、57 號閘門參與多條通道', () => {
    const count = new Map<number, number>();
    for (const c of CHANNELS) for (const g of c.gates) count.set(g, (count.get(g) ?? 0) + 1);
    const multi = [...count].filter(([, n]) => n > 1).map(([g]) => g).sort((a, b) => a - b);
    expect(multi).toEqual([10, 20, 34, 57]);
  });

  it('每個閘門都有圖形座標，每個中心都有形狀', () => {
    for (const g of GATES) expect(GATE_POINTS[g.number]).toBeDefined();
    for (const c of CENTER_ORDER) expect(GEOMETRY[c]).toBeDefined();
  });
});

describe('規則推導', () => {
  it('沒有閘門 → 反映者、月亮權威、九中心完全開放', () => {
    const d = derive([]);
    expect(d.type).toBe('reflector');
    expect(d.authority).toBe('lunar');
    expect(Object.values(d.centerStates).every((s) => s === 'open')).toBe(true);
  });

  it('只有單一閘門 → 中心未定義（非完全開放），仍是反映者', () => {
    const d = derive([34]);
    expect(d.centerStates.sacral).toBe('undefined');
    expect(d.centerStates.root).toBe('open');
    expect(d.type).toBe('reflector');
  });

  it('5-15：薦骨有定義、未連喉嚨 → 生產者、薦骨權威', () => {
    const d = derive([5, 15]);
    expect(d.type).toBe('generator');
    expect(d.authority).toBe('sacral');
    expect(d.definition).toBe('single');
  });

  it('20-34：薦骨直接連喉嚨 → 顯示生產者', () => {
    const d = derive([20, 34]);
    expect(d.type).toBe('manifestingGenerator');
    expect(d.motorsToThroat).toEqual(['sacral']);
  });

  it('20-34 加 6-59：情緒有定義時權威優先為情緒', () => {
    const d = derive([20, 34, 6, 59]);
    expect(d.type).toBe('manifestingGenerator');
    expect(d.authority).toBe('emotional');
  });

  it('21-45：意志力連喉嚨 → 顯示者、意志力顯示權威', () => {
    const d = derive([21, 45]);
    expect(d.type).toBe('manifestor');
    expect(d.authority).toBe('egoManifested');
  });

  it('25-51：意志力只連 G → 投射者、意志力投射權威', () => {
    const d = derive([25, 51]);
    expect(d.type).toBe('projector');
    expect(d.authority).toBe('egoProjected');
  });

  it('25-51 加 7-31：意志力經 G 間接連喉嚨 → 顯示者', () => {
    const d = derive([25, 51, 7, 31]);
    expect(d.type).toBe('manifestor');
    expect(d.authority).toBe('egoManifested');
  });

  it('7-31 加 64-47：投射者、自我投射權威、二分定義', () => {
    const d = derive([7, 31, 64, 47]);
    expect(d.type).toBe('projector');
    expect(d.authority).toBe('selfProjected');
    expect(d.definition).toBe('split');
  });

  it('43-23：只有邏輯與喉嚨 → 投射者、環境權威', () => {
    const d = derive([43, 23]);
    expect(d.type).toBe('projector');
    expect(d.authority).toBe('mental');
  });

  it('根部經直覺連喉嚨（18-58、16-48）→ 顯示者、直覺權威', () => {
    const d = derive([18, 58, 16, 48]);
    expect(d.type).toBe('manifestor');
    expect(d.authority).toBe('splenic');
  });

  it('忽略不存在的閘門號碼', () => {
    expect(derive([0, 65, 99]).activeGates).toEqual([]);
  });
});
