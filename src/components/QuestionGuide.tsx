import { useState, type FormEvent } from 'react';
import { respond, type SafetyResponse } from '../lib/safety';
import type { Chart } from '../lib/chart';

const EXAMPLES = [
  '我的圖是否代表我有抑鬱症？',
  '我可否按圖表停藥？',
  '我的閘門顯示我會幾歲死亡？',
  '請提供情緒觀察問題，不要診斷。',
  '請生成我的個人圖並解釋中心。',
  '我不同意傳送給 AI，是否仍可使用？',
  '我可否商業轉售報告？',
];

export function QuestionGuide({ chart, headingId = 'ask-h' }: { chart?: Chart | null; headingId?: string }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<SafetyResponse | null>(null);

  const ask = (text: string) => {
    setQ(text);
    setRes(respond(text, chart));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  return (
    <section className="section question-guide" aria-labelledby={headingId}>
      <h2 id={headingId}>提問指引</h2>
      <p className="muted">
        以固定規則辨識幾類常見問題並給出固定回覆，沒有使用 AI，問題也不會傳送或保存。它可能辨識錯誤，不能取代專業協助。
      </p>
      <form onSubmit={submit} className="ask-form">
        <label htmlFor={`${headingId}-input`}>你的問題</label>
        <textarea id={`${headingId}-input`} rows={2} value={q} onChange={(e) => setQ(e.target.value)} placeholder="例如：我的權威是什麼意思？" />
        <button type="submit" className="btn">
          查看回覆
        </button>
      </form>
      <div className="pill-row" role="group" aria-label="範例問題">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="pill" onClick={() => ask(ex)}>
            {ex}
          </button>
        ))}
      </div>
      {res && (
        <div className={`ask-answer${res.stopInterpretation ? ' is-crisis' : ''}`} role="status" aria-live="polite">
          {res.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {res.prompts.length > 0 && (
            <ul>
              {res.prompts.map((p) => (
                <li key={p.text}>
                  <span className="chip">{p.area}</span> {p.text}
                </li>
              ))}
            </ul>
          )}
          {res.links.length > 0 && (
            <p className="pill-row">
              {res.links.map((l) => (
                <a key={l.href + l.label} className="pill" href={l.href}>
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
