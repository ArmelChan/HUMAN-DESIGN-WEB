import { useMemo, type KeyboardEvent } from 'react';
import { CENTERS, CENTER_ORDER, CHANNELS, GATES, getGate, type CenterId, type ChannelStructure } from '../data/structure';
import { GEOMETRY, VIEWBOX, polygonPath } from '../data/geometry';
import { channelFull, channelHalves, gateLabelPoint } from '../lib/bodygraphDraw';
import type { CenterState } from '../lib/derive';
import type { GateSource } from '../lib/chart';
import { relatedOf, type Selection } from '../lib/selection';
import { CENTER_STATE_NOTES } from '../data/content/centers';

interface Props {
  selection: Selection;
  onSelect: (sel: Selection) => void;
  /** 規則實驗室才會傳入；未傳入時圖上只顯示結構，不顯示任何定義狀態。 */
  centerStates?: Record<CenterId, CenterState>;
  activeGates?: Set<number>;
  /** 傳入時，點閘門會切換啟動狀態，而不是選取。 */
  onToggleGate?: (n: number) => void;
  /** 個人排圖時傳入：每個啟動閘門來自人格、設計或兩者。 */
  gateSources?: Map<number, GateSource>;
  title: string;
  description: string;
}

function onActivate(handler: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };
}

export function BodyGraph({ selection, onSelect, centerStates, activeGates, onToggleGate, gateSources, title, description }: Props) {
  const related = useMemo(() => relatedOf(selection), [selection]);
  const hasSelection = selection !== null;
  const labMode = Boolean(centerStates);

  const isChannelRelated = (c: ChannelStructure) =>
    related.channels.has(c.id) || (selection?.kind !== 'channel' && c.gates.some((g) => related.gates.has(g)));

  return (
    <svg
      className={`bodygraph${labMode ? ' is-lab' : ''}`}
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      role="group"
      aria-labelledby="bg-title bg-desc"
    >
      <title id="bg-title">{title}</title>
      <desc id="bg-desc">{description}</desc>

      <g className="bg-channels">
        {CHANNELS.map((c) => {
          const [h0, h1] = channelHalves(c);
          const isSel = selection?.kind === 'channel' && selection.id === c.id;
          const rel = isChannelRelated(c);
          const dim = hasSelection && !rel;
          const on0 = activeGates?.has(c.gates[0]);
          const on1 = activeGates?.has(c.gates[1]);
          return (
            <g
              key={c.id}
              className={`bg-channel${isSel ? ' is-selected' : ''}${rel ? ' is-related' : ''}${dim ? ' is-dim' : ''}`}
            >
              <path className="ch-tube" d={channelFull(c)} />
              {[
                [h0, on0, c.gates[0]],
                [h1, on1, c.gates[1]],
              ].map(([d, on, g]) => {
                const src = on ? gateSources?.get(g as number) : undefined;
                return (
                  <g key={g as number}>
                    <path className={`ch-half${on ? ' is-on' : ''}${src ? ` src-${src}` : ''}`} d={d as string} />
                    {src === 'both' && <path className="ch-half-both" d={d as string} />}
                  </g>
                );
              })}
              <path
                className="ch-hit"
                d={channelFull(c)}
                onClick={() => onSelect({ kind: 'channel', id: c.id })}
              >
                <title>{`通道 ${c.id}（${c.english}）`}</title>
              </path>
            </g>
          );
        })}
      </g>

      <g className="bg-centers">
        {CENTER_ORDER.map((id) => {
          const shape = GEOMETRY[id];
          const center = CENTERS[id];
          const state = centerStates?.[id];
          const isSel = selection?.kind === 'center' && selection.id === id;
          const rel = related.centers.has(id);
          const dim = hasSelection && !rel;
          const stateText = state ? `，${CENTER_STATE_NOTES[state].label}` : '';
          const labelPos = shape.label;
          return (
            <g
              key={id}
              className={`bg-center state-${state ?? 'neutral'}${isSel ? ' is-selected' : ''}${rel ? ' is-related' : ''}${dim ? ' is-dim' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={`${center.name}${stateText}`}
              onClick={() => onSelect({ kind: 'center', id })}
              onKeyDown={onActivate(() => onSelect({ kind: 'center', id }))}
            >
              <polygon className="center-ring" points={polygonPath(shape.points)} />
              <polygon className="center-shape" points={polygonPath(shape.points)} />
              <text className="center-label" x={labelPos.x} y={labelPos.y} aria-hidden="true">
                {center.shortName}
              </text>
            </g>
          );
        })}
      </g>

      <g className="bg-gates">
        {GATES.map((gate) => {
          const pt = gateLabelPoint[gate.number];
          const on = activeGates?.has(gate.number);
          const isSel = selection?.kind === 'gate' && selection.n === gate.number;
          const rel = related.gates.has(gate.number);
          const handler = onToggleGate
            ? () => onToggleGate(gate.number)
            : () => onSelect({ kind: 'gate', n: gate.number });
          return (
            <g
              key={gate.number}
              className={`bg-gate${on ? ' is-on' : ''}${on && gateSources?.get(gate.number) ? ` src-${gateSources.get(gate.number)}` : ''}${isSel ? ' is-selected' : ''}${rel ? ' is-related' : ''}${centerStates?.[gate.center] === 'defined' ? ' in-defined' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handler();
              }}
            >
              <circle className="gate-dot" cx={pt.x} cy={pt.y} r={7} />
              <text className="gate-num" x={pt.x} y={pt.y} aria-hidden="true">
                {gate.number}
              </text>
              <title>
                {onToggleGate
                  ? `${on ? '關閉' : '啟動'}閘門 ${gate.number}（${getGate(gate.number)!.iChing}）`
                  : `閘門 ${gate.number}（${getGate(gate.number)!.iChing}）`}
              </title>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
