import {
  CENTERS,
  CENTER_ORDER,
  CIRCUIT_LABEL,
  CIRCUIT_VERIFICATION,
  ROLE_LABEL,
  channelCenters,
  channelsOfCenter,
  channelsOfGate,
  getChannel,
  getGate,
  type CenterId,
} from '../data/structure';
import { CENTER_CONTENT, CENTER_STATE_NOTES } from '../data/content/centers';
import type { CenterState } from '../lib/derive';
import type { Selection } from '../lib/selection';
import { LayerTag, VerificationBadge } from './Common';

/** 個人排圖時傳入：讓說明面板顯示該部位在使用者圖中的狀態。 */
export interface PersonalContext {
  /** 例如「規則實驗中的狀態」或「你的圖中的狀態」。 */
  stateLabel: string;
  /** 每個閘門被哪些啟動點啟動，例如「人格・太陽」。 */
  gateActivations: Map<number, string[]>;
  activeChannels: Set<string>;
  /** 只知道日期時，無法確定的中心改用這段文字說明。 */
  centerNote?: Partial<Record<CenterId, string>>;
}

interface Props {
  selection: Selection;
  onSelect: (sel: Selection) => void;
  centerStates?: Record<CenterId, CenterState>;
  personal?: PersonalContext;
  /** 是否顯示「依序瀏覽九個中心」的上一個／下一個控制。 */
  guided?: boolean;
  headingLevel?: 'h2' | 'h3';
}

export function DetailPanel({ selection, onSelect, centerStates, personal, guided = true, headingLevel = 'h2' }: Props) {
  const H = headingLevel;
  if (!selection) {
    return (
      <div className="panel-empty">
        <H className="panel-title">從圖上選一個部位開始</H>
        <p>
          點選任何一個幾何形狀（能量中心）、連線（通道）或數字（閘門），這裡會顯示它在人類圖體系中的意思。使用鍵盤時，可按 Tab 移到各中心，再按 Enter 選取。
        </p>
        <p>不確定從哪裡開始的話，可以依序瀏覽九個中心：</p>
        <button type="button" className="btn" onClick={() => onSelect({ kind: 'center', id: 'head' })}>
          從頭頂中心開始
        </button>
      </div>
    );
  }
  if (selection.kind === 'center')
    return <CenterView id={selection.id} onSelect={onSelect} state={centerStates?.[selection.id]} personal={personal} guided={guided} H={H} />;
  if (selection.kind === 'channel') return <ChannelView id={selection.id} onSelect={onSelect} personal={personal} H={H} />;
  return <GateView n={selection.n} onSelect={onSelect} personal={personal} H={H} />;
}

function Crumbs({ items }: { items: string[] }) {
  return (
    <p className="crumbs" aria-label="目前閱讀位置">
      {items.map((t, i) => (
        <span key={i}>
          {i > 0 && <span aria-hidden="true"> › </span>}
          {t}
        </span>
      ))}
    </p>
  );
}

