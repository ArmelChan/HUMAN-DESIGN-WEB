// 個人報告產生器：只依圖表計算結果與本站內容資料組成，固定、可重現。
// 不接受姓名、性別、職業等身分資訊；使用者的反思回應也不會回頭改變報告。

import { CENTERS, CENTER_ORDER, channelCenters, type CenterId } from '../data/structure';
import { CENTER_CONTENT } from '../data/content/centers';
import { AUTHORITIES, TYPES } from '../data/content/types';
import { LINES } from '../data/content/profiles';
import { EDUCATION_SOURCES, STRESS_EDUCATION } from '../data/content/education';
import { DIRECTION_SCENARIOS, GENERAL_PROMPTS, type ReflectionArea } from '../data/content/reflection';
import { SOURCES, type Layer } from '../data/sources';
import { MANDALA_RULES } from '../data/rules/mandala';
import { DISCLAIMER } from '../data/disclaimer';
import { startDivergenceSensitive, type Chart, type SensitivityReport } from './chart';
import type { DayRangeResult } from './dayRange';
import { BODY_LABEL, type BodyId } from './ephemeris';
import type { AuthorityId, TypeId } from './derive';

export const REPORT_VERSION = 'report-1.0.0';

export type ReportInput =
  | { mode: 'exact'; chart: Chart }
  | { mode: 'approx'; chart: Chart; uncertaintyMinutes: number; sensitivity: SensitivityReport }
  | { mode: 'dateOnly'; day: DayRangeResult };

export interface ReportItem {
  id: string;
  heading: string;
  text: string;
  /** 這段內容依據的是圖中的哪個元素。 */
  basis: string;
  layer: Layer;
  centerId?: CenterId;
  centerStatus?: 'defined' | 'notDefined' | 'uncertain';
}

export interface ReflectionPrompt {
  id: string;
  area: ReflectionArea;
  text: string;
  basis: string;
}

export interface Report {
  version: string;
  mode: ReportInput['mode'];
  notice: string;
  calculation: ReportItem[];
  system: ReportItem[];
  reflection: ReflectionPrompt[];
  health: {
    restricted: boolean;
    intro: string;
    practices: string[];
    mentalHealth: string;
    seekHelp: string[];
    chartBoundary: string;
    bodyClaims: { centerId: CenterId; text: string }[];
  };
  direction: ReportItem[];
  limits: string[];
  sources: { label: string; url?: string }[];
}

export const SHORT_NOTICE = DISCLAIMER;

interface Core {
  type: TypeId | null;
  authority: AuthorityId | null;
  profile: [number, number] | null;
  centerStatus: Record<CenterId, 'defined' | 'notDefined' | 'uncertain'>;
  channels: string[];
  crossGates: [number, number, number, number] | null;
}

function coreOf(input: ReportInput): Core {
  if (input.mode === 'dateOnly') {
    const d = input.day;
    const centerStatus = {} as Core['centerStatus'];
    for (const id of CENTER_ORDER) {
      centerStatus[id] = d.alwaysDefined.includes(id) ? 'defined' : d.neverDefined.includes(id) ? 'notDefined' : 'uncertain';
    }
    const channelSets = d.charts.map((c) => c.derivation.activeChannels.map((x) => x.id));
    const channels = channelSets[0].filter((id) => channelSets.every((s) => s.includes(id)));
    const sunEarth = (side: 'personality' | 'design', body: BodyId) => d.stable.find((s) => s.side === side && s.body === body);
    const cg = [sunEarth('personality', 'sun'), sunEarth('personality', 'earth'), sunEarth('design', 'sun'), sunEarth('design', 'earth')];
    return {
      type: d.type,
      authority: d.authority,
      profile: d.profile ? (d.profile.split('/').map(Number) as [number, number]) : null,
      centerStatus,
      channels,
      crossGates: cg.every(Boolean) ? (cg.map((x) => Number(x!.gateLine.split('.')[0])) as Core['crossGates']) : null,
    };
  }
  const c = input.chart;
  const centerStatus = {} as Core['centerStatus'];
  for (const id of CENTER_ORDER) centerStatus[id] = c.derivation.centerStates[id] === 'defined' ? 'defined' : 'notDefined';
  return {
    type: c.derivation.type,
    authority: c.derivation.authority,
    profile: [c.profile.conscious, c.profile.unconscious],
    centerStatus,
    channels: c.derivation.activeChannels.map((x) => x.id),
    crossGates: c.crossGates,
  };
}

