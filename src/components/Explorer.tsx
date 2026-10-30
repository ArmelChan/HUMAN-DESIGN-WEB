import { useEffect, useRef, useState } from 'react';
import { BodyGraph } from './BodyGraph';
import { DetailPanel, type PersonalContext } from './DetailPanel';
import { CENTERS, getChannel, getGate } from '../data/structure';
import { CENTER_STATE_NOTES } from '../data/content/centers';
import type { CenterState } from '../lib/derive';
import type { CenterId } from '../data/structure';
import type { Selection } from '../lib/selection';
import type { GateSource } from '../lib/chart';

interface Props {
  selection: Selection;
  onSelect: (sel: Selection) => void;
  centerStates?: Record<CenterId, CenterState>;
  activeGates?: Set<number>;
  onToggleGate?: (n: number) => void;
  gateSources?: Map<number, GateSource>;
  personal?: PersonalContext;
  graphTitle: string;
  graphDescription: string;
  /** 圖上方的模式標示，例如「結構圖」「規則實驗：非個人人類圖」。 */
  modeLabel: string;
  aside?: React.ReactNode;
}

function selectionText(sel: Selection): string {
  if (!sel) return '尚未選取';
  if (sel.kind === 'center') return CENTERS[sel.id].name;
  if (sel.kind === 'channel') return `通道 ${getChannel(sel.id)!.id}`;
  return `閘門 ${sel.n}（${getGate(sel.n)!.iChing}）`;
}

export function Explorer({
  selection,
  onSelect,
  centerStates,
  activeGates,
  onToggleGate,
  gateSources,
  personal,
  graphTitle,
  graphDescription,
  modeLabel,
  aside,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  // 手機版的說明面板是貼在畫面底部的抽屜，可收合以看清整張圖。
  const [sheetOpen, setSheetOpen] = useState(selection !== null);

  // 切換選取時讓說明面板回到頂端；手機上面板在圖下方，不自動捲動，避免失去圖像參照。
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    panelRef.current?.scrollTo({ top: 0 });
    setSheetOpen(true);
  }, [selection]);

  return (
    <div className="explorer">
      <div className="explorer-graph">
        <div className="graph-head">
          <span className="mode-label">{modeLabel}</span>
          <span className="current" role="status" aria-live="polite">
            已選取：<strong>{selectionText(selection)}</strong>
          </span>
        </div>
        <BodyGraph
          selection={selection}
          onSelect={onSelect}
          centerStates={centerStates}
          activeGates={activeGates}
          onToggleGate={onToggleGate}
          gateSources={gateSources}
          title={graphTitle}
          description={graphDescription}
        />
        <Legend lab={Boolean(centerStates)} chart={Boolean(gateSources)} />
      </div>
      <div className={`explorer-panel${sheetOpen ? '' : ' is-collapsed'}`} ref={panelRef} aria-label="說明面板" role="region">
        <div className="sheet-bar">
          <span className="sheet-current">{selectionText(selection)}</span>
          <button
            type="button"
            className="btn btn-quiet sheet-toggle"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen((v) => !v)}
          >
            {sheetOpen ? '收合說明，看完整圖像' : '展開說明'}
          </button>
        </div>
        <div className="sheet-body">
          {aside}
          <DetailPanel selection={selection} onSelect={onSelect} centerStates={centerStates} personal={personal} />
        </div>
      </div>
    </div>
  );
}

export function Legend({ lab, chart = false }: { lab: boolean; chart?: boolean }) {
  return (
    <details className="legend" open={lab}>
      <summary>圖例</summary>
      <ul>
        <li>
          <svg width="34" height="18" aria-hidden="true">
            <rect x="3" y="3" width="28" height="12" className="lg-selected" />
          </svg>
          粗框：目前選取的部位；細框與加深：與選取部位相連的中心、通道和閘門。
        </li>
        {lab ? (
          <>
            {(['defined', 'undefined', 'open'] as const).map((s) => (
              <li key={s}>
                <svg width="34" height="18" aria-hidden="true">
                  <rect x="3" y="3" width="28" height="12" className={`lg-${s}`} />
                </svg>
                {CENTER_STATE_NOTES[s].label}（{CENTER_STATE_NOTES[s].marker}）
              </li>
            ))}
            {chart ? (
              <>
                <li>
                  <svg width="34" height="18" aria-hidden="true">
                    <line x1="2" y1="9" x2="32" y2="9" className="lg-line-on" />
                  </svg>
                  深色實線：人格（出生時刻）啟動的閘門。
                </li>
                <li>
                  <svg width="34" height="18" aria-hidden="true">
                    <line x1="2" y1="9" x2="32" y2="9" className="lg-line-design" />
                  </svg>
                  紅色實線：設計（太陽回推 88°）啟動的閘門。
                </li>
                <li>
                  <svg width="34" height="18" aria-hidden="true">
                    <line x1="2" y1="9" x2="32" y2="9" className="lg-line-both-base" />
                    <line x1="2" y1="9" x2="32" y2="9" className="lg-line-both-dash" />
                  </svg>
                  紅底深色虛線：人格與設計都啟動了這個閘門。一條通道的兩半都有顏色，代表通道成立。
                </li>
              </>
            ) : (
              <li>
                <svg width="34" height="18" aria-hidden="true">
                  <line x1="2" y1="9" x2="32" y2="9" className="lg-line-on" />
                </svg>
                深色實線：被啟動的閘門那一半通道；兩半都深色，代表通道成立。
              </li>
            )}
            <li>
              <svg width="34" height="18" aria-hidden="true">
                <circle cx="17" cy="9" r="7" className="lg-gate-on" />
              </svg>
              {chart ? '深色或紅色底的數字：被啟動的閘門（紅色為設計，加紅框表示人格與設計都有）。' : '深底白字的數字：被啟動的閘門。'}
            </li>
          </>
        ) : (
          <li>
            <svg width="34" height="18" aria-hidden="true">
              <line x1="2" y1="9" x2="32" y2="9" className="lg-line" />
            </svg>
            空心連線：36 條通道的位置；結構圖不顯示任何人的啟動狀態。
          </li>
        )}
        <li>圖形比例為本站自行繪製的示意，中心與閘門的對應關係依通行資料整理。</li>
      </ul>
    </details>
  );
}
