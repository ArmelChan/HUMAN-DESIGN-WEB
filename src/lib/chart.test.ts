import { MakeTime, SearchSunLongitude, SunPosition } from 'astronomy-engine';
import { readFileSync } from 'node:fs';
import { GATE_WHEEL, gateStartLongitude, longitudeToGateLine, formatZodiac } from './mandala';
import { ASTRONOMY_ENGINE, meanNode, osculatingNode } from './ephemeris';
import { solveDesignMoment } from './designSolver';
import { WIDTH_DEG } from '../data/rules/mandala';
import { localToUtc, offsetMinutesAt } from './timezone';
import { computeChart, sensitivity } from './chart';
import { PROFILES } from '../data/content/profiles';

describe('閘門輪（黃經 → 閘門、爻）', () => {
  it('64 個閘門各出現一次', () => {
    expect([...GATE_WHEEL].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
  });

  it('閘門 41 起於水瓶座 2°（302°）', () => {
    expect(longitudeToGateLine(302.0001)).toMatchObject({ gate: 41, line: 1 });
    expect(longitudeToGateLine(301.9999)).toMatchObject({ gate: 60, line: 6 });
  });

  it('與查得來源一致的邊界：閘門 25 起於雙魚座 28°15′、閘門 17 起於牡羊座 3°52′30″', () => {
    expect(gateStartLongitude(25)).toBeCloseTo(358.25, 6);
    expect(gateStartLongitude(17)).toBeCloseTo(3.875, 6);
    expect(formatZodiac(gateStartLongitude(25))).toBe('雙魚座 28°15′');
  });

  it('摩羯座範圍內的閘門依序為 10、58、38、54、61、60', () => {
    const order = [10, 58, 38, 54, 61, 60].map(gateStartLongitude);
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
    expect(order[0]).toBeCloseTo(268.25, 6);
  });

  it('對沖 180° 的閘門與常見的輪迴交叉太陽／地球配對一致', () => {
    const pairs: [number, number][] = [
      [1, 2], [13, 7], [49, 4], [30, 29], [55, 59], [37, 40], [63, 64], [22, 47],
      [36, 6], [25, 46], [17, 18], [21, 48], [51, 57], [42, 32], [3, 50], [27, 28],
      [24, 44], [23, 43], [8, 14], [20, 34], [16, 9], [35, 5], [45, 26], [12, 11],
      [15, 10], [52, 58], [39, 38], [53, 54], [62, 61], [56, 60], [41, 31], [19, 33],
    ];
    for (const [a, b] of pairs) {
      const diff = Math.abs(gateStartLongitude(a) - gateStartLongitude(b));
      expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 6);
    }
  });

  it('爻寬 0.9375°，並回報離邊界的距離', () => {
    const r = longitudeToGateLine(302 + 0.9375 * 2 + 0.1);
    expect(r).toMatchObject({ gate: 41, line: 3 });
    expect(r.boundaryDistance).toBeCloseTo(0.1, 6);
  });
});

