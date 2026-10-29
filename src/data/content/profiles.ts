import type { Verification } from '../sources';

export interface LineContent {
  line: number;
  name: string;
  english: string;
  altNames: string[];
  half: 'lower' | 'upper';
  summary: string;
  detail: string;
  observe: string;
}

export const LINES: LineContent[] = [
  {
    line: 1,
    name: '探究者',
    english: 'Investigator',
    altNames: ['研究者'],
    half: 'lower',
    summary: '需要穩固的基礎才覺得安全。',
    detail:
      '體系描述第一爻傾向先弄清楚底層原理，資訊不足時容易不安。研究本身是建立安全感的方式，而不是拖延。',
    observe: '面對新的事物時，你是先查資料，還是先動手？資訊不夠時你的感覺如何？',
  },
  {
    line: 2,
    name: '隱士',
    english: 'Hermit',
    altNames: [],
    half: 'lower',
    summary: '有自然的天賦，需要獨處，也會被別人「叫出來」。',
    detail:
      '體系描述第二爻的能力常是自己沒有特別意識到的，別人卻看得見並前來邀請。獨處的時間被視為必要，而不是逃避。',
    observe: '別人說你擅長的事，你自己是否覺得「這沒什麼」？你多久需要一段不被打擾的時間？',
  },
  {
    line: 3,
    name: '烈士',
    english: 'Martyr',
    altNames: ['實驗者'],
    half: 'lower',
    summary: '透過嘗試與碰撞來學習，從「這樣不行」中找到可行的方法。',
    detail:
      '體系描述第三爻在試錯中累積經驗，事情出差錯被視為學習過程的一部分，而不是失敗。「烈士」一詞容易讓人誤會為犧牲，因此有些中文資料改譯為實驗者。',
    observe: '你學會一件事，多半是靠讀說明還是靠犯錯？犯錯之後你怎麼看待自己？',
  },
  {
    line: 4,
    name: '機會主義者',
    english: 'Opportunist',
    altNames: ['人脈者', '外交家'],
    half: 'upper',
    summary: '機會多半透過認識的人而來，人際網絡是重要的基礎。',
    detail:
      '體系描述第四爻的機會來自既有的關係網絡，而非陌生人；穩定的基礎讓他們較能面對改變。「機會主義者」在中文有貶義，體系原意並沒有。',
    observe: '你最近的幾個重要機會，是怎麼來的？來自朋友、同事，還是陌生人？',
  },
  {
    line: 5,
    name: '異端者',
    english: 'Heretic',
    altNames: ['異議者'],
    half: 'upper',
    summary: '別人容易把期待投射在他們身上，期待他們提出解方。',
    detail:
      '體系描述第五爻常被陌生人寄予期待，若提出的方案管用就受到讚揚，不管用時聲譽也容易受損。體系因此強調實際可行的解方與保持一定距離。',
    observe: '別人是否常在還不太認識你的時候，就期待你能幫忙解決問題？',
  },
  {
    line: 6,
    name: '典範',
    english: 'Role Model',
    altNames: ['人生典範'],
    half: 'upper',
    summary: '體系描述的人生分為三個階段，最後成為他人可參照的典範。',
    detail:
      '體系把第六爻的人生分為三段：約 30 歲前像第三爻一樣在試錯中學習；約 30 到 50 歲間「上到屋頂」較為抽離地觀察；約 50 歲後「下屋頂」，以身作則。這些年齡是體系中與土星回歸、凱龍星回歸相關的說法，屬體系主張。',
    observe: '回顧自己不同年齡的狀態，你的參與方式有沒有明顯的轉變？',
  },
];

export type ProfileGeometry = 'right' | 'juxtaposition' | 'left';

export const GEOMETRY_LABEL: Record<ProfileGeometry, { name: string; text: string }> = {
  right: { name: '右角度', text: '體系描述為較著重個人自身的人生歷程。' },
  juxtaposition: { name: '並列（交叉）', text: '只有 4/1，體系描述為有一條相對固定的路線。' },
  left: { name: '左角度', text: '體系描述為人生歷程較多牽涉與他人之間的互動。' },
};

export interface ProfileContent {
  id: string;
  conscious: number;
  unconscious: number;
  geometry: ProfileGeometry;
  note: string;
}

export const PROFILES: ProfileContent[] = [
  { id: '1/3', conscious: 1, unconscious: 3, geometry: 'right', note: '研究打底，再以嘗試驗證；兩者都偏向從自身經驗建立把握。' },
  { id: '1/4', conscious: 1, unconscious: 4, geometry: 'right', note: '有了穩固的知識基礎，再透過熟識的人際網絡分享出去。' },
  { id: '2/4', conscious: 2, unconscious: 4, geometry: 'right', note: '需要獨處的天賦，與重視熟人網絡的傾向並存，兩者之間需要找到節奏。' },
  { id: '2/5', conscious: 2, unconscious: 5, geometry: 'right', note: '不自覺的天賦，容易被陌生人投射期待，被叫出來的次數可能比預期多。' },
  { id: '3/5', conscious: 3, unconscious: 5, geometry: 'right', note: '從試錯中找出可行之道，別人也期待他們把這些方法帶出來。' },
  { id: '3/6', conscious: 3, unconscious: 6, geometry: 'right', note: '前半生的試錯經驗，日後成為觀察與示範的素材。' },
  { id: '4/6', conscious: 4, unconscious: 6, geometry: 'right', note: '人際網絡是基礎，同時經歷第六爻描述的三個人生階段。' },
  { id: '4/1', conscious: 4, unconscious: 1, geometry: 'juxtaposition', note: '唯一的並列人生角色，人際網絡與穩固基礎都很重要，體系描述其路線相對固定。' },
  { id: '5/1', conscious: 5, unconscious: 1, geometry: 'left', note: '承接他人的期待，並以扎實的研究作為能提出解方的後盾。' },
  { id: '5/2', conscious: 5, unconscious: 2, geometry: 'left', note: '被期待提出解方，但同時需要獨處的空間，兩者之間的張力是體系常談的主題。' },
  { id: '6/2', conscious: 6, unconscious: 2, geometry: 'left', note: '三階段的人生歷程，加上需要獨處、被叫出來的天賦。' },
  { id: '6/3', conscious: 6, unconscious: 3, geometry: 'left', note: '第六爻的前段本就像第三爻，加上潛意識的第三爻，試錯的經驗特別多。' },
];

export const PROFILE_INTRO = {
  summary:
    '人生角色由兩個數字組成，取自出生時（意識面，人格）與出生前約 88 天（潛意識面，設計）太陽所在閘門的爻位。',
  detail:
    '每個閘門有 6 條爻。體系用「意識太陽爻位／潛意識太陽爻位」組成人生角色，例如 1/3。這兩個數字的組合只有 12 種，是依幾何規則得來，不是 6×6 的任意搭配。爻位 1–3 屬下卦，體系描述為較向內、與自身有關；4–6 屬上卦，較向外、與他人有關。',
  caution:
    '人生角色描述的是體系所說的「扮演方式」，不是性格測驗結果。即使知道一個人的人生角色，也不能據此預測他的選擇或成就。個人排圖頁可以依出生資料算出人生角色，但出生時間誤差可能使結果改變。',
  verification: 'commonReference' as Verification,
};
