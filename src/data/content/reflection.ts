// 自我反思問題與象徵性方向情境。全部是「可觀察、可反思」的問題，不是量表，也不計分。

import type { TypeId } from '../../lib/derive';

export type ReflectionArea = 'emotion' | 'relationship' | 'work' | 'direction';

export const AREA_LABEL: Record<ReflectionArea, string> = {
  emotion: '情緒',
  relationship: '關係',
  work: '工作',
  direction: '人生方向',
};

/** 與圖表無關、所有人相同的基本問題。 */
export const GENERAL_PROMPTS: Record<ReflectionArea, string[]> = {
  emotion: [
    '最近一次情緒明顯起伏時，你在做什麼、和誰在一起？那個情緒過了多久才平穩下來？',
    '有哪些訊號會讓你知道自己累了，例如睡眠、胃口或說話的速度？',
  ],
  relationship: [
    '和某個人相處後，你通常覺得比較有精神，還是比較疲憊？差別可能在哪裡？',
    '你最近一次沒說出口的需求是什麼？當時是什麼讓你沒有說？',
  ],
  work: [
    '一天之中，哪一段時間做事最順？那段時間你在做什麼類型的事？',
    '你最近答應下來的工作裡，有沒有一件其實沒有想做的？',
  ],
  direction: [
    '回顧過去一年，有哪個決定讓你事後覺得「那樣做是對的」？當時你是怎麼決定的？',
    '如果不考慮別人的期待，你下一年想多花時間在什麼事情上？',
  ],
};

/** 依類型的象徵性情境：每項都是「可能的樣子」，由使用者自行判斷是否適用。 */
export const DIRECTION_SCENARIOS: Record<TypeId, { area: ReflectionArea; text: string }[]> = {
  generator: [
    { area: 'work', text: '體系的說法中，生產者在回應已經出現的事物時較能持續投入。可以留意：最近讓你做得最久、最不覺得勉強的事，是怎麼開始的？' },
    { area: 'relationship', text: '有些人會發現，被直接問「要不要」時比被要求「主動提議」更容易知道自己的意願。這對你成立嗎？' },
    { area: 'direction', text: '體系把「挫折」視為提醒訊號。若最近常感到挫折，可以記下當時投入的是哪件事，而不急著判斷原因。' },
  ],
  manifestingGenerator: [
    { area: 'work', text: '體系描述顯示生產者可能同時進行多件事、跳過步驟再回頭補。可以觀察：你回頭補的步驟，有多少是真的必要？' },
    { area: 'relationship', text: '體系建議在回應後、行動前告知相關的人。你可以試著記錄一次「先告知」與一次「沒告知」時，對方的反應有何不同。' },
    { area: 'direction', text: '如果你的興趣轉換得很快，可以把它當作觀察對象：哪些轉換之後你仍然滿足，哪些之後覺得挫折？' },
  ],
  manifestor: [
    { area: 'work', text: '體系描述顯示者能直接發起。可以留意：你發起的事情中，哪些需要交棒給別人延續？' },
    { area: 'relationship', text: '體系的策略是「告知」，而不是請求許可。你可以觀察，事先告知是否改變了別人對你行動的反應。' },
    { area: 'direction', text: '體系把「憤怒」視為提醒訊號。若感到被阻撓，可以記下在那之前是否有說明自己要做什麼。' },
  ],
  projector: [
    { area: 'work', text: '體系建議投射者在重大事情上等待邀請。可以回顧：你最被重視的一次合作，是對方先來找你，還是你先提議？' },
    { area: 'relationship', text: '有些人會發現，對方主動詢問時，自己的建議比較能被聽進去。這在你的經驗裡成立嗎？' },
    { area: 'direction', text: '體系把「苦澀」視為提醒訊號。若感到不被看見，可以記下當時對方是否真的想聽你的意見。' },
  ],
  reflector: [
    { area: 'work', text: '體系描述反映者會反映所處環境的狀態。可以比較：在不同的工作環境中，你的狀態差異有多大？' },
    { area: 'relationship', text: '你身邊的人換了一群時，你對自己的感覺會改變嗎？哪些人讓你覺得最像自己？' },
    { area: 'direction', text: '體系建議重大決定經過約一個月亮週期。你可以試著把一個決定記錄下來，每週寫一次當時的感受。' },
  ],
};
