import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Explorer } from '../components/Explorer';
import { Callout } from '../components/Common';
import { ConsentPanel } from '../components/ConsentPanel';
import { ReportView } from '../components/ReportView';
import { QuestionGuide } from '../components/QuestionGuide';
import { ActivationTable, ProvenanceView, SensitivityView, SubdivisionTable } from '../components/ChartDetails';
import type { PersonalContext } from '../components/DetailPanel';
import { computeChart, sensitivity, type Chart, type SensitivityReport } from '../lib/chart';
import { computeDayRange, type DayRangeResult } from '../lib/dayRange';
import { buildReport, isMinorOn, type Report } from '../lib/report';
import { BODY_LABEL, NODE_MODE_LABEL } from '../lib/ephemeris';
import { COMMON_ZONES, allTimeZones, formatOffset, localToUtc, localToUtcFixed, type Conversion, type LocalDateTime } from '../lib/timezone';
import {
  STORAGE_KEYS,

  browserStore,
  clearAll,
  makeRecord,
  needsAcceptance,
  readConsent,
  writeConsent,
  type ConsentRecord,
} from '../lib/consent';
import type { ReflectionEntry } from '../lib/exportReport';
import { DISCLAIMER } from '../data/disclaimer';
import { MANDALA_RULES } from '../data/rules/mandala';
import { AUTHORITIES, TYPES } from '../data/content/types';
import { LINES } from '../data/content/profiles';
import { CENTERS, CENTER_ORDER, type CenterId } from '../data/structure';
import type { CenterState, DefinitionKind } from '../lib/derive';
import type { Selection } from '../lib/selection';

type TimeMode = 'exact' | 'approx' | 'dateOnly';

const MODE_LABEL: Record<TimeMode, string> = {
  exact: '精確：知道到分鐘的出生時間（例如出生證明）',
  approx: '約略：只記得大概的時間',
  dateOnly: '只知道日期：不知道出生時間',
};

const UNCERTAINTY = [15, 30, 60, 120] as const;

interface FormState {
  date: string;
  time: string;
  mode: TimeMode;
  uncertainty: number;
  zoneMode: 'zone' | 'offset';
  tz: string;
  offset: string;
}

const EMPTY: FormState = { date: '', time: '', mode: 'exact', uncertainty: 30, zoneMode: 'zone', tz: 'Asia/Taipei', offset: '+08:00' };

const DEFINITION_LABEL: Record<DefinitionKind, string> = {
  none: '無定義',
  single: '一分人（單一定義）',
  split: '二分人',
  tripleSplit: '三分人',
  quadrupleSplit: '四分人',
};

