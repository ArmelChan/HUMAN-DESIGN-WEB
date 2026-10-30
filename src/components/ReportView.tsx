// 七段式個人報告。限制與來源兩段不收合，必要提示在結果頁與匯出檔都會出現。

import { useEffect, useState } from 'react';
import { LayerTag } from './Common';
import { AREA_LABEL, type ReflectionArea } from '../data/content/reflection';
import { EDUCATION_SOURCES } from '../data/content/education';
import type { Report } from '../lib/report';
import { ANSWER_LABEL, BIRTH_DATA_WARNING, USAGE_NOTE, reportToHtml, reportToText, type ReflectionAnswer, type ReflectionEntry } from '../lib/exportReport';
import type { Provenance } from '../lib/chart';
import type { Selection } from '../lib/selection';
import { coverSvg, type CoverModel } from '../lib/reportCover';
import { SAVE_MESSAGE, platformDownloads, saveFile } from '../lib/saveFile';
import { ReportCover } from '../figures/ReportCover';
import { CenterGlyph, GlyphLegend } from '../figures/CenterGlyph';

interface Props {
  report: Report;
  reflection: Record<string, ReflectionEntry>;
  onReflection: (id: string, entry: ReflectionEntry) => void;
  onSelect: (sel: Selection) => void;
  provenance: Provenance | null;
  birthSummary: string;
  cover: CoverModel;
}

const SECTIONS = [
  ['rep-calc', '1. 圖表計算結果'],
  ['rep-system', '2. 人類圖體系解釋'],
  ['rep-reflect', '3. 自我觀察與反思'],
  ['rep-health', '4. 一般健康與心理教育'],
  ['rep-direction', '5. 象徵性人生方向'],
  ['rep-limits', '6. 計算與解讀限制'],
  ['rep-sources', '7. 來源與版權'],
] as const;

const EMPTY_ENTRY: ReflectionEntry = { answer: null, example: '', counterExample: '' };

