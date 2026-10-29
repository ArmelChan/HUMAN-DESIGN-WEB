import { BodyGraph } from '../components/BodyGraph';
import { DetailPanel } from '../components/DetailPanel';
import { NotFoundBlock, ShareButton, VerificationBadge } from '../components/Common';
import {
  CENTERS,
  CENTER_ORDER,
  CHANNELS,
  CIRCUIT_LABEL,
  CIRCUIT_VERIFICATION,
  channelCenters,
  getChannel,
  type Circuit,
} from '../data/structure';
import { replaceHash, type Route } from '../lib/router';
import type { Selection } from '../lib/selection';

export function navigateTo(sel: Selection) {
  if (!sel) return;
  if (sel.kind === 'center') window.location.hash = `#/centers/${sel.id}`;
  else if (sel.kind === 'channel') window.location.hash = `#/channels/${sel.id}`;
  else window.location.hash = `#/gates/${sel.n}`;
}

export function ChannelsPage({ route, param }: { route: Route; param?: string }) {
  if (param) return <ChannelDetail id={param} />;

  const q = route.query.get('q') ?? '';
  const center = route.query.get('center') ?? '';
  const circuit = route.query.get('circuit') ?? '';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(route.query);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    replaceHash(`#/channels${s ? `?${s}` : ''}`);
  };

  const needle = q.trim().toLowerCase();
  const results = CHANNELS.filter((c) => {
    const [a, b] = channelCenters(c);
    if (center && a !== center && b !== center) return false;
    if (circuit && c.circuit !== circuit) return false;
    if (!needle) return true;
    return (
      c.id.includes(needle) ||
      c.gates.some((g) => String(g) === needle) ||
      c.english.toLowerCase().includes(needle) ||
      c.provisionalName.includes(q.trim()) ||
      CENTERS[a].name.includes(q.trim()) ||
      CENTERS[b].name.includes(q.trim())
    );
  });

  return (
    <div className="page">
      <h1>
        36 條通道
        <span className="h1-sub">每條通道連接兩個中心，兩端各是一個閘門</span>
      </h1>
      <p className="lede">
        通道兩端的閘門都被啟動時，通道成立，兩端的中心也就有了定義。本頁提供結構索引：哪兩個閘門、連接哪兩個中心、屬於哪個迴路。各通道的詳細解讀<strong>尚未收錄</strong>，中文名稱為網站暫譯。
      </p>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label>
          搜尋
          <input
            type="search"
            value={q}
            placeholder="閘門號碼、英文名或中心"
            onChange={(e) => update('q', e.target.value)}
          />
        </label>
        <label>
          中心
          <select value={center} onChange={(e) => update('center', e.target.value)}>
            <option value="">全部中心</option>
            {CENTER_ORDER.map((id) => (
              <option key={id} value={id}>
                {CENTERS[id].name}
              </option>
            ))}
          </select>
        </label>
        <label>
          迴路
          <select value={circuit} onChange={(e) => update('circuit', e.target.value)}>
            <option value="">全部迴路</option>
            {(Object.keys(CIRCUIT_LABEL) as Circuit[]).map((k) => (
              <option key={k} value={k}>
                {CIRCUIT_LABEL[k].name}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className="result-count" role="status" aria-live="polite">
        找到 {results.length} 條通道
      </p>

      {results.length === 0 ? (
        <div className="empty">
          <p>沒有符合條件的通道。試試只輸入一個閘門號碼，或清除篩選。</p>
          <button type="button" className="btn btn-quiet" onClick={() => replaceHash('#/channels')}>
            清除所有篩選
          </button>
        </div>
      ) : (
        <ul className="index-list">
          {results.map((c) => {
            const [a, b] = channelCenters(c);
            return (
              <li key={c.id}>
                <a href={`#/channels/${c.id}`}>
                  <span className="idx-key">{c.id}</span>
                  <span className="idx-main">
                    <strong>「{c.provisionalName}」</strong> <span className="en">{c.english}</span>
                    <span className="muted small">
                      {CENTERS[a].name} ↔ {CENTERS[b].name}・{CIRCUIT_LABEL[c.circuit].name}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <section className="section" aria-labelledby="circuit-h">
        <h2 id="circuit-h">迴路分組的核實狀態</h2>
        <ul className="plain-list">
          {(Object.keys(CIRCUIT_LABEL) as Circuit[]).map((k) => (
            <li key={k}>
              {CIRCUIT_LABEL[k].name}（{CIRCUIT_LABEL[k].english}）・{CIRCUIT_LABEL[k].group}{' '}
              <VerificationBadge status={CIRCUIT_VERIFICATION[k]} />
            </li>
          ))}
        </ul>
        <p className="muted">
          20-57 腦波通道在不同資料中的歸類不一致：本站依通行資料列在覺知迴路，部分網站則把它與整合通道並列。
        </p>
      </section>
    </div>
  );
}

function ChannelDetail({ id }: { id: string }) {
  const ch = getChannel(id);
  if (!ch) return <div className="page"><NotFoundBlock what={`通道「${id}」`} /></div>;
  return (
    <div className="page page-wide">
      <p className="crumbs">
        <a href="#/channels">通道</a> › {ch.id}
      </p>
      <div className="detail-layout">
        <div className="detail-graph">
          <BodyGraph
            selection={{ kind: 'channel', id: ch.id }}
            onSelect={navigateTo}
            title={`結構圖：通道 ${ch.id} 的位置`}
            description={`通道 ${ch.id} 在 BodyGraph 中的位置。`}
          />
          <p className="muted small">結構圖，非個人資料。</p>
        </div>
        <div className="detail-body">
          <DetailPanel selection={{ kind: 'channel', id: ch.id }} onSelect={navigateTo} guided={false} />
          <ShareButton />
        </div>
      </div>
    </div>
  );
}
