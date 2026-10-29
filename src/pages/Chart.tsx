import { useMemo, useState, type FormEvent } from 'react';
import { Explorer } from '../components/Explorer';
import { Callout, LayerTag } from '../components/Common';
import { computeChart, sensitivity, startDivergenceSensitive, type Activation, type Chart, type SensitivityReport } from '../lib/chart';
import { DISCLAIMER } from '../data/disclaimer';
import { MANDALA_RULES } from '../data/rules/mandala';
import { BODY_LABEL, NODE_MODE_LABEL } from '../lib/ephemeris';
import { formatZodiac } from '../lib/mandala';
import {
  COMMON_ZONES,
  allTimeZones,
  formatOffset,
  localToUtc,
  localToUtcFixed,
  type Conversion,
  type LocalDateTime,
} from '../lib/timezone';
import { AUTHORITIES, TYPES } from '../data/content/types';
import { LINES } from '../data/content/profiles';
import { CENTERS, CENTER_ORDER, channelDisplayName } from '../data/structure';
import type { DefinitionKind } from '../lib/derive';
import type { Selection } from '../lib/selection';

type Precision = 'exact' | 'm15' | 'h1' | 'unknown';

const PRECISION: Record<Precision, { label: string; minutes: number }> = {
  exact: { label: '準確到分鐘（例如出生證明上的時間）', minutes: 0 },
  m15: { label: '大約，誤差 15 分鐘內', minutes: 15 },
  h1: { label: '只記得大概時段，誤差 1 小時內', minutes: 60 },
  unknown: { label: '不知道出生時間', minutes: 720 },
};

interface FormState {
  date: string;
  time: string;
  precision: Precision;
  zoneMode: 'zone' | 'offset';
  tz: string;
  offset: string;
}

const STORAGE_KEY = 'hd-birth-input-v1';
const EMPTY: FormState = { date: '', time: '', precision: 'exact', zoneMode: 'zone', tz: 'Asia/Taipei', offset: '+08:00' };

function loadSaved(): FormState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function saveInput(f: FormState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  } catch {
    /* 無法儲存時不影響計算 */
  }
}

function clearSaved() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
}

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

