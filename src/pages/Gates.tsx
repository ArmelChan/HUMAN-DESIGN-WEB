import { BodyGraph } from '../components/BodyGraph';
import { DetailPanel } from '../components/DetailPanel';
import { NotFoundBlock, ShareButton, VerificationBadge } from '../components/Common';
import { CENTERS, CENTER_ORDER, GATES, channelsOfGate, getGate } from '../data/structure';
import { replaceHash, type Route } from '../lib/router';
import { navigateTo } from './Channels';

export function GatesPage({ route, param }: { route: Route; param?: string }) {
  if (param) return <GateDetail n={Number(param)} raw={param} />;

  const q = route.query.get('q') ?? '';
  const center = route.query.get('center') ?? '';
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(route.query);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    replaceHash(`#/gates${s ? `?${s}` : ''}`);
  };

  const needle = q.trim();
  const results = GATES.filter((g) => {
    if (center && g.center !== center) return false;
    if (!needle) return true;
    return (
      String(g.number) === needle ||
      g.iChing.includes(needle) ||
      g.keynote.toLowerCase().includes(needle.toLowerCase())
    );
  });

  return (
    <div className="page">
      <h1>
        64 個閘門
        <span className="h1-sub">對應易經 64 卦，分布在九個中心</span>
      </h1>
      <p className="lede">
        閘門是人類圖中最小的結構單位。本頁列出每個閘門所在的中心、對應的易經卦名與所屬通道。閘門與各爻的詳細解讀<strong>尚未收錄</strong>；英文關鍵詞保留原文，因各作者用字不一，暫不翻譯。
      </p>
      <p>
        <VerificationBadge status="commonReference" /> <span className="muted small">閘門與中心的對應依通行資料整理；易經卦名為傳統名稱。</span>
      </p>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label>
          搜尋
          <input
            type="search"
            value={q}
            placeholder="號碼、卦名或英文關鍵詞"
            onChange={(e) => update('q', e.target.value)}
          />
        </label>
        <label>
          中心
          <select value={center} onChange={(e) => update('center', e.target.value)}>
            <option value="">全部中心</option>
            {CENTER_ORDER.map((id) => (
              <option key={id} value={id}>
                {CENTERS[id].name}（{CENTERS[id].gates.length}）
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className="result-count" role="status" aria-live="polite">
        找到 {results.length} 個閘門
      </p>

      {results.length === 0 ? (
        <div className="empty">
          <p>沒有符合條件的閘門。閘門號碼是 1 到 64。</p>
          <button type="button" className="btn btn-quiet" onClick={() => replaceHash('#/gates')}>
            清除所有篩選
          </button>
        </div>
      ) : (
        <ul className="gate-grid">
          {results.map((g) => (
            <li key={g.number}>
              <a href={`#/gates/${g.number}`}>
                <span className="gate-n">{g.number}</span>
                <span className="gate-ic">{g.iChing}</span>
                <span className="muted small">{CENTERS[g.center].shortName}・{channelsOfGate(g.number).map((c) => c.id).join('、')}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GateDetail({ n, raw }: { n: number; raw: string }) {
  const gate = Number.isInteger(n) ? getGate(n) : undefined;
  if (!gate) return <div className="page"><NotFoundBlock what={`閘門「${raw}」`} /></div>;
  const prev = n > 1 ? n - 1 : null;
  const next = n < 64 ? n + 1 : null;
  return (
    <div className="page page-wide">
      <p className="crumbs">
        <a href="#/gates">閘門</a> › {n} 號
      </p>
      <div className="detail-layout">
        <div className="detail-graph">
          <BodyGraph
            selection={{ kind: 'gate', n }}
            onSelect={navigateTo}
            title={`結構圖：閘門 ${n} 的位置`}
            description={`閘門 ${n} 位於${CENTERS[gate.center].name}。`}
          />
          <p className="muted small">結構圖，非個人資料。</p>
        </div>
        <div className="detail-body">
          <DetailPanel selection={{ kind: 'gate', n }} onSelect={navigateTo} guided={false} />
          <ShareButton />
          <nav className="stepper" aria-label="上一個與下一個閘門">
            {prev ? <a className="btn btn-quiet" href={`#/gates/${prev}`}>← 閘門 {prev}</a> : <span />}
            {next ? <a className="btn btn-quiet" href={`#/gates/${next}`}>閘門 {next} →</a> : <span />}
          </nav>
        </div>
      </div>
    </div>
  );
}
