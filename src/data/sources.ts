// 來源與核實狀態。每段內容都標明它屬於哪一層（體系說法／其他作者詮釋／網站編輯整理），
// 以及在本站建置時核實到什麼程度。

export type Verification = 'crossChecked' | 'commonReference' | 'pending' | 'notIncluded';

export const VERIFICATION_LABEL: Record<Verification, { label: string; description: string }> = {
  crossChecked: {
    label: '已交叉比對',
    description: '建置時以兩個以上彼此獨立的來源比對，說法一致。仍不等於與原始著作逐頁核對。',
  },
  commonReference: {
    label: '依通行資料整理',
    description: '與常見的人類圖參考資料一致，由編輯整理；本次未與原始著作逐條核對。',
  },
  pending: {
    label: '待核實',
    description: '來源之間有出入或只找到單一來源，暫列供參考，不宜引用。',
  },
  notIncluded: {
    label: '尚未收錄',
    description: '本站目前沒有這部分內容，不以推測補上。',
  },
};

/** 內容屬於哪一層。 */
export type Layer = 'system' | 'interpretation' | 'editorial' | 'science';

export const LAYER_LABEL: Record<Layer, { label: string; description: string }> = {
  system: {
    label: '體系說法',
    description: '人類圖創始者 Ra Uru Hu 及其官方教材的主張，本站轉述而非引用原文。',
  },
  interpretation: {
    label: '其他作者詮釋',
    description: '後來的老師、作者或社群的延伸說法，不同流派之間常有差異。',
  },
  editorial: {
    label: '網站編輯整理',
    description: '本站為了閱讀而寫的觀察提示、比較與限制說明，不屬於體系本身。',
  },
  science: {
    label: '科學與研究現況',
    description: '已確立的科學知識或研究狀態，用來和體系主張區分。',
  },
};

export interface Source {
  id: string;
  title: string;
  author?: string;
  year?: string;
  publisher?: string;
  url?: string;
  kind: 'primary' | 'secondary' | 'web-crosscheck' | 'science';
  note: string;
}

export const SOURCES: Source[] = [
  {
    id: 'definitive-book',
    title: 'The Definitive Book of Human Design: The Science of Differentiation',
    author: 'Lynda Bunnell, Ra Uru Hu',
    year: '2011',
    publisher: 'HDC Publishing',
    kind: 'primary',
    note: '體系的主要教科書。本站的結構與術語以它所代表的體系為準，但本次建置未能逐頁核對，相關內容標為「依通行資料整理」。',
  },
  {
    id: 'jovian-archive',
    title: 'Jovian Archive',
    url: 'https://www.jovianarchive.com/',
    kind: 'primary',
    note: '出版 Ra Uru Hu 著作與課程的機構。BodyGraph 圖像與部分名稱涉及其著作權與商標，本站圖形為自行繪製的示意圖。',
  },
  {
    id: 'parkyn',
    title: 'Human Design: Discover the Person You Were Born to Be',
    author: 'Chetan Parkyn',
    year: '2009',
    publisher: 'New World Library',
    kind: 'secondary',
    note: '另一位作者的入門詮釋，部分用語與官方教材不同，本站提到其他流派用語時以此類資料為例。',
  },
  {
    id: 'web-integration',
    title: 'The Integration Channels（Human Design Hub）',
    url: 'https://humandesignhub.app/en/library/circuit-integration',
    kind: 'web-crosscheck',
    note: '二手網站，僅用於交叉比對整合通道組的組成。',
  },
  {
    id: 'web-circuitry',
    title: 'Human Design Circuitry（Health Manifested）',
    url: 'https://healthmanifested.com/human-design-circuitry/',
    kind: 'web-crosscheck',
    note: '二手網站，用於比對迴路分組。注意：20-57 腦波通道在不同網站的歸類並不一致。',
  },
  {
    id: 'web-circuits-jfj',
    title: 'HD101: The Human Design Circuits（Just Follow Joy）',
    url: 'https://justfollowjoy.com/blog/hd101-the-human-design-circuits',
    kind: 'web-crosscheck',
    note: '二手網站，用於比對中心迴路（10-34、25-51）。',
  },
  {
    id: 'web-zh-104',
    title: '人類圖相關介紹（104 職場力）',
    url: 'https://blog.104.com.tw/human-design-chart/',
    kind: 'web-crosscheck',
    note: '中文媒體文章，用於了解台灣讀者常見的中心與類型譯名，並比對投射者的判定規則。不作為內容依據。',
  },
  {
    id: 'astronomy-engine',
    title: 'Astronomy Engine（JavaScript 版 2.1.19）',
    author: 'Don Cross',
    url: 'https://github.com/cosinekitty/astronomy',
    kind: 'science',
    note: 'MIT 授權的開源天文計算函式庫，個人排圖用它計算太陽、月亮與行星的地心黃經，以及設計時刻（太陽回推 88°）。在瀏覽器內執行，不連線。',
  },
  {
    id: 'meeus',
    title: 'Astronomical Algorithms（第 2 版）',
    author: 'Jean Meeus',
    year: '1998',
    publisher: 'Willmann-Bell',
    kind: 'science',
    note: '月球平均交點與真交點的公式取自第 47 章；第 25 章的低精度太陽公式用於單元測試中獨立比對太陽位置。',
  },
  {
    id: 'web-gate-degrees',
    title: '閘門黃道度數的二手資料（Bonnie Sorsby、Awakened by Design 等網站的搜尋摘要）',
    url: 'https://bonniesorsby.com/human-design-gates-by-degree/',
    kind: 'web-crosscheck',
    note: '用於比對閘門 41 起於水瓶座 2°、閘門 25 起於雙魚座 28°15′、閘門 17 起於牡羊座 3°52′，以及摩羯座閘門順序。原頁面在建置環境無法開啟，僅取得搜尋摘要；另有一個網站的度數與此不同。',
  },
  {
    id: 'forer-1949',
    title: 'The fallacy of personal validation: a classroom demonstration of gullibility',
    author: 'Bertram R. Forer',
    year: '1949',
    publisher: 'Journal of Abnormal and Social Psychology, 44(1)',
    kind: 'science',
    note: '說明人們容易把籠統的人格描述視為「特別準」。本站用它提醒讀者留意閱讀描述性文字時的這種傾向。',
  },
];

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}
