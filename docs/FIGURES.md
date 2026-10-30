# 圖解素材清單（Asset manifest）

本站的圖像全部由程式以 SVG 繪製。沒有使用圖像生成模型、沒有點陣圖檔、沒有第三方圖片、字型或圖示。
圖上的文字都是 SVG／HTML 文字（可選取、可朗讀、可翻譯），不是圖片裡的字。
權利狀態以 `src/data/legal/assets.ts` 為準（網站 `#/copyright` 頁的素材登錄表即由該檔產生）；本文件只是對照表。

| 編號 | 素材 | 程式位置 | 資料來源 | 使用位置 | 個人資料 | 登錄 id | 權利狀態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 首頁主視覺：閘門輪 | `src/figures/GateWheel.tsx` | 規則表 `src/data/rules/mandala.ts`；「現在」的太陽位置由 astronomy-engine 計算（延遲載入） | `#/` 首頁 | 無 | `figure-gate-wheel` | 待確認（依附閘門排列規則的權利） |
| B | 排圖流程圖 | `src/figures/ChartingFlow.tsx` | 本站計算步驟（88°、302°、5.625° 與程式常數一致） | `#/chart`「計算流程」 | 無 | `figure-charting-flow` | 已查核無第三方素材 |
| C | 九大中心小圖與中心總覽（可重用元件） | `src/figures/CenterGlyph.tsx`、`src/lib/staticBodygraph.ts` | 自繪幾何 `src/data/geometry.ts` | `#/centers` 總覽、報告「體系解釋」段 | 報告中依使用者排圖上色 | `figure-center-glyph` | 待確認（依附 BodyGraph 配置的權利） |
| D | 出生時間不確定性時間軸 | `src/figures/UncertaintyTimeline.tsx`、`src/lib/timeline.ts` | 對輸入時刻前後逐點重新排圖 | `#/chart` 約略時間與只知道日期的結果 | 有（只在瀏覽器中） | `figure-uncertainty-timeline` | 已查核無第三方素材 |
| E | 個人報告封面（資料驅動模板） | `src/lib/reportCover.ts`、`src/figures/ReportCover.tsx` | 排圖結果（類型、權威、人生角色、定義、中心、閘門） | `#/chart` 報告頂端、匯出的 HTML | 有（只在瀏覽器中與使用者自行匯出的檔案） | `figure-report-cover` | 待確認（含 BodyGraph） |

共用：`src/lib/bodygraphDraw.ts`（互動 BodyGraph 與靜態圖共用的通道路徑與閘門位置）、`src/figures/LazyMount.tsx`（非首屏圖延遲掛載）。

「已查核無第三方素材」只代表沒有使用他人的圖像，不代表可任意商用；本站原創圖像的授權條件尚待營運者決定。

## 準確性規則

- 個人化的圖只從排圖引擎的輸出產生，不另外手繪或用生成圖替代。
- 每個圖形元素帶 `data-*` 屬性（`data-center`、`data-state`、`data-gate`、`data-source`、`data-half`、`data-fact`、`data-wheel-gate`、`data-row`），供測試核對。
- 不使用器官、人體解剖或醫學影像；中心以幾何形狀表示。
- 只知道出生日期時，無法確定的中心以第三種線型（點狀虛線）表示，不假裝確定。

## 無障礙與版面

- 有內容的圖：`role="img"` 加 `<title>`／`aria-label`，並附文字版（`<details>` 或相鄰文字）。
- 裝飾部分：`aria-hidden="true"`（閘門輪中央的 BodyGraph 輪廓、中心小圖本身——旁邊已有中心名稱與狀態文字）。
- 顏色使用網站 CSS 變數，深色模式自動切換；匯出的獨立 HTML 使用淺色備用值。
- 每張圖都有明確的 `width`／`height`／`viewBox`；流程圖有寬、窄兩種排版；時間軸在手機上可橫向捲動自身容器，頁面不橫向捲動。
- 不在首屏的圖（時間軸）以 IntersectionObserver 延遲掛載。

## 測試

- 單元測試 `src/figures/figures.test.tsx`：靜態與互動 BodyGraph 和排圖資料一致、閘門輪分段與規則表一致、流程圖文字與程式常數一致、時間軸與逐點重算一致、封面欄位與排圖一致、封面文字不超出邊界、使用者標題跳脫、匯出檔內嵌同一封面。
- 瀏覽器測試 `e2e/figures.e2e.cjs`：首頁說明文字與高亮閘門一致、流程圖寬窄排版、封面與摘要卡及互動圖一致、中心小圖狀態、延遲載入、破圖檢查、深色模式顏色、手機寬度不溢出、鍵盤操作。
