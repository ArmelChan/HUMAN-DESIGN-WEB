import { Explorer } from '../components/Explorer';
import { HeroWheel } from '../figures/GateWheel';
import { replaceHash, type Route } from '../lib/router';
import { decodeSelection, encodeSelection, type Selection } from '../lib/selection';

export function HomePage({ route }: { route: Route }) {
  const selection = decodeSelection(route.query.get('s'));
  const onSelect = (sel: Selection) => {
    const code = encodeSelection(sel);
    replaceHash(code ? `#/?s=${code}` : '#/');
  };

  return (
    <div className="page page-wide">
      <div className="intro-strip hero">
        <div className="hero-text">
        <h1>
          人類圖圖解
          <span className="h1-sub">從 BodyGraph 的九個中心開始認識人類圖</span>
        </h1>
        <p>
          點選圖中的形狀、連線或數字，右側（手機在下方）會說明它在人類圖體系中的意思。這張是結構圖，只畫出所有可能的中心、通道與閘門，<strong>不代表任何人的人類圖</strong>。
        </p>
        <p className="hero-links">
          <a className="btn" href="#/chart">產生自己的圖</a>
          <a className="btn btn-quiet" href="#/intro">先看一張圖怎麼讀</a>
        </p>
        </div>
        <HeroWheel />
      </div>

      <Explorer
        selection={selection}
        onSelect={onSelect}
        modeLabel="結構圖・非個人資料"
        graphTitle="人類圖 BodyGraph 結構圖"
        graphDescription="九個能量中心、36 條通道與 64 個閘門的示意圖。每個中心都可以點選查看說明。"
      />

      <section className="section" aria-labelledby="next-h">
        <h2 id="next-h">接下來可以讀什麼</h2>
        <div className="cards">
          <a className="card" href="#/intro">
            <span className="card-kicker">入門</span>
            <span className="card-title">一張圖怎麼讀</span>
            <span className="card-text">類型、策略、內在權威、人生角色與中心、通道、閘門之間的關係，以及哪些是整體結構、哪些是個別元素。</span>
          </a>
          <a className="card" href="#/types">
            <span className="card-kicker">比較</span>
            <span className="card-title">類型與內在權威</span>
            <span className="card-text">五種類型的判定規則、策略與非自己主題並列比較，以及權威的判定順序。</span>
          </a>
          <a className="card" href="#/lab">
            <span className="card-kicker">互動</span>
            <span className="card-title">規則實驗室</span>
            <span className="card-text">自己點亮閘門，觀察中心如何變成有定義，類型與權威如何依規則改變。</span>
          </a>
          <a className="card" href="#/channels">
            <span className="card-kicker">索引</span>
            <span className="card-title">36 條通道・64 個閘門</span>
            <span className="card-text">可搜尋、可依中心篩選的結構索引，並標明哪些解讀尚未收錄。</span>
          </a>
        </div>
      </section>

      <section className="section narrow" aria-labelledby="stance-h">
        <h2 id="stance-h">閱讀前先知道的三件事</h2>
        <ol className="plain-list">
          <li>
            人類圖是 1987 年由 Ra Uru Hu 提出的體系，結合了易經、占星、卡巴拉生命之樹與脈輪等元素。它對人的描述<strong>沒有經過科學研究驗證</strong>，本站轉述體系說法時會標示「體系說法」。
          </li>
          <li>
            個人人類圖要以出生日期、時間與時區計算行星位置。這張首頁圖與<a href="#/lab">規則實驗室</a>都不是個人資料；要看自己的圖，請到<a href="#/chart">個人排圖</a>，計算只在你的瀏覽器內進行。
          </li>
          <li>
            閱讀描述性的文字時，人容易覺得籠統的描述「說的就是我」（心理學稱巴納姆效應或佛瑞效應）。本站的「自我觀察」提示是用來留意，而不是用來確認。
          </li>
        </ol>
      </section>
    </div>
  );
}
