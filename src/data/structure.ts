// 人類圖的結構資料：九個中心、64 個閘門、36 條通道。
// 這裡只放「哪個閘門屬於哪個中心、哪兩個閘門組成一條通道」這類結構事實，
// 解讀文字放在 content/ 目錄，SVG 座標放在 geometry.ts。

import type { Verification } from './sources';

export type CenterId =
  | 'head'
  | 'ajna'
  | 'throat'
  | 'g'
  | 'heart'
  | 'spleen'
  | 'solarPlexus'
  | 'sacral'
  | 'root';

/** 中心在體系中的功能分類；一個中心可同時屬於多類。 */
export type CenterRole = 'pressure' | 'awareness' | 'motor' | 'expression' | 'identity';

export interface CenterStructure {
  id: CenterId;
  name: string;
  shortName: string;
  english: string;
  roles: CenterRole[];
  gates: number[];
}

export const CENTER_ORDER: CenterId[] = [
  'head',
  'ajna',
  'throat',
  'g',
  'heart',
  'spleen',
  'solarPlexus',
  'sacral',
  'root',
];

export const CENTERS: Record<CenterId, CenterStructure> = {
  head: {
    id: 'head',
    name: '頭頂中心',
    shortName: '頭頂',
    english: 'Head Center',
    roles: ['pressure'],
    gates: [64, 61, 63],
  },
  ajna: {
    id: 'ajna',
    name: '邏輯中心',
    shortName: '邏輯',
    english: 'Ajna Center',
    roles: ['awareness'],
    gates: [47, 24, 4, 17, 43, 11],
  },
  throat: {
    id: 'throat',
    name: '喉嚨中心',
    shortName: '喉嚨',
    english: 'Throat Center',
    roles: ['expression'],
    gates: [62, 23, 56, 16, 20, 31, 8, 33, 35, 12, 45],
  },
  g: {
    id: 'g',
    name: 'G 中心',
    shortName: 'G',
    english: 'G Center (Identity)',
    roles: ['identity'],
    gates: [1, 13, 7, 10, 25, 15, 2, 46],
  },
  heart: {
    id: 'heart',
    name: '意志力中心',
    shortName: '意志力',
    english: 'Heart / Ego Center',
    roles: ['motor'],
    gates: [21, 51, 26, 40],
  },
  spleen: {
    id: 'spleen',
    name: '直覺中心',
    shortName: '直覺',
    english: 'Spleen Center',
    roles: ['awareness'],
    gates: [48, 57, 44, 50, 32, 28, 18],
  },
  solarPlexus: {
    id: 'solarPlexus',
    name: '情緒中心',
    shortName: '情緒',
    english: 'Solar Plexus Center',
    roles: ['motor', 'awareness'],
    gates: [36, 22, 37, 6, 49, 55, 30],
  },
  sacral: {
    id: 'sacral',
    name: '薦骨中心',
    shortName: '薦骨',
    english: 'Sacral Center',
    roles: ['motor'],
    gates: [5, 14, 29, 34, 27, 59, 42, 3, 9],
  },
  root: {
    id: 'root',
    name: '根部中心',
    shortName: '根部',
    english: 'Root Center',
    roles: ['pressure', 'motor'],
    gates: [53, 60, 52, 54, 38, 58, 19, 39, 41],
  },
};

export const ROLE_LABEL: Record<CenterRole, string> = {
  pressure: '壓力中心',
  awareness: '覺察中心',
  motor: '動力中心',
  expression: '表達中心',
  identity: '方向與身分',
};

export const MOTOR_CENTERS: CenterId[] = ['heart', 'solarPlexus', 'sacral', 'root'];

/**
 * 通道所屬的迴路群組。
 * 整合通道組與中心迴路在本站建置時以多個二手來源交叉比對過，
 * 其餘群組依通行資料整理，標記於 CIRCUIT_VERIFICATION。
 */
export type Circuit =
  | 'integration'
  | 'knowing'
  | 'centering'
  | 'logic'
  | 'abstract'
  | 'ego'
  | 'defense';

