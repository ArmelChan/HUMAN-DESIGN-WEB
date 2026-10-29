// 排圖結果的技術細節：啟動點表、時間誤差檢查、細分表、計算紀錄。
import { useState } from 'react';
import { startDivergenceSensitive, type Activation, type Chart, type SensitivityReport } from '../lib/chart';
import { MANDALA_RULES } from '../data/rules/mandala';
import { BODY_LABEL, NODE_MODE_LABEL } from '../lib/ephemeris';
import { formatZodiac } from '../lib/mandala';

export function ActivationTable({ title, tone, rows }: { title: string; tone: 'personality' | 'design'; rows: Activation[] }) {
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

export function SensitivityView({ report }: { report: SensitivityReport }) {
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

export function SubdivisionTable({ title, rows }: { title: string; rows: Activation[] }) {
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

export function ProvenanceView({ chart }: { chart: Chart }) {
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
            {p.solver.method}；{p.solver.iterations} 次迭代，殘差 {p.solver.residualDeg.toExponential(2)}°，停止條件：{p.solver.stopReason === 'residual' ? `殘差小於 ${p.solver.tolerance.residualDeg}°` : p.solver.stopReason === 'step' ? `時間步長小於 ${p.solver.tolerance.stepSeconds} 秒` : '達到迭代上限'}
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
