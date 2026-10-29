import type { AuthorityId, TypeId } from '../../lib/derive';
import type { Verification } from '../sources';

export interface TypeContent {
  id: TypeId;
  name: string;
  english: string;
  altNames: string[];
  /** 判定規則，以中心定義描述。 */
  rule: string;
  strategy: string;
  strategyEnglish: string;
  signature: string;
  notSelf: string;
  aura: string;
  /** 體系內常被引用的比例。 */
  commonlyCitedShare: string;
  summary: string;
  detail: string;
  misconceptions: string[];
  observe: string[];
  notInfer: string;
  possibleAuthorities: AuthorityId[];
  verification: Verification;
}

export const TYPE_ORDER: TypeId[] = ['generator', 'manifestingGenerator', 'manifestor', 'projector', 'reflector'];

export const TYPES: Record<TypeId, TypeContent> = {
  generator: {
    id: 'generator',
    name: '生產者',
    english: 'Generator',
    altNames: ['純生產者'],
    rule: '薦骨中心有定義，且沒有任何動力中心經由通道連到喉嚨。',
    strategy: '等待回應',
    strategyEnglish: 'To Respond',
    signature: '滿足',
    notSelf: '挫折',
    aura: '開放、包覆',
    commonlyCitedShare: '約 37%',
    summary: '薦骨能量穩定，以回應外在出現的事物來投入工作與生活。',
    detail:
      '體系把生產者描述為擁有持續生命力的人，這股能量在回應「已經出現在眼前」的事情時最能發揮。所謂等待回應，不是什麼都不做，而是不從頭腦發起，改為留意生活中出現的人、事、問題，觀察身體對它們的第一個反應。體系常用「挫折」作為偏離自己策略的訊號，「滿足」則是策略運作良好時的感受。',
    misconceptions: [
      '「生產者就是勞動者，適合做重複性工作」——生產者這個名稱來自「生產能量」，與職業類別無關。',
      '「等待回應就是不能主動」——日常中隨時都有可以回應的事物，主動詢問別人、接受提問也都能創造回應的機會。',
    ],
    observe: [
      '最近一次感到挫折，是因為事情本身，還是因為你投入了一件身體其實沒有回應的事？',
      '有人直接問你是非題時，你能否察覺到身體在想法出現之前的反應？',
    ],
    notInfer: '不能據此判斷一個人該做什麼工作、該工作多久，或是否「天生勤勞」。',
    possibleAuthorities: ['emotional', 'sacral'],
    verification: 'commonReference',
  },
  manifestingGenerator: {
    id: 'manifestingGenerator',
    name: '顯示生產者',
    english: 'Manifesting Generator',
    altNames: ['顯示型生產者'],
    rule: '薦骨中心有定義，且至少一個動力中心（可以是薦骨本身）經由通道直接或間接連到喉嚨。',
    strategy: '等待回應，行動前告知',
    strategyEnglish: 'To Respond (then Inform)',
    signature: '滿足',
    notSelf: '挫折與憤怒',
    aura: '開放、包覆',
    commonlyCitedShare: '約 33%',
    summary: '生產者的一種：同樣以回應運作，但能量可以很快轉成行動。',
    detail:
      '在 Ra Uru Hu 的原始分類中，顯示生產者是生產者的一個分支，策略同樣是等待回應；許多後來的教材把它列為第五種類型，並在策略中加上「行動前告知」，因為能量連到喉嚨，回應之後常會很快動起來。體系描述他們常常同時進行多件事、可能跳過步驟再回頭補，這被視為運作方式的一部分，而不是缺點。',
    misconceptions: [
      '「顯示生產者是顯示者加生產者，兼具兩種策略」——多數教材仍以回應為主，告知是補充，不是另一個獨立的發起策略。',
      '「顯示生產者一定很急躁」——速度快是體系常見的描述，但不是每個人都如此，也不代表沒有耐性。',
    ],
    observe: [
      '你是否常在回應某件事之後很快動起來，事後才發現漏了某個步驟？那個步驟真的必要嗎？',
      '當你開始做一件事卻沒先告訴相關的人，事後通常發生什麼？',
    ],
    notInfer: '不能據此認定一個人適合多工職務，或據此解釋注意力相關的醫療狀況。',
    possibleAuthorities: ['emotional', 'sacral'],
    verification: 'commonReference',
  },
  manifestor: {
    id: 'manifestor',
    name: '顯示者',
    english: 'Manifestor',
    altNames: ['發起者'],
    rule: '薦骨中心沒有定義，且至少一個動力中心（意志力、情緒或根部）經由通道直接或間接連到喉嚨。',
    strategy: '告知',
    strategyEnglish: 'To Inform',
    signature: '平靜',
    notSelf: '憤怒',
    aura: '封閉、具推離感',
    commonlyCitedShare: '約 8–9%',
    summary: '能直接發起行動的類型；體系建議在行動前告知會受影響的人。',
    detail:
      '體系把顯示者描述為不需要等待外在事物就能發起的人。正因為他們的行動常出乎旁人意料，體系提出的策略是「告知」：在行動之前，讓會受到影響的人知道。告知不是請求許可，而是降低他人反彈、減少阻力。體系也說顯示者的薦骨沒有定義，不擁有生產者那種持續工作的能量，因此發起之後可能需要交棒或休息。',
    misconceptions: [
      '「顯示者是天生的領導者」——體系描述的是發起的能力，不等於帶領團隊的能力或意願。',
      '「告知就是報備，要等別人同意」——體系的告知是通知，不是徵求同意。',
    ],
    observe: [
      '你做了決定卻沒有告訴身邊的人時，他們的反應如何？你又有什麼感受？',
      '什麼時候你會感到被干涉、被阻撓而生氣？那時有沒有事先說明你要做什麼？',
    ],
    notInfer: '不能據此判斷一個人是否適合管理職，或將憤怒情緒合理化為「類型特質」。',
    possibleAuthorities: ['emotional', 'splenic', 'egoManifested'],
    verification: 'commonReference',
  },
  projector: {
    id: 'projector',
    name: '投射者',
    english: 'Projector',
    altNames: [],
    rule: '薦骨中心沒有定義，沒有動力中心連到喉嚨，但至少有一個中心有定義。',
    strategy: '等待被邀請',
    strategyEnglish: 'Wait for the Invitation',
    signature: '成功',
    notSelf: '苦澀',
    aura: '專注、穿透',
    commonlyCitedShare: '約 20%',
    summary: '擅長看見他人與系統運作的方式；體系建議在重大事情上等待邀請。',
    detail:
      '體系描述投射者的能力在於辨識、引導與管理他人的能量，而不是自己持續產出。體系所說的「等待被邀請」主要指人生的重大事項：工作、親密關係、居住的地方、重要的合作，並不是日常每件小事都要等人開口。被邀請代表對方先認可了你的能力，引導才比較可能被聽進去。',
    misconceptions: [
      '「投射者不用工作，只要等就好」——體系並未這樣說；它談的是在重大承諾上，有邀請作為前提較不易耗損。',
      '「投射者比較弱」——體系認為投射者沒有持續的薦骨能量，因此需要不同的工作節奏，這與能力高低無關。',
    ],
    observe: [
      '你最投入、也最被重視的那次合作，是怎麼開始的？是你提議，還是對方來找你？',
      '你給出的建議沒有被聽見時，當時對方有沒有問你的意見？',
    ],
    notInfer: '不能據此認定一個人不適合全職工作、不適合創業，或據此解釋疲勞相關的健康問題。',
    possibleAuthorities: ['emotional', 'splenic', 'egoProjected', 'selfProjected', 'mental'],
    verification: 'commonReference',
  },
  reflector: {
    id: 'reflector',
    name: '反映者',
    english: 'Reflector',
    altNames: ['反射者'],
    rule: '九個中心全部沒有定義（沒有任何完整通道）。',
    strategy: '等待一個月亮週期（約 28 天）',
    strategyEnglish: 'Wait a Lunar Cycle',
    signature: '驚喜',
    notSelf: '失望',
    aura: '抵抗、取樣',
    commonlyCitedShare: '約 1%',
    summary: '九個中心全部沒有定義，體系描述他們會反映所處環境與群體的狀態。',
    detail:
      '體系把反映者描述為對環境高度敏感的人，像是映照周遭的鏡子，因此所處的社群與地點對他們特別重要。月亮大約 28 天走完 64 個閘門，對反映者而言，每天被月亮啟動的部位不同，體系因此建議重大決定經過一整個月亮週期，並在這段時間與信任的人談論。',
    misconceptions: [
      '「反映者沒有個性」——全部中心未定義描述的是能量模式，不代表沒有個人特質或想法。',
      '「每個決定都要等 28 天」——體系指的是重大決定，日常的小事不必如此。',
    ],
    observe: [
      '換一個環境或一群人相處後，你的狀態變化有多明顯？',
      '回想一個你等了一段時間才做的決定，跟當下就做的決定相比，結果有何不同？',
    ],
    notInfer: '不能據此認定一個人容易被操控、沒有主見，或據此解釋任何心理狀況。',
    possibleAuthorities: ['lunar'],
    verification: 'commonReference',
  },
};

