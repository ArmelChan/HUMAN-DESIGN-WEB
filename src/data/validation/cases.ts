// 30 組合成驗證測例。
// - expect 欄位只放「不靠本站引擎就能得知」的預期值，並以 basis 標示依據。
// - 本站引擎的輸出另存為 internal-snapshot.json，只作回歸比對，不當作正確答案。
// - external 一律為 pending_external_validation：尚未取得 Jovian Archive、myBodyGraph 等排圖器的結果。

export type CaseGroup = 'time' | 'calendar' | 'boundary' | 'structure';

export const GROUP_LABEL: Record<CaseGroup, string> = {
  time: '時區與夏令時間',
  calendar: '曆法、跨年與範圍邊界',
  boundary: '閘門、爻與細分邊界',
  structure: '類型、權威與定義結構',
};

export type ExpectBasis = 'independent' | 'tzdb' | 'rule' | 'searchFound';

export const BASIS_LABEL: Record<ExpectBasis, string> = {
  independent: '獨立已知事實',
  tzdb: 'IANA 時區資料庫',
  rule: '依本站規則表推導',
  searchFound: '以本站引擎搜尋找到的時刻',
};

export interface ValidationCase {
  id: string;
  group: CaseGroup;
  label: string;
  purpose: string;
  input: { date: string; time: string; tz: string };
  expect: {
    basis: ExpectBasis;
    kind?: 'ok' | 'nonexistent' | 'ambiguous' | 'invalid';
    utc?: string;
    offsets?: number[];
    /** 例如 { side: 'personality', body: 'sun', gateLine: '60.6' } */
    activation?: { side: 'personality' | 'design'; body: string; gateLine: string };
    nearLineBoundary?: { side: 'personality' | 'design'; body: string };
    startDivergenceSensitive?: { side: 'personality' | 'design'; body: string };
    type?: string;
    authority?: string;
    definition?: string;
  };
  external: { status: 'pending_external_validation'; results: null };
}

const pending = { status: 'pending_external_validation', results: null } as const;