describe('星曆', () => {
  // Meeus 第 25 章的低精度太陽公式（誤差約 0.01°），作為獨立比對。
  function meeusSun(date: Date): number {
    const T = MakeTime(date).tt / 36525;
    const r = Math.PI / 180;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const C =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * r) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M * r) +
      0.000289 * Math.sin(3 * M * r);
    const omega = 125.04 - 1934.136 * T;
    return (((L0 + C - 0.00569 - 0.00478 * Math.sin(omega * r)) % 360) + 360) % 360;
  }

  it('太陽位置與 Meeus 獨立公式相差小於 0.02°（1900–2100 抽樣）', () => {
    let worst = 0;
    for (let y = 1900; y <= 2100; y += 7) {
      for (const m of [0, 3, 6, 9]) {
        const d = new Date(Date.UTC(y, m, 15, 6));
        const a = SunPosition(MakeTime(d)).elon;
        const b = meeusSun(d);
        const diff = Math.abs(a - b);
        worst = Math.max(worst, Math.min(diff, 360 - diff));
      }
    }
    expect(worst).toBeLessThan(0.02);
  });

  it('J2000 曆元的行星地心黃經與已知值相差 1° 以內', () => {
    const lon = ASTRONOMY_ENGINE.longitudes(new Date('2000-01-01T12:00:00Z'), 'osculating');
    const expected: Record<string, number> = {
      sun: 280.4, mercury: 271.9, venus: 241.6, mars: 327.9, jupiter: 25.2,
      saturn: 40.4, uranus: 314.8, neptune: 303.2, pluto: 251.5,
    };
    for (const [k, v] of Object.entries(expected)) {
      const diff = Math.abs(lon[k as keyof typeof lon] - v);
      expect(Math.min(diff, 360 - diff), k).toBeLessThan(1);
    }
  });

  it('平均交點在 J2000 約為 125.04°；密切交點與平均交點相差不超過 2°', () => {
    expect(meanNode(0)).toBeCloseTo(125.0445, 3);
    for (let y = 1900; y <= 2100; y += 0.71) {
      const d = new Date(Date.UTC(1900, 0, 1) + (y - 1900) * 365.25 * 86400000);
      const diff = Math.abs(osculatingNode(d) - meanNode(MakeTime(d).tt / 36525));
      expect(Math.min(diff, 360 - diff)).toBeLessThan(2);
    }
  });

  it('引擎版本與實際安裝的套件一致，授權為 MIT', () => {
    const pkg = JSON.parse(readFileSync('node_modules/astronomy-engine/package.json', 'utf8'));
    expect(ASTRONOMY_ENGINE.version).toBe(pkg.version);
    expect(pkg.license).toBe('MIT');
  });

  it('設計時刻：自行求根，殘差小於 1e-8°，與函式庫的搜尋結果相差不到 1 秒', () => {
    for (const iso of ['1950-03-01T00:00:00Z', '1985-07-20T09:30:00Z', '2010-12-31T23:00:00Z', '1900-01-01T00:00:00Z', '2100-12-31T23:59:00Z']) {
      const birth = new Date(iso);
      const { design, report } = solveDesignMoment(birth, ASTRONOMY_ENGINE);
      expect(report.stopReason).not.toBe('maxIterations');
      expect(Math.abs(report.residualDeg)).toBeLessThan(1e-7);
      const days = (birth.getTime() - design.getTime()) / 86400000;
      expect(days).toBeGreaterThan(86);
      expect(days).toBeLessThan(93);
      const lib = SearchSunLongitude(report.targetLongitude, new Date(birth.getTime() - 96 * 86400000), 16)!;
      expect(Math.abs(lib.date.getTime() - design.getTime())).toBeLessThan(1000);
    }
  });

  it('設計時刻：處理 0°／360° 跨越（出生太陽約 88° 與約 0°）', () => {
    for (const iso of ['2001-06-19T00:00:00Z', '2001-06-19T12:00:00Z', '2001-03-20T13:00:00Z', '2001-03-21T00:00:00Z']) {
      const birth = new Date(iso);
      const { design, report } = solveDesignMoment(birth, ASTRONOMY_ENGINE);
      const a = SunPosition(MakeTime(birth)).elon;
      const b = SunPosition(MakeTime(design)).elon;
      expect((((a - b) % 360) + 360) % 360).toBeCloseTo(88, 6);
      expect(Math.abs(report.residualDeg)).toBeLessThan(1e-7);
    }
  });
});

describe('細分與邊界（左閉右開）', () => {
  it('恰好落在 302° 屬於閘門 41 的第一個基底；略小於 302° 屬於閘門 60 的最後一個基底', () => {
    expect(longitudeToGateLine(302)).toMatchObject({ gate: 41, line: 1, color: 1, tone: 1, base: 1 });
    expect(longitudeToGateLine(302 - 1e-6)).toMatchObject({ gate: 60, line: 6, color: 6, tone: 6, base: 5 });
    expect(longitudeToGateLine(0)).toMatchObject({ gate: 25 });
    expect(longitudeToGateLine(360)).toMatchObject({ gate: 25 });
  });

  it('寬度：爻 0.9375°、色 0.15625°、調 0.0260417°、基底 0.0052083°', () => {
    expect(WIDTH_DEG.line).toBeCloseTo(0.9375, 10);
    expect(WIDTH_DEG.color).toBeCloseTo(0.15625, 10);
    expect(WIDTH_DEG.tone).toBeCloseTo(0.15625 / 6, 10);
    expect(WIDTH_DEG.base).toBeCloseTo(0.15625 / 30, 10);
  });

  it('每個細分邊界都在正確位置切換（隨機抽查 2000 個邊界）', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = 0; i < 2000; i++) {
      const k = Math.floor(rand() * 69120);
      const edge = 302 + k * WIDTH_DEG.base;
      const before = longitudeToGateLine(edge - WIDTH_DEG.base / 2);
      const after = longitudeToGateLine(edge + 1e-7);
      const key = (g: ReturnType<typeof longitudeToGateLine>) => [g.gate, g.line, g.color, g.tone, g.base].join('.');
      expect(key(after)).not.toBe(key(before));
      expect(after.base).toBe((k % 5) + 1);
    }
  });
});

