import { BodyGraph } from '../components/BodyGraph';
import { LayerTag, NotFoundBlock, ShareButton, VerificationBadge } from '../components/Common';
import { CENTER_CONTENT, CENTER_STATE_NOTES } from '../data/content/centers';
import { CENTERS, CENTER_ORDER, ROLE_LABEL, channelsOfCenter, type CenterId, type CenterRole } from '../data/structure';
import type { Selection } from '../lib/selection';

function go(sel: Selection) {
  if (!sel) return;
  if (sel.kind === 'center') window.location.hash = `#/centers/${sel.id}`;
  else if (sel.kind === 'channel') window.location.hash = `#/channels/${sel.id}`;
  else window.location.hash = `#/gates/${sel.n}`;
}

const ROLE_ORDER: CenterRole[] = ['pressure', 'awareness', 'motor', 'expression', 'identity'];

const ROLE_TEXT: Record<CenterRole, string> = {
  pressure: '產生推動的壓力：頭頂是想弄懂的壓力，根部是想完成的壓力。',
  awareness: '三種覺察：邏輯是心智的，直覺是當下身體的，情緒是隨時間浮現的。',
  motor: '提供能量。是否有動力中心連到喉嚨，是判定顯示者與顯示生產者的關鍵。',
  expression: '喉嚨是能量轉為語言或行動的出口。',
  identity: 'G 中心與方向、身分和愛有關。',
};

export function CentersPage() {
  return (
    <div className="page">
      <h1>
        九個能量中心
        <span className="h1-sub">每個中心處理一類能量或覺察</span>
      </h1>
      <p className="lede">
        體系把 BodyGraph 上的九個幾何形狀稱為能量中心。閱讀中心時，要同時看兩件事：這個中心本身處理什麼，以及它在一張圖中是有定義、未定義還是完全開放。
      </p>

      <section className="section" aria-labelledby="states-h">
        <h2 id="states-h">有定義、未定義、完全開放</h2>
        <p>
          這三個詞在中文資料裡常被混用。本站採用區分較細的用法，三者的判斷依據都是「閘門與通道」，可以在<a href="#/lab">規則實驗室</a>親手試出來。
        </p>
        <div className="state-cards">
          {(['defined', 'undefined', 'open'] as const).map((s) => (
            <div key={s} className="state-card">
              <svg viewBox="0 0 80 60" width="80" height="60" aria-hidden="true">
                <rect x="10" y="10" width="60" height="40" className={`lg-${s}`} />
                {s !== 'open' && <circle cx="22" cy="22" r="6" className="lg-gate-on" />}
                {s === 'defined' && <line x1="22" y1="22" x2="22" y2="0" className="lg-line-on" />}
              </svg>
              <h3>
                {CENTER_STATE_NOTES[s].label} <span className="en">{CENTER_STATE_NOTES[s].english}</span>
              </h3>
              <p>{CENTER_STATE_NOTES[s].text}</p>
            </div>
          ))}
        </div>
        <p className="muted">
          <LayerTag layer="system" /> 體系並不把未定義中心視為缺陷，而是描述為接收、放大與學習外界能量的地方；它同時也是體系所說「制約」最容易發生的位置。
        </p>
      </section>

      <section className="section" aria-labelledby="roles-h">
        <h2 id="roles-h">依功能分組</h2>
        <div className="role-grid">
          {ROLE_ORDER.map((r) => (
            <div key={r} className="role-card">
              <h3>{ROLE_LABEL[r]}</h3>
              <p>{ROLE_TEXT[r]}</p>
              <p className="pill-row">
                {CENTER_ORDER.filter((id) => CENTERS[id].roles.includes(r)).map((id) => (
                  <a key={id} className="pill" href={`#/centers/${id}`}>
                    {CENTERS[id].name}
                  </a>
                ))}
              </p>
            </div>
          ))}
        </div>
        <p className="muted">情緒中心同時是動力與覺察中心，根部中心同時是壓力與動力中心。</p>
      </section>

      <section className="section" aria-labelledby="list-h">
        <h2 id="list-h">逐一閱讀</h2>
        <ol className="center-list">
          {CENTER_ORDER.map((id, i) => (
            <li key={id}>
              <a href={`#/centers/${id}`}>
                <span className="num">{i + 1}</span>
                <span>
                  <strong>{CENTERS[id].name}</strong> <span className="en">{CENTERS[id].english}</span>
                  <br />
                  <span className="muted">{CENTER_CONTENT[id].summary}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function CenterDetailPage({ id }: { id: string }) {
  if (!(id in CENTERS)) return <div className="page"><NotFoundBlock what="這個能量中心" /></div>;
  const cid = id as CenterId;
  const c = CENTERS[cid];
  const t = CENTER_CONTENT[cid];
  const idx = CENTER_ORDER.indexOf(cid);
  const prev = CENTER_ORDER[idx - 1];
  const next = CENTER_ORDER[idx + 1];

  return (
    <div className="page page-wide">
      <p className="crumbs">
        <a href="#/centers">能量中心</a> › {c.name}（{idx + 1}／9）
      </p>
      <div className="detail-layout">
        <div className="detail-graph">
          <BodyGraph
            selection={{ kind: 'center', id: cid }}
            onSelect={go}
            title={`結構圖：${c.name}的位置`}
            description={`${c.name}在 BodyGraph 中的位置，以及連到它的通道。點其他中心可前往該中心的頁面。`}
          />
          <p className="muted small">結構圖，非個人資料。點其他部位可前往對應頁面。</p>
        </div>
        <article className="detail-body">
          <h1>
            {c.name}
            <span className="h1-sub">{c.english}</span>
          </h1>
          <p className="chips">
            {c.roles.map((r) => (
              <span key={r} className="chip">
                {ROLE_LABEL[r]}
              </span>
            ))}
            <span className="chip">閘門：{c.gates.join('、')}</span>
          </p>
          {t.altNames.length > 0 && <p className="muted">其他譯名：{t.altNames.join('、')}</p>}
          <p className="lede">{t.summary}</p>

          <h2>
            體系中的定義 <LayerTag layer="system" />
          </h2>
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

          <h2>與其他部位的關係</h2>
          <p>{t.relations}</p>
          <p className="pill-row">
            {channelsOfCenter(cid).map((ch) => (
              <a key={ch.id} className="pill" href={`#/channels/${ch.id}`}>
                {ch.id}「{ch.provisionalName}」
              </a>
            ))}
          </p>

          <h2>常見誤解</h2>
          <ul>
            {t.misconceptions.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <h2>
            可供自我觀察的情境 <LayerTag layer="editorial" />
          </h2>
          <ul>
            {t.observe.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <h2>
            不應據此推論 <LayerTag layer="editorial" />
          </h2>
          <p>{t.notInfer}</p>

          <h2>體系內的身體對應</h2>
          <p>{t.bodyClaim}這是人類圖體系的主張，不是解剖學或內分泌學的結論。</p>

          <p className="detail-foot">
            <VerificationBadge status={t.verification} />
            <ShareButton />
          </p>

          <nav className="stepper" aria-label="上一個與下一個中心">
            {prev ? <a className="btn btn-quiet" href={`#/centers/${prev}`}>← {CENTERS[prev].name}</a> : <span />}
            {next ? <a className="btn btn-quiet" href={`#/centers/${next}`}>{CENTERS[next].name} →</a> : <span />}
          </nav>
        </article>
      </div>
    </div>
  );
}