function utcText(d: Date): string {
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

interface Result {
  chart: Chart;
  meanChart: Chart;
  local: LocalDateTime;
  zoneText: string;
  offsetMinutes: number;
  report: SensitivityReport | null;
  precision: Precision;
}

export function ChartPage() {
  const saved = useMemo(loadSaved, []);
  const [form, setForm] = useState<FormState>(saved ?? EMPTY);
  const [remember, setRemember] = useState(saved !== null);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState('');
  const [ambiguous, setAmbiguous] = useState<Extract<Conversion, { kind: 'ambiguous' }> | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [showAllZones, setShowAllZones] = useState(false);

  const zones = useMemo(() => (showAllZones ? allTimeZones() : []), [showAllZones]);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const run = (utc: Date, offsetMinutes: number, local: LocalDateTime) => {
    const chart = computeChart(utc, 'osculating');
    const pad = (n: number) => String(n).padStart(2, '0');
    chart.provenance.input = {
      localDateTime: `${local.year}-${pad(local.month)}-${pad(local.day)} ${pad(local.hour)}:${pad(local.minute)}`,
      zone: form.zoneMode === 'zone' ? form.tz : '自訂時差',
      offset: formatOffset(offsetMinutes),
      precision: PRECISION[form.precision].label,
    };
    const minutes = PRECISION[form.precision].minutes;
    setResult({
      chart,
      meanChart: computeChart(utc, 'mean'),
      local,
      zoneText: form.zoneMode === 'zone' ? form.tz : '自訂時差',
      offsetMinutes,
      report: minutes > 0 ? sensitivity(utc, minutes) : null,
      precision: form.precision,
    });
    setSelection(null);
    setAmbiguous(null);
    if (remember) saveInput(form);
    else clearSaved();
    window.setTimeout(() => document.getElementById('result')?.scrollIntoView(), 0);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAmbiguous(null);
    if (!ack) {
      setError('請先閱讀上方說明並勾選確認。');
      return;
    }
    if (!form.date) {
      setError('請輸入出生日期。');
      return;
    }
    const time = form.precision === 'unknown' ? '12:00' : form.time;
    if (!time) {
      setError('請輸入出生時間；若不知道，請在「時間準確度」選擇「不知道出生時間」。');
      return;
    }
    const [year, month, day] = form.date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const local = { year, month, day, hour, minute };
    let conv: Conversion;
    if (form.zoneMode === 'zone') {
      conv = localToUtc(local, form.tz);
    } else {
      const off = parseOffset(form.offset);
      if (off === null) {
        setError('時差格式不正確，請輸入像 +08:00 或 -05:00 的格式。');
        return;
      }
      conv = localToUtcFixed(local, off);
    }
    try {
      if (conv.kind === 'invalid') setError(conv.reason);
      else if (conv.kind === 'nonexistent')
        setError('這個時刻在該時區不存在（夏令時間開始時，時鐘會直接跳過一段時間）。請確認出生時間，或改用「自訂時差」輸入當時的時差。');
      else if (conv.kind === 'ambiguous') setAmbiguous(conv);
      else run(conv.utc, conv.offsetMinutes, local);
    } catch (err) {
      setError(`計算時發生錯誤：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const reset = () => {
    setResult(null);
    setSelection(null);
    setForm(EMPTY);
    setAck(false);
    setRemember(false);
    clearSaved();
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
          輸入出生日期、時間與出生地的時區，網站會計算出生時（人格）與太陽回推 88°時（設計）共 26 個啟動點，
          並依體系規則推導類型、內在權威與人生角色。
        </p>
      </div>

      <Callout title="使用前說明">
        <p>{DISCLAIMER}</p>
      </Callout>

      <section className="section chart-form-wrap" aria-labelledby="privacy-h">
        <h2 id="privacy-h">計算前請先閱讀</h2>
        <ul className="plain-list">
          <li>
            <strong>出生資料不會離開你的裝置。</strong>計算完全在瀏覽器內完成，本站沒有伺服器端程式，也不使用外部 API 或分析工具。
            網址中不會帶出生資料；只有在你勾選「記住在這台裝置」時，才會存在這個瀏覽器的本機儲存空間，可隨時刪除。
          </li>
          <li>
            <strong>結果是體系內的描述。</strong>天文位置是真實計算，但「這些位置代表什麼」是人類圖的主張，沒有科學研究支持，
            不能作為醫療、心理、職涯或人際判斷的依據。
          </li>
          <li>
            <strong>時間會影響結果。</strong>月亮大約每 2 小時換一條爻、每半天換一個閘門；出生時間或時區錯誤，可能改變類型、權威或人生角色。
          </li>
          <li>替他人排圖前，請先取得對方同意，出生資料屬於個人資料。</li>
        </ul>

        <form className="chart-form" onSubmit={submit} noValidate>
          <div className="form-grid">
            <label>
              出生日期
              <input type="date" min="1900-01-01" max="2100-12-31" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </label>
            <label>
              時間準確度
              <select value={form.precision} onChange={(e) => set('precision', e.target.value as Precision)}>
                {(Object.keys(PRECISION) as Precision[]).map((k) => (
                  <option key={k} value={k}>
                    {PRECISION[k].label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              出生時間（當地時間，24 小時制）
              <input
                type="time"
                value={form.precision === 'unknown' ? '' : form.time}
                disabled={form.precision === 'unknown'}
                onChange={(e) => set('time', e.target.value)}
              />
              {form.precision === 'unknown' && <span className="hint">將以當天中午 12:00 計算，並列出一整天內會變動的項目。</span>}
            </label>
          </div>

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
              <input
                className="offset-input"
                aria-label="與 UTC 的時差"
                value={form.offset}
                placeholder="+08:00"
                onChange={(e) => set('offset', e.target.value)}
              />
            )}
            <p className="hint">
              人類圖只用到出生時刻，不需要精確的經緯度；但時區必須正確。1970 年以前部分地區的時區紀錄可能不完整，
              若你知道當時的時差（例如出生證明註明），用「自訂時差」較可靠。
            </p>
          </fieldset>

          <label className="check-line">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            我已閱讀上方說明，了解計算在本機進行、結果屬人類圖體系的描述，且時間誤差會影響結果。
          </label>
          <label className="check-line">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            記住在這台裝置（存在瀏覽器本機，下次免重新輸入；不勾選則關閉頁面後不保留）
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {ambiguous && (
            <div className="ambiguous" role="alert">
              <p>
                這個當地時間在該時區出現了兩次（夏令時間結束時，時鐘會倒回一小時）。請選擇出生時使用的時差：
              </p>
              <div className="pill-row">
                {ambiguous.options.map((o) => (
                  <button
                    key={o.offsetMinutes}
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => {
                      const [year, month, day] = form.date.split('-').map(Number);
                      const [hour, minute] = (form.precision === 'unknown' ? '12:00' : form.time).split(':').map(Number);
                      run(o.utc, o.offsetMinutes, { year, month, day, hour, minute });
                    }}
                  >
                    {formatOffset(o.offsetMinutes)}（{utcText(o.utc)}）
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn">
              計算
            </button>
            <button type="button" className="btn btn-quiet" onClick={reset}>
              清除輸入與已儲存資料
            </button>
          </div>
        </form>
      </section>

      {result && <ChartResult result={result} selection={selection} onSelect={setSelection} onReset={reset} />}
    </div>
  );
}

function ChartResult({
  result,
  selection,
  onSelect,
  onReset,
}: {
  result: Result;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onReset: () => void;
}) {
  const { chart, meanChart, local, zoneText, offsetMinutes, report, precision } = result;
  const d = chart.derivation;
  const t = TYPES[d.type];
  const a = AUTHORITIES[d.authority];
  const p = chart.profile;
  const activeGates = useMemo(() => new Set(chart.gateSources.keys()), [chart]);
  const pad = (n: number) => String(n).padStart(2, '0');
  const localText = `${local.year}-${pad(local.month)}-${pad(local.day)} ${pad(local.hour)}:${pad(local.minute)}`;

  const nodeDiffs = (['personality', 'design'] as const).flatMap((side) =>
    chart[side]
      .filter((x) => x.body === 'northNode' || x.body === 'southNode')
      .map((x) => {
        const m = meanChart[side].find((y) => y.body === x.body)!;
        return m.gate !== x.gate || m.line !== x.line
          ? `${side === 'personality' ? '人格' : '設計'}${BODY_LABEL[x.body]}：真交點 ${x.gate}.${x.line}，平均交點 ${m.gate}.${m.line}`
          : null;
      })
      .filter(Boolean),
  );
  const typeChangesWithMean = meanChart.derivation.type !== d.type || meanChart.derivation.authority !== d.authority;

  return (
    <section id="result" className="section" aria-labelledby="result-h">
      <h2 id="result-h">計算結果</h2>
      <p className="chart-banner">依你輸入的出生資料計算・資料只存在此瀏覽器</p>
      <p className="muted small">{DISCLAIMER}</p>
      {precision === 'unknown' && (
        <Callout tone="caution" title="未提供出生時間">
          <p>以下以當天中午 12:00 計算。下方的「時間誤差檢查」列出一整天內會改變的項目；標示為會變動的結論都不能採信。</p>
        </Callout>
      )}

      <dl className="facts conversion">
        <div>
          <dt>輸入的當地時間</dt>
          <dd>
            {precision === 'unknown' ? `${localText.slice(0, 10)}（時間未知，以 12:00 計）` : localText}・{zoneText}・{formatOffset(offsetMinutes)}
          </dd>
        </div>
        <div>
          <dt>換算為 UTC</dt>
          <dd>{utcText(chart.birthUtc)}（人格時刻）</dd>
        </div>
        <div>
          <dt>設計時刻</dt>
          <dd>
            {utcText(chart.designUtc)}（太陽黃經少 88°，出生前 {((chart.birthUtc.getTime() - chart.designUtc.getTime()) / 86400000).toFixed(1)} 天）
          </dd>
        </div>
      </dl>

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-k">類型</p>
          <p className="summary-v">
            <a href="#/types">{t.name}</a>
          </p>
          <p className="muted small">策略：{t.strategy}・標誌：{t.signature}・非自己主題：{t.notSelf}</p>
        </div>
        <div className="summary-card">
          <p className="summary-k">內在權威</p>
          <p className="summary-v">
            <a href={`#/types#auth-${a.id}`}>{a.name}</a>
          </p>
          <p className="muted small">{a.center}</p>
        </div>
        <div className="summary-card">
          <p className="summary-k">人生角色</p>
          <p className="summary-v">
            <a href={`#/profiles?line=${p.conscious}`}>
              {p.conscious}/{p.unconscious}
            </a>
          </p>
          <p className="muted small">
            {LINES[p.conscious - 1].name}／{LINES[p.unconscious - 1].name}
          </p>
        </div>
        <div className="summary-card">
          <p className="summary-k">定義類型</p>
          <p className="summary-v">{DEFINITION_LABEL[d.definition]}</p>
          <p className="muted small">
            有定義：{CENTER_ORDER.filter((c) => d.centerStates[c] === 'defined').map((c) => CENTERS[c].shortName).join('、') || '無'}
          </p>
        </div>
        <div className="summary-card">
          <p className="summary-k">輪迴交叉的閘門</p>
          <p className="summary-v">
            {chart.crossGates[0]}/{chart.crossGates[1]} | {chart.crossGates[2]}/{chart.crossGates[3]}
          </p>
          <p className="muted small">人格太陽／地球｜設計太陽／地球。交叉名稱與解讀尚未收錄。</p>
        </div>
      </div>

      <p className="muted small">
        成立的通道：{d.activeChannels.length ? d.activeChannels.map(channelDisplayName).join('、') : '無'}
      </p>
      <details className="more">
        <summary>類型與權威的推導過程</summary>
        <ol>
          {d.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </details>

      <Explorer
        selection={selection}
        onSelect={onSelect}
        centerStates={d.centerStates}
        activeGates={activeGates}
        gateSources={chart.gateSources}
        modeLabel="個人排圖・依輸入資料計算"
        graphTitle="依輸入出生資料計算的 BodyGraph"
        graphDescription={`${t.name}，${a.name}，人生角色 ${p.conscious}/${p.unconscious}。啟動的閘門：${[...activeGates].sort((x, y) => x - y).join('、')}。`}
      />

      <section className="section" aria-labelledby="act-h">
        <h3 id="act-h">26 個啟動點</h3>
        <div className="act-grid">
          <ActivationTable title="人格（出生時刻）" tone="personality" rows={chart.personality} />
          <ActivationTable title="設計（太陽回推 88°）" tone="design" rows={chart.design} />
        </div>
        <p className="muted small">
          「接近邊界」表示位置距爻的邊界不到 {MANDALA_RULES.precision.nearLineArcmin} 角分，出生時間差幾分鐘就可能落到相鄰的爻或閘門。
          「起點分歧」表示位置落在兩種閘門輪起點（302° 與 302.057°）會給出不同結果的範圍內。
        </p>
        <details className="more">
          <summary>進階細分：色、調、基底（單一第三方規則，未驗證）</summary>
          <p className="muted small">
            {MANDALA_RULES.subdivisions.note}一個基底只有約 0.0052°，月亮大約 30 多秒就會移過一個基底；除非出生時間精確到秒，這些數值不具參考價值。
          </p>
          <div className="act-grid">
            <SubdivisionTable title="人格" rows={chart.personality} />
            <SubdivisionTable title="設計" rows={chart.design} />
          </div>
        </details>
      </section>

      <ProvenanceView chart={chart} />

      {report && <SensitivityView report={report} />}

      <section className="section" aria-labelledby="acc-h">
        <h3 id="acc-h">計算方式與限制</h3>
        <ul className="plain-list">
          <li>
            天體位置以開源函式庫 astronomy-engine（MIT 授權）計算地心、當日真黃道（回歸黃道）經度。本站以獨立的天文公式抽查，
            1900–2100 年間太陽位置的差距在 1 角分以內；一條爻寬 56.25 角分。
          </li>
          <li>
            月球交點採{NODE_MODE_LABEL.osculating}：由月球的位置與速度向量求出軌道面與黃道的交線，與 Swiss Ephemeris 的 TRUE_NODE 定義相同。部分軟體使用平均交點：
            {nodeDiffs.length === 0 ? '這張圖用平均交點計算，交點的閘門與爻相同。' : `這張圖用平均交點會有差異——${nodeDiffs.join('；')}。`}
            {typeChangesWithMean && ' 改用平均交點時，類型或權威也會不同，請特別留意。'}
          </li>
          <li>
            閘門順序 64 個位置與兩份開源實作逐一一致；起點 302° 與另一份實作的 302.057° 存在分歧。第三方轉錄的 5 張參照圖 130 個啟動點全部一致（二手參照）。
            直接與其他排圖軟體比對：<strong>尚未完成（pending_external_validation）</strong>。詳見<a href="#/verification">計算驗證</a>。
          </li>
          <li>不一致時，最常見的原因是出生時間或時區，其次是交點算法與閘門輪起點。</li>
          <li>
            <LayerTag layer="science" /> 計算出的行星位置是天文事實；把它們解讀為性格、決策方式或人生方向，是人類圖體系的主張，沒有經過科學驗證。
          </li>
        </ul>
        <button type="button" className="btn btn-quiet" onClick={onReset}>
          清除結果與已儲存資料
        </button>
      </section>
    </section>
  );
}

function ActivationTable({ title, tone, rows }: { title: string; tone: 'personality' | 'design'; rows: Activation[] }) {
  return (
    <div className={`table-wrap act-${tone}`}>
      <table className="compare act-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">星體</th>
            <th scope="col">閘門.爻</th>
            <th scope="col">黃道位置</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.body}>
              <th scope="row">{BODY_LABEL[r.body]}</th>
              <td>
                <a href={`#/gates/${r.gate}`}>
                  {r.gate}.{r.line}
                </a>
                {r.boundaryDistance * 60 < MANDALA_RULES.precision.nearLineArcmin && <span className="near-edge">接近邊界</span>}
                {startDivergenceSensitive(r) && <span className="near-edge">起點分歧</span>}
              </td>
              <td>{formatZodiac(r.longitude)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SensitivityView({ report }: { report: SensitivityReport }) {
  const range = report.rangeMinutes >= 720 ? '當天 0:00 到 24:00' : `±${report.rangeMinutes} 分鐘`;
  const items: [string, boolean][] = [
    ['類型', report.typeStable],
    ['內在權威', report.authorityStable],
    ['人生角色', report.profileStable],
    ['定義類型', report.definitionStable],
  ];
  return (
    <section className="section" aria-labelledby="sens-h">
      <h3 id="sens-h">時間誤差檢查（{range}）</h3>
      <p className="muted">在這個範圍內取 {report.samples} 個時間點重新計算，看結果是否一致。</p>
      <ul className="stability">
        {items.map(([k, ok]) => (
          <li key={k} className={ok ? 'is-stable' : 'is-unstable'}>
            <span aria-hidden="true">{ok ? '✓' : '!'}</span> {k}：{ok ? '範圍內不變' : '範圍內會改變，不能確定'}
          </li>
        ))}
      </ul>
      {report.changing.length > 0 ? (
        <>
          <p>會改變閘門或爻的啟動點：</p>
          <ul>
            {report.changing.map((c) => (
              <li key={`${c.side}-${c.body}`}>
                {c.side === 'personality' ? '人格' : '設計'}
                {BODY_LABEL[c.body]}：{c.values.join(' → ')}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>範圍內 26 個啟動點的閘門與爻都不變。</p>
      )}
    </section>
  );
}

function SubdivisionTable({ title, rows }: { title: string; rows: Activation[] }) {
  return (
    <div className="table-wrap">
      <table className="compare act-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">星體</th>
            <th scope="col">閘門.爻.色.調.基底</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.body}>
              <th scope="row">{BODY_LABEL[r.body]}</th>
              <td className="num">
                {r.gate}.{r.line}.{r.color}.{r.tone}.{r.base}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProvenanceView({ chart }: { chart: Chart }) {
  const [status, setStatus] = useState('');
  const p = chart.provenance;
  const json = JSON.stringify(p, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setStatus('已複製。內容包含你的出生時間，分享前請留意。');
    } catch {
      setStatus('無法自動複製，請從下方文字框手動選取。');
    }
  };
  return (
    <section className="section" aria-labelledby="prov-h">
      <h3 id="prov-h">計算紀錄</h3>
      <p className="muted">每張圖都保留下列資訊，方便日後重現或與其他軟體比對。這些值由程式在計算時記錄，不是事後補寫。</p>
      <dl className="facts">
        <div>
          <dt>輸入</dt>
          <dd>{p.input ? `${p.input.localDateTime}・${p.input.zone}・${p.input.offset}・${p.input.precision}` : '—'}</dd>
        </div>
        <div>
          <dt>UTC</dt>
          <dd>人格 {p.birthUtc}｜設計 {p.designUtc}（相差 {p.daysBetween.toFixed(4)} 天）</dd>
        </div>
        <div>
          <dt>星曆引擎</dt>
          <dd>
            {p.engine.name} {p.engine.version}（{p.engine.license}）・資料檔：{p.engine.dataFiles}
          </dd>
        </div>
        <div>
          <dt>計算設定</dt>
          <dd>
            回歸黃道・地心・當日真黃道與真春分點・視位置・{NODE_MODE_LABEL[p.settings.nodeMode]}
          </dd>
        </div>
        <div>
          <dt>規則表</dt>
          <dd>
            {p.rules.version}・起點 {p.rules.startLongitude}°・區間 {p.rules.interval}
          </dd>
        </div>
        <div>
          <dt>設計時刻求根</dt>
          <dd>
            {p.solver.method}；{p.solver.iterations} 次迭代，殘差 {p.solver.residualDeg.toExponential(2)}°，
            停止條件：{p.solver.stopReason === 'residual' ? `殘差小於 ${p.solver.tolerance.residualDeg}°` : p.solver.stopReason === 'step' ? `時間步長小於 ${p.solver.tolerance.stepSeconds} 秒` : '達到迭代上限'}
          </dd>
        </div>
        <div>
          <dt>外部驗證</dt>
          <dd>{p.externalValidation}（尚未與其他排圖軟體直接比對）</dd>
        </div>
      </dl>
      <details className="more">
        <summary>以 JSON 檢視</summary>
        <textarea className="prov-json" readOnly value={json} rows={14} aria-label="計算紀錄 JSON" />
        <p>
          <button type="button" className="btn btn-quiet" onClick={copy}>
            複製計算紀錄
          </button>{' '}
          <span className="muted small" role="status" aria-live="polite">{status}</span>
        </p>
      </details>
    </section>
  );
}