describe('時區換算', () => {
  it('台灣 2000 年為 UTC+8', () => {
    const r = localToUtc({ year: 2000, month: 1, day: 1, hour: 8, minute: 0 }, 'Asia/Taipei');
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') expect(r.utc.toISOString()).toBe('2000-01-01T00:00:00.000Z');
  });

  it('台灣 1979 年 7 月實施夏令時間（UTC+9）', () => {
    const r = localToUtc({ year: 1979, month: 7, day: 15, hour: 12, minute: 0 }, 'Asia/Taipei');
    expect(r.kind === 'ok' && r.offsetMinutes).toBe(540);
  });

  it('夏令時間開始時不存在的時刻', () => {
    expect(localToUtc({ year: 2021, month: 3, day: 14, hour: 2, minute: 30 }, 'America/New_York').kind).toBe('nonexistent');
  });

  it('夏令時間結束時重複的時刻', () => {
    const r = localToUtc({ year: 2021, month: 11, day: 7, hour: 1, minute: 30 }, 'America/New_York');
    expect(r.kind).toBe('ambiguous');
    if (r.kind === 'ambiguous') expect(r.options.map((o) => o.offsetMinutes)).toEqual([-240, -300]);
  });

  it('不存在的日期與超出範圍的年份', () => {
    expect(localToUtc({ year: 2001, month: 2, day: 29, hour: 0, minute: 0 }, 'Asia/Taipei').kind).toBe('invalid');
    expect(localToUtc({ year: 1850, month: 1, day: 1, hour: 0, minute: 0 }, 'Asia/Taipei').kind).toBe('invalid');
  });

  it('時差計算', () => {
    expect(offsetMinutesAt(Date.UTC(2024, 0, 1), 'Asia/Hong_Kong')).toBe(480);
  });
});

describe('完整排圖', () => {
  const valid = new Set(PROFILES.map((p) => p.id));

  it('每張圖各有 13 個人格與 13 個設計啟動點', () => {
    const c = computeChart(new Date('1990-05-05T03:20:00Z'));
    expect(c.personality).toHaveLength(13);
    expect(c.design).toHaveLength(13);
    expect(c.gateSources.size).toBeLessThanOrEqual(26);
  });

  it('地球與太陽、南交點與北交點相差 180°', () => {
    const c = computeChart(new Date('1975-10-10T10:10:00Z'));
    for (const side of [c.personality, c.design]) {
      const g = (b: string) => side.find((a) => a.body === b)!.longitude;
      expect(Math.abs(((g('earth') - g('sun') + 360) % 360) - 180)).toBeLessThan(1e-9);
      expect(Math.abs(((g('southNode') - g('northNode') + 360) % 360) - 180)).toBeLessThan(1e-9);
    }
  });

  it('隨機 500 個出生時刻，人生角色都落在 12 種合法組合內', () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const start = Date.UTC(1920, 0, 1);
    const span = Date.UTC(2080, 0, 1) - start;
    for (let i = 0; i < 500; i++) {
      const c = computeChart(new Date(start + rand() * span));
      expect(valid.has(`${c.profile.conscious}/${c.profile.unconscious}`)).toBe(true);
    }
  });

  it('時間敏感度：範圍為 0 時所有結果皆穩定', () => {
    const r = sensitivity(new Date('1990-05-05T03:20:00Z'), 0);
    expect(r.samples).toBe(1);
    expect(r.changing).toHaveLength(0);
  });

  it('時間敏感度：±12 小時內月亮的閘門會改變', () => {
    const r = sensitivity(new Date('1990-05-05T03:20:00Z'), 720);
    expect(r.changing.some((x) => x.body === 'moon')).toBe(true);
  });
});

describe('起點分歧標記', () => {
  it('只在替代起點真的會改變閘門或爻時才標記', async () => {
    const { startDivergenceSensitive } = await import('./chart');
    const mk = (longitude: number) => ({ body: 'sun' as const, longitude, ...longitudeToGateLine(longitude) });
    expect(startDivergenceSensitive(mk(302.03))).toBe(true); // 302° 之後 0.03°：改用 302.057° 會落回閘門 60
    expect(startDivergenceSensitive(mk(302 - 0.03))).toBe(false); // 邊界之前：兩種起點都屬閘門 60
    expect(startDivergenceSensitive(mk(305))).toBe(false);
  });
});