export function ReportView({ report, reflection, onReflection, onSelect, provenance, birthSummary, cover }: Props) {
  const areas: ReflectionArea[] = ['emotion', 'relationship', 'work', 'direction'];
  const answered = report.reflection.filter((p) => reflection[p.id]?.answer).length;
  const disagreed = report.reflection.filter((p) => reflection[p.id]?.answer === 'disagree').length;

  const showOnGraph = (centerId: string | undefined) => {
    if (!centerId) return;
    onSelect({ kind: 'center', id: centerId as never });
    document.getElementById('result-graph')?.scrollIntoView({ block: 'start' });
  };

  return (
    <section className="section report" aria-labelledby="report-h">
      <h2 id="report-h">個人報告</h2>
      <ReportCover model={cover} />
      <p className="report-notice">{report.notice}</p>
      <nav className="report-nav" aria-label="報告段落">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#/chart#${id}`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ block: 'start' });
          }}>
            {label}
          </a>
        ))}
      </nav>

      <section id="rep-calc" className="report-part" aria-labelledby="rep-calc-h">
        <h3 id="rep-calc-h">1. 圖表計算結果</h3>
        <dl className="facts">
          {report.calculation.map((i) => (
            <div key={i.id}>
              <dt>{i.heading}</dt>
              <dd>
                {i.text}
                <span className="muted small"> 依據：{i.basis}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="rep-system" className="report-part" aria-labelledby="rep-system-h">
        <h3 id="rep-system-h">
          2. 人類圖體系解釋 <LayerTag layer="system" />
        </h3>
        <p className="muted small">以下是人類圖體系的說法，依你圖中的元素選出；它們沒有經過科學驗證。有些描述也適用於許多人，請對照自己的經驗判斷。</p>
        <GlyphLegend />
        {report.system.map((i) => (
          <article key={i.id} className={`report-item${i.centerId ? ' has-glyph' : ''}`}>
            {i.centerId && <CenterGlyph id={i.centerId} state={i.centerStatus ?? 'neutral'} width={44} />}
            <h4>{i.heading}</h4>
            <p>{i.text}</p>
            <p className="muted small">
              依據：{i.basis} <LayerTag layer={i.layer} />
              {i.centerId && (
                <button type="button" className="inline-link" onClick={() => showOnGraph(i.centerId)}>
                  在圖上查看
                </button>
              )}
            </p>
          </article>
        ))}
      </section>

      <section id="rep-reflect" className="report-part" aria-labelledby="rep-reflect-h">
        <h3 id="rep-reflect-h">
          3. 自我觀察與反思 <LayerTag layer="editorial" />
        </h3>
        <p className="muted">
          這些問題不計分、不是心理量表，也不會得出任何判定。你可以選擇「符合」「不符合」或「不確定」，並記下例子或反例。你的回應不會改變計算結果，也不會讓報告變得更「準」。
        </p>
        <p className="muted small" role="status" aria-live="polite">
          已回應 {answered}／{report.reflection.length} 題
          {disagreed > 0 && `；其中 ${disagreed} 題你認為不符合，這是有用的資訊，不代表你或圖表有錯`}。
        </p>
        {areas.map((area) => (
          <div key={area} className="reflect-area">
            <h4>{AREA_LABEL[area]}</h4>
            {report.reflection
              .filter((p) => p.area === area)
              .map((p) => {
                const e = reflection[p.id] ?? EMPTY_ENTRY;
                return (
                  <fieldset key={p.id} className="reflect-item">
                    <legend>{p.text}</legend>
                    <p className="muted small">依據：{p.basis}</p>
                    <div className="reflect-answers" role="radiogroup" aria-label="這題是否符合你的經驗">
                      {(Object.keys(ANSWER_LABEL) as ReflectionAnswer[]).map((a) => (
                        <label key={a} className="radio-pill">
                          <input
                            type="radio"
                            name={`r-${p.id}`}
                            checked={e.answer === a}
                            onChange={() => onReflection(p.id, { ...e, answer: a })}
                          />
                          {ANSWER_LABEL[a]}
                        </label>
                      ))}
                    </div>
                    <label className="note">
                      例子
                      <textarea rows={2} value={e.example} onChange={(ev) => onReflection(p.id, { ...e, example: ev.target.value })} />
                    </label>
                    <label className="note">
                      反例
                      <textarea rows={2} value={e.counterExample} onChange={(ev) => onReflection(p.id, { ...e, counterExample: ev.target.value })} />
                    </label>
                  </fieldset>
                );
              })}
          </div>
        ))}
        <p className="muted small">請不要在這裡寫下你不想保存的病歷、診斷或用藥資料；本站不需要這些資訊。</p>
      </section>

      <section id="rep-health" className="report-part" aria-labelledby="rep-health-h">
        <h3 id="rep-health-h">
          4. 一般健康與心理教育 <LayerTag layer="science" />
        </h3>
        <p className="callout callout-caution">{report.health.chartBoundary}</p>
        <p>{report.health.intro}</p>
        {report.health.practices.length > 0 && (
          <ul>
            {report.health.practices.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        {report.health.mentalHealth && <p>{report.health.mentalHealth}</p>}
        <h4>什麼時候求助</h4>
        <ul>
          {report.health.seekHelp.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {report.health.bodyClaims.length > 0 && (
          <details className="more">
            <summary>人類圖的身體對應：體系主張，不是醫學事實（9 項）</summary>
            <ul>
              {report.health.bodyClaims.map((b) => (
                <li key={b.centerId}>{b.text}</li>
              ))}
            </ul>
          </details>
        )}
        <p className="muted small">
          資料來源：{EDUCATION_SOURCES.map((s) => (
            <span key={s.url}>
              {' '}
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.publisher}〈{s.title}〉
              </a>
              （查核 {s.checkedAt}）
            </span>
          ))}
        </p>
      </section>

      <section id="rep-direction" className="report-part" aria-labelledby="rep-direction-h">
        <h3 id="rep-direction-h">
          5. 象徵性人生方向 <LayerTag layer="editorial" />
        </h3>
        {report.direction.map((i) => (
          <article key={i.id} className="report-item">
            <h4>{i.heading}</h4>
            <p>{i.text}</p>
          </article>
        ))}
      </section>

      <section id="rep-limits" className="report-part report-always" aria-labelledby="rep-limits-h">
        <h3 id="rep-limits-h">6. 計算與解讀限制</h3>
        <ul>
          {report.limits.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p>
          詳見<a href="#/verification">計算驗證</a>。
        </p>
      </section>

      <section id="rep-sources" className="report-part report-always" aria-labelledby="rep-sources-h">
        <h3 id="rep-sources-h">7. 來源與版權</h3>
        <ul className="small">
          {report.sources.map((s) => (
            <li key={s.label}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}</li>
          ))}
        </ul>
        <p className="small">{USAGE_NOTE}</p>
        <p className="small">
          詳見<a href="#/copyright">版權與使用指引</a>與<a href="#/sources">來源頁的第三方元件授權</a>。
        </p>
      </section>

      <ExportPanel report={report} reflection={reflection} provenance={provenance} birthSummary={birthSummary} cover={cover} />
    </section>
  );
}

function ExportPanel({
  report,
  reflection,
  provenance,
  birthSummary,
  cover,
}: {
  report: Report;
  reflection: Record<string, ReflectionEntry>;
  provenance: Provenance | null;
  birthSummary: string;
  cover: CoverModel;
}) {
  const [title, setTitle] = useState('');
  const [includeReflection, setIncludeReflection] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState('');
  const opts = () => ({
    title,
    includeReflection,
    reflection,
    provenance,
    birthSummary,
    generatedAt: new Date(),
    coverSvg: coverSvg({ ...cover, title: title.trim() || cover.title }),
  });

  const [canSave, setCanSave] = useState(true);
  const [saving, setSaving] = useState(false);
  // 先確認是否在 claude.ai 檢視器中；這一步不會跳出提示
  useEffect(() => {
    void platformDownloads();
  }, []);

  const download = async () => {
    setSaving(true);
    setStatus('正在準備下載…');
    const outcome = await saveFile('human-design-report.html', reportToHtml(report, opts()), 'text/html;charset=utf-8');
    if (outcome === 'unavailable') setCanSave(false);
    setStatus(SAVE_MESSAGE[outcome]);
    setSaving(false);
  };
  const copy = async () => {
    const text = reportToText(report, opts());
    try {
      await navigator.clipboard.writeText(text);
      setStatus('已複製報告純文字。');
    } catch {
      setStatus('無法自動複製。');
    }
  };

  return (
    <section className="report-part export" aria-labelledby="export-h">
      <h3 id="export-h">匯出報告</h3>
      <p className="form-error">{BIRTH_DATA_WARNING}匯出的檔案會保留報告開頭與結尾的聲明、計算限制、驗證狀態、來源與使用範圍。</p>
      <label className="field">
        報告標題（可選，只出現在檔首，不影響內容）
        <input id="export-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="人類圖個人報告" />
      </label>
      <label className="check-line">
        <input id="export-reflection" type="checkbox" checked={includeReflection} onChange={(e) => setIncludeReflection(e.target.checked)} />
        包含我的反思回應與筆記
      </label>
      <label className="check-line">
        <input id="export-confirm" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        我了解匯出內容含有出生資料{includeReflection ? '與我的反思筆記' : ''}
      </label>
      <div className="form-actions">
        {canSave && (
          <button id="export-download" type="button" className="btn" disabled={!confirmed || saving} onClick={download}>
            下載 HTML 報告
          </button>
        )}
        <button type="button" className="btn btn-quiet" disabled={!confirmed} onClick={copy}>
          複製純文字
        </button>
      </div>
      <p className="muted small" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
