import { LayerTag, VerificationBadge } from '../components/Common';
import { THIRD_PARTY_LICENSES } from '../data/licenses.generated';
import { LAYER_LABEL, SOURCES, VERIFICATION_LABEL, type Layer, type Verification } from '../data/sources';

const KIND_LABEL = {
  primary: '體系原始資料',
  secondary: '其他作者著作',
  'web-crosscheck': '建置時交叉比對用的網路資料',
  science: '科學文獻',
} as const;

export function SourcesPage() {
  return (
    <div className="page">
      <h1>
        來源與編輯註記
        <span className="h1-sub">內容從哪裡來、核實到什麼程度</span>
      </h1>

      <section className="section" aria-labelledby="layers-h">
        <h2 id="layers-h">內容的四種層次</h2>
        <dl className="facts">
          {(Object.keys(LAYER_LABEL) as Layer[]).map((k) => (
            <div key={k}>
              <dt>
                <LayerTag layer={k} />
              </dt>
              <dd>{LAYER_LABEL[k].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section" aria-labelledby="ver-h">
        <h2 id="ver-h">核實狀態</h2>
        <dl className="facts">
          {(Object.keys(VERIFICATION_LABEL) as Verification[]).map((k) => (
            <div key={k}>
              <dt>
                <VerificationBadge status={k} />
              </dt>
              <dd>{VERIFICATION_LABEL[k].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section" aria-labelledby="src-h">
        <h2 id="src-h">參考來源</h2>
        <ul className="source-list">
          {SOURCES.map((s) => (
            <li key={s.id}>
              <p className="muted small">{KIND_LABEL[s.kind]}</p>
              <p>
                <cite>{s.url ? <a href={s.url} rel="noopener noreferrer" target="_blank">{s.title}</a> : s.title}</cite>
                {s.author && `，${s.author}`}
                {s.publisher && `，${s.publisher}`}
                {s.year && `，${s.year}`}
              </p>
              <p>{s.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="notes-h">
        <h2 id="notes-h">編輯註記</h2>
        <ul className="plain-list">
          <li>
            <strong>本次建置實際做到的查證：</strong>以網路搜尋比對了中心數、閘門數、通道數，生產者與投射者的判定規則，整合通道組（10-20、20-34、34-57、10-57）與中心迴路（10-34、25-51）的組成。其餘結構資料與體系說法依編輯對通行資料的整理，尚未與原始教材逐頁核對，因此標為「依通行資料整理」。
          </li>
          <li>
            <strong>譯名：</strong>中心、類型、權威與人生角色採台灣中文資料常見的譯名；通道中文名稱為本站暫譯；閘門暫只列易經卦名與英文關鍵詞。
          </li>
          <li>
            <strong>未定義與完全開放：</strong>資料之間用法不一，有的視為同義。本站採區分的用法，並在每處說明。
          </li>
          <li>
            <strong>類型數量：</strong>Ra Uru Hu 原始教材為四種類型（顯示生產者屬生產者），許多後續教材列為五種。本站並列五種，並標明這一點。
          </li>
          <li>
            <strong>圖形：</strong>BodyGraph 為本站自行繪製，中心相對位置依常見版面，比例與座標不是官方圖譜。少數通道（如 20-34）為避免穿過其他中心而畫成曲線，曲線沒有額外意義。
          </li>
          <li>
            <strong>尚未收錄：</strong>各通道與閘門的詳細解讀、閘門六爻內容、輪迴交叉的名稱與解讀、變數（Variables）。
          </li>
          <li>
            <strong>個人排圖的驗證：</strong>以單元測試檢查——太陽位置與獨立公式在 1900–2100 年間差距小於 1 角分；J2000 曆元九顆行星的位置與已知值相差 1° 以內；設計時刻的太陽恰好少 88°；500 個隨機時刻算出的人生角色全部落在 12 種合法組合內；32 組太陽／地球對沖閘門與常見的輪迴交叉配對一致；台灣 1979 年夏令時間與美國夏令時間切換的換算正確。另與第三方轉錄的 5 張參照圖比對，130 個啟動點全部一致（二手參照）。直接與其他人類圖軟體比對尚未完成，標記為 pending_external_validation，詳見<a href="#/verification">計算驗證</a>。
          </li>
          <li>
            <strong>交點：</strong>採密切（真）交點，由月球狀態向量求得，與 Swiss Ephemeris 的 TRUE_NODE 定義相同。先前版本使用 Meeus 的近似公式，與密切交點最多相差約 17 角分，已改正。部分軟體採平均交點，排圖結果頁會列出差異。
          </li>
          <li>
            <strong>「自我觀察」與「不應據此推論」</strong>兩類段落由本站撰寫，不屬於體系教材。
          </li>
        </ul>
      </section>
      <section className="section" id="licenses" aria-labelledby="licenses-h">
        <h2 id="licenses-h">第三方元件授權</h2>
        <p>
          本站打包了下列開源元件。MIT 授權要求在軟體的副本中保留版權聲明與授權聲明，以下全文直接取自各套件安裝檔，由建置腳本產生。
        </p>
        {THIRD_PARTY_LICENSES.map((l) => (
          <details key={l.name} className="more">
            <summary>
              {l.name} {l.version}（{l.license}）
            </summary>
            <pre className="license-text">{l.text}</pre>
          </details>
        ))}
      </section>
    </div>
  );
}