export const VALIDATION_CASES: ValidationCase[] = [
  { id: 'hk-1985', group: 'time', label: '香港 1985-07-15 10:30', purpose: '香港 1980 年起不再實施夏令時間，應為 UTC+8。',
    input: { date: '1985-07-15', time: '10:30', tz: 'Asia/Hong_Kong' },
    expect: { basis: 'independent', kind: 'ok', utc: '1985-07-15T02:30:00.000Z' }, external: pending },
  { id: 'hk-1962-summer', group: 'time', label: '香港 1962-08-10 09:00', purpose: '1970 年以前，香港實施夏令時間的年份。',
    input: { date: '1962-08-10', time: '09:00', tz: 'Asia/Hong_Kong' },
    expect: { basis: 'tzdb', kind: 'ok' }, external: pending },
  { id: 'hk-1996-leap', group: 'calendar', label: '香港 1996-02-29 06:00', purpose: '閏日，且換算成 UTC 後落在前一天。',
    input: { date: '1996-02-29', time: '06:00', tz: 'Asia/Hong_Kong' },
    expect: { basis: 'independent', kind: 'ok', utc: '1996-02-28T22:00:00.000Z' }, external: pending },
  { id: 'van-2021-gap', group: 'time', label: '溫哥華 2021-03-14 02:30', purpose: '夏令時間開始，02:00–03:00 不存在。',
    input: { date: '2021-03-14', time: '02:30', tz: 'America/Vancouver' },
    expect: { basis: 'independent', kind: 'nonexistent' }, external: pending },
  { id: 'van-2021-before-gap', group: 'time', label: '溫哥華 2021-03-14 01:59', purpose: '切換前一分鐘，仍為 UTC−8。',
    input: { date: '2021-03-14', time: '01:59', tz: 'America/Vancouver' },
    expect: { basis: 'independent', kind: 'ok', utc: '2021-03-14T09:59:00.000Z' }, external: pending },
  { id: 'van-2021-after-gap', group: 'time', label: '溫哥華 2021-03-14 03:00', purpose: '切換後，為 UTC−7。',
    input: { date: '2021-03-14', time: '03:00', tz: 'America/Vancouver' },
    expect: { basis: 'independent', kind: 'ok', utc: '2021-03-14T10:00:00.000Z' }, external: pending },
  { id: 'van-2021-overlap', group: 'time', label: '溫哥華 2021-11-07 01:30', purpose: '夏令時間結束，01:00–02:00 出現兩次。',
    input: { date: '2021-11-07', time: '01:30', tz: 'America/Vancouver' },
    expect: { basis: 'independent', kind: 'ambiguous', offsets: [-420, -480] }, external: pending },
  { id: 'van-1965-summer', group: 'time', label: '溫哥華 1965-07-01 12:00', purpose: '1970 年以前的夏令時間紀錄。',
    input: { date: '1965-07-01', time: '12:00', tz: 'America/Vancouver' },
    expect: { basis: 'tzdb', kind: 'ok' }, external: pending },
  { id: 'tpe-1979-dst', group: 'time', label: '台北 1979-07-15 12:00', purpose: '台灣 1979 年實施夏令時間（UTC+9）。',
    input: { date: '1979-07-15', time: '12:00', tz: 'Asia/Taipei' },
    expect: { basis: 'tzdb', kind: 'ok', utc: '1979-07-15T03:00:00.000Z' }, external: pending },
  { id: 'invalid-2001-02-29', group: 'calendar', label: 'UTC 2001-02-29 12:00', purpose: '不存在的日期必須被拒絕。',
    input: { date: '2001-02-29', time: '12:00', tz: 'UTC' },
    expect: { basis: 'independent', kind: 'invalid' }, external: pending },
  { id: 'utc-2000-leap', group: 'calendar', label: 'UTC 2000-02-29 12:00', purpose: '世紀閏年。',
    input: { date: '2000-02-29', time: '12:00', tz: 'UTC' },
    expect: { basis: 'independent', kind: 'ok', utc: '2000-02-29T12:00:00.000Z' }, external: pending },
  { id: 'utc-1999-1231', group: 'calendar', label: 'UTC 1999-12-31 23:59', purpose: '跨年前一分鐘。',
    input: { date: '1999-12-31', time: '23:59', tz: 'UTC' },
    expect: { basis: 'independent', kind: 'ok', utc: '1999-12-31T23:59:00.000Z' }, external: pending },
  { id: 'utc-1900-lower', group: 'calendar', label: 'UTC 1900-01-01 00:00', purpose: '支援範圍下限；設計時刻落在 1899 年。',
    input: { date: '1900-01-01', time: '00:00', tz: 'UTC' },
    expect: { basis: 'independent', kind: 'ok', utc: '1900-01-01T00:00:00.000Z' }, external: pending },
  { id: 'utc-2100-upper', group: 'calendar', label: 'UTC 2100-12-31 23:59', purpose: '支援範圍上限。',
    input: { date: '2100-12-31', time: '23:59', tz: 'UTC' },
    expect: { basis: 'independent', kind: 'ok', utc: '2100-12-31T23:59:00.000Z' }, external: pending },
  { id: 'sun-gate-edge-before', group: 'boundary', label: 'UTC 2001-01-21 23:26', purpose: '太陽在 302° 前約 4 秒：應仍屬閘門 60 第 6 爻。',
    input: { date: '2001-01-21', time: '23:26', tz: 'UTC' },
    expect: { basis: 'rule', kind: 'ok', activation: { side: 'personality', body: 'sun', gateLine: '60.6' }, nearLineBoundary: { side: 'personality', body: 'sun' } }, external: pending },
  { id: 'sun-gate-edge-after', group: 'boundary', label: 'UTC 2001-01-21 23:27', purpose: '太陽剛過 302°：應屬閘門 41 第 1 爻。',
    input: { date: '2001-01-21', time: '23:27', tz: 'UTC' },
    expect: { basis: 'rule', kind: 'ok', activation: { side: 'personality', body: 'sun', gateLine: '41.1' }, nearLineBoundary: { side: 'personality', body: 'sun' } }, external: pending },
  { id: 'sun-line-edge', group: 'boundary', label: 'UTC 2001-01-24 17:46', purpose: '太陽在 41.3／41.4 邊界前約 15 秒。',
    input: { date: '2001-01-24', time: '17:46', tz: 'UTC' },
    expect: { basis: 'rule', kind: 'ok', activation: { side: 'personality', body: 'sun', gateLine: '41.3' }, nearLineBoundary: { side: 'personality', body: 'sun' } }, external: pending },
  { id: 'sun-color-edge', group: 'boundary', label: 'UTC 2001-01-22 06:48', purpose: '太陽在色 2／色 3 邊界前約 12 秒（細分層級）。',
    input: { date: '2001-01-22', time: '06:48', tz: 'UTC' },
    expect: { basis: 'rule', kind: 'ok', activation: { side: 'personality', body: 'sun', gateLine: '41.1' } }, external: pending },
  { id: 'moon-line-edge-hk', group: 'boundary', label: '香港 1985-05-10 09:10', purpose: '月亮剛從 60.3 進入 60.4。',
    input: { date: '1985-05-10', time: '09:10', tz: 'Asia/Hong_Kong' },
    expect: { basis: 'searchFound', kind: 'ok', activation: { side: 'personality', body: 'moon', gateLine: '60.4' }, nearLineBoundary: { side: 'personality', body: 'moon' } }, external: pending },
  { id: 'start-divergence', group: 'boundary', label: 'UTC 2001-01-22 00:08', purpose: '太陽在 302° 後約 0.03°，落在兩種起點（302° 與 302.057°）的分歧範圍內。',
    input: { date: '2001-01-22', time: '00:08', tz: 'UTC' },
    expect: { basis: 'rule', kind: 'ok', activation: { side: 'personality', body: 'sun', gateLine: '41.1' }, startDivergenceSensitive: { side: 'personality', body: 'sun' } }, external: pending },
  { id: 'projector-splenic', group: 'structure', label: 'UTC 1950-01-01 00:00', purpose: '投射者、直覺權威、二分定義；同時是跨年時刻。',
    input: { date: '1950-01-01', time: '00:00', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', type: 'projector', authority: 'splenic', definition: 'split' }, external: pending },
  { id: 'triple-split', group: 'structure', label: 'UTC 1950-01-01 07:24', purpose: '三分定義。',
    input: { date: '1950-01-01', time: '07:24', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', definition: 'tripleSplit' }, external: pending },
  { id: 'mental-single', group: 'structure', label: 'UTC 1950-01-01 22:12', purpose: '環境權威（無內在權威）、一分定義。',
    input: { date: '1950-01-01', time: '22:12', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', authority: 'mental', definition: 'single' }, external: pending },
  { id: 'manifestor-ego', group: 'structure', label: 'UTC 1950-01-02 09:18', purpose: '顯示者、意志力顯示權威。',
    input: { date: '1950-01-02', time: '09:18', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', type: 'manifestor', authority: 'egoManifested' }, external: pending },
  { id: 'generator-sacral', group: 'structure', label: 'UTC 1950-01-03 14:54', purpose: '生產者、薦骨權威。',
    input: { date: '1950-01-03', time: '14:54', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', type: 'generator', authority: 'sacral' }, external: pending },
  { id: 'self-projected', group: 'structure', label: 'UTC 1950-01-05 18:42', purpose: '自我投射權威。',
    input: { date: '1950-01-05', time: '18:42', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', authority: 'selfProjected' }, external: pending },
  { id: 'manifesting-generator', group: 'structure', label: 'UTC 1950-01-06 09:30', purpose: '顯示生產者。',
    input: { date: '1950-01-06', time: '09:30', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', type: 'manifestingGenerator' }, external: pending },
  { id: 'ego-projected', group: 'structure', label: 'UTC 1950-01-28 03:12', purpose: '意志力投射權威（少見）。',
    input: { date: '1950-01-28', time: '03:12', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', authority: 'egoProjected' }, external: pending },
  { id: 'quadruple-split', group: 'structure', label: 'UTC 1950-02-24 01:12', purpose: '四分定義（少見）。',
    input: { date: '1950-02-24', time: '01:12', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', definition: 'quadrupleSplit' }, external: pending },
  { id: 'reflector', group: 'structure', label: 'UTC 1950-07-23 10:54', purpose: '反映者、月亮權威（約 1%）。',
    input: { date: '1950-07-23', time: '10:54', tz: 'UTC' },
    expect: { basis: 'searchFound', kind: 'ok', type: 'reflector', authority: 'lunar', definition: 'none' }, external: pending },
];
