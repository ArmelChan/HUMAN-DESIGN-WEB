import { Callout, LayerTag } from '../components/Common';

interface FlowNode {
  id: string;
  title: string;
  text: string;
  href?: string;
  tone: 'input' | 'element' | 'whole';
}

const FLOW: FlowNode[][] = [
  [
    {
      id: 'birth',
      title: '出生時刻',
      text: '出生日期、時間與出生地時區。個人排圖頁從這裡開始，在瀏覽器內計算。',
      href: '#/chart',
      tone: 'input',
    },
  ],
  [
    {
      id: 'activations',
      title: '26 個啟動點',
      text: '出生時（人格，13 個）與太陽回推 88 度時（設計，13 個）的太陽、地球、月亮、南北交點與各行星位置。',
      tone: 'input',
    },
  ],
  [
    {
      id: 'gates',
      title: '閘門與爻',
      text: '每個啟動點落在 64 個閘門之一，也落在該閘門 6 條爻中的一條。',
      href: '#/gates',
      tone: 'element',
    },
  ],
  [
    {
      id: 'channels',
      title: '通道',
      text: '一條通道兩端的閘門都被啟動，這條通道才成立。',
      href: '#/channels',
      tone: 'element',
    },
  ],
  [
    {
      id: 'centers',
      title: '能量中心',
      text: '連著成立通道的中心有定義；沒有的是未定義或完全開放。',
      href: '#/centers',
      tone: 'element',
    },
  ],
  [
    {
      id: 'type',
      title: '類型 → 策略',
      text: '看薦骨是否有定義、動力中心是否連到喉嚨，決定類型；策略跟著類型而來。',
      href: '#/types',
      tone: 'whole',
    },
    {
      id: 'authority',
      title: '內在權威',
      text: '依有定義中心的固定順位決定：情緒、薦骨、直覺、意志力、G 中心……',
      href: '#/types#authority',
      tone: 'whole',
    },
    {
      id: 'definition',
      title: '定義類型',
      text: '有定義的中心彼此連成幾群：一分、二分、三分或四分。',
      href: '#/lab',
      tone: 'whole',
    },
    {
      id: 'profile',
      title: '人生角色',
      text: '直接取自意識與潛意識太陽所在的爻位，不經過中心與通道。',
      href: '#/profiles',
      tone: 'whole',
    },
  ],
];

const TONE_LABEL = { input: '計算輸入', element: '個別元素', whole: '整體結構' } as const;

export function IntroPage() {
  return (
    <div className="page">
      <h1>
        一張人類圖怎麼讀
        <span className="h1-sub">從計算來源到類型、權威的推導順序</span>
      </h1>
      <p className="lede">
        人類圖裡的名詞彼此不是並列的。類型、內在權威是從中心的定義狀態推導出來的；中心的定義狀態又取決於通道；通道取決於閘門。理解這個順序，就比較不會把「類型」當成孤立的性格標籤。
      </p>

      <section className="section" aria-labelledby="flow-h">
        <h2 id="flow-h">推導順序</h2>
        <p className="muted">每一層都由上一層決定。點選方塊可以前往對應頁面。</p>
        <ol className="flow">
          {FLOW.map((row, i) => (
            <li key={i} className={`flow-row cols-${row.length}`}>
              {row.map((n) => {
                const body = (
                  <>
                    <span className="flow-tag">{TONE_LABEL[n.tone]}</span>
                    <span className="flow-title">{n.title}</span>
                    <span className="flow-text">{n.text}</span>
                  </>
                );
                return n.href ? (
                  <a key={n.id} className={`flow-node tone-${n.tone}`} href={n.href}>
                    {body}
                  </a>
                ) : (
                  <div key={n.id} className={`flow-node tone-${n.tone}`}>
                    {body}
                  </div>
                );
              })}
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="whole-h">
        <h2 id="whole-h">整體結構與個別元素</h2>
        <p>
          讀圖時常見的混淆，是把某個閘門或某條通道的描述，當成整張圖的結論。體系的讀法是先看整體結構，再看個別元素。
        </p>
        <div className="table-wrap">
          <table className="compare">
            <caption>兩種層次的差別</caption>
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">整體結構</th>
                <th scope="col">個別元素</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">包含</th>
                <td>類型、策略、內在權威、定義類型、人生角色</td>
                <td>單一中心的狀態、單一通道、單一閘門</td>
              </tr>
              <tr>
                <th scope="row">怎麼得到</th>
                <td>綜合整張圖的定義與連接關係推導</td>
                <td>直接看某個部位是否被啟動或有定義</td>
              </tr>
              <tr>
                <th scope="row">體系中的用途</th>
                <td>做決定的方式、與他人互動的方式</td>
                <td>描述特定主題的運作與傾向</td>
              </tr>
              <tr>
                <th scope="row">常見誤讀</th>
                <td>把類型當成性格分類或職業建議</td>
                <td>只看一條通道就下整體結論</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="demo-h">
        <h2 id="demo-h">示範圖不是你的人類圖</h2>
        <p>
          本站有兩種圖：首頁與各頁的<strong>結構圖</strong>只畫出所有可能的部位，沒有任何啟動狀態；<a href="#/lab">規則實驗室</a>裡的<strong>示例</strong>是為了展示判定規則而挑選的閘門組合。兩者都不是由出生資料算出，不能拿來對照自己。只有<a href="#/chart">個人排圖</a>頁的結果，是依你輸入的出生資料計算的。
        </p>
        <p>
          個人排圖需要正確處理出生時間、出生地時區與夏令時間，並計算行星位置。本站的排圖頁以開源天文函式庫在瀏覽器內計算，並附上時間誤差檢查；它計算的是天文位置，對這些位置的解讀仍屬體系主張。
        </p>
      </section>

      <section className="section" aria-labelledby="sci-h">
        <h2 id="sci-h">體系主張與科學事實的界線</h2>
        <div className="two-col">
          <div>
            <p>
              <LayerTag layer="system" />
            </p>
            <ul>
              <li>出生時的行星位置與微中子會在人身上留下「印記」，形成每個人的設計。</li>
              <li>九個中心對應身體的特定器官或腺體。</li>
              <li>依類型、策略與權威生活，能減少「非自己」的挫折、憤怒、苦澀或失望。</li>
            </ul>
          </div>
          <div>
            <p>
              <LayerTag layer="science" />
            </p>
            <ul>
              <li>微中子確實存在且大量穿過人體，但沒有研究顯示它們會在人身上留下性格或命運方面的訊息。</li>
              <li>解剖學與內分泌學中沒有「能量中心」這種結構，中心與器官的對應屬於體系的象徵說法。</li>
              <li>目前沒有經同儕審查的研究證實人類圖類型能預測行為、能力或人生結果。</li>
            </ul>
          </div>
        </div>
        <Callout tone="caution" title="使用界線">
          人類圖不能用於醫療、心理診斷、招募篩選或替他人做決定。若你正在面對健康、情緒或安全方面的困難，請向相關專業人員求助。
        </Callout>
      </section>
    </div>
  );
}
