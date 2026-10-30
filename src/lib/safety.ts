// 提問指引：以固定規則辨識問題類別，回覆固定的安全內容。沒有使用任何語言模型。
// 這是關鍵字比對，會有漏判與誤判；它不取代專業協助，也不保證辨識出所有危機訊號。

import { CENTER_CONTENT } from '../data/content/centers';
import { CENTERS, CENTER_ORDER } from '../data/structure';
import { AREA_LABEL, GENERAL_PROMPTS, type ReflectionArea } from '../data/content/reflection';
import type { Chart } from './chart';

export type QuestionCategory =
  | 'crisis'
  | 'medication'
  | 'psychDiagnosis'
  | 'medicalDiagnosis'
  | 'deathPrediction'
  | 'majorDecision'
  | 'commercialUse'
  | 'aiConsent'
  | 'observationRequest'
  | 'chartRequest'
  | 'general';

interface Rule {
  category: QuestionCategory;
  pattern: RegExp;
}

// 順序即優先序：危機訊號永遠最先處理。
const RULES: Rule[] = [
  { category: 'crisis', pattern: /想死|不想活|自殺|輕生|結束(自己的)?生命|傷害自己|自殘|活不下去|割腕|跳樓|胸口劇痛|胸痛|呼吸困難|喘不過氣|昏倒|失去意識|中風|大量出血|suicid|kill myself/i },
  { category: 'medication', pattern: /停藥|減藥|換藥|加藥|藥量|劑量|吃藥|服藥|用藥|藥物|不吃藥|處方|medication|dose/i },
  { category: 'psychDiagnosis', pattern: /抑鬱|憂鬱|躁鬱|雙相|躁症|ADHD|過動|注意力不足|人格障礙|邊緣性人格|焦慮症|恐慌症|強迫症|自閉|亞斯|思覺失調|精神分裂|精神病|PTSD|創傷後壓力|飲食障礙|depress|bipolar|disorder/i },
  { category: 'deathPrediction', pattern: /(幾歲|何時|什麼時候|哪一年|哪年).{0,8}(死|過世|離世|走)|壽命|死亡|會不會死|意外身亡|災難|血光/ },
  { category: 'medicalDiagnosis', pattern: /癌|腫瘤|疾病|生病|病變|器官|荷爾蒙|內分泌|生育|不孕|懷孕|流產|健康風險|心臟病|糖尿病|血壓|免疫/ },
  { category: 'majorDecision', pattern: /離婚|分手|辭職|離職|投資|買房|賣房|手術|要不要(接受)?治療|移民|借錢/ },
  { category: 'commercialUse', pattern: /轉售|商業|商用|販售|賣給|出售|收費|再發布|重新發布|resell|commercial/i },
  { category: 'aiConsent', pattern: /\bAI\b|人工智慧|人工智能|外傳|傳送給|上傳|雲端/i },
  { category: 'observationRequest', pattern: /觀察問題|反思問題|自我觀察|反思|不要診斷|情緒觀察/ },
  { category: 'chartRequest', pattern: /排圖|生成.{0,6}圖|我的圖|個人圖|解釋.{0,6}中心|中心.{0,4}(意思|解釋)|bodygraph/i },
];

export interface SafetyResponse {
  categories: QuestionCategory[];
  /** 是否停止一切命理解讀（危機訊號）。 */
  stopInterpretation: boolean;
  paragraphs: string[];
  /** 可直接使用的反思問題（只在觀察類請求時提供）。 */
  prompts: { area: string; text: string }[];
  links: { label: string; href: string }[];
}

export function classify(question: string): QuestionCategory[] {
  const q = question.trim();
  if (!q) return [];
  let hits = RULES.filter((r) => r.pattern.test(q)).map((r) => r.category);
  // 問題涉及健康、心理、死亡或重大決定時，不同時附上排圖導覽，避免把界線回答和解讀混在一起。
  const sensitive: QuestionCategory[] = ['crisis', 'medication', 'psychDiagnosis', 'medicalDiagnosis', 'deathPrediction', 'majorDecision'];
  if (hits.some((h) => sensitive.includes(h))) hits = hits.filter((h) => h !== 'chartRequest');
  return hits.length ? hits : ['general'];
}

const NOT_DIAGNOSTIC =
  '人類圖的中心、通道、閘門與權威，是體系內的分類方式，沒有經過科學驗證，不能用來判斷任何人是否有身心疾病。';

