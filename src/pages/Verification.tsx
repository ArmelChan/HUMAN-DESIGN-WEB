import { useMemo, useState } from 'react';
import { Callout } from '../components/Common';
import { MANDALA_RULES, RULE_STATUS_LABEL, WIDTH_DEG, type RuleStatus } from '../data/rules/mandala';
import { REFERENCE_CHARTS, REFERENCE_ORDER, REFERENCE_SOURCE } from '../data/validation/references';
import { BASIS_LABEL, GROUP_LABEL, VALIDATION_CASES, type CaseGroup } from '../data/validation/cases';
import { AUTHORITIES, TYPES } from '../data/content/types';
import { computeChart } from '../lib/chart';
import { localToUtc } from '../lib/timezone';
import { formatZodiac, gateStartLongitude } from '../lib/mandala';
import { ASTRONOMY_ENGINE } from '../lib/ephemeris';
import { DISCLAIMER } from '../data/disclaimer';

function StatusChip({ status }: { status: RuleStatus | 'pending_external_validation' | 'internal' | 'third_party_transcribed' }) {
  const label =
    status === 'pending_external_validation'
      ? '待外部驗證'
      : status === 'internal'
        ? '僅內部測試'
        : status === 'third_party_transcribed'
          ? '二手參照'
          : RULE_STATUS_LABEL[status];
  return <span className={`vstatus vstatus-${status}`}>{label}</span>;
}

function useReferenceResults() {
  return useMemo(
    () =>
      REFERENCE_CHARTS.map((ref) => {
        const [year, month, day] = ref.local.date.split('-').map(Number);
        const [hour, minute] = ref.local.time.split(':').map(Number);
        const conv = localToUtc({ year, month, day, hour, minute }, ref.local.tz);
        if (conv.kind !== 'ok') return { ref, error: conv.kind as string, chart: null, match: 0, diffs: [] as string[] };
        const chart = computeChart(conv.utc);
        let match = 0;
        const diffs: string[] = [];
        for (const [side, list] of [['personality', ref.personality], ['design', ref.design]] as const) {
          REFERENCE_ORDER.forEach((body, i) => {
            const a = chart[side].find((x) => x.body === body)!;
            const got = `${a.gate}.${a.line}`;
            if (got === list[i]) match++;
            else diffs.push(`${side === 'personality' ? '人格' : '設計'} ${body}：${got}（參照 ${list[i]}）`);
          });
        }
        return { ref, error: null as string | null, chart, match, diffs };
      }),
    [],
  );
}

function useCaseResults() {
  return useMemo(
    () =>
      VALIDATION_CASES.map((c) => {
        const [year, month, day] = c.input.date.split('-').map(Number);
        const [hour, minute] = c.input.time.split(':').map(Number);
        const conv = localToUtc({ year, month, day, hour, minute }, c.input.tz);
        const kindOk = !c.expect.kind || c.expect.kind === conv.kind;
        if (conv.kind === 'invalid' || conv.kind === 'nonexistent') return { c, conv, kindOk, summary: conv.kind === 'invalid' ? '拒絕：無效日期' : '提示：時刻不存在' };
        const first = conv.kind === 'ambiguous' ? conv.options[0] : conv;
        const chart = computeChart(first.utc);
        const t = TYPES[chart.derivation.type].name;
        const a = AUTHORITIES[chart.derivation.authority].name;
        const utcOk = !c.expect.utc || c.expect.utc === first.utc.toISOString();
        return {
          c,
          conv,
          kindOk: kindOk && utcOk,
          summary: `${first.utc.toISOString().slice(0, 16).replace('T', ' ')} UTC・${t}・${a}・${chart.profile.conscious}/${chart.profile.unconscious}${conv.kind === 'ambiguous' ? '（重複時刻，顯示第一個時差）' : ''}`,
        };
      }),
    [],
  );
}