function parseOffset(s: string): number | null {
  const m = s.trim().match(/^([+-−])?(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return null;
  const sign = m[1] === '-' || m[1] === '−' ? -1 : 1;
  const h = Number(m[2]);
  const min = Number(m[3] ?? 0);
  if (h > 14 || min > 59) return null;
  return sign * (h * 60 + min);
}

const utcText = (d: Date) => `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
const pad = (n: number) => String(n).padStart(2, '0');

type Result =
  | {
      kind: 'chart';
      chart: Chart;
      meanChart: Chart;
      sensitivity: SensitivityReport | null;
      local: LocalDateTime;
      zoneText: string;
      offsetMinutes: number;
      report: Report;
    }
  | { kind: 'day'; day: DayRangeResult; zoneText: string; report: Report };

function readJson<T>(key: string): T | null {
  const store = browserStore();
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    browserStore()?.setItem(key, JSON.stringify(value));
  } catch {
    /* 無法保存時不影響使用 */
  }
}

/** 依目前的表單內容換算 UTC，供即時預覽與送出共用。 */
function convertForm(form: FormState): { conv: Conversion | null; local: LocalDateTime | null; problem: string | null } {
  if (!form.date) return { conv: null, local: null, problem: null };
  if (form.mode !== 'dateOnly' && !form.time) return { conv: null, local: null, problem: null };
  const [year, month, day] = form.date.split('-').map(Number);
  const [hour, minute] = form.mode === 'dateOnly' ? [0, 0] : form.time.split(':').map(Number);
  const local = { year, month, day, hour, minute };
  if (form.zoneMode === 'zone') return { conv: localToUtc(local, form.tz), local, problem: null };
  const off = parseOffset(form.offset);
  if (off === null) return { conv: null, local, problem: '時差格式不正確，請輸入像 +08:00 或 -05:00 的格式。' };
  return { conv: localToUtcFixed(local, off), local, problem: null };
}

export function ChartPage() {
  const initial = useMemo(() => {
    const record = readConsent(browserStore());
    const input = readJson<Partial<FormState>>(STORAGE_KEYS.input);
    const reflection = readJson<Record<string, ReflectionEntry>>(STORAGE_KEYS.reflection);
    return { record, input, reflection, anySaved: Boolean(record || input || reflection) };
  }, []);

  const [form, setForm] = useState<FormState>({ ...EMPTY, ...(initial.input ?? {}) });
  const [record, setRecord] = useState<ConsentRecord | null>(initial.record && !needsAcceptance(initial.record) ? initial.record : null);
  const outdatedVersion = initial.record && needsAcceptance(initial.record) ? initial.record.termsVersion : null;
  const [termsChecked, setTermsChecked] = useState(false);
  const [localSave, setLocalSave] = useState(initial.anySaved);
  const [reflection, setReflection] = useState<Record<string, ReflectionEntry>>(initial.reflection ?? {});
  const [error, setError] = useState('');
  const [ambiguous, setAmbiguous] = useState<Extract<Conversion, { kind: 'ambiguous' }> | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [showAllZones, setShowAllZones] = useState(false);
  const [clearStatus, setClearStatus] = useState('');

  const zones = useMemo(() => (showAllZones ? allTimeZones() : []), [showAllZones]);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const preview = useMemo(() => convertForm(form), [form]);

  // 本機保存：勾選時寫入，取消勾選時立即刪除。
  useEffect(() => {
    if (!localSave) {
      clearAll(browserStore());
      return;
    }
    writeJson(STORAGE_KEYS.input, form);
    writeJson(STORAGE_KEYS.reflection, reflection);
    if (record) writeConsent(browserStore(), record);
  }, [localSave, form, reflection, record]);

  const zoneText = form.zoneMode === 'zone' ? form.tz : '自訂時差';
  const minor = form.date ? isMinorOn(form.date, new Date()) : false;

  const runChart = (utc: Date, offsetMinutes: number, local: LocalDateTime) => {
    const chart = computeChart(utc, 'osculating');
    chart.provenance.input = {
      localDateTime: `${local.year}-${pad(local.month)}-${pad(local.day)} ${pad(local.hour)}:${pad(local.minute)}`,
      zone: zoneText,
      offset: formatOffset(offsetMinutes),
      precision: form.mode === 'approx' ? `約略（±${form.uncertainty} 分鐘）` : '精確',
    };
    const sens = form.mode === 'approx' ? sensitivity(utc, form.uncertainty) : null;
    const report =
      form.mode === 'approx' && sens
        ? buildReport({ mode: 'approx', chart, uncertaintyMinutes: form.uncertainty, sensitivity: sens }, { subjectIsMinor: minor })
        : buildReport({ mode: 'exact', chart }, { subjectIsMinor: minor });
    setResult({ kind: 'chart', chart, meanChart: computeChart(utc, 'mean'), sensitivity: sens, local, zoneText, offsetMinutes, report });
    finish();
  };

  const finish = () => {
    setSelection(null);
    setAmbiguous(null);
    window.setTimeout(() => document.getElementById('result')?.scrollIntoView(), 0);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAmbiguous(null);
    if (!record && !termsChecked) {
      setError('請先閱讀使用條款，並勾選「我已閱讀並同意使用條款」。');
      return;
    }
    if (!form.date) {
      setError('請輸入出生日期。');
      return;
    }
    if (form.mode !== 'dateOnly' && !form.time) {
      setError('請輸入出生時間；如果不知道，請選擇「只知道日期」。');
      return;
    }
    const { conv, problem } = preview;
    if (problem) {
      setError(problem);
      return;
    }
    if (!conv) return;
    if (!record) setRecord(makeRecord(new Date()));
    try {
      if (form.mode === 'dateOnly') {
        if (conv.kind === 'invalid') {
          setError(conv.reason);
          return;
        }
        const off = form.zoneMode === 'offset' ? parseOffset(form.offset)! : undefined;
        const day = computeDayRange(form.date, form.tz, off);
        setResult({ kind: 'day', day, zoneText, report: buildReport({ mode: 'dateOnly', day }, { subjectIsMinor: minor }) });
        finish();
        return;
      }
      if (conv.kind === 'invalid') setError(conv.reason);
      else if (conv.kind === 'nonexistent')
        setError('這個時刻在該時區不存在（夏令時間開始時，時鐘會直接跳過一段時間）。請確認出生時間，或改用「自訂時差」輸入當時的時差。');
      else if (conv.kind === 'ambiguous') setAmbiguous(conv);
      else runChart(conv.utc, conv.offsetMinutes, preview.local!);
    } catch (err) {
      setError(`計算時發生錯誤：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const clearDevice = () => {
    const removed = clearAll(browserStore());
    setForm(EMPTY);
    setReflection({});
    setResult(null);
    setRecord(null);
    setTermsChecked(false);
    setLocalSave(false);
    setSelection(null);
    setClearStatus(removed.length ? `已刪除這台裝置上的 ${removed.length} 項本站資料，並清空目前畫面。` : '這台裝置上沒有本站保存的資料；目前畫面已清空。');
    window.scrollTo(0, 0);
  };

  return (
    <div className="page page-wide">
      <div className="intro-strip">
        <h1>
          個人排圖
          <span className="h1-sub">依出生時間計算行星位置，再依人類圖規則推導</span>
        </h1>
        <p>
          輸入出生日期、時間的準確程度與出生地的時區，網站會在你的瀏覽器內計算出生時（人格）與太陽回推 88°時（設計）共 26 個啟動點，再依體系規則推導類型、內在權威與人生角色。計算使用固定的天文演算法與規則表，同樣的輸入一定得到同樣的結果。
        </p>
      </div>

      <Callout title="使用前說明">
        <p>{DISCLAIMER}</p>
      </Callout>

      <form className="chart-form" onSubmit={submit} noValidate aria-labelledby="form-h">
        <h2 id="form-h">出生資料</h2>
        <div className="form-grid">
          <label>
            出生日期
            <input id="birth-date" type="date" min="1900-01-01" max="2100-12-31" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </label>
        </div>

        <fieldset className="zone-field">
          <legend>出生時間的準確程度</legend>
          {(Object.keys(MODE_LABEL) as TimeMode[]).map((m) => (
            <label key={m} className="radio">
              <input type="radio" name="timeMode" checked={form.mode === m} onChange={() => set('mode', m)} />
              {MODE_LABEL[m]}
            </label>
          ))}
          {form.mode !== 'dateOnly' && (
            <div className="form-grid indent">
              <label>
                出生時間（當地時間，24 小時制）
                <input id="birth-time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
              </label>
              {form.mode === 'approx' && (
                <label>
                  可能的誤差
                  <select id="uncertainty" value={form.uncertainty} onChange={(e) => set('uncertainty', Number(e.target.value))}>
                    {UNCERTAINTY.map((u) => (
                      <option key={u} value={u}>
                        ±{u} 分鐘
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          {form.mode === 'dateOnly' && (
            <p className="hint indent">
              不會以任何預設時間（例如中午）代表你的出生時間。網站會計算這一天當地每 30 分鐘的結果，只顯示全天都相同的部分；會隨時間改變的項目一律標示「無法確定」。
            </p>
          )}
        </fieldset>

        <fieldset className="zone-field">
          <legend>出生地時區</legend>
          <label className="radio">
            <input type="radio" name="zoneMode" checked={form.zoneMode === 'zone'} onChange={() => set('zoneMode', 'zone')} />
            依地區（自動處理當時的夏令時間）
          </label>
          {form.zoneMode === 'zone' && (
            <div className="zone-pick">
              <select aria-label="時區" value={form.tz} onChange={(e) => set('tz', e.target.value)}>
                <optgroup label="常用">
                  {COMMON_ZONES.map((z) => (
                    <option key={z.tz} value={z.tz}>
                      {z.label}（{z.tz}）
                    </option>
                  ))}
                </optgroup>
                {showAllZones && (
                  <optgroup label="全部時區">
                    {zones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </optgroup>
                )}
                {!COMMON_ZONES.some((z) => z.tz === form.tz) && !showAllZones && <option value={form.tz}>{form.tz}</option>}
              </select>
              {!showAllZones && (
                <button type="button" className="btn btn-quiet" onClick={() => setShowAllZones(true)}>
                  顯示全部時區
                </button>
              )}
            </div>
          )}
          <label className="radio">
            <input type="radio" name="zoneMode" checked={form.zoneMode === 'offset'} onChange={() => set('zoneMode', 'offset')} />
            自訂時差（已知出生當時與 UTC 的確切時差）
          </label>
          {form.zoneMode === 'offset' && (
            <input className="offset-input" aria-label="與 UTC 的時差" value={form.offset} placeholder="+08:00" onChange={(e) => set('offset', e.target.value)} />
          )}
          <p className="hint">
            人類圖只用到出生時刻，出生地只用來決定時區，不需要經緯度，也不會保存地名。1970 年以前部分地區的時區紀錄可能不完整，若你知道當時的確切時差，用「自訂時差」較可靠。
          </p>
        </fieldset>

        <UtcPreview form={form} preview={preview} />

        <ConsentPanel
          record={record}
          outdatedVersion={outdatedVersion}
          termsChecked={termsChecked}
          onTermsChecked={setTermsChecked}
          localSave={localSave}
          onLocalSave={setLocalSave}
        />

        {minor && (
          <p className="hint" role="status">
            依輸入的出生日期，報告對象未滿 18 歲：報告不提供一般健康與心理教育的延伸內容，建議與家長、監護人或學校輔導人員一起閱讀。這是依日期作的產品限制，不是年齡驗證。
          </p>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {ambiguous && (
          <div className="ambiguous" role="alert">
            <p>這個當地時間在該時區出現了兩次（夏令時間結束時，時鐘會倒回一小時）。請選擇出生時使用的時差：</p>
            <div className="pill-row">
              {ambiguous.options.map((o) => (
                <button key={o.offsetMinutes} type="button" className="btn btn-quiet" onClick={() => runChart(o.utc, o.offsetMinutes, preview.local!)}>
                  {formatOffset(o.offsetMinutes)}（{utcText(o.utc)}）
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn" id="generate">
            產生圖表與報告
          </button>
        </div>
      </form>

      {result?.kind === 'chart' && (
        <ChartResult result={result} selection={selection} onSelect={setSelection} reflection={reflection} onReflection={(id, e) => setReflection((r) => ({ ...r, [id]: e }))} />
      )}
      {result?.kind === 'day' && (
        <DayResult result={result} selection={selection} onSelect={setSelection} reflection={reflection} onReflection={(id, e) => setReflection((r) => ({ ...r, [id]: e }))} />
      )}

      <section className="section data-controls" aria-labelledby="data-h">
        <h2 id="data-h">管理你的資料</h2>
        <p>
          目前{localSave ? '已勾選在這台裝置保存：出生資料、反思筆記與條款接受紀錄會保存在這個瀏覽器中。' : '沒有在這台裝置保存任何資料；關閉頁面後就不保留。'}
          本站不會把這些資料傳送到任何地方，詳見<a href="#/privacy">隱私聲明</a>。
        </p>
        <button type="button" className="btn btn-quiet" id="clear-device" onClick={clearDevice}>
          清除這台裝置上的資料
        </button>
        <p className="muted small" role="status" aria-live="polite">
          {clearStatus}
        </p>
      </section>
    </div>
  );
}

function UtcPreview({ form, preview }: { form: FormState; preview: ReturnType<typeof convertForm> }) {
  let text = '輸入出生日期與時間後，這裡會即時顯示換算成 UTC 的結果。';
  let tone = 'muted';
  const { conv, problem } = preview;
  if (problem) {
    text = problem;
    tone = 'warn';
  } else if (conv) {
    if (conv.kind === 'invalid') {
      text = conv.reason;
      tone = 'warn';
    } else if (form.mode === 'dateOnly') {
      text = `會計算 ${form.date} 當地 00:00 到 23:30，每 30 分鐘一個時刻（${form.zoneMode === 'zone' ? form.tz : form.offset}）。`;
    } else if (conv.kind === 'nonexistent') {
      text = '這個時刻在該時區不存在（夏令時間開始時被跳過）。';
      tone = 'warn';
    } else if (conv.kind === 'ambiguous') {
      text = `這個時刻在該時區出現兩次：${conv.options.map((o) => `${formatOffset(o.offsetMinutes)} → ${utcText(o.utc)}`).join('，或 ')}。送出後請選擇其一。`;
      tone = 'warn';
    } else {
      text = `${form.date} ${form.time}（${form.zoneMode === 'zone' ? form.tz : '自訂時差'}，${formatOffset(conv.offsetMinutes)}）→ ${utcText(conv.utc)}`;
      if (form.mode === 'approx') text += `；誤差範圍 ±${form.uncertainty} 分鐘`;
    }
  }
  return (
    <div className={`utc-preview tone-${tone}`} role="status" aria-live="polite" id="utc-preview">
      <strong>UTC 換算預覽：</strong>
      {text}
    </div>
  );
}

interface ResultProps<R> {
  result: R;
  selection: Selection;
  onSelect: (s: Selection) => void;
  reflection: Record<string, ReflectionEntry>;
  onReflection: (id: string, e: ReflectionEntry) => void;
}

function ChartResult({ result, selection, onSelect, reflection, onReflection }: ResultProps<Extract<Result, { kind: 'chart' }>>) {
  const { chart, meanChart, local, zoneText, offsetMinutes, report } = result;
  const d = chart.derivation;
  const t = TYPES[d.type];
  const a = AUTHORITIES[d.authority];
  const p = chart.profile;
  const activeGates = useMemo(() => new Set(chart.gateSources.keys()), [chart]);
  const personal = useMemo<PersonalContext>(() => {
    const gateActivations = new Map<number, string[]>();
    for (const side of ['personality', 'design'] as const) {
      for (const x of chart[side]) {
        const list = gateActivations.get(x.gate) ?? [];
        list.push(`${side === 'personality' ? '人格' : '設計'}${BODY_LABEL[x.body]}（${x.gate}.${x.line}）`);
        gateActivations.set(x.gate, list);
      }
    }
    return { stateLabel: '你的圖中的狀態', gateActivations, activeChannels: new Set(d.activeChannels.map((c) => c.id)) };
  }, [chart, d]);
  const localText = `${local.year}-${pad(local.month)}-${pad(local.day)} ${pad(local.hour)}:${pad(local.minute)}`;
  const birthSummary = `出生資料：${localText}・${zoneText}・${formatOffset(offsetMinutes)}（${chart.provenance.input?.precision ?? ''}）`;

  const nodeDiffs = (['personality', 'design'] as const).flatMap((side) =>
    chart[side]
      .filter((x) => x.body === 'northNode' || x.body === 'southNode')
      .map((x) => {
        const m = meanChart[side].find((y) => y.body === x.body)!;
        return m.gate !== x.gate || m.line !== x.line ? `${side === 'personality' ? '人格' : '設計'}${BODY_LABEL[x.body]}：${x.gate}.${x.line}（平均交點 ${m.gate}.${m.line}）` : null;
      })
      .filter(Boolean),
  );

  return (
    <section id="result" className="section" aria-labelledby="result-h">
      <h2 id="result-h">計算結果</h2>
      <p className="chart-banner">依你輸入的出生資料計算・資料只存在此瀏覽器・外部驗證：待完成</p>
      <p className="report-notice">{DISCLAIMER}</p>
      <dl className="facts conversion">
        <div>
          <dt>輸入的當地時間</dt>
          <dd>
            {localText}・{zoneText}・{formatOffset(offsetMinutes)}・{chart.provenance.input?.precision}
          </dd>
        </div>
        <div>
          <dt>換算為 UTC</dt>
          <dd>{utcText(chart.birthUtc)}（人格時刻）</dd>
        </div>
        <div>
          <dt>設計時刻</dt>
          <dd>
            {utcText(chart.designUtc)}（太陽黃經少 88°，出生前 {chart.provenance.daysBetween.toFixed(1)} 天）
          </dd>
        </div>
      </dl>

      <div className="summary-grid">
        <Summary k="類型" v={<a href="#/types">{t.name}</a>} note={`策略：${t.strategy}`} unsure={result.sensitivity ? !result.sensitivity.typeStable : false} />
        <Summary k="內在權威" v={<a href={`#/types#auth-${a.id}`}>{a.name}</a>} note={a.center} unsure={result.sensitivity ? !result.sensitivity.authorityStable : false} />
        <Summary
          k="人生角色"
          v={<a href={`#/profiles?line=${p.conscious}`}>{`${p.conscious}/${p.unconscious}`}</a>}
          note={`${LINES[p.conscious - 1].name}／${LINES[p.unconscious - 1].name}`}
          unsure={result.sensitivity ? !result.sensitivity.profileStable : false}
        />
        <Summary
          k="定義類型"
          v={DEFINITION_LABEL[d.definition]}
          note={`有定義：${CENTER_ORDER.filter((c) => d.centerStates[c] === 'defined').map((c) => CENTERS[c].shortName).join('、') || '無'}`}
          unsure={result.sensitivity ? !result.sensitivity.definitionStable : false}
        />
      </div>

      <div id="result-graph">
        <Explorer
          selection={selection}
          onSelect={onSelect}
          centerStates={d.centerStates}
          activeGates={activeGates}
          gateSources={chart.gateSources}
          personal={personal}
          modeLabel="個人排圖・依輸入資料計算"
          graphTitle="依輸入出生資料計算的 BodyGraph"
          graphDescription={`${t.name}，${a.name}，人生角色 ${p.conscious}/${p.unconscious}。啟動的閘門：${[...activeGates].sort((x, y) => x - y).join('、')}。`}
        />
      </div>

      <ReportView report={report} reflection={reflection} onReflection={onReflection} onSelect={onSelect} provenance={chart.provenance} birthSummary={birthSummary} />

      {result.sensitivity && <SensitivityView report={result.sensitivity} />}

      <section className="section" aria-labelledby="act-h">
        <h3 id="act-h">26 個啟動點</h3>
        <div className="act-grid">
          <ActivationTable title="人格（出生時刻）" tone="personality" rows={chart.personality} />
          <ActivationTable title="設計（太陽回推 88°）" tone="design" rows={chart.design} />
        </div>
        <p className="muted small">
          「接近邊界」：距爻的邊界不到 {MANDALA_RULES.precision.nearLineArcmin} 角分。「起點分歧」：改用另一個閘門輪起點（302.057°）會得到不同的閘門或爻。交點採{NODE_MODE_LABEL.osculating}
          {nodeDiffs.length ? `；改用平均交點時：${nodeDiffs.join('；')}` : '；改用平均交點時，交點的閘門與爻相同'}。
        </p>
        <details className="more">
          <summary>進階細分：色、調、基底（單一第三方規則，未驗證，不提供解讀）</summary>
          <p className="muted small">{MANDALA_RULES.subdivisions.note}</p>
          <div className="act-grid">
            <SubdivisionTable title="人格" rows={chart.personality} />
            <SubdivisionTable title="設計" rows={chart.design} />
          </div>
        </details>
      </section>

      <ProvenanceView chart={chart} />

      <QuestionGuide chart={chart} headingId="ask-in-chart-h" />
    </section>
  );
}

function DayResult({ result, selection, onSelect, reflection, onReflection }: ResultProps<Extract<Result, { kind: 'day' }>>) {
  const { day, zoneText, report } = result;
  const activeGates = useMemo(() => new Set(day.stableGates.keys()), [day]);
  const centerStates = useMemo(() => {
    const s = {} as Record<CenterId, CenterState>;
    for (const id of CENTER_ORDER) s[id] = day.alwaysDefined.includes(id) ? 'defined' : 'undefined';
    return s;
  }, [day]);
  const personal = useMemo<PersonalContext>(() => {
    const gateActivations = new Map<number, string[]>();
    for (const x of day.stable) {
      const g = Number(x.gateLine.split('.')[0]);
      const list = gateActivations.get(g) ?? [];
      list.push(`${x.side === 'personality' ? '人格' : '設計'}${BODY_LABEL[x.body]}（${x.gateLine}，全天不變）`);
      gateActivations.set(g, list);
    }
    const centerNote: PersonalContext['centerNote'] = {};
    for (const id of CENTER_ORDER) {
      if (day.alwaysDefined.includes(id)) continue;
      centerNote[id] = day.neverDefined.includes(id) ? '全天都沒有定義（是否有懸掛閘門無法確定）' : '一天之中有時有定義、有時沒有，無法確定';
    }
    const channels = day.charts.map((c) => c.derivation.activeChannels.map((x) => x.id));
    return {
      stateLabel: '只知道日期時的狀態',
      gateActivations,
      activeChannels: new Set(channels[0].filter((id) => channels.every((s) => s.includes(id)))),
      centerNote,
    };
  }, [day]);
  const show = (v: string | null) => v ?? '無法確定';

  return (
    <section id="result" className="section" aria-labelledby="result-h">
      <h2 id="result-h">只知道日期的結果</h2>
      <p className="chart-banner">沒有出生時間・只顯示全天都相同的結果・資料只存在此瀏覽器</p>
      <p className="report-notice">{DISCLAIMER}</p>
      <dl className="facts conversion">
        <div>
          <dt>計算範圍</dt>
          <dd>
            {day.date} 當地 00:00–23:30（{zoneText}），共 {day.samples} 個時刻；UTC {utcText(day.firstUtc)} 至 {utcText(day.lastUtc)}
          </dd>
        </div>
      </dl>
      <div className="summary-grid">
        <Summary k="類型" v={show(day.type ? TYPES[day.type].name : null)} note="全天相同才顯示" unsure={!day.type} />
        <Summary k="內在權威" v={show(day.authority ? AUTHORITIES[day.authority].name : null)} note="全天相同才顯示" unsure={!day.authority} />
        <Summary k="人生角色" v={show(day.profile)} note="全天相同才顯示" unsure={!day.profile} />
        <Summary k="全天不變的啟動點" v={`${day.stable.length}/26`} note={`會改變：${day.variable.map((v) => `${v.side === 'personality' ? '人格' : '設計'}${BODY_LABEL[v.body]}`).join('、') || '無'}`} unsure={false} />
      </div>
      <div id="result-graph">
        <Explorer
          selection={selection}
          onSelect={onSelect}
          centerStates={centerStates}
          activeGates={activeGates}
          gateSources={day.stableGates}
          personal={personal}
          modeLabel="只知道日期・只顯示全天不變的閘門"
          graphTitle="只知道出生日期時的部分 BodyGraph"
          graphDescription={`只顯示 ${day.date} 全天都不變的閘門：${[...activeGates].sort((x, y) => x - y).join('、')}。實心中心為全天都有定義；虛線中心表示沒有定義或無法確定。`}
        />
      </div>
      <ReportView report={report} reflection={reflection} onReflection={onReflection} onSelect={onSelect} provenance={null} birthSummary={`出生資料：${day.date}（不知道出生時間）・${zoneText}`} />
      <QuestionGuide headingId="ask-in-day-h" />
    </section>
  );
}

function Summary({ k, v, note, unsure }: { k: string; v: React.ReactNode; note: string; unsure: boolean }) {
  return (
    <div className={`summary-card${unsure ? ' is-unsure' : ''}`}>
      <p className="summary-k">{k}</p>
      <p className="summary-v">{v}</p>
      <p className="muted small">{note}</p>
      {unsure && <p className="unsure-tag">在時間誤差範圍內可能改變</p>}
    </div>
  );
}

