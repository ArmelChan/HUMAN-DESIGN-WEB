// C. 九大中心圖解：可重用的中心小圖，以及中心總覽。小圖由同一套 BodyGraph 幾何繪製。
// 小圖本身是裝飾性的定位提示（aria-hidden），中心名稱與狀態一律以旁邊的 HTML 文字呈現。

import { CENTERS, CENTER_ORDER, ROLE_LABEL, type CenterId } from '../data/structure';
import { CENTER_CONTENT } from '../data/content/centers';
import { staticBodygraphSvg, type StaticCenterState } from '../lib/staticBodygraph';

export const GLYPH_STATE_LABEL: Record<StaticCenterState, string> = {
  defined: '有定義',
  notDefined: '沒有定義',
  uncertain: '無法確定',
  neutral: '',
};

export function CenterGlyph({ id, state = 'neutral', width = 56 }: { id: CenterId; state?: StaticCenterState; width?: number }) {
  const svg = staticBodygraphSvg({ title: CENTERS[id].name, focus: id, centerStates: { [id]: state }, width });
  return <span className="center-glyph" aria-hidden="true" data-glyph={id} data-state={state} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function CentersAtlas() {
  return (
    <ul className="centers-atlas">
      {CENTER_ORDER.map((id, i) => (
        <li key={id}>
          <a href={`#/centers/${id}`} className="atlas-card">
            <CenterGlyph id={id} width={64} />
            <span className="atlas-text">
              <span className="atlas-name">
                {i + 1}. {CENTERS[id].name}
                <span className="en">{CENTERS[id].english}</span>
              </span>
              <span className="atlas-roles">{CENTERS[id].roles.map((r) => ROLE_LABEL[r]).join('・')}・{CENTERS[id].gates.length} 個閘門</span>
              <span className="atlas-summary">{CENTER_CONTENT[id].summary}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function GlyphLegend() {
  return (
    <p className="glyph-legend muted small">
      小圖標出該中心在 BodyGraph 中的位置：
      <CenterGlyph id="sacral" state="defined" width={22} /> 實心＝有定義
      <CenterGlyph id="sacral" state="notDefined" width={22} /> 虛線＝沒有定義
      <CenterGlyph id="sacral" state="uncertain" width={22} /> 點線＝無法確定
    </p>
  );
}