function CenterView({
  id,
  onSelect,
  state,
  personal,
  guided,
  H,
}: {
  id: CenterId;
  onSelect: Props['onSelect'];
  state?: CenterState;
  personal?: PersonalContext;
  guided: boolean;
  H: 'h2' | 'h3';
}) {
  const c = CENTERS[id];
  const t = CENTER_CONTENT[id];
  const idx = CENTER_ORDER.indexOf(id);
  const prev = CENTER_ORDER[idx - 1];
  const next = CENTER_ORDER[idx + 1];
  return (
    <article className="detail">
      <Crumbs items={['能量中心', `${c.name}（${idx + 1}／9）`]} />
      <H className="panel-title">
        {c.name} <span className="en">{c.english}</span>
      </H>
      <p className="chips">
        {c.roles.map((r) => (
          <span key={r} className="chip">
            {ROLE_LABEL[r]}
          </span>
        ))}
        <span className="chip">{c.gates.length} 個閘門</span>
        {t.altNames.length > 0 && <span className="chip chip-quiet">別稱：{t.altNames.join('、')}</span>}
      </p>
      {state && (
        <p className={`state-line state-${state}`}>
          {personal?.centerNote?.[id] ? (
            <strong>{personal.stateLabel}：{personal.centerNote[id]}</strong>
          ) : (
            <>
              <strong>
                {personal?.stateLabel ?? '規則實驗中的狀態'}：{CENTER_STATE_NOTES[state].label}
              </strong>
              （{CENTER_STATE_NOTES[state].marker}）
            </>
          )}
        </p>
      )}
      <p className="lede">{t.summary}</p>

      <div className="layer-block">
        <LayerTag layer="system" />
        <p>{t.definition}</p>
        <dl className="pair">
          <div>
            <dt>有定義時</dt>
            <dd>{t.defined}</dd>
          </div>
          <div>
            <dt>未定義／完全開放時</dt>
            <dd>{t.undefinedState}</dd>
          </div>
        </dl>
      </div>

      <details className="more">
        <summary>關係、常見誤解與限制</summary>
        <h4>與其他部位的關係</h4>
        <p>{t.relations}</p>
        <h4>常見誤解</h4>
        <ul>
          {t.misconceptions.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <h4>
          可供自我觀察的情境 <LayerTag layer="editorial" />
        </h4>
        <ul>
          {t.observe.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <h4>
          不應據此推論 <LayerTag layer="editorial" />
        </h4>
        <p>{t.notInfer}</p>
        <h4>體系內的身體對應</h4>
        <p>
          {t.bodyClaim}這是人類圖體系的主張，並非解剖學或內分泌學的結論，也不應用來理解任何身體症狀。
        </p>
      </details>

      <div className="link-group">
        <p className="link-group-title">連到這個中心的通道</p>
        <div className="pill-row">
          {channelsOfCenter(id).map((ch) => (
            <button key={ch.id} type="button" className="pill" onClick={() => onSelect({ kind: 'channel', id: ch.id })}>
              {ch.id}
            </button>
          ))}
        </div>
        <p className="link-group-title">中心內的閘門</p>
        <div className="pill-row">
          {c.gates.map((g) => (
            <button key={g} type="button" className="pill" onClick={() => onSelect({ kind: 'gate', n: g })}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <footer className="detail-foot">
        <VerificationBadge status={t.verification} />
        <a href={`#/centers/${id}`}>在完整頁面閱讀</a>
      </footer>

      {guided && (
        <nav className="stepper" aria-label="依序瀏覽九個中心">
          <button type="button" className="btn btn-quiet" disabled={!prev} onClick={() => prev && onSelect({ kind: 'center', id: prev })}>
            ← {prev ? CENTERS[prev].name : '已是第一個'}
          </button>
          <button type="button" className="btn btn-quiet" disabled={!next} onClick={() => next && onSelect({ kind: 'center', id: next })}>
            {next ? CENTERS[next].name : '已是最後一個'} →
          </button>
        </nav>
      )}
    </article>
  );
}

function ChannelView({ id, onSelect, personal, H }: { id: string; onSelect: Props['onSelect']; personal?: PersonalContext; H: 'h2' | 'h3' }) {
  const ch = getChannel(id)!;
  const [a, b] = channelCenters(ch);
  const circuit = CIRCUIT_LABEL[ch.circuit];
  return (
    <article className="detail">
      <Crumbs items={['通道', ch.id]} />
      <H className="panel-title">
        通道 {ch.id}「{ch.provisionalName}」 <span className="en">Channel of {ch.english}</span>
      </H>
      <p className="lede">
        連接<button type="button" className="inline-link" onClick={() => onSelect({ kind: 'center', id: a })}>{CENTERS[a].name}</button>
        與<button type="button" className="inline-link" onClick={() => onSelect({ kind: 'center', id: b })}>{CENTERS[b].name}</button>
        。當閘門 {ch.gates[0]} 與 {ch.gates[1]} 同時被啟動，這條通道成立，兩端的中心都有了定義。
      </p>
      <dl className="facts">
        <div>
          <dt>兩端閘門</dt>
          <dd className="pill-row">
            {ch.gates.map((g) => (
              <button key={g} type="button" className="pill" onClick={() => onSelect({ kind: 'gate', n: g })}>
                {g}（{getGate(g)!.iChing}）
              </button>
            ))}
          </dd>
        </div>
        <div>
          <dt>迴路群組</dt>
          <dd>
            {circuit.name}（{circuit.english}），屬{circuit.group} <VerificationBadge status={CIRCUIT_VERIFICATION[ch.circuit]} />
          </dd>
        </div>
        <div>
          <dt>中文名稱</dt>
          <dd>「{ch.provisionalName}」為網站暫譯，台灣出版品的譯名尚未逐條核對。</dd>
        </div>
      </dl>
      {personal && (
        <p className="state-line">
          <strong>
            {personal.stateLabel}：{personal.activeChannels.has(ch.id) ? '這條通道成立' : '這條通道沒有成立'}
          </strong>
          {!personal.activeChannels.has(ch.id) &&
            ch.gates.some((g) => personal.gateActivations.has(g)) &&
            `（已啟動閘門 ${ch.gates.filter((g) => personal.gateActivations.has(g)).join('、')}，另一端沒有）`}
        </p>
      )}
      <p className="not-included">
        <VerificationBadge status="notIncluded" /> 這條通道的詳細解讀尚未收錄。本站目前只提供結構資訊，不以推測補上內容。
      </p>
      <footer className="detail-foot">
        <VerificationBadge status="commonReference" />
        <a href={`#/channels/${ch.id}`}>在通道頁閱讀</a>
      </footer>
    </article>
  );
}

function GateView({ n, onSelect, personal, H }: { n: number; onSelect: Props['onSelect']; personal?: PersonalContext; H: 'h2' | 'h3' }) {
  const gate = getGate(n)!;
  const chans = channelsOfGate(n);
  return (
    <article className="detail">
      <Crumbs items={['閘門', `${n} 號`]} />
      <H className="panel-title">
        閘門 {n}・{gate.iChing}卦 <span className="en">Gate {n} — {gate.keynote}</span>
      </H>
      <p className="lede">
        位於<button type="button" className="inline-link" onClick={() => onSelect({ kind: 'center', id: gate.center })}>
          {CENTERS[gate.center].name}
        </button>
        ，對應易經第 {n} 卦「{gate.iChing}」。
      </p>
      <dl className="facts">
        <div>
          <dt>所在通道</dt>
          <dd className="pill-row">
            {chans.map((c) => (
              <button key={c.id} type="button" className="pill" onClick={() => onSelect({ kind: 'channel', id: c.id })}>
                {c.id}「{c.provisionalName}」
              </button>
            ))}
          </dd>
        </div>
        <div>
          <dt>對面的閘門</dt>
          <dd>
            {chans
              .map((c) => c.gates.find((g) => g !== n)!)
              .map((g) => `${g} 號（${CENTERS[getGate(g)!.center].name}）`)
              .join('、')}
          </dd>
        </div>
        <div>
          <dt>英文關鍵詞</dt>
          <dd>{gate.keynote}（人類圖英文資料常見的稱呼，各作者用字不一，暫不譯為中文）</dd>
        </div>
      </dl>
      {personal && (
        <p className="state-line">
          <strong>{personal.stateLabel}：</strong>
          {personal.gateActivations.has(n) ? `由 ${personal.gateActivations.get(n)!.join('、')} 啟動` : '這個閘門沒有被啟動'}
        </p>
      )}
      <p className="not-included">
        <VerificationBadge status="notIncluded" /> 閘門的詳細解讀與六條爻的內容尚未收錄。
      </p>
      <footer className="detail-foot">
        <VerificationBadge status="commonReference" />
        <a href={`#/gates/${n}`}>在閘門頁閱讀</a>
      </footer>
    </article>
  );
}
