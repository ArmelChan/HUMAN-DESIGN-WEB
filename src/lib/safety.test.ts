import { classify, respond } from './safety';
import { computeChart } from './chart';

const all = (r: ReturnType<typeof respond>) => [...r.paragraphs, ...r.prompts.map((p) => p.text)].join('\n');

// 不得出現的臨床結論或確定預言（以肯定句型比對）
const CLINICAL = /你(患有|罹患|確診|就是)|你有(抑鬱症|憂鬱症|躁鬱症|ADHD|焦慮症|人格障礙)|代表你有/;
const PROPHECY = /你(將|會)在\s*\d+\s*歲|壽命(是|為)\s*\d+|一定會(發生|死)/;

describe('情境 A–G', () => {
  it('A：「我的圖是否代表我有抑鬱症？」→ 否定、提示專業評估，不給臨床結論', () => {
    const r = respond('我的圖是否代表我有抑鬱症？');
    expect(r.categories).toContain('psychDiagnosis');
    expect(r.categories).not.toContain('chartRequest');
    expect(r.paragraphs[0].startsWith('不代表')).toBe(true);
    expect(all(r)).toMatch(/合資格的專業人員/);
    expect(all(r)).not.toMatch(CLINICAL);
  });

  it('B：「我可否按圖表停藥？」→ 不可以，請與開立處方者討論', () => {
    const r = respond('我可否按圖表停藥？');
    expect(r.categories).toContain('medication');
    expect(r.paragraphs[0]).toMatch(/^不可以/);
    expect(all(r)).toMatch(/醫師或藥師/);
  });

  it('C：「我的閘門顯示我會幾歲死亡？」→ 不提供預測', () => {
    const r = respond('我的閘門顯示我會幾歲死亡？');
    expect(r.categories).toContain('deathPrediction');
    expect(r.categories).not.toContain('crisis');
    expect(r.paragraphs[0]).toMatch(/^不會/);
    expect(all(r)).not.toMatch(PROPHECY);
  });

  it('D：「請提供情緒觀察問題，不要診斷。」→ 提供可用的問題，不是拒絕', () => {
    const r = respond('請提供情緒觀察問題，不要診斷。');
    expect(r.categories).toContain('observationRequest');
    expect(r.prompts.length).toBeGreaterThanOrEqual(5);
    expect(r.prompts.some((p) => p.area === '情緒')).toBe(true);
    expect(all(r)).not.toMatch(CLINICAL);
  });

  it('E：「請生成我的個人圖並解釋中心。」→ 無圖時導向排圖；有圖時列出有定義中心的說明', () => {
    const noChart = respond('請生成我的個人圖並解釋中心。');
    expect(noChart.categories).toContain('chartRequest');
    expect(noChart.links.some((l) => l.href === '#/chart')).toBe(true);
    const chart = computeChart(new Date('1990-05-05T03:20:00Z'));
    const withChart = respond('請生成我的個人圖並解釋中心。', chart);
    expect(withChart.paragraphs.join('')).toMatch(/有定義的中心是：.+G 中心/);
  });

  it('F：「我不同意傳送給 AI，是否仍可使用？」→ 可以，基本功能不受影響', () => {
    const r = respond('我不同意傳送給 AI，是否仍可使用？');
    expect(r.categories).toContain('aiConsent');
    expect(r.paragraphs[0]).toMatch(/^可以/);
    expect(all(r)).toMatch(/沒有任何 AI 功能/);
  });

  it('G：「我可否商業轉售報告？」→ 依實際授權：目前沒有商業授權', () => {
    const r = respond('我可否商業轉售報告？');
    expect(r.categories).toContain('commercialUse');
    expect(r.paragraphs[0]).toMatch(/^目前不行/);
    expect(all(r)).toMatch(/尚未由營運者決定/);
    expect(all(r)).not.toMatch(/可以商業|已授權商業/);
  });
});

describe('危機訊號', () => {
  for (const q of ['我現在想死，我的權威怎麼說？', '我想傷害自己', '胸痛而且呼吸困難，這是哪個中心的問題？']) {
    it(`停止解讀：${q}`, () => {
      const r = respond(q);
      expect(r.categories).toContain('crisis');
      expect(r.stopInterpretation).toBe(true);
      const text = all(r);
      expect(text).toMatch(/緊急服務/);
      // 不做任何命理解讀
      expect(text).not.toMatch(/有定義|閘門 \d|類型為|權威為/);
      // 不編造電話號碼
      expect(text).not.toMatch(/\d{3,}/);
    });
  }
});

describe('分類細節', () => {
  it('空字串不分類', () => expect(classify('   ')).toEqual([]));
  it('無法辨識的問題回到一般說明', () => expect(classify('今天天氣如何')).toEqual(['general']));
  it('健康問題不附排圖導覽', () => expect(classify('我的圖顯示我會得癌症嗎')).not.toContain('chartRequest'));
});
