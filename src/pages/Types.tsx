import { useEffect, useState } from 'react';
import { Callout, LayerTag, VerificationBadge } from '../components/Common';
import {
  AUTHORITIES,
  AUTHORITY_ORDER,
  SHARE_NOTE,
  TYPES,
  TYPE_CLASSIFICATION_NOTE,
  TYPE_ORDER,
} from '../data/content/types';
import type { TypeId } from '../lib/derive';

export function TypesPage({ anchor }: { anchor: string | null }) {
  const [active, setActive] = useState<TypeId>('generator');

  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
  }, [anchor]);

  const t = TYPES[active];

  return (
    <div className="page">
      <h1>
        類型、策略與內在權威
        <span className="h1-sub">它們都從中心的定義狀態推導而來</span>
      </h1>
      <p className="lede">
        類型由兩個問題決定：薦骨中心有沒有定義？有沒有動力中心經通道連到喉嚨？策略是體系針對各類型給出的互動建議；內在權威則另外依「哪些中心有定義」按固定順位決定。
      </p>

      <section className="section" aria-labelledby="tree-h">
        <h2 id="tree-h">判定類型的兩個問題</h2>
        <div className="decision" role="img" aria-label="判定流程：先看是否有任何中心有定義，沒有則是反映者。有的話看薦骨是否有定義：有定義且動力中心連到喉嚨為顯示生產者，否則為生產者；薦骨無定義且動力中心連到喉嚨為顯示者，否則為投射者。">
          <div className="dq">有任何中心有定義嗎？</div>
          <div className="dbranches">
            <div className="dbranch">
              <span className="dlabel">沒有</span>
              <button type="button" className="dleaf" onClick={() => setActive('reflector')}>反映者</button>
            </div>
            <div className="dbranch">
              <span className="dlabel">有</span>
              <div className="dq">薦骨中心有定義嗎？</div>
              <div className="dbranches">
                <div className="dbranch">
                  <span className="dlabel">有</span>
                  <div className="dq">動力中心連到喉嚨？</div>
                  <div className="dbranches">
                    <div className="dbranch">
                      <span className="dlabel">是</span>
                      <button type="button" className="dleaf" onClick={() => setActive('manifestingGenerator')}>顯示生產者</button>
                    </div>
                    <div className="dbranch">
                      <span className="dlabel">否</span>
                      <button type="button" className="dleaf" onClick={() => setActive('generator')}>生產者</button>
                    </div>
                  </div>
                </div>
                <div className="dbranch">
                  <span className="dlabel">沒有</span>
                  <div className="dq">動力中心連到喉嚨？</div>
                  <div className="dbranches">
                    <div className="dbranch">
                      <span className="dlabel">是</span>
                      <button type="button" className="dleaf" onClick={() => setActive('manifestor')}>顯示者</button>
                    </div>
                    <div className="dbranch">
                      <span className="dlabel">否</span>
                      <button type="button" className="dleaf" onClick={() => setActive('projector')}>投射者</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="muted">
          動力中心是薦骨、情緒、意志力、根部四個。「連到喉嚨」可以是直接相連，也可以經過其他有定義的中心間接相連。點選上方的類型可在下方查看說明。
        </p>
        <Callout title={TYPE_CLASSIFICATION_NOTE.title}>
          <p>{TYPE_CLASSIFICATION_NOTE.text}</p>
        </Callout>
      </section>

      <section className="section" aria-labelledby="compare-h">
        <h2 id="compare-h">並列比較</h2>
        <div className="table-wrap">
          <table className="compare">
            <caption>五種類型的體系說法（比例為常被引用的數字，見表下說明）</caption>
            <thead>
              <tr>
                <th scope="col">類型</th>
                <th scope="col">判定規則</th>
                <th scope="col">策略</th>
                <th scope="col">標誌</th>
                <th scope="col">非自己主題</th>
                <th scope="col">常引用比例</th>
              </tr>
            </thead>
            <tbody>
              {TYPE_ORDER.map((id) => {
                const x = TYPES[id];
                return (
                  <tr key={id} className={id === active ? 'is-active' : undefined}>
                    <th scope="row">
                      <button type="button" className="inline-link" onClick={() => setActive(id)} aria-pressed={id === active}>
                        {x.name}
                      </button>
                      <span className="en">{x.english}</span>
                    </th>
                    <td>{x.rule}</td>
                    <td>
                      {x.strategy}
                      <span className="en">{x.strategyEnglish}</span>
                    </td>
                    <td>{x.signature}</td>
                    <td>{x.notSelf}</td>
                    <td>{x.commonlyCitedShare}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">{SHARE_NOTE}</p>
      </section>

      <section className="section type-detail" aria-labelledby="type-h" aria-live="polite">
        <h2 id="type-h">
          {t.name} <span className="en">{t.english}</span>
        </h2>
        <p className="tabs" role="group" aria-label="切換類型">
          {TYPE_ORDER.map((id) => (
            <button key={id} type="button" className={`tab${id === active ? ' is-active' : ''}`} aria-pressed={id === active} onClick={() => setActive(id)}>
              {TYPES[id].name}
            </button>
          ))}
        </p>
        <p className="lede">{t.summary}</p>
        <p>
          <LayerTag layer="system" /> {t.detail}
        </p>
        <dl className="facts">
          <div>
            <dt>氣場（體系用語）</dt>
            <dd>{t.aura}</dd>
          </div>
          <div>
            <dt>可能的內在權威</dt>
            <dd className="pill-row">
              {t.possibleAuthorities.map((a) => (
                <a key={a} className="pill" href={`#/types#auth-${a}`}>
                  {AUTHORITIES[a].name}
                </a>
              ))}
            </dd>
          </div>
          {t.altNames.length > 0 && (
            <div>
              <dt>其他譯名</dt>
              <dd>{t.altNames.join('、')}</dd>
            </div>
          )}
        </dl>
        <h3>常見誤解</h3>
        <ul>
          {t.misconceptions.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <h3>
          可供自我觀察的情境 <LayerTag layer="editorial" />
        </h3>
        <ul>
          {t.observe.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <h3>
          不應據此推論 <LayerTag layer="editorial" />
        </h3>
        <p>{t.notInfer}</p>
        <p>
          <VerificationBadge status={t.verification} />
        </p>
      </section>

      <section className="section" id="authority" aria-labelledby="authority-h">
        <h2 id="authority-h">內在權威的判定順序</h2>
        <p>
          體系把內在權威看成做決定時可以依靠的訊號。一張圖只有一個內在權威，判定方式是由上往下檢查，遇到第一個有定義的中心就停下來。所以情緒中心有定義的人，即使薦骨也有定義，權威仍是情緒。
        </p>
        <ol className="authority-ladder">
          {AUTHORITY_ORDER.map((id) => {
            const a = AUTHORITIES[id];
            return (
              <li key={id} id={`auth-${id}`} className="authority-step">
                <div className="authority-rank" aria-hidden="true">
                  {a.rank}
                </div>
                <div>
                  <h3>
                    {a.name} <span className="en">{a.english}</span>
                  </h3>
                  <p className="muted">
                    依據：{a.center}｜可能出現於：{a.types.map((x) => TYPES[x].name).join('、')}
                  </p>
                  <p>{a.summary}</p>
                  <details className="more">
                    <summary>更多說明與觀察方式</summary>
                    <p>
                      <LayerTag layer="system" /> {a.detail}
                    </p>
                    <p>
                      <LayerTag layer="editorial" /> {a.observe}
                    </p>
                    <p className="muted">{a.caution}</p>
                    {a.altNames.length > 0 && <p className="muted">其他譯名：{a.altNames.join('、')}</p>}
                  </details>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="muted">意志力權威依連接方式分為顯示與投射兩種，因此在順位上同列第 4。</p>
        <Callout tone="caution" title="權威不是決策保證">
          內在權威是體系提出的決策方式，本站只做說明。重大的醫療、財務、法律或安全決定，仍應參考專業意見與實際資訊。
        </Callout>
      </section>
    </div>
  );
}
