import { Callout, LayerTag, VerificationBadge } from '../components/Common';
import { GEOMETRY_LABEL, LINES, PROFILES, PROFILE_INTRO } from '../data/content/profiles';
import { replaceHash, type Route } from '../lib/router';

export function ProfilesPage({ route }: { route: Route }) {
  const raw = Number(route.query.get('line'));
  const line = raw >= 1 && raw <= 6 ? raw : null;
  const setLine = (n: number | null) => replaceHash(n ? `#/profiles?line=${n}` : '#/profiles');

  const shown = line ? PROFILES.filter((p) => p.conscious === line || p.unconscious === line) : PROFILES;

  return (
    <div className="page">
      <h1>
        人生角色
        <span className="h1-sub">由兩條爻組成的 12 種組合</span>
      </h1>
      <p className="lede">{PROFILE_INTRO.summary}</p>
      <p>
        <LayerTag layer="system" /> {PROFILE_INTRO.detail}
      </p>

      <section className="section" aria-labelledby="hex-h">
        <h2 id="hex-h">六條爻</h2>
        <p className="muted">易經的卦由下往上數爻。下卦（1–3）體系描述為較向內，上卦（4–6）較向外。點選一條爻可篩選下方的人生角色。</p>
        <div className="hexagram" role="group" aria-label="依爻位篩選人生角色">
          {[...LINES].reverse().map((l) => (
            <button
              key={l.line}
              type="button"
              className={`hex-line half-${l.half}${line === l.line ? ' is-active' : ''}`}
              aria-pressed={line === l.line}
              onClick={() => setLine(line === l.line ? null : l.line)}
            >
              <span className="hex-num">{l.line}</span>
              <span className="hex-bar" aria-hidden="true" />
              <span className="hex-name">
                {l.name}
                <span className="en">{l.english}</span>
              </span>
            </button>
          ))}
        </div>
        {line && (
          <div className="line-detail" aria-live="polite">
            {(() => {
              const l = LINES[line - 1];
              return (
                <>
                  <h3>
                    第 {l.line} 爻：{l.name} <span className="en">{l.english}</span>
                  </h3>
                  {l.altNames.length > 0 && <p className="muted">其他譯名：{l.altNames.join('、')}</p>}
                  <p>
                    <strong>{l.summary}</strong>
                  </p>
                  <p>
                    <LayerTag layer="system" /> {l.detail}
                  </p>
                  <p>
                    <LayerTag layer="editorial" /> {l.observe}
                  </p>
                  <button type="button" className="btn btn-quiet" onClick={() => setLine(null)}>
                    清除篩選，顯示全部 12 種
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="list-h">
        <h2 id="list-h">
          {line ? `含第 ${line} 爻的人生角色（${shown.length} 種）` : '12 種人生角色'}
        </h2>
        <ul className="profile-grid">
          {shown.map((p) => (
            <li key={p.id} className="profile-card">
              <p className="profile-id">{p.id}</p>
              <p className="profile-names">
                {LINES[p.conscious - 1].name}／{LINES[p.unconscious - 1].name}
              </p>
              <p className="chip">{GEOMETRY_LABEL[p.geometry].name}</p>
              <p>{p.note}</p>
              <p className="muted small">
                意識面第 {p.conscious} 爻・潛意識面第 {p.unconscious} 爻
              </p>
            </li>
          ))}
        </ul>
        <dl className="facts">
          {(Object.keys(GEOMETRY_LABEL) as (keyof typeof GEOMETRY_LABEL)[]).map((k) => (
            <div key={k}>
              <dt>{GEOMETRY_LABEL[k].name}</dt>
              <dd>{GEOMETRY_LABEL[k].text}</dd>
            </div>
          ))}
        </dl>
        <p>
          <VerificationBadge status={PROFILE_INTRO.verification} />{' '}
          <span className="muted small">各組合的簡述為本站依兩條爻的體系說法整理，不是原始教材的逐字內容。</span>
        </p>
      </section>

      <Callout tone="caution" title="使用界線">
        <p>{PROFILE_INTRO.caution}</p>
      </Callout>
    </div>
  );
}
