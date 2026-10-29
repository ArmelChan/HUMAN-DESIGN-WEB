// 依人類圖公開的判定規則，從「哪些閘門被點亮」推導中心狀態、類型與內在權威。
// 這裡不做任何天文計算：真實的人類圖要用出生時刻計算 26 個行星啟動點，
// 本模組只處理「閘門已知之後」的規則部分，供規則實驗室與單元測試使用。

import {
  CENTER_ORDER,
  CHANNELS,
  MOTOR_CENTERS,
  channelCenters,
  getGate,
  type CenterId,
  type ChannelStructure,
} from '../data/structure';

export type CenterState = 'defined' | 'undefined' | 'open';

export type TypeId = 'manifestor' | 'generator' | 'manifestingGenerator' | 'projector' | 'reflector';

export type AuthorityId =
  | 'emotional'
  | 'sacral'
  | 'splenic'
  | 'egoManifested'
  | 'egoProjected'
  | 'selfProjected'
  | 'mental'
  | 'lunar';

export type DefinitionKind = 'none' | 'single' | 'split' | 'tripleSplit' | 'quadrupleSplit';

export interface Derivation {
  activeGates: number[];
  activeChannels: ChannelStructure[];
  centerStates: Record<CenterId, CenterState>;
  /** 有定義中心依通道相連後的群組；群組數決定「一分人、二分人……」。 */
  components: CenterId[][];
  definition: DefinitionKind;
  /** 與喉嚨中心相連的動力中心（直接或經由其他有定義中心間接相連）。 */
  motorsToThroat: CenterId[];
  type: TypeId;
  authority: AuthorityId;
  /** 每一步判定的中文說明，供介面逐步顯示推導過程。 */
  steps: string[];
}

const CENTER_NAME: Record<CenterId, string> = {
  head: '頭頂',
  ajna: '邏輯',
  throat: '喉嚨',
  g: 'G',
  heart: '意志力',
  spleen: '直覺',
  solarPlexus: '情緒',
  sacral: '薦骨',
  root: '根部',
};

export function derive(gates: Iterable<number>): Derivation {
  const active = new Set<number>();
  for (const g of gates) if (getGate(g)) active.add(g);

  const activeChannels = CHANNELS.filter((c) => active.has(c.gates[0]) && active.has(c.gates[1]));

  const defined = new Set<CenterId>();
  const adjacency = new Map<CenterId, Set<CenterId>>();
  for (const c of activeChannels) {
    const [a, b] = channelCenters(c);
    defined.add(a);
    defined.add(b);
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  }

  const centerStates = {} as Record<CenterId, CenterState>;
  for (const id of CENTER_ORDER) {
    if (defined.has(id)) centerStates[id] = 'defined';
    else if ([...active].some((g) => getGate(g)!.center === id)) centerStates[id] = 'undefined';
    else centerStates[id] = 'open';
  }

  const components: CenterId[][] = [];
  const seen = new Set<CenterId>();
  for (const id of CENTER_ORDER) {
    if (!defined.has(id) || seen.has(id)) continue;
    const group: CenterId[] = [];
    const stack = [id];
    seen.add(id);
    while (stack.length) {
      const cur = stack.pop()!;
      group.push(cur);
      for (const next of adjacency.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    components.push(CENTER_ORDER.filter((c) => group.includes(c)));
  }

  const definition: DefinitionKind =
    components.length === 0
      ? 'none'
      : components.length === 1
        ? 'single'
        : components.length === 2
          ? 'split'
          : components.length === 3
            ? 'tripleSplit'
            : 'quadrupleSplit';

  const throatGroup = components.find((g) => g.includes('throat')) ?? [];
  const motorsToThroat = MOTOR_CENTERS.filter((m) => throatGroup.includes(m));

  const steps: string[] = [];
  const definedList = CENTER_ORDER.filter((c) => defined.has(c));

  let type: TypeId;
  if (definedList.length === 0) {
    type = 'reflector';
    steps.push('沒有任何一條完整通道，九個中心都沒有定義 → 反映者。');
  } else if (defined.has('sacral')) {
    if (motorsToThroat.length > 0) {
      type = 'manifestingGenerator';
      steps.push(
        `薦骨有定義，且動力中心（${motorsToThroat.map((m) => CENTER_NAME[m]).join('、')}）經通道連到喉嚨 → 顯示生產者。`,
      );
    } else {
      type = 'generator';
      steps.push('薦骨有定義，但沒有動力中心連到喉嚨 → 生產者。');
    }
  } else if (motorsToThroat.length > 0) {
    type = 'manifestor';
    steps.push(
      `薦骨沒有定義，動力中心（${motorsToThroat.map((m) => CENTER_NAME[m]).join('、')}）經通道連到喉嚨 → 顯示者。`,
    );
  } else {
    type = 'projector';
    steps.push('薦骨沒有定義，也沒有動力中心連到喉嚨，但至少有一個中心有定義 → 投射者。');
  }

  let authority: AuthorityId;
  if (defined.has('solarPlexus')) {
    authority = 'emotional';
    steps.push('情緒中心有定義，在權威順序中排第一 → 情緒權威。');
  } else if (defined.has('sacral')) {
    authority = 'sacral';
    steps.push('情緒中心沒有定義，薦骨有定義 → 薦骨權威。');
  } else if (defined.has('spleen')) {
    authority = 'splenic';
    steps.push('情緒與薦骨都沒有定義，直覺中心有定義 → 直覺權威。');
  } else if (defined.has('heart')) {
    authority = type === 'manifestor' ? 'egoManifested' : 'egoProjected';
    steps.push(
      type === 'manifestor'
        ? '前三者都沒有定義，意志力中心有定義並連到喉嚨 → 意志力顯示權威。'
        : '前三者都沒有定義，意志力中心有定義但沒有連到喉嚨 → 意志力投射權威。',
    );
  } else if (defined.has('g') && throatGroup.includes('g')) {
    authority = 'selfProjected';
    steps.push('定義只牽涉 G 中心與喉嚨（及以上的中心）→ 自我投射權威。');
  } else if (definedList.length > 0) {
    authority = 'mental';
    steps.push('有定義的中心只在頭頂、邏輯、喉嚨之間 → 沒有內在權威，體系稱環境權威（或心智投射）。');
  } else {
    authority = 'lunar';
    steps.push('沒有任何定義 → 月亮權威（以約 28 天的月亮週期觀察）。');
  }

  return {
    activeGates: [...active].sort((a, b) => a - b),
    activeChannels,
    centerStates,
    components,
    definition,
    motorsToThroat,
    type,
    authority,
    steps,
  };
}