export const CIRCUIT_LABEL: Record<Circuit, { name: string; english: string; group: string }> = {
  integration: { name: '整合通道組', english: 'Integration', group: '個體人迴路群（常被另列）' },
  knowing: { name: '覺知迴路', english: 'Knowing', group: '個體人迴路群' },
  centering: { name: '中心迴路', english: 'Centering', group: '個體人迴路群' },
  logic: { name: '理解（邏輯）迴路', english: 'Understanding / Logic', group: '社群人迴路群' },
  abstract: { name: '感知（抽象）迴路', english: 'Sensing / Abstract', group: '社群人迴路群' },
  ego: { name: '自我迴路', english: 'Ego', group: '部落人迴路群' },
  defense: { name: '防衛迴路', english: 'Defense', group: '部落人迴路群' },
};

export const CIRCUIT_VERIFICATION: Record<Circuit, Verification> = {
  integration: 'crossChecked',
  centering: 'crossChecked',
  knowing: 'commonReference',
  logic: 'commonReference',
  abstract: 'commonReference',
  ego: 'commonReference',
  defense: 'commonReference',
};

export interface ChannelStructure {
  /** 以兩個閘門號碼組成，小號在前，例如 "20-34"。 */
  id: string;
  gates: [number, number];
  english: string;
  /** 網站暫譯；台灣出版品的正式譯名尚未逐條核對。 */
  provisionalName: string;
  circuit: Circuit;
}

function ch(a: number, b: number, english: string, provisionalName: string, circuit: Circuit): ChannelStructure {
  const [x, y] = a < b ? [a, b] : [b, a];
  return { id: `${x}-${y}`, gates: [x, y], english, provisionalName, circuit };
}

export const CHANNELS: ChannelStructure[] = [
  ch(64, 47, 'Abstraction', '抽象', 'abstract'),
  ch(61, 24, 'Awareness', '覺察', 'knowing'),
  ch(63, 4, 'Logic', '邏輯', 'logic'),
  ch(17, 62, 'Acceptance', '接納', 'logic'),
  ch(43, 23, 'Structuring', '架構', 'knowing'),
  ch(11, 56, 'Curiosity', '好奇', 'abstract'),
  ch(16, 48, 'Wavelength', '波長', 'logic'),
  ch(20, 57, 'Brainwave', '腦波', 'knowing'),
  ch(20, 34, 'Charisma', '魅力', 'integration'),
  ch(10, 20, 'Awakening', '覺醒', 'integration'),
  ch(7, 31, 'Alpha', '阿爾法', 'logic'),
  ch(1, 8, 'Inspiration', '啟發', 'knowing'),
  ch(13, 33, 'The Prodigal', '浪子', 'abstract'),
  ch(21, 45, 'Money', '金錢', 'ego'),
  ch(35, 36, 'Transitoriness', '無常', 'abstract'),
  ch(12, 22, 'Openness', '開放', 'knowing'),
  ch(10, 34, 'Exploration', '探索', 'centering'),
  ch(10, 57, 'Perfected Form', '完美形式', 'integration'),
  ch(25, 51, 'Initiation', '發起', 'centering'),
  ch(5, 15, 'Rhythm', '韻律', 'logic'),
  ch(2, 14, 'The Beat', '節拍', 'knowing'),
  ch(29, 46, 'Discovery', '發現', 'abstract'),
  ch(26, 44, 'Surrender', '交付', 'ego'),
  ch(37, 40, 'Community', '社群', 'ego'),
  ch(34, 57, 'Power', '力量', 'integration'),
  ch(27, 50, 'Preservation', '保存', 'defense'),
  ch(6, 59, 'Mating', '親密', 'defense'),
  ch(42, 53, 'Maturation', '成熟', 'abstract'),
  ch(3, 60, 'Mutation', '突變', 'knowing'),
  ch(9, 52, 'Concentration', '專注', 'logic'),
  ch(32, 54, 'Transformation', '轉化', 'ego'),
  ch(28, 38, 'Struggle', '掙扎', 'knowing'),
  ch(18, 58, 'Judgment', '評判', 'logic'),
  ch(19, 49, 'Synthesis', '綜合', 'ego'),
  ch(39, 55, 'Emoting', '情緒表達', 'knowing'),
  ch(30, 41, 'Recognition', '辨識', 'abstract'),
];