export function respond(question: string, chart?: Chart | null): SafetyResponse {
  const categories = classify(question);
  const out: SafetyResponse = { categories, stopInterpretation: false, paragraphs: [], prompts: [], links: [] };
  if (categories.length === 0) {
    out.paragraphs.push('請先輸入你的問題。');
    return out;
  }

  if (categories.includes('crisis')) {
    out.stopInterpretation = true;
    out.paragraphs.push(
      '你描述的情況可能涉及即時的安全或身體危險。這時不適合用人類圖來解讀。',
      '請立即聯絡你所在地的緊急服務，或請身邊的人陪你一起求助。如果你正在考慮傷害自己，請現在就告訴一位你信任的人，並聯絡當地的危機支援或醫療服務。',
      '本站不知道你所在的地點，因此不提供特定的電話號碼；請使用你所在地官方公布的緊急求助方式。',
    );
    return out;
  }

  if (categories.includes('medication')) {
    out.paragraphs.push(
      '不可以。人類圖圖表不能作為開始、停止或調整任何藥物的依據。',
      '用藥的任何改變，請先和開立處方的醫師或藥師討論；自行停藥或改變劑量可能帶來風險。',
      '如果你對目前的治療有疑慮，可以把疑問寫下來，在下次回診時提出。',
    );
  }
  if (categories.includes('psychDiagnosis')) {
    out.paragraphs.push(
      '不代表。' + NOT_DIAGNOSTIC,
      '如果你擔心自己的情緒或心理狀態，請向精神科醫師、臨床心理師或其他合資格的專業人員尋求評估。本站的反思問題不是量表，也不能作為診斷。',
      '如果你想整理自己的感受，可以使用報告中的「自我觀察與反思」，它只用來記錄你的經驗，不給任何判定。',
    );
    out.links.push({ label: '一般心理健康教育', href: '#/chart' });
  }
  if (categories.includes('medicalDiagnosis')) {
    out.paragraphs.push(
      NOT_DIAGNOSTIC.replace('身心疾病', '疾病、疾病風險、生育或荷爾蒙狀態'),
      '體系把中心對應到某些器官或腺體，這是象徵性的說法，不是醫學事實。身體的疑慮請向醫療人員求助，不要因為圖表而延誤就醫。',
    );
  }
  if (categories.includes('deathPrediction')) {
    out.paragraphs.push(
      '不會。人類圖的閘門、通道或任何元素都不能預測壽命、死亡時間、疾病或災難，本站也不提供這類預測。',
      '體系中與年齡有關的說法（例如第六爻的人生階段）是象徵性的描述，不是對事件的預言。',
    );
  }
  if (categories.includes('majorDecision')) {
    out.paragraphs.push(
      '這類重大決定不應單憑人類圖做出。體系的策略與權威可以作為整理自己想法的一種角度，但請同時考慮實際的資訊、相關的人，以及醫療、法律或財務等專業意見。',
    );
  }
  if (categories.includes('commercialUse')) {
    out.paragraphs.push(
      '目前不行。報告的個人保存、列印與分享在使用條款草稿中允許；商業轉售或商業再發布的權限尚未由營運者決定，因此現在沒有任何商業授權。',
      '報告中也含有第三方的名稱、規則資料與開源授權內容，這些部分的權利屬於各自的權利人，本站條款無法代為授權。',
    );
    out.links.push({ label: '版權與使用指引', href: '#/copyright' });
  }
  if (categories.includes('aiConsent')) {
    out.paragraphs.push(
      '可以。本站目前沒有任何 AI 功能，也不會把你的出生資料或反思內容傳送給 AI 或其他第三方。排圖與報告全部在你的瀏覽器內計算，不需要任何外傳同意。',
      '如果日後加入 AI 功能，會另外說明接收者、傳送的欄位與用途，並讓你選擇不使用；不使用 AI 時，基本排圖仍然可用。',
    );
    out.links.push({ label: '隱私聲明', href: '#/privacy' });
  }
  if (categories.includes('observationRequest')) {
    out.paragraphs.push('以下是一些觀察問題。它們不計分，也不會得出任何判定；請只記錄你實際的經驗，包括不符合的例子。');
    for (const area of Object.keys(GENERAL_PROMPTS) as ReflectionArea[]) {
      for (const text of GENERAL_PROMPTS[area]) out.prompts.push({ area: AREA_LABEL[area], text });
    }
    out.prompts.push({ area: AREA_LABEL.emotion, text: CENTER_CONTENT.solarPlexus.observe[0] });
  }
  if (categories.includes('chartRequest')) {
    if (chart) {
      const defined = CENTER_ORDER.filter((id) => chart.derivation.centerStates[id] === 'defined');
      out.paragraphs.push(
        `依你目前的排圖結果，有定義的中心是：${defined.map((id) => CENTERS[id].name).join('、') || '無'}。`,
        ...defined.slice(0, 4).map((id) => `${CENTERS[id].name}（有定義）：${CENTER_CONTENT[id].defined}`),
        '完整的中心說明在下方報告的「人類圖體系解釋」，也可以直接點圖上的中心查看。',
      );
    } else {
      out.paragraphs.push(
        '可以。請到「個人排圖」輸入出生日期、時間準確程度與出生地時區；計算在你的瀏覽器內完成。產生後，點選圖上的中心即可看到該中心在你圖中的狀態與說明。',
      );
      out.links.push({ label: '前往個人排圖', href: '#/chart' });
    }
  }
  if (categories.includes('general')) {
    out.paragraphs.push(
      '這個提問指引只能辨識幾類常見問題，例如排圖、反思、AI 與隱私、授權、以及健康與心理相關的界線。你的問題可能需要查閱相關頁面。',
    );
    out.links.push({ label: '人類圖入門', href: '#/intro' }, { label: '使用條款', href: '#/terms' });
  }
  return out;
}
