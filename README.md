# 人類圖圖解（繁體中文人類圖互動資訊網站）

線上版本：https://claude.ai/artifact/GuYMvFZNZoCnqiKpb2CkDY

（單一檔案版，由 `npm run build:artifact` 產生）

以互動 BodyGraph 為主要工具，介紹人類圖（Human Design）的能量中心、通道、閘門、類型、策略、內在權威與人生角色。
個人排圖在瀏覽器內計算（見下方「個人排圖」）；本站不提供醫療、心理或命運方面的判斷。

## 開發

```bash
npm install
npm run dev        # 開發伺服器
npm run typecheck  # TypeScript 型別檢查
npm test           # Vitest：結構資料完整性與規則推導
npm run build      # 輸出至 dist/（相對路徑，可放任何靜態主機）
```

路由使用 hash（`#/centers/sacral`、`#/channels/20-34`、`#/lab?g=20,34`），靜態主機不需要伺服器端設定，每個條目與實驗狀態都有可分享的網址。

## 目錄

| 路徑 | 內容 |
| --- | --- |
| `src/data/structure.ts` | 結構事實：9 中心、64 閘門（易經卦名、英文關鍵詞）、36 通道、迴路分組與其核實狀態 |
| `src/data/geometry.ts` | BodyGraph 示意座標（自行繪製，非官方圖譜） |
| `src/data/sources.ts` | 來源清單、核實狀態（已交叉比對／依通行資料整理／待核實／尚未收錄）、內容層次 |
| `src/data/content/` | 中心、類型、權威、人生角色、詞彙、實驗室示例的中文內容 |
| `src/lib/derive.ts` | 由「已啟動閘門」依體系規則推導中心狀態、類型、內在權威、定義類型（不含天文計算） |
| `src/components/` | `BodyGraph`（SVG）、`DetailPanel`（分層說明）、`Explorer`（圖＋面板，手機為底部抽屜） |
| `src/pages/` | 各頁面 |

## 內容原則

- 每段內容標示層次：體系說法／其他作者詮釋／網站編輯整理／科學與研究現況。
- 中心頁的每個概念包含：定義、與其他部位的關係、常見誤解、自我觀察情境、不應據此推論的事。
- 尚未核實或尚未收錄的資料明確標示，不以推測補上。

## 個人排圖（`#/chart`）

- 計算全部在瀏覽器內完成：`src/lib/ephemeris.ts`（astronomy-engine，MIT）、`src/lib/mandala.ts`（黃經 → 閘門／爻）、
  `src/lib/timezone.ts`（Intl IANA 時區，處理夏令時間的重複與不存在時刻）、`src/lib/chart.ts`（26 個啟動點、時間誤差檢查）。
- 不使用外部 API、不上傳、不放入網址；只有使用者勾選時才存入 localStorage，可一鍵刪除。
- 計算前必須勾選知情確認。
- 頁面延遲載入，天文函式庫不進主程式包。
- 驗證方式見 `src/lib/chart.test.ts` 與來源頁的編輯註記。

## 可追溯的排圖引擎（補充包 A）

- **星曆適配層**：`src/lib/ephemeris.ts` 定義 `EphemerisEngine` 介面，目前唯一實作為既有的 astronomy-engine 2.1.19（MIT）。
  未更換為 Swiss Ephemeris（AGPL 或付費授權，須在散布前選定）。
- **設計時刻**：`src/lib/designSolver.ts` 自行求根（割線法＋二分保底），以 `wrap180` 處理 0°／360° 跨越，記錄迭代次數、殘差、停止條件。
- **交點**：預設為密切交點（由月球狀態向量求得，同 Swiss Ephemeris TRUE_NODE）；可選平均交點。
- **規則表**：`src/data/rules/mandala.ts`（`mandala-1.0.0`），含 64 閘門完整順序、起點與分歧、左閉右開區間、爻／色／調／基底、精度策略與來源狀態。
- **計算紀錄**：每張圖的 `provenance` 保留輸入、時區與偏移、UTC、設計 UTC、引擎與版本、設定、規則表版本、求根報告。
- **第三方授權**：`npm run licenses` 從 node_modules 產生 `src/data/licenses.generated.ts`，在來源頁顯示全文。

## 驗證（補充包 B）

| 測試檔 | 內容 |
| --- | --- |
| `src/lib/chart.test.ts` | 星曆抽查、求根殘差、0°/360° 跨越、半開區間與細分邊界、引擎版本與授權 |
| `src/lib/references.test.ts` | 第三方轉錄的 5 張參照圖（二手參照）：130/130 個啟動點一致 |
| `src/lib/validation.test.ts` | 30 組合成測例；預期值只用獨立事實或規則推導；`internal-snapshot.json` 僅作回歸比對 |

