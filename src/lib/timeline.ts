// 出生時間不確定性的時間軸資料：在時間範圍內依序取樣，找出每一列（類型、權威、人生角色、各啟動點）在哪些時段取哪個值。
// 只用排圖引擎的實際計算結果，不做內插或推測。

import { AUTHORITIES, TYPES } from '../data/content/types';
import { BODY_LABEL, BODY_ORDER } from './ephemeris';
import { computeChart, type Chart } from './chart';
import type { DayRangeResult } from './dayRange';

export interface TimelineSample {
  /** 時間軸上的標籤，例如「−30 分」或「14:30」。 */
  label: string;
  chart: Chart;
}

export interface TimelineSegment {
  from: number; // 取樣索引（含）
  to: number; // 取樣索引（含）
  value: string;
}

export interface TimelineRow {
  key: string;
  label: string;
  kind: 'summary' | 'activation';
  segments: TimelineSegment[];
}

export interface Timeline {
  labels: string[];
  /** 使用者輸入的時刻在取樣中的索引；只知道日期時為 null。 */
  markerIndex: number | null;
  rows: TimelineRow[];
  stableActivations: number;
}

function segmentsOf(values: string[]): TimelineSegment[] {
  const out: TimelineSegment[] = [];
  values.forEach((v, i) => {
    const last = out[out.length - 1];
    if (last && last.value === v) last.to = i;
    else out.push({ from: i, to: i, value: v });
  });
  return out;
}

export function buildTimeline(samples: TimelineSample[], markerIndex: number | null): Timeline {
  const charts = samples.map((s) => s.chart);
  const rows: TimelineRow[] = [
    { key: 'type', label: '類型', kind: 'summary', segments: segmentsOf(charts.map((c) => TYPES[c.derivation.type].name)) },
    { key: 'authority', label: '內在權威', kind: 'summary', segments: segmentsOf(charts.map((c) => AUTHORITIES[c.derivation.authority].name)) },
    { key: 'profile', label: '人生角色', kind: 'summary', segments: segmentsOf(charts.map((c) => `${c.profile.conscious}/${c.profile.unconscious}`)) },
  ];
  let stable = 0;
  for (const side of ['personality', 'design'] as const) {
    for (const body of BODY_ORDER) {
      const values = charts.map((c) => {
        const a = c[side].find((x) => x.body === body)!;
        return `${a.gate}.${a.line}`;
      });
      const segs = segmentsOf(values);
      if (segs.length > 1) rows.push({ key: `${side}-${body}`, label: `${side === 'personality' ? '人格' : '設計'}${BODY_LABEL[body]}`, kind: 'activation', segments: segs });
      else stable++;
    }
  }
  return { labels: samples.map((s) => s.label), markerIndex, rows, stableActivations: stable };
}

/** 約略模式：以輸入時刻為中心，在 ±range 分鐘內取樣（含兩端）。 */
export function approxSamples(birthUtc: Date, rangeMinutes: number, steps = 24): { samples: TimelineSample[]; markerIndex: number } {
  const step = (2 * rangeMinutes) / steps;
  const samples: TimelineSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const m = -rangeMinutes + i * step;
    const label = m === 0 ? '輸入時刻' : `${m > 0 ? '+' : '−'}${Math.round(Math.abs(m))} 分`;
    samples.push({ label, chart: computeChart(new Date(birthUtc.getTime() + m * 60000)) });
  }
  return { samples, markerIndex: steps / 2 };
}

/** 只知道日期：直接使用全日取樣的結果。 */
export function daySamples(day: DayRangeResult): TimelineSample[] {
  return day.charts.map((chart, i) => ({ label: day.labels[i], chart }));
}