export function VerificationPage() {
  const refs = useReferenceResults();
  const cases = useCaseResults();
  const [copied, setCopied] = useState('');
  const totalMatch = refs.reduce((s, r) => s + r.match, 0);
  const passCount = cases.filter((x) => x.kindOk).length;

  const copyCases = async () => {
    const payload = VALIDATION_CASES.map((c) => ({ id: c.id, ...c.input, external: c.external.status }));
    const text = JSON.stringify(payload, null, 1);
    try {
      await navigator.clipboard.writeText(text);
      setCopied('已複製 30 組測例的輸入資料（不含任何使用者資料）。');
    } catch {
      setCopied('無法自動複製，請從下方表格手動抄錄。');
    }
  };

  const groups = Object.keys(GROUP_LABEL) as CaseGroup[];

  return (
    <div className="page">
      <h1>
        計算驗證
        <span className="h1-sub">每一層驗證了什麼、還缺什麼</span>
      </h1>
      <Callout title="使用前說明">
        <p>{DISCLAIMER}</p>
      </Callout>

      <section className="section" aria-labelledby="layers-h">
        <h2 id="layers-h">三種不同的驗證</h2>
        <div className="table-wrap">
          <table className="compare">
            <caption>三個層次各自回答不同的問題，彼此不能互相證明</caption>
            <thead>
              <tr>
                <th scope="col">層次</th>
                <th scope="col">應回答的問題</th>
                <th scope="col">不能混為一談的事</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">天文與時間計算</th>
                <td>出生時間的換算與行星位置是否可重現？</td>
                <td>天文計算正確，不代表人格解讀成立。</td>
              </tr>
              <tr>
                <th scope="row">人類圖體系內的一致性</th>
                <td>閘門、通道、類型等是否符合所採用的規則？</td>
                <td>與其他排圖網站一致，不代表心理或命運預測已被證明有效。</td>
              </tr>
              <tr>
                <th scope="row">個人解讀與應用</th>
                <td>文字是否忠於來源、清楚標示限制？</td>
                <td>
                  「我覺得很像」不能單獨作為驗證方法；這正是巴納姆效應帶來的風險（見
                  <a href="https://www.britannica.com/science/Barnum-Effect" target="_blank" rel="noopener noreferrer">
                    Britannica「Barnum Effect」
                  </a>
                  ）。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          Jovian Archive 是「人類圖體系如何定義自身」的原始來源，例如人格取出生時刻、設計取太陽回推約 88° 的時刻。
          它自稱的「科學」或「能量藍圖」屬體系主張，本站不把它改寫成已獲獨立科學驗證的結論。
        </p>
      </section>

      <section className="section" aria-labelledby="matrix-h">
        <h2 id="matrix-h">驗證矩陣</h2>
        <div className="table-wrap">
          <table className="compare">
            <caption>「本站目前做到的」只列已執行並通過的檢查；跨軟體比對一欄如實標示狀態</caption>
            <thead>
              <tr>
                <th scope="col">層級</th>
                <th scope="col">比較欄位</th>
                <th scope="col">差異時先檢查</th>
                <th scope="col">本站目前做到的</th>
                <th scope="col">跨軟體比對</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">時間</th>
                <td>UTC、時區偏移、設計時刻</td>
                <td>夏令時間、曆法、求根方式</td>
                <td>以瀏覽器內建的 IANA 時區資料換算；14 組時間與曆法測例符合預期；設計時刻自行求根，殘差小於 10⁻⁸°，與函式庫搜尋結果相差不到 1 秒。</td>
                <td><StatusChip status="pending_external_validation" /></td>
              </tr>
              <tr>
                <th scope="row">天文</th>
                <td>各啟動點黃經</td>
                <td>星曆、座標設定、交點算法</td>
                <td>太陽位置與獨立公式相差不到 1 角分（1900–2100）；J2000 九顆行星與已知值相差 1° 以內；交點採密切交點。</td>
                <td><StatusChip status="pending_external_validation" /></td>
              </tr>
              <tr>
                <th scope="row">映射</th>
                <td>閘門、爻</td>
                <td>起點、閘門順序、邊界處理</td>
                <td>64 個閘門順序與兩份開源實作逐一一致；起點有分歧（302° 或 302.057°），參照資料支持 302°。</td>
                <td>
                  <StatusChip status="third_party_transcribed" /> {totalMatch}/130
                </td>
              </tr>
              <tr>
                <th scope="row">圖結構</th>
                <td>通道、中心、定義</td>
                <td>連接表、圖論計算</td>
                <td>18 項規則單元測試；3 張參照圖的有定義中心一致。</td>
                <td><StatusChip status="third_party_transcribed" /></td>
              </tr>
              <tr>
                <th scope="row">派生分類</th>
                <td>類型、策略、權威、人生角色</td>
                <td>規則優先序、特殊情況</td>
                <td>30 組測例涵蓋五種類型、八種權威、五種定義；500 個隨機時刻的人生角色都落在 12 種合法組合內。</td>
                <td><StatusChip status="third_party_transcribed" /></td>
              </tr>
              <tr>
                <th scope="row">進階項目</th>
                <td>四箭頭、色、調、基底</td>
                <td>更細的邊界、出生時間誤差</td>
                <td>色、調、基底依單一第三方規則計算並顯示數值；四箭頭（變數）尚未實作；沒有任何參照資料。</td>
                <td><StatusChip status="pending_external_validation" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="ref-h">
        <h2 id="ref-h">第三方轉錄參照圖：{totalMatch}/130 個啟動點一致</h2>
        <p>
          資料取自 <a href={REFERENCE_SOURCE.url} target="_blank" rel="noopener noreferrer">{REFERENCE_SOURCE.label}</a>（{REFERENCE_SOURCE.license}）。
          轉錄者表示數值抄錄自「某個以 Swiss Ephemeris 為基礎的線上排圖器」的截圖，但沒有公開排圖器名稱，本站也無法取得原始截圖。
          因此這是二手參照：它能抓出明顯錯誤，但不等同於直接與其他軟體比對。以下結果在你的瀏覽器中即時計算。
        </p>
        <div className="table-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">參照圖</th>
                <th scope="col">一致</th>
                <th scope="col">本站推得</th>
                <th scope="col">備註</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.ref.id}>
                  <th scope="row">
                    {r.ref.label}
                    <span className="en">{r.ref.local.tz}</span>
                  </th>
                  <td className="num">{r.error ?? `${r.match}/26`}</td>
                  <td>
                    {r.chart
                      ? `${TYPES[r.chart.derivation.type].name}・${AUTHORITIES[r.chart.derivation.authority].name}・${r.chart.profile.conscious}/${r.chart.profile.unconscious}`
                      : ''}
                    {r.ref.derivedFromScreenshot ? '（類型等與轉錄者核對的截圖一致）' : '（轉錄者未核對截圖的衍生結果，不列為參照）'}
                  </td>
                  <td>
                    {r.diffs.length > 0 && <span>{r.diffs.join('；')}。</span>}
                    {r.ref.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="cases-h">
        <h2 id="cases-h">30 組合成測例：{passCount}/30 符合預期</h2>
        <p>
          「預期」只採用不靠本站引擎就能得知的事實（例如香港 1980 年後不實施夏令時間），或依本站規則表推導的結果，各列標示依據。
          本站引擎的完整輸出另存為內部快照，只用於回歸比對；所有測例的跨軟體結果都還是空白。
        </p>
        <p>
          <button type="button" className="btn btn-quiet" onClick={copyCases}>
            複製 30 組測例的輸入（供在其他排圖器手動比對）
          </button>{' '}
          <span className="muted small" role="status" aria-live="polite">{copied}</span>
        </p>
        {groups.map((g) => (
          <div key={g} className="table-wrap case-group">
            <table className="compare">
              <caption>{GROUP_LABEL[g]}</caption>
              <thead>
                <tr>
                  <th scope="col">測例</th>
                  <th scope="col">目的</th>
                  <th scope="col">預期依據</th>
                  <th scope="col">本站結果</th>
                  <th scope="col">外部</th>
                </tr>
              </thead>
              <tbody>
                {cases
                  .filter((x) => x.c.group === g)
                  .map((x) => (
                    <tr key={x.c.id}>
                      <th scope="row">
                        {x.c.label}
                        <span className="en">{x.c.input.tz}</span>
                      </th>
                      <td>{x.c.purpose}</td>
                      <td>{BASIS_LABEL[x.c.expect.basis]}</td>
                      <td>
                        <span className={x.kindOk ? 'ok-mark' : 'bad-mark'}>{x.kindOk ? '✓' : '✗'}</span> {x.summary}
                      </td>
                      <td><StatusChip status="pending_external_validation" /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <section className="section" aria-labelledby="rules-h">
        <h2 id="rules-h">閘門輪規則表（{MANDALA_RULES.version}）</h2>
        <dl className="facts">
          <div>
            <dt>座標慣例</dt>
            <dd>
              {MANDALA_RULES.coordinate.text} <StatusChip status={MANDALA_RULES.coordinate.status} />
              <br />
              <span className="muted small">{MANDALA_RULES.coordinate.note}</span>
            </dd>
          </div>
          <div>
            <dt>黃經起點</dt>
            <dd>
              {MANDALA_RULES.startLongitude.text} <StatusChip status={MANDALA_RULES.startLongitude.status} />
              <ul className="small">
                {MANDALA_RULES.startLongitude.alternatives.map((a) => (
                  <li key={a.by}>
                    {a.value.toFixed(4)}°：{a.by}
                  </li>
                ))}
              </ul>
              <span className="muted small">{MANDALA_RULES.startLongitude.note}</span>
            </dd>
          </div>
          <div>
            <dt>邊界規則</dt>
            <dd>
              {MANDALA_RULES.interval.text} <StatusChip status={MANDALA_RULES.interval.status} />
            </dd>
          </div>
          <div>
            <dt>細分</dt>
            <dd>
              閘門 {WIDTH_DEG.gate}°・爻 {WIDTH_DEG.line}°・色 {WIDTH_DEG.color}°・調 {WIDTH_DEG.tone.toFixed(7)}°・基底 {WIDTH_DEG.base.toFixed(7)}°{' '}
              <StatusChip status={MANDALA_RULES.subdivisions.status} />
              <br />
              <span className="muted small">{MANDALA_RULES.subdivisions.note}</span>
            </dd>
          </div>
          <div>
            <dt>精度策略</dt>
            <dd>
              {MANDALA_RULES.precision.text}離爻邊界不到 {MANDALA_RULES.precision.nearLineArcmin} 角分的啟動點，或落在起點分歧範圍內的啟動點，排圖結果會加註。
            </dd>
          </div>
          <div>
            <dt>星曆引擎</dt>
            <dd>
              {ASTRONOMY_ENGINE.name} {ASTRONOMY_ENGINE.version}（{ASTRONOMY_ENGINE.license}）・資料檔：{ASTRONOMY_ENGINE.dataFiles}
            </dd>
          </div>
        </dl>
        <h3>
          64 個閘門的完整順序 <StatusChip status={MANDALA_RULES.gateOrder.status} />
        </h3>
        <p className="muted small">{MANDALA_RULES.gateOrder.note}</p>
        <ol className="wheel-list">
          {MANDALA_RULES.gateOrder.value.map((g) => (
            <li key={g}>
              <a href={`#/gates/${g}`}>閘門 {g}</a>
              <span className="muted small">{formatZodiac(gateStartLongitude(g))} 起</span>
            </li>
          ))}
        </ol>
        <h3>規則來源</h3>
        <ul className="plain-list">
          {MANDALA_RULES.sources.map((s) => (
            <li key={s.id}>
              {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}：{s.detail}
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="ext-h">
        <h2 id="ext-h">外部比對：尚未完成</h2>
        <p>
          下列排圖器可作為比對候選，但不同網址不一定代表不同的計算引擎。在確認引擎之前，不能把它們的一致結果算成多份獨立驗證。
        </p>
        <div className="table-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">候選</th>
                <th scope="col">與其他候選的關係</th>
                <th scope="col">狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <a href="https://jovianarchive.com/pages/get-your-human-design-chart" target="_blank" rel="noopener noreferrer">Jovian Archive 免費排圖</a>
                </th>
                <td>體系原始出版者</td>
                <td><StatusChip status="pending_external_validation" /></td>
              </tr>
              <tr>
                <th scope="row">Maia Mechanics</th>
                <td>屬 Jovian Archive 的工具，不能與上一列算成兩份獨立結果</td>
                <td><StatusChip status="pending_external_validation" /></td>
              </tr>
              <tr>
                <th scope="row">myBodyGraph</th>
                <td>引擎與上述是否相同尚未確認</td>
                <td><StatusChip status="pending_external_validation" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          未完成的原因：這些排圖器需要在網頁上手動輸入，建置環境無法操作；本站也沒有確認它們的使用條款是否允許自動擷取。
          若你能在這些排圖器輸入上方 30 組測例並提供結果，就能補上這一欄。
        </p>
      </section>

      <section className="section" aria-labelledby="lic-h">
        <h2 id="lic-h">星曆授權</h2>
        <p>
          Swiss Ephemeris 採雙重授權（AGPL 或付費的 Professional License），開發者必須在散布軟體或啟用公開服務之前選定其一。
          本站沒有更換引擎，沿用既有的 Astronomy Engine（MIT）；MIT 授權要求在散布的軟體中保留版權與授權聲明，全文列在
          <a href="#/sources">來源頁</a>的「第三方元件授權」。程式能在瀏覽器執行，不代表沒有授權問題；本站的判斷依據是各套件實際的授權條款。
        </p>
      </section>
    </div>
  );
}