function hashText(t: string): string {
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function buildReport(input: ReportInput, options: { subjectIsMinor: boolean }): Report {
  const core = coreOf(input);
  const unstable = input.mode === 'approx' ? input.sensitivity : null;
  const typeUnsure = unstable ? !unstable.typeStable : false;
  const authUnsure = unstable ? !unstable.authorityStable : false;
  const profileUnsure = unstable ? !unstable.profileStable : false;
  const unsureNote = '（在你選擇的出生時間誤差範圍內可能改變，請保留判斷）';

  // 1. 圖表計算結果
  const calculation: ReportItem[] = [];
  const unknown = '這一天之內會改變，只知道日期時無法確定。';
  calculation.push({
    id: 'calc-type',
    heading: '類型',
    text: core.type ? `依本工具採用的人類圖規則，這張圖的類型為${TYPES[core.type].name}。${typeUnsure ? unsureNote : ''}` : `類型：${unknown}`,
    basis: '薦骨是否有定義、動力中心是否連到喉嚨',
    layer: 'system',
  });
  calculation.push({
    id: 'calc-authority',
    heading: '內在權威',
    text: core.authority ? `依權威判定順序，這張圖的內在權威為${AUTHORITIES[core.authority].name}。${authUnsure ? unsureNote : ''}` : `內在權威：${unknown}`,
    basis: '有定義中心的順位',
    layer: 'system',
  });
  calculation.push({
    id: 'calc-profile',
    heading: '人生角色',
    text: core.profile ? `人生角色為 ${core.profile[0]}/${core.profile[1]}（${LINES[core.profile[0] - 1].name}／${LINES[core.profile[1] - 1].name}）。${profileUnsure ? unsureNote : ''}` : `人生角色：${unknown}`,
    basis: '人格太陽與設計太陽的爻位',
    layer: 'system',
  });
  const defined = CENTER_ORDER.filter((id) => core.centerStatus[id] === 'defined');
  const uncertain = CENTER_ORDER.filter((id) => core.centerStatus[id] === 'uncertain');
  calculation.push({
    id: 'calc-centers',
    heading: '有定義的中心',
    text:
      (defined.length ? defined.map((id) => CENTERS[id].name).join('、') : '無') +
      (uncertain.length ? `；全天之中有時有定義、有時沒有：${uncertain.map((id) => CENTERS[id].name).join('、')}` : ''),
    basis: '成立的通道',
    layer: 'system',
  });
  calculation.push({
    id: 'calc-channels',
    heading: input.mode === 'dateOnly' ? '全天都成立的通道' : '成立的通道',
    text: core.channels.length ? core.channels.join('、') : '無',
    basis: '兩端閘門同時被啟動',
    layer: 'system',
  });
  if (input.mode !== 'dateOnly') {
    const c = input.chart;
    const flagged = [...c.personality, ...c.design].filter((a) => startDivergenceSensitive(a));
    calculation.push({
      id: 'calc-divergence',
      heading: '閘門輪起點分歧',
      text: flagged.length
        ? `${flagged.length} 個啟動點若改用另一個起點（302.057°）會落在不同的閘門或爻：${flagged.map((a) => BODY_LABEL[a.body]).join('、')}。`
        : '26 個啟動點在兩種起點下都得到相同的閘門與爻。',
      basis: MANDALA_RULES.startLongitude.text,
      layer: 'editorial',
    });
  }
  calculation.push({
    id: 'calc-external',
    heading: '外部驗證狀態',
    text: '尚未與其他人類圖排圖軟體直接比對（pending_external_validation）。工程測試通過不等於科學驗證。',
    basis: '計算驗證頁',
    layer: 'editorial',
  });

  // 2. 人類圖體系解釋
  const system: ReportItem[] = [];
  if (core.type) {
    const t = TYPES[core.type];
    system.push({ id: 'sys-type', heading: `類型：${t.name}`, text: t.detail, basis: `類型為${t.name}`, layer: 'system' });
    system.push({
      id: 'sys-strategy',
      heading: `策略：${t.strategy}`,
      text: `體系對${t.name}的建議是「${t.strategy}」；依策略生活時較常出現的感受稱為「${t.signature}」，偏離時的提醒訊號稱為「${t.notSelf}」。這是體系的說法，是否適用由你自己觀察。`,
      basis: `類型為${t.name}`,
      layer: 'system',
    });
  }
  if (core.authority) {
    const a = AUTHORITIES[core.authority];
    system.push({ id: 'sys-authority', heading: `內在權威：${a.name}`, text: `${a.summary}${a.detail}`, basis: a.center, layer: 'system' });
  }
  for (const id of CENTER_ORDER) {
    const status = core.centerStatus[id];
    const content = CENTER_CONTENT[id];
    system.push({
      id: `sys-center-${id}`,
      heading: `${CENTERS[id].name}：${status === 'defined' ? '有定義' : status === 'notDefined' ? '沒有定義' : '無法確定'}`,
      text:
        status === 'defined'
          ? content.defined
          : status === 'notDefined'
            ? content.undefinedState
            : '只知道出生日期時，這個中心在一天之中有時有定義、有時沒有，因此不提供這部分的解釋。',
      basis: `${CENTERS[id].name}的定義狀態`,
      layer: 'system',
      centerId: id,
      centerStatus: status,
    });
  }
  for (const chId of core.channels) {
    const [a, b] = chId.split('-').map(Number);
    const [ca, cb] = channelCenters({ id: chId, gates: [a, b], english: '', provisionalName: '', circuit: 'logic' });
    system.push({
      id: `sys-channel-${chId}`,
      heading: `通道 ${chId}`,
      text: `連接${CENTERS[ca].name}與${CENTERS[cb].name}，使兩個中心都有定義。這條通道的詳細解讀本站尚未收錄。`,
      basis: `閘門 ${a} 與 ${b} 同時被啟動`,
      layer: 'editorial',
    });
  }
  if (core.profile) {
    for (const [i, n] of core.profile.entries()) {
      const l = LINES[n - 1];
      system.push({
        id: `sys-line-${i}`,
        heading: `${i === 0 ? '意識面' : '潛意識面'}第 ${n} 爻：${l.name}`,
        text: `${l.summary}${l.detail}`,
        basis: `${i === 0 ? '人格' : '設計'}太陽的爻位`,
        layer: 'system',
      });
    }
  }

  // 3. 自我觀察與反思
  const reflection: ReflectionPrompt[] = [];
  // id 由題目文字雜湊產生：同一題在不同圖表中 id 相同，保存的筆記不會掛到別的題目上。
  const add = (area: ReflectionArea, text: string, basis: string) => {
    const id = `${area}-${hashText(text)}`;
    if (!reflection.some((r) => r.id === id)) reflection.push({ id, area, text, basis });
  };
  const sp = CENTER_CONTENT.solarPlexus;
  add('emotion', sp.observe[0], `情緒中心${core.centerStatus.solarPlexus === 'defined' ? '有定義' : core.centerStatus.solarPlexus === 'notDefined' ? '沒有定義' : '無法確定'}`);
  for (const t of GENERAL_PROMPTS.emotion) add('emotion', t, '所有人相同的問題');
  add('relationship', CENTER_CONTENT.g.observe[0], `G 中心的定義狀態`);
  add('relationship', CENTER_CONTENT.heart.observe[0], '意志力中心的定義狀態');
  for (const t of GENERAL_PROMPTS.relationship) add('relationship', t, '所有人相同的問題');
  if (core.type) {
    add('work', TYPES[core.type].observe[0], `類型為${TYPES[core.type].name}`);
    add('relationship', TYPES[core.type].observe[1], `類型為${TYPES[core.type].name}`);
  }
  add('work', CENTER_CONTENT.sacral.observe[1], '薦骨中心的定義狀態');
  for (const t of GENERAL_PROMPTS.work) add('work', t, '所有人相同的問題');
  if (core.authority) add('direction', AUTHORITIES[core.authority].observe, `內在權威為${AUTHORITIES[core.authority].name}`);
  if (core.profile) add('direction', LINES[core.profile[0] - 1].observe, `意識面第 ${core.profile[0]} 爻`);
  for (const t of GENERAL_PROMPTS.direction) add('direction', t, '所有人相同的問題');

  // 4. 一般健康與心理教育（不依圖表個人化）
  const health: Report['health'] = {
    restricted: options.subjectIsMinor,
    intro: STRESS_EDUCATION.intro,
    practices: options.subjectIsMinor ? [] : STRESS_EDUCATION.practices,
    mentalHealth: options.subjectIsMinor ? '' : STRESS_EDUCATION.mentalHealth,
    seekHelp: options.subjectIsMinor
      ? [
          '這份報告的出生日期顯示未滿 18 歲，本站不提供這部分的延伸內容。若有情緒或健康方面的困擾，請和家長、監護人、學校老師或輔導人員談談，或向醫療人員求助。',
          STRESS_EDUCATION.seekHelp[1],
        ]
      : STRESS_EDUCATION.seekHelp,
    chartBoundary: STRESS_EDUCATION.chartBoundary,
    bodyClaims: options.subjectIsMinor
      ? []
      : CENTER_ORDER.map((id) => ({ centerId: id, text: `${CENTERS[id].name}：${CENTER_CONTENT[id].bodyClaim}這是體系的象徵性說法，不是解剖學或醫學事實，不能用來判斷該器官的健康狀況。` })),
  };

  // 5. 象徵性人生方向
  const direction: ReportItem[] = [];
  direction.push({
    id: 'dir-frame',
    heading: '閱讀方式',
    text: '以下是人類圖體系內的象徵性說法與可能情境，不是預測，也不保證任何事件發生。每一項都可能適用、部分適用或不適用，由你自己判斷。',
    basis: '—',
    layer: 'editorial',
  });
  if (core.profile) {
    const [c, u] = core.profile;
    direction.push({
      id: 'dir-profile',
      heading: `人生角色 ${c}/${u} 的象徵`,
      text: `體系把人生角色描述為一個人參與世界的「扮演方式」：意識面的${LINES[c - 1].name}（${LINES[c - 1].summary}），潛意識面的${LINES[u - 1].name}（${LINES[u - 1].summary}）。它不決定你會走哪一條路。`,
      basis: '人格與設計太陽的爻位',
      layer: 'system',
    });
  }
  if (core.crossGates) {
    const [a, b, c2, d] = core.crossGates;
    direction.push({
      id: 'dir-cross',
      heading: '輪迴交叉的閘門',
      text: `由人格太陽／地球（${a}／${b}）與設計太陽／地球（${c2}／${d}）組成。體系把它描述為人生的主題；交叉的名稱與解讀本站尚未收錄，不以推測補上。`,
      basis: '四個太陽與地球啟動點',
      layer: 'editorial',
    });
  }
  if (core.type) {
    for (const [i, s] of DIRECTION_SCENARIOS[core.type].entries()) {
      direction.push({ id: `dir-scenario-${i}`, heading: `可能情境：${{ emotion: '情緒', relationship: '關係', work: '工作', direction: '方向' }[s.area]}`, text: s.text, basis: `類型為${TYPES[core.type].name}`, layer: 'editorial' });
    }
  }

  // 6. 計算與解讀限制
  const limits: string[] = [];
  if (input.mode === 'dateOnly') {
    limits.push(`只知道出生日期：本報告只採用當地這一天 ${input.day.samples} 個取樣時刻都相同的結果，沒有以任何單一時刻代表你的出生時間。`);
  }
  if (input.mode === 'approx') {
    limits.push(`出生時間約略（±${input.uncertaintyMinutes} 分鐘）：報告以你輸入的時間計算，在這個範圍內會改變的項目已標註。`);
  }
  limits.push(
    '出生時間、時區或夏令時間有誤，會改變啟動點，進而改變類型、權威或人生角色。1970 年以前部分地區的時區紀錄可能不完整。',
    '閘門輪起點在不同實作之間存在分歧（302° 與 302.057°），本站採 302°。',
    '交點採密切交點；採平均交點的軟體可能得到不同的交點閘門或爻。',
    '本站尚未與其他人類圖排圖軟體直接比對結果；第三方轉錄的參照圖屬二手資料。',
    '計算出的行星位置是天文事實；把它們解讀為性格、決策方式或人生方向，是人類圖體系的主張，沒有經過科學驗證。',
    '閱讀描述性文字時，人容易覺得籠統的描述特別準（巴納姆效應）。反思問題是用來觀察，不是用來確認。',
    '你在反思區的回應不會改變計算結果；不認同某段解讀，不代表你或圖表有錯。',
    '本報告不是臨床量表、心理測驗或診斷工具。',
  );

  const sources = [
    ...SOURCES.filter((s) => s.kind !== 'web-crosscheck').map((s) => ({ label: [s.title, s.author, s.year].filter(Boolean).join('，'), url: s.url })),
    ...EDUCATION_SOURCES.map((s) => ({ label: `${s.publisher}〈${s.title}〉（查核日期 ${s.checkedAt}）`, url: s.url })),
    { label: `規則表 ${MANDALA_RULES.version}；報告版本 ${REPORT_VERSION}` },
  ];

  return {
    version: REPORT_VERSION,
    mode: input.mode,
    notice: SHORT_NOTICE,
    calculation,
    system,
    reflection,
    health,
    direction,
    limits,
    sources,
  };
}

/** 依出生日期判斷報告對象在今天是否未滿 18 歲。報告對象不一定是操作者本人，這不是年齡驗證。 */
export function isMinorOn(birthDate: string, today: Date): boolean {
  const [y, m, d] = birthDate.split('-').map(Number);
  const age = today.getFullYear() - y - (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d) ? 1 : 0);
  return age < 18;
}
