// 第三方轉錄的參照圖。
// 來源：free-human-design（MIT，Copyright (c) 2026 Adam Blvck / Blvck Studios）儲存庫的
// test/reference-charts.test.js。該作者表示這些數值抄錄自「某個以 Swiss Ephemeris 為基礎的線上排圖器」的截圖，
// 但未公開排圖器名稱。本站無法取得原始截圖或直接操作該排圖器，因此這是二手參照，
// 不等同於直接的跨軟體驗證；直接比對仍為 pending_external_validation。

export interface ReferenceChart {
  id: string;
  label: string;
  local: { date: string; time: string; tz: string };
  /** 依序：太陽、地球、月亮、北交點、南交點、水星、金星、火星、木星、土星、天王星、海王星、冥王星。 */
  personality: string[];
  design: string[];
  /** 轉錄者表示已與截圖的中心著色核對；其餘兩張的衍生結果由其程式產生，不列為參照。 */
  derivedFromScreenshot?: {
    type: string;
    authority: string;
    profile: string;
    definedCenters: string[];
  };
  note?: string;
}

export const REFERENCE_ORDER = [
  'sun', 'earth', 'moon', 'northNode', 'southNode', 'mercury', 'venus',
  'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
] as const;

export const REFERENCE_SOURCE = {
  label: 'free-human-design 儲存庫 test/reference-charts.test.js',
  url: 'https://github.com/adamblvck/free-human-design/blob/main/test/reference-charts.test.js',
  license: 'MIT',
  level: 'third_party_transcribed' as const,
};

export const REFERENCE_CHARTS: ReferenceChart[] = [
  {
    id: 'ref-brussels-1992',
    label: '布魯塞爾 1992-12-09 00:35',
    local: { date: '1992-12-09', time: '00:35', tz: 'Europe/Brussels' },
    personality: ['26.1', '45.1', '20.5', '26.5', '45.5', '14.3', '60.5', '56.1', '48.2', '13.1', '54.2', '54.3', '43.6'],
    design: ['47.3', '22.3', '63.4', '11.5', '12.5', '64.5', '48.5', '15.2', '6.2', '19.6', '38.5', '54.2', '43.2'],
    derivedFromScreenshot: { type: 'manifestor', authority: 'emotional', profile: '1/3', definedCenters: ['head', 'ajna', 'throat', 'solarPlexus'] },
  },
  {
    id: 'ref-chicago-1969',
    label: '芝加哥 1969-03-11 03:00',
    local: { date: '1969-03-11', time: '03:00', tz: 'America/Chicago' },
    personality: ['22.4', '47.4', '26.5', '25.3', '46.3', '30.4', '42.6', '9.1', '46.5', '42.4', '46.5', '14.5', '6.2'],
    design: ['26.6', '45.6', '48.2', '17.3', '18.3', '11.5', '41.4', '32.1', '18.1', '51.4', '46.6', '14.3', '6.3'],
    derivedFromScreenshot: { type: 'projector', authority: 'emotional', profile: '4/6', definedCenters: ['g', 'heart', 'solarPlexus', 'root'] },
  },
  {
    id: 'ref-sandiego-1960',
    label: '聖地牙哥 1960-09-12 07:35',
    local: { date: '1960-09-12', time: '07:35', tz: 'America/Los_Angeles' },
    personality: ['47.3', '22.3', '35.6', '64.5', '63.5', '46.3', '48.3', '12.3', '11.3', '38.3', '4.5', '28.6', '40.1'],
    design: ['45.6', '26.6', '19.1', '47.3', '22.3', '53.1', '45.3', '42.4', '10.2', '54.2', '7.6', '28.5', '59.4'],
  },
  {
    id: 'ref-boise-1974',
    label: '博伊西 1974-08-02 12:00',
    local: { date: '1974-08-02', time: '12:00', tz: 'America/Boise' },
    personality: ['33.3', '19.3', '41.4', '26.2', '45.2', '62.5', '53.1', '59.4', '63.6', '39.4', '32.4', '9.2', '18.1'],
    design: ['24.5', '44.5', '46.1', '26.4', '45.4', '24.3', '36.6', '52.4', '63.1', '15.4', '32.5', '9.4', '18.1'],
    note: '1974 年美國實施全年夏令時間，IANA 時區資料給出 UTC−6。轉錄者推測參照排圖器用了 UTC−7，但本站以 UTC−6 計算時 26 個啟動點全部與參照一致，該推測未獲支持。',
  },
  {
    id: 'ref-poznan-1970',
    label: '波茲南 1970-06-04 04:00',
    local: { date: '1970-06-04', time: '04:00', tz: 'Europe/Warsaw' },
    personality: ['35.2', '5.2', '35.3', '37.1', '40.1', '23.1', '39.6', '15.4', '50.1', '2.4', '18.1', '14.5', '6.3'],
    design: ['63.4', '64.4', '49.4', '63.1', '64.1', '55.1', '36.3', '3.4', '28.4', '27.4', '18.5', '34.1', '6.4'],
    derivedFromScreenshot: { type: 'manifestingGenerator', authority: 'emotional', profile: '2/4', definedCenters: ['throat', 'g', 'heart', 'sacral', 'solarPlexus', 'spleen', 'root'] },
    note: '北／南交點離爻邊界約 3.7 角分：以 Meeus 近似真交點計算會落到 37.2／40.2，改用密切交點後與參照一致。',
  },
];