export interface GateStructure {
  number: number;
  center: CenterId;
  /** 易經卦名（公有領域的傳統名稱）。 */
  iChing: string;
  /** 人類圖英文資料常見的閘門關鍵詞，不同作者用字不一。 */
  keynote: string;
}

const I_CHING: string[] = [
  '乾', '坤', '屯', '蒙', '需', '訟', '師', '比', '小畜', '履',
  '泰', '否', '同人', '大有', '謙', '豫', '隨', '蠱', '臨', '觀',
  '噬嗑', '賁', '剝', '復', '無妄', '大畜', '頤', '大過', '坎', '離',
  '咸', '恆', '遯', '大壯', '晉', '明夷', '家人', '睽', '蹇', '解',
  '損', '益', '夬', '姤', '萃', '升', '困', '井', '革', '鼎',
  '震', '艮', '漸', '歸妹', '豐', '旅', '巽', '兌', '渙', '節',
  '中孚', '小過', '既濟', '未濟',
];

const KEYNOTES: string[] = [
  'Self-Expression', 'Direction of the Self', 'Ordering', 'Formulization', 'Fixed Rhythms',
  'Friction', 'The Role of the Self', 'Contribution', 'Focus', 'Behavior of the Self',
  'Ideas', 'Caution', 'The Listener', 'Power Skills', 'Extremes',
  'Skills', 'Opinions', 'Correction', 'Wanting', 'The Now',
  'The Hunter / Huntress', 'Openness', 'Assimilation', 'Rationalization', 'Spirit of the Self',
  'The Egoist', 'Caring', 'The Game Player', 'Perseverance', 'Feelings',
  'Influence', 'Continuity', 'Privacy', 'Power', 'Change',
  'Crisis', 'Friendship', 'The Fighter', 'The Provocateur', 'Aloneness',
  'Contraction', 'Growth', 'Insight', 'Alertness', 'The Gatherer',
  'Determination of the Self', 'Realizing', 'Depth', 'Principles', 'Values',
  'Shock', 'Stillness', 'Beginnings', 'Ambition', 'Spirit',
  'Stimulation', 'Intuitive Clarity', 'Vitality', 'Sexuality', 'Acceptance',
  'Mystery', 'Details', 'Doubt', 'Confusion',
];

const gateCenter = new Map<number, CenterId>();
for (const id of CENTER_ORDER) for (const g of CENTERS[id].gates) gateCenter.set(g, id);

export const GATES: GateStructure[] = Array.from({ length: 64 }, (_, i) => {
  const number = i + 1;
  const center = gateCenter.get(number);
  if (!center) throw new Error(`閘門 ${number} 沒有對應中心`);
  return { number, center, iChing: I_CHING[i], keynote: KEYNOTES[i] };
});

export function getGate(n: number): GateStructure | undefined {
  return GATES[n - 1];
}

export function getChannel(id: string): ChannelStructure | undefined {
  return CHANNELS.find((c) => c.id === id);
}

export function channelsOfGate(n: number): ChannelStructure[] {
  return CHANNELS.filter((c) => c.gates.includes(n));
}

export function channelCenters(c: ChannelStructure): [CenterId, CenterId] {
  return [gateCenter.get(c.gates[0])!, gateCenter.get(c.gates[1])!];
}

export function channelsOfCenter(id: CenterId): ChannelStructure[] {
  return CHANNELS.filter((c) => channelCenters(c).includes(id));
}

export function channelDisplayName(c: ChannelStructure): string {
  return `${c.gates[0]}-${c.gates[1]}「${c.provisionalName}」`;
}
