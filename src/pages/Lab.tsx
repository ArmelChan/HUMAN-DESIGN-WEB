import { useMemo } from 'react';
import { Explorer } from '../components/Explorer';
import { Callout } from '../components/Common';
import { LAB_PRESETS } from '../data/content/presets';
import { AUTHORITIES, TYPES } from '../data/content/types';
import { CENTERS, CENTER_ORDER, channelDisplayName, getChannel, getGate } from '../data/structure';
import { derive, type DefinitionKind } from '../lib/derive';
import { replaceHash, type Route } from '../lib/router';
import { decodeSelection, encodeSelection, type Selection } from '../lib/selection';

const DEFINITION_LABEL: Record<DefinitionKind, string> = {
  none: '無定義',
  single: '一分人（單一定義）',
  split: '二分人',
  tripleSplit: '三分人',
  quadrupleSplit: '四分人',
};

function parseGates(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && getGate(n));
}

export function LabPage({ route }: { route: Route }) {
  const gates = parseGates(route.query.get('g'));
  const selection = decodeSelection(route.query.get('s'));
  const active = useMemo(() => new Set(gates), [gates.join(',')]);
  const result = useMemo(() => derive(active), [active]);

  const write = (nextGates: number[], sel: Selection) => {
    const params = new URLSearchParams();
    const sorted = [...new Set(nextGates)].sort((a, b) => a - b);
    if (sorted.length) params.set('g', sorted.join(','));
    const code = encodeSelection(sel);
    if (code) params.set('s', code);
    const s = params.toString();
    replaceHash(`#/lab${s ? `?${s}` : ''}`);
  };

  const toggle = (n: number) => write(active.has(n) ? gates.filter((g) => g !== n) : [...gates, n], { kind: 'gate', n });
  const select = (sel: Selection) => write(gates, sel);

  const selectedChannel = selection?.kind === 'channel' ? getChannel(selection.id) : undefined;
  const channelOn = selectedChannel ? selectedChannel.gates.every((g) => active.has(g)) : false;

  const t = TYPES[result.type];
  const a = AUTHORITIES[result.authority];

  const resultCard = (
    <div className="lab-result">
      <p className="lab-banner">規則實驗・不是任何人的人類圖</p>
      <dl className="lab-facts">
        <div>
          <dt>依規則推得的類型</dt>
          <dd>
            <a href="#/types">{t.name}</a>
          </dd>
        </div>
        <div>
          <dt>內在權威</dt>
          <dd>
            <a href={`#/types#auth-${a.id}`}>{a.name}</a>
          </dd>
        </div>
        <div>
          <dt>定義類型</dt>
          <dd>{DEFINITION_LABEL[result.definition]}</dd>
        </div>
        <div>
          <dt>成立的通道</dt>
          <dd>{result.activeChannels.length ? result.activeChannels.map(channelDisplayName).join('、') : '無'}</dd>
        </div>
      </dl>
      <details className="more" open>
        <summary>推導過程</summary>
        <ol>
          {result.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </details>
      {selectedChannel && (
        <button
          type="button"
          className="btn"
          onClick={() =>
            write(
              channelOn ? gates.filter((g) => !selectedChannel.gates.includes(g)) : [...gates, ...selectedChannel.gates],
              selection,
            )
          }
        >
          {channelOn ? `關閉通道 ${selectedChannel.id} 的兩個閘門` : `啟動通道 ${selectedChannel.id} 的兩個閘門`}
        </button>
      )}
    </div>
  );

  return (
    <div className="page page-wide">
      <div className="intro-strip">
        <h1>
          規則實驗室
          <span className="h1-sub">點亮閘門，看中心、類型與權威如何依規則變化</span>
        </h1>
        <p>
          在圖上點數字可以啟動或關閉閘門；點中心或連線則顯示說明。這裡只展示「閘門已知之後」的判定規則，<strong>不會根據出生資料計算</strong>，所以結果不是任何人的人類圖。
        </p>
      </div>

      <div className="preset-row" role="group" aria-label="教學示例">
        <span className="muted small">教學示例：</span>
        {LAB_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="pill"
            title={p.purpose}
            aria-pressed={gates.join(',') === [...p.gates].sort((x, y) => x - y).join(',')}
            onClick={() => write(p.gates, null)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {(() => {
        const preset = LAB_PRESETS.find((p) => gates.join(',') === [...p.gates].sort((x, y) => x - y).join(','));
        return preset ? <p className="muted small preset-purpose">示例說明：{preset.purpose}</p> : null;
      })()}

      <Explorer
        selection={selection}
        onSelect={select}
        centerStates={result.centerStates}
        activeGates={active}
        onToggleGate={toggle}
        modeLabel="規則實驗・非個人資料"
        graphTitle="規則實驗用 BodyGraph"
        graphDescription={`目前啟動的閘門：${result.activeGates.join('、') || '無'}。依規則推得${t.name}、${a.name}。`}
        aside={resultCard}
      />

      <section className="section" aria-labelledby="checklist-h">
        <h2 id="checklist-h">用清單切換閘門</h2>
        <p className="muted">與點選圖上數字的效果相同，適合鍵盤操作或在小螢幕上精確選擇。</p>
        <div className="gate-checklist">
          {CENTER_ORDER.map((id) => (
            <fieldset key={id}>
              <legend>
                {CENTERS[id].name}
                <span className={`state-tag state-${result.centerStates[id]}`}>
                  {result.centerStates[id] === 'defined' ? '有定義' : result.centerStates[id] === 'undefined' ? '未定義' : '完全開放'}
                </span>
              </legend>
              {[...CENTERS[id].gates].sort((x, y) => x - y).map((g) => (
                <label key={g} className="check">
                  <input type="checkbox" checked={active.has(g)} onChange={() => toggle(g)} />
                  {g}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <button type="button" className="btn btn-quiet" onClick={() => write([], null)} disabled={gates.length === 0}>
          全部清空
        </button>
      </section>

      <Callout tone="caution" title="這裡的結果代表什麼">
        <p>
          真實的人類圖由 26 個行星啟動點決定，一個人通常會有二十多個被啟動的閘門。這裡的示例只用少數幾個閘門，是為了讓規則容易看清楚。若想看依出生資料計算的人類圖，請使用<a href="#/chart">個人排圖</a>頁。
        </p>
      </Callout>
    </div>
  );
}
