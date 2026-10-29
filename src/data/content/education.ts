// 一般健康與心理教育內容：不依圖表個人化，所有人看到的內容相同。
// 以轉述與連結方式引用，不複製原文。查核日期記錄於 checkedAt。

export interface EducationSource {
  title: string;
  publisher: string;
  url: string;
  checkedAt: string;
  note: string;
}

export const EDUCATION_SOURCES: EducationSource[] = [
  {
    title: 'Stress（問答）',
    publisher: '世界衛生組織（WHO）',
    url: 'https://www.who.int/news-room/questions-and-answers/item/stress',
    checkedAt: '2026-10-29',
    note: '頁面顯示更新日期為 2026 年 3 月 30 日。本站只轉述要點。',
  },
  {
    title: 'Mental health（事實簡介）',
    publisher: '世界衛生組織（WHO）',
    url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response',
    checkedAt: '2026-10-29',
    note: '本站只轉述心理健康的定義。',
  },
];

export const STRESS_EDUCATION = {
  intro:
    'WHO 把壓力描述為面對困難處境時的擔憂或心理緊繃，是每個人都會有的自然反應；怎麼回應壓力，會影響整體的身心狀態。',
  practices: [
    '維持規律的作息：固定時間上床與起床，睡前減少使用螢幕，晚上避免大量進食、咖啡因與酒精。',
    '安排日常行程：讓吃飯、運動、家務與和家人相處有固定的時間，能帶來較多掌控感。',
    '和信任的人談談你在意的事。',
    '規律、均衡地進食，每天有一些身體活動，例如散步。',
    '如果新聞或社群媒體讓你更緊張，可以減少接觸的時間。',
  ],
  mentalHealth:
    'WHO 把心理健康描述為一種身心安適的狀態：能應對生活壓力、發揮能力、好好學習與工作，並參與社群。它不只是「沒有疾病」。',
  seekHelp: [
    '如果情緒或壓力持續影響睡眠、工作、學業或人際關係，請向醫師、臨床心理師、諮商師等合資格的專業人員求助。',
    '如果你或身邊的人有立即的安全危險，請立刻聯絡你所在地的緊急服務，或請身邊的人陪同你求助。',
    '正在接受治療或服藥的人，任何調整都應先和負責的醫療人員討論。',
  ],
  chartBoundary:
    '以上內容對所有人都相同，不是從你的人類圖推導出來的。人類圖的中心、通道、閘門與權威，不能用來判斷你是否有任何身心疾病，也不能用來決定治療或用藥。',
};
