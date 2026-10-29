// 版本化的閘門輪規則表。改動任何數值都必須提升 version，並更新 chart.test.ts 中的對照測試。

export type RuleStatus = 'verified' | 'multiSource' | 'singleSource' | 'divergent' | 'pending';

export const RULE_STATUS_LABEL: Record<RuleStatus, string> = {
  verified: '已核實（原始來源）',
  multiSource: '多個非官方來源一致',
  singleSource: '單一來源',
  divergent: '來源之間存在分歧',
  pending: '待驗證',
};

export interface RuleSource {
  id: string;
  label: string;
  detail: string;
  url?: string;
}

export const MANDALA_RULES = {
  version: 'mandala-1.0.0',
  coordinate: {
    text: '地心、回歸黃道；經度以當日真春分點與真黃道為準（含章動），行星位置含光行時與光行差修正。',
    status: 'singleSource' as RuleStatus,
    note: '人類圖資料普遍以回歸黃道計算，但沒有找到原始來源逐項說明座標細節；本站採天文上「視位置」的標準慣例。',
  },
  startLongitude: {
    value: 302,
    text: '閘門 41 第 1 爻起於黃經 302°（水瓶座 2°00′）。',
    status: 'divergent' as RuleStatus,
    alternatives: [
      { value: 302, by: '@pikku/addon-human-design 0.1.8（經度 + 58° 後分 64 段）' },
      { value: 302.0572916667, by: 'free-human-design 1.0.1（mandala.js 的偏移公式換算）' },
    ],
    note: '第三方轉錄的 5 張參照圖中，3 個落在兩種起點之間的啟動點都與 302.000° 一致，因此本站採用 302°。',
  },
  gateOrder: {
    // 自閘門 41 起，沿黃經增加方向排列。
    value: [
      41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
      27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
      31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
      28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
    ] as readonly number[],
    status: 'multiSource' as RuleStatus,
    note: '64 個位置全部與兩份開源實作逐一比對一致；另以網路二手資料核對了數處邊界。尚未取得 Jovian Archive 的官方對照表。',
  },
  interval: {
    text: '每一層都採左閉右開區間 [a, b)：恰好落在邊界上的位置屬於後一段。',
    status: 'singleSource' as RuleStatus,
  },
  subdivisions: {
    line: 6,
    color: 6,
    tone: 6,
    base: 5,
    status: 'singleSource' as RuleStatus,
    note: '色、調、基底的切分（每爻 6 色、每色 6 調、每調 5 基底）來自第三方技術資料與 free-human-design 的實作，未見原始來源；本站只顯示數值，不提供解讀。',
  },
  precision: {
    text: '經度先換算成「基底」為單位的整數索引（全圓 69,120 個基底），再以整數除法求得閘門、爻、色、調、基底，避免浮點誤差讓相鄰層級互相矛盾。',
    epsilonDeg: 1e-9,
    nearLineArcmin: 3,
  },
  sources: [
    {
      id: 'pikku',
      label: '@pikku/addon-human-design 0.1.8',
      detail: 'npm 套件，dist/src/lib/constants.js 的 GATES 陣列與 activations.js 的偏移。',
      url: 'https://www.npmjs.com/package/@pikku/addon-human-design',
    },
    {
      id: 'free-human-design',
      label: 'free-human-design 1.0.1（MIT）',
      detail: 'npm 套件，src/calc/mandala.js 的 iching_map（自閘門 55 起，旋轉後與本表一致）與色、調、基底寬度。',
      url: 'https://github.com/adamblvck/free-human-design',
    },
    {
      id: 'web-snippets',
      label: '網路二手資料（搜尋摘要）',
      detail: '閘門 41 起於水瓶座 2°、閘門 25 起於雙魚座 28°15′、閘門 17 起於牡羊座 3°52′、摩羯座閘門順序。',
    },
  ] as RuleSource[],
} as const;

const L = MANDALA_RULES.subdivisions;
export const BASES_PER_CIRCLE = 64 * L.line * L.color * L.tone * L.base; // 69,120
export const WIDTH_DEG = {
  gate: 360 / 64,
  line: 360 / (64 * L.line),
  color: 360 / (64 * L.line * L.color),
  tone: 360 / (64 * L.line * L.color * L.tone),
  base: 360 / BASES_PER_CIRCLE,
};
