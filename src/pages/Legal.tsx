// 使用條款、隱私聲明、版權與使用指引三個獨立頁面。全部為待法律審閱的草稿。

import { Callout } from '../components/Common';
import { TERMS_META, TERMS_SECTIONS, type LegalSection } from '../data/legal/terms';
import { DATA_FLOWS, PRIVACY_META, PRIVACY_SECTIONS } from '../data/legal/privacy';
import { CONTENT_CLASSES, COPYRIGHT_SECTIONS } from '../data/legal/copyright';
import { ASSETS, CATEGORY_LABEL, assetSummary, type Permission } from '../data/legal/assets';
import { OPERATOR_FIELDS, PENDING_LABEL } from '../data/legal/operator';
import { DISCLAIMER } from '../data/disclaimer';

function DraftBanner({ version, status, updated }: { version: string; status: string; updated: string }) {
  return (
    <Callout tone="caution" title="草稿">
      <p>
        版本 {version}・{status}・最後更新 {updated}。本文件尚未經法律專業人員審閱，不保證在任何地區有效；公開上線前，營運者須補齊標示為「{PENDING_LABEL}」的欄位並完成審閱。
      </p>
    </Callout>
  );
}

function Sections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.id} className="section narrow" id={`sec-${s.id}`} aria-labelledby={`sec-${s.id}-h`}>
          <h2 id={`sec-${s.id}-h`}>{s.title}</h2>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
    </>
  );
}

export function TermsPage() {
  return (
    <div className="page">
      <h1>
        使用條款
        <span className="h1-sub">人類圖計算、體系解說與自我反思內容的使用規則</span>
      </h1>
      <DraftBanner {...TERMS_META} />
      <Callout title="簡明摘要">
        <p>{DISCLAIMER}</p>
      </Callout>
      <Sections sections={TERMS_SECTIONS} />
      <p>
        另見<a href="#/privacy">隱私聲明</a>與<a href="#/copyright">版權與使用指引</a>。
      </p>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="page">
      <h1>
        隱私聲明
        <span className="h1-sub">你輸入的資料去了哪裡</span>
      </h1>
      <DraftBanner {...PRIVACY_META} />
      <Sections sections={PRIVACY_SECTIONS.slice(0, 2)} />
      <div className="table-wrap">
        <table className="compare">
          <caption>依網站程式實際行為整理</caption>
          <thead>
            <tr>
              <th scope="col">資料</th>
              <th scope="col">在哪裡處理</th>
              <th scope="col">是否傳出</th>
              <th scope="col">保存</th>
            </tr>
          </thead>
          <tbody>
            {DATA_FLOWS.map((f) => (
              <tr key={f.data}>
                <th scope="row">{f.data}</th>
                <td>{f.where}</td>
                <td>{f.sentOut}</td>
                <td>{f.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Sections sections={PRIVACY_SECTIONS.slice(2)} />
    </div>
  );
}

const PERM: Record<Permission, string> = { yes: '可', no: '不可', unknown: '未確認', notApplicable: '不適用' };

export function CopyrightPage() {
  const sum = assetSummary();
  const categories = [...new Set(ASSETS.map((a) => a.category))];
  return (
    <div className="page page-wide">
      <h1>
        版權與使用指引
        <span className="h1-sub">本站內容、第三方素材與你的報告各自的權利狀態</span>
      </h1>
      <Callout tone="caution" title="草稿">
        <p>
          本頁尚未經法律專業人員審閱。素材登錄中「待確認」的項目，權利狀態尚未確認；公開上線前須逐項處理：取得授權、改用可授權的替代品，或暫停發布該素材。
        </p>
      </Callout>

      <section className="section" aria-labelledby="classes-h">
        <h2 id="classes-h">內容分類</h2>
        <dl className="facts">
          {CONTENT_CLASSES.map((c) => (
            <div key={c.id}>
              <dt>{c.name}</dt>
              <dd>{c.status}</dd>
            </div>
          ))}
        </dl>
      </section>

      {COPYRIGHT_SECTIONS.map((s) => (
        <section key={s.id} className="section narrow" aria-labelledby={`cp-${s.id}`}>
          <h2 id={`cp-${s.id}`}>{s.title}</h2>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}

      <section className="section" id="registry" aria-labelledby="registry-h">
        <h2 id="registry-h">
          第三方素材登錄（{sum.total} 項：已確認 {sum.confirmed}、待確認 {sum.pending}）
        </h2>
        <p className="muted">
          「已確認」只代表授權條件已查到並有證據，不代表所有用途都沒有問題。自動掃描（授權檔產生與測試）只能輔助，不取代人工核對。查核日期記錄於每一列。
        </p>
        {categories.map((cat) => (
          <div key={cat} className="table-wrap case-group">
            <table className="compare registry">
              <caption>{CATEGORY_LABEL[cat]}</caption>
              <thead>
                <tr>
                  <th scope="col">名稱</th>
                  <th scope="col">權利人與來源</th>
                  <th scope="col">授權與證據</th>
                  <th scope="col">商用／修改</th>
                  <th scope="col">署名與通知</th>
                  <th scope="col">使用範圍</th>
                  <th scope="col">狀態</th>
                </tr>
              </thead>
              <tbody>
                {ASSETS.filter((a) => a.category === cat).map((a) => (
                  <tr key={a.id} id={`asset-${a.id}`}>
                    <th scope="row">
                      {a.name}
                      {a.origin && (
                        <span className="muted small">
                          <br />
                          產生方式：{a.origin === 'original-code' ? '原創程式繪製' : a.origin === 'ai-generated' ? '外部 AI 生成' : '第三方素材'}
                          {a.file && `・${a.file}`}
                          {a.createdAt && `・建立 ${a.createdAt}`}
                          {a.tool && (
                            <>
                              <br />
                              工具：{a.tool}
                            </>
                          )}
                        </span>
                      )}
                    </th>
                    <td>
                      {a.rightsHolder}
                      {a.sourceUrl && (
                        <>
                          <br />
                          <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="small">
                            來源
                          </a>
                        </>
                      )}
                    </td>
                    <td>
                      {a.license}
                      {a.licenseVersion ? ` ${a.licenseVersion}` : ''}
                      <br />
                      <span className="muted small">證據：{a.evidence}</span>
                    </td>
                    <td>
                      {PERM[a.commercialUse]}／{PERM[a.modification]}
                    </td>
                    <td>{a.attribution}</td>
                    <td>
                      {a.scope}
                      {a.note && <span className="muted small"><br />{a.note}</span>}
                    </td>
                    <td>
                      <span className={`vstatus vstatus-${a.status === 'confirmed' ? 'multiSource' : 'pending'}`}>{a.status === 'confirmed' ? '已確認' : '待確認'}</span>
                      <br />
                      <span className="muted small">{a.checkedAt}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <p>
          開源授權全文見<a href="#/sources">來源頁的「第三方元件授權」</a>。
        </p>
      </section>

      <section className="section" aria-labelledby="op-h">
        <h2 id="op-h">待營運者確認的欄位</h2>
        <ul className="plain-list">
          {OPERATOR_FIELDS.map((f) => (
            <li key={f.key}>
              <strong>{f.label}：</strong>
              {f.value ?? PENDING_LABEL}
              <span className="muted small">（{f.note}）</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
