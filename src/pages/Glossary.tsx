import { useState } from 'react';
import { VerificationBadge } from '../components/Common';
import { GLOSSARY } from '../data/content/glossary';

export function GlossaryPage() {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const items = GLOSSARY.filter(
    (g) =>
      !needle ||
      g.term.toLowerCase().includes(needle) ||
      g.english.toLowerCase().includes(needle) ||
      g.variants.some((v) => v.includes(q.trim())),
  );
  return (
    <div className="page">
      <h1>
        詞彙與譯名
        <span className="h1-sub">本站用語、英文原名與其他常見譯法</span>
      </h1>
      <p className="lede">
        人類圖的中文譯名並不統一。本站每個概念只用一個名稱，其他譯法列在「也譯作」，方便對照其他中文資料。
      </p>
      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label>
          搜尋詞彙
          <input type="search" value={q} placeholder="中文、英文或其他譯名" onChange={(e) => setQ(e.target.value)} />
        </label>
      </form>
      <p className="result-count" role="status" aria-live="polite">
        {items.length} 個詞彙
      </p>
      {items.length === 0 ? (
        <div className="empty">
          <p>沒有找到「{q}」。可以試試英文原名，或到<a href="#/sources">來源頁</a>查看本站的收錄範圍。</p>
        </div>
      ) : (
        <dl className="glossary">
          {items.map((g) => (
            <div key={g.id} id={`term-${g.id}`} className="term">
              <dt>
                {g.term} <span className="en">{g.english}</span>
              </dt>
              <dd>
                <p>{g.definition}</p>
                {g.variants.length > 0 && <p className="muted small">也譯作：{g.variants.join('、')}</p>}
                <p className="term-foot">
                  <VerificationBadge status={g.verification} />
                  {g.link && <a href={g.link}>相關頁面</a>}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
