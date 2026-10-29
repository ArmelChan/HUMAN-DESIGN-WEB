import { useMemo, type KeyboardEvent } from 'react';
import { CENTERS, CENTER_ORDER, CHANNELS, GATES, getGate, type CenterId, type ChannelStructure } from '../data/structure';
import { CHANNEL_BENDS, GATE_POINTS, GEOMETRY, VIEWBOX, centroid, polygonPath, type Point } from '../data/geometry';
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

const LABEL_INSET = 11;

const gateLabelPoint: Record<number, Point> = (() => {
  const out: Record<number, Point> = {};
  for (const gate of GATES) {
    const a = GATE_POINTS[gate.number];
    const c = centroid(GEOMETRY[gate.center].points);
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    out[gate.number] = { x: a.x + (dx / len) * LABEL_INSET, y: a.y + (dy / len) * LABEL_INSET };
  }
  return out;
})();

/** 把通道切成兩半，各半屬於一個閘門。有彎曲的通道以二次貝茲曲線切分。 */
function channelHalves(c: ChannelStructure): [string, string] {
  const a = GATE_POINTS[c.gates[0]];
  const b = GATE_POINTS[c.gates[1]];
  const bend = CHANNEL_BENDS[c.id];
  if (!bend) {
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return [`M${a.x},${a.y} L${m.x},${m.y}`, `M${b.x},${b.y} L${m.x},${m.y}`];
  }
  const p01 = { x: (a.x + bend.x) / 2, y: (a.y + bend.y) / 2 };
  const p12 = { x: (bend.x + b.x) / 2, y: (bend.y + b.y) / 2 };
  const m = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 };
  return [`M${a.x},${a.y} Q${p01.x},${p01.y} ${m.x},${m.y}`, `M${b.x},${b.y} Q${p12.x},${p12.y} ${m.x},${m.y}`];
}

function channelFull(c: ChannelStructure): string {
  const a = GATE_POINTS[c.gates[0]];
  const b = GATE_POINTS[c.gates[1]];
  const bend = CHANNEL_BENDS[c.id];
  return bend ? `M${a.x},${a.y} Q${bend.x},${bend.y} ${b.x},${b.y}` : `M${a.x},${a.y} L${b.x},${b.y}`;
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
