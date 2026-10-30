// 隱私聲明草稿：依程式實際資料流程撰寫。改動資料流程時必須同步更新本檔與 privacy.test.ts。

import { PRIVACY_VERSION, STORAGE_KEYS } from '../../lib/consent';
import { operatorValue } from './operator';
import type { LegalSection } from './terms';

export const PRIVACY_META = {
  version: PRIVACY_VERSION,
  status: '草稿：尚未經法律專業人員審閱，尚未生效',
  updated: '2026-10-29',
};

export interface DataFlow {
  data: string;
  where: string;
  sentOut: string;
  retention: string;
}

export const DATA_FLOWS: DataFlow[] = [
  {
    data: '出生日期、時間、時間準確程度、時區或時差',
    where: '你的瀏覽器記憶體，用於計算',
    sentOut: '不傳送。網站沒有伺服器端程式、沒有分析工具，也不放入網址。',
    retention: '關閉或重新整理頁面即消失；只有勾選「在這台裝置保存」時才寫入瀏覽器本機儲存（' + STORAGE_KEYS.input + '）。',
  },
  {
    data: '反思回應與你寫下的例子、反例',
    where: '你的瀏覽器記憶體',
    sentOut: '不傳送。',
    retention: '同上；勾選保存時寫入 ' + STORAGE_KEYS.reflection + '。',
  },
  {
    data: '條款接受紀錄（條款版本與接受時間）',
    where: '你的瀏覽器記憶體',
    sentOut: '不傳送。',
    retention: '勾選保存時寫入 ' + STORAGE_KEYS.consent + '；未勾選則只在這次開啟頁面期間有效。這只是你瀏覽器中的紀錄，不構成跨裝置或對第三方的證明。',
  },
  {
    data: '匯出的報告檔案或複製的文字',
    where: '由你選擇存放的位置或剪貼簿',
    sentOut: '本站不傳送；之後如何分享由你決定。在 claude.ai 上開啟本站時，下載的檔案會交給 claude.ai 的檢視器，由它顯示檔名與大小請你確認後存檔；該平台如何處理這個步驟依其本身的政策（見第 5 節），本站無法核實。',
    retention: '由你自行管理。',
  },
  {
    data: '提問指引中輸入的問題',
    where: '你的瀏覽器記憶體，只用於比對固定規則',
    sentOut: '不傳送、不保存。',
    retention: '離開頁面即消失。',
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'scope',
    title: '1. 適用範圍',
    paragraphs: ['本聲明說明本網站如何處理你輸入的資料。它與使用條款分開；使用條款不取代本聲明。'],
  },
  {
    id: 'flows',
    title: '2. 實際的資料處理流程',
    paragraphs: ['所有計算都在你的瀏覽器內完成。下表依網站程式的實際行為列出各類資料的處理方式。'],
  },
  {
    id: 'not-collected',
    title: '3. 不收集的資料',
    paragraphs: [
      '本站不要求、也不需要病歷、診斷、用藥或其他健康資料。反思區只請你記錄自己的經驗，請不要在其中寫入你不想保存的敏感資訊。',
      '本站程式不寫入 cookie，不使用分析或廣告追蹤工具，不使用錯誤追蹤服務，也不在瀏覽器主控台輸出出生資料或反思內容。',
      '網址中不會帶出生資料。分享連結（例如某個中心頁面的連結）只包含頁面位置。',
    ],
  },
  {
    id: 'ai',
    title: '4. AI 與第三方',
    paragraphs: [
      '本版本沒有任何 AI 功能，不會把你的資料傳送給 AI 服務或其他第三方。',
      '若日後加入 AI 功能，會在使用前另外告知接收者、傳送的欄位、用途與已知的保存安排，並讓你選擇不使用；不使用 AI 時，基本排圖仍可運作。本站不會在未確認供應商條款前，宣稱任何「不保存」或「不用於訓練」的承諾。',
    ],
  },
  {
    id: 'hosting',
    title: '5. 網站託管',
    paragraphs: [
      '載入網頁時，託管網站的服務可能依其本身的政策記錄一般連線資訊（例如 IP 位址與瀏覽器類型）。這不在本站程式控制範圍內。託管方與其政策：' + operatorValue('hosting') + '。',
    ],
  },
  {
    id: 'control',
    title: '6. 你的控制方式',
    paragraphs: [
      '本機保存預設關閉，需要你另外勾選。你隨時可以在個人排圖頁按「清除這台裝置上的資料」，刪除本站保存的所有項目；也可以透過瀏覽器的網站資料設定清除。',
      '匯出或分享報告前，網站會提醒你報告含有出生資料。',
    ],
  },
  {
    id: 'contact',
    title: '7. 版本與聯絡',
    paragraphs: [`版本：${PRIVACY_VERSION}。營運者：${operatorValue('legalName')}。聯絡方式：${operatorValue('contact')}。`],
  },
];
