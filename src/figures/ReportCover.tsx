// E. 個人報告封面：顯示由排圖資料產生的 SVG。網頁與匯出 HTML 使用同一個 coverSvg() 字串。

import { coverSvg, type CoverModel } from '../lib/reportCover';

export function ReportCover({ model }: { model: CoverModel }) {
  return (
    <figure className="report-cover">
      <div className="cover-frame" dangerouslySetInnerHTML={{ __html: coverSvg(model) }} />
      <figcaption className="muted small">
        封面依你的排圖資料產生，所有文字都是 SVG 文字，不是點陣圖。匯出報告時會使用同一張封面。
      </figcaption>
    </figure>
  );
}