export interface AuthorityContent {
  id: AuthorityId;
  name: string;
  english: string;
  altNames: string[];
  rank: number;
  center: string;
  /** 哪些類型可能出現此權威。 */
  types: TypeId[];
  summary: string;
  detail: string;
  observe: string;
  caution: string;
  verification: Verification;
}

export const AUTHORITY_ORDER: AuthorityId[] = [
  'emotional',
  'sacral',
  'splenic',
  'egoManifested',
  'egoProjected',
  'selfProjected',
  'mental',
  'lunar',
];

export const AUTHORITIES: Record<AuthorityId, AuthorityContent> = {
  emotional: {
    id: 'emotional',
    name: '情緒權威',
    english: 'Emotional (Solar Plexus) Authority',
    altNames: ['情緒中心權威'],
    rank: 1,
    center: '情緒中心',
    types: ['generator', 'manifestingGenerator', 'manifestor', 'projector'],
    summary: '情緒中心有定義時一律以它為權威：不在當下決定，等情緒波走過一段時間後的清晰。',
    detail:
      '體系說情緒中心有定義的人約占一半。因為情緒以波的形式起伏，體系認為任何單一時刻的感受都不完整，建議在高點與低點都感受同一件事，等到某種平穩的清晰出現再決定。這段時間沒有固定長短，小事可能一晚，大事可能更久。',
    observe: '同一件事，隔一晚或隔幾天再問自己一次，答案有沒有變？變的是什麼？',
    caution: '「等待清晰」不等於壓抑情緒，也不代表情緒有問題；這是體系的決策建議，不是情緒管理或治療方法。',
    verification: 'commonReference',
  },
  sacral: {
    id: 'sacral',
    name: '薦骨權威',
    english: 'Sacral Authority',
    altNames: [],
    rank: 2,
    center: '薦骨中心',
    types: ['generator', 'manifestingGenerator'],
    summary: '情緒中心無定義、薦骨有定義時：在當下以身體的回應作為依據。',
    detail:
      '體系描述薦骨的回應是即時的、身體性的，常以「嗯哼（是）」「嗯嗯（否）」這類聲音或身體的趨向與退縮表現。因為需要有東西可以回應，被問是非題特別有幫助。這種回應發生在頭腦開始分析之前。',
    observe: '請一位朋友問你一連串簡單的是非題，留意在你想好理由之前，身體已經偏向哪一邊。',
    caution: '身體反應也可能受疲勞、飢餓或環境影響；體系的說法是一種觀察方式，不是生理學上的測量。',
    verification: 'commonReference',
  },
  splenic: {
    id: 'splenic',
    name: '直覺權威',
    english: 'Splenic Authority',
    altNames: ['脾權威'],
    rank: 3,
    center: '直覺中心',
    types: ['manifestor', 'projector'],
    summary: '情緒與薦骨都無定義、直覺中心有定義時：聽當下那個只出現一次的安靜訊號。',
    detail:
      '體系描述直覺權威的訊號在當下出現、只說一次、音量很小，與健康和生存有關。錯過了不會重複提醒。它與情緒權威的「等待」相反，重點在於當下。',
    observe: '回想你曾有過「一開始就覺得不對」的時刻，那個感覺是何時出現的？你當時怎麼處理它？',
    caution: '體系所說的直覺不能取代醫療判斷或安全評估。',
    verification: 'commonReference',
  },
  egoManifested: {
    id: 'egoManifested',
    name: '意志力權威（顯示）',
    english: 'Ego Manifested Authority',
    altNames: ['自我顯示權威', '心臟權威'],
    rank: 4,
    center: '意志力中心（連到喉嚨）',
    types: ['manifestor'],
    summary: '意志力中心直接或間接連到喉嚨的顯示者：聽自己說出口的「我想要」。',
    detail:
      '體系描述這類人的依據是意志：自己真心想要什麼、願意承諾什麼。由於意志力連到喉嚨，體系建議留意自己在當下脫口而出的話，那常是意志的直接表達。',
    observe: '在你說「我要」「我會」的時候，那是當下真心的，還是覺得應該這樣說？',
    caution: '體系強調的是真實的意願，不是把任性或衝動合理化。',
    verification: 'commonReference',
  },
  egoProjected: {
    id: 'egoProjected',
    name: '意志力權威（投射）',
    english: 'Ego Projected Authority',
    altNames: ['自我投射意志力權威'],
    rank: 4,
    center: '意志力中心（只連到 G）',
    types: ['projector'],
    summary: '意志力中心只與 G 中心相連的投射者：在被邀請後，聽自己對「這對我有什麼」的回答。',
    detail:
      '體系描述這是較少見的權威。意志力沒有連到喉嚨，因此常建議在談話中聽自己說出的話，特別是關於自己想要什麼、這件事對自己有什麼好處的部分。',
    observe: '討論一個邀請時，你有沒有聽見自己誠實地說出「我想要」或「我不要」？',
    caution: '這是體系的分類，少見不代表特殊或較高。',
    verification: 'commonReference',
  },
  selfProjected: {
    id: 'selfProjected',
    name: '自我投射權威',
    english: 'Self-Projected Authority',
    altNames: ['G 中心權威'],
    rank: 5,
    center: 'G 中心（連到喉嚨）',
    types: ['projector'],
    summary: 'G 中心連到喉嚨、沒有更高順位權威的投射者：在說出來的過程中聽見自己的方向。',
    detail:
      '體系建議這類人找信任的人談，對方不需要給建議，重點是讓自己說出來。聽自己的語氣與內容，往往能聽出這件事是否符合自己的方向與身分。',
    observe: '跟朋友描述一個選擇時，哪一種說法讓你自己聽起來比較像「是我」？',
    caution: '傾聽者的角色是讓你聽見自己，若對方給的建議比你的聲音更大，就偏離了體系的用意。',
    verification: 'commonReference',
  },
  mental: {
    id: 'mental',
    name: '環境權威',
    english: 'Mental / Environmental Authority（No Inner Authority）',
    altNames: ['心智投射權威', '外在權威', '無內在權威'],
    rank: 6,
    center: '無（定義只在頭頂、邏輯、喉嚨）',
    types: ['projector'],
    summary: '定義只在頭頂、邏輯與喉嚨之間的投射者：體系稱沒有內在權威，依靠環境與傾聽者。',
    detail:
      '體系的說法是，這類投射者的頭腦不適合替自己做決定，但可以把想法說給不同的人聽、在不同的環境中說，藉此看清楚。所處的環境是否合適被視為很重要的線索。',
    observe: '同一件事在家裡、在辦公室、在咖啡館說出來，你自己的感覺有沒有不同？',
    caution: '中文譯名不統一，「心智投射」「環境權威」「外在權威」常指同一件事。',
    verification: 'commonReference',
  },
  lunar: {
    id: 'lunar',
    name: '月亮權威',
    english: 'Lunar Authority',
    altNames: ['月循環權威'],
    rank: 7,
    center: '無（九中心全部未定義）',
    types: ['reflector'],
    summary: '反映者的權威：以約 28 天的月亮週期觀察，在不同日子感受同一個決定。',
    detail:
      '體系描述月亮約 28 天走完 64 個閘門，反映者每天受到不同的啟動。經過一整個週期，並且在這段期間與信任的人談論，才能看出對一件事的一致感受。',
    observe: '把一個重要決定記下來，每週寫一次你當時的感受，一個月後回頭看。',
    caution: '這是體系的建議，不是天文學或生理學上的因果關係。',
    verification: 'commonReference',
  },
};

export const TYPE_CLASSIFICATION_NOTE = {
  title: '四種還是五種類型？',
  text:
    'Ra Uru Hu 最初的教材把類型分為四種：顯示者、生產者、投射者、反映者，顯示生產者被視為生產者的一種。之後許多教材與中文資料把顯示生產者列為獨立的第五種類型。本站在比較表中把五種並列，以便看出差異，同時在每處都標明顯示生產者屬於生產者這一支。',
};

export const SHARE_NOTE =
  '這些比例是人類圖教材與社群中常被引用的數字，來源沒有說明抽樣方法，不是人口統計研究的結果，只能當作體系內的參考。';