所有測例的外部比對欄位為 `pending_external_validation`。更新快照：`UPDATE_SNAPSHOT=1 npx vitest run src/lib/validation.test.ts`。

## 個人報告、反思與同意（report-1.0.0）

- 時間準確度分三種：精確、約略（±15–120 分鐘）、只知道日期。只知道日期時，計算當地全天每 30 分鐘的結果，只採用全天不變的部分，不以中午或任何單一時刻代表出生時間（`src/lib/dayRange.ts`）。
- 輸入時即時顯示 UTC 換算預覽，含夏令時間的重複與不存在時刻提示。
- 報告七段（`src/lib/report.ts`）：計算結果、體系解釋、自我觀察與反思、一般健康與心理教育（不依圖表個人化，轉述 WHO）、象徵性人生方向、限制、來源與版權。報告產生器不接受姓名、性別、職業；反思回應不會改變報告。
- 反思：符合／不符合／不確定，加上例子與反例；不計分、不是量表。
- 匯出：HTML 下載與純文字複製，固定保留首尾聲明、限制、驗證狀態、來源與使用範圍（`src/lib/exportReport.ts`）。
- 下載（`src/lib/saveFile.ts`）：在 claude.ai 檢視器中使用平台的 `downloads` 功能（發布時須宣告 `capabilities: {downloads: true}`），由檢視器顯示檔名與大小請使用者確認；取消、格式不允許或環境不支援時顯示原因並建議「複製純文字」，不自動重試。其他環境用一般瀏覽器下載。
- 提問指引（`src/lib/safety.ts`，`#/ask`）：固定規則，沒有 AI。對診斷、用藥、死亡預測、重大決定給出界線回覆；危機訊號會停止解讀，提示聯絡當地緊急服務，不編造電話。
- 同意（`src/lib/consent.ts`）：條款接受、本機保存、AI 外傳、行銷四項分開；預設都不勾選；本版本沒有 AI 與行銷功能，因此後兩項只有說明、沒有勾選框。條款版本變更時需要重新接受。

## 圖解（`src/figures/`）

五組圖解都由程式以 SVG 繪製，文字是可選取、可朗讀的 SVG／HTML 文字，沒有使用圖像生成模型或第三方圖檔。
個人化的圖（報告封面、中心小圖、時間軸）直接由排圖資料產生，測試會核對圖與資料一致。清單、使用位置與授權狀態見 `docs/FIGURES.md`。

## 條款、隱私與版權（草稿）

`#/terms`、`#/privacy`、`#/copyright` 三個頁面都是**待法律審閱的草稿**，未生效。營運者欄位未填，公開上線前的阻擋事項見 `docs/OPERATOR_TODO.md`。
第三方素材登錄在 `src/data/legal/assets.ts`；開源授權全文由 `npm run licenses` 從 node_modules 產生。

## 瀏覽器測試

```bash
npm run build && npx vite preview --port 4173 --strictPort &
NODE_PATH=$(npm root -g) node e2e/site.e2e.cjs
NODE_PATH=$(npm root -g) node e2e/figures.e2e.cjs   # 圖解：資料一致、破圖、深色模式、手機寬度
NODE_PATH=$(npm root -g) node e2e/downloads.e2e.cjs # 下載：模擬 claude.ai 檢視器的各種回應
```

單一檔案版也可以用同樣的測試：把 `dist-artifact/human-design.html` 包上平台會加的外框（doctype、`<meta charset>`、`<meta name=viewport>`）後以 UTF-8 提供，
再把 `BASE` 環境變數設為該網址。直接開啟未包外框的檔案時沒有 viewport 設定，手機寬度的檢查會失敗，這不代表線上版有問題。

需要全域安裝的 Playwright（本專案未列為相依套件）。

## 尚未完成

- 36 條通道與 64 個閘門的詳細解讀、閘門六爻內容（目前只有結構資訊）。
- 通道中文名稱為網站暫譯，需與台灣出版譯本核對。
- 除整合通道組與中心迴路外，其餘迴路分組未經二次來源比對。
- 中心、類型、權威等體系說法未與原始教材逐頁核對。
- 輪迴交叉、變數等進階主題。
- 直接與 Jovian Archive、myBodyGraph 等排圖器比對（pending_external_validation）；需人工在這些網站輸入 30 組測例。
- 閘門輪起點 302° 與 302.057° 的分歧尚未以官方資料裁定。
- 色、調、基底只有單一第三方規則，無參照資料；四箭頭（變數）未實作。
- 輪迴交叉名稱、變數（Variables）、顏色／調性／基底等更細的層級。
