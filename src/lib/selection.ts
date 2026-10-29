import { CENTERS, getChannel, getGate, channelCenters, type CenterId } from '../data/structure';

export type Selection =
  | { kind: 'center'; id: CenterId }
  | { kind: 'channel'; id: string }
  | { kind: 'gate'; n: number }
  | null;

export function encodeSelection(sel: Selection): string {
  if (!sel) return '';
  if (sel.kind === 'center') return `center-${sel.id}`;
  if (sel.kind === 'channel') return `channel-${sel.id}`;
  return `gate-${sel.n}`;
}

export function decodeSelection(raw: string | null): Selection {
  if (!raw) return null;
  const [kind, ...rest] = raw.split('-');
  const value = rest.join('-');
  if (kind === 'center' && value in CENTERS) return { kind: 'center', id: value as CenterId };
  if (kind === 'channel' && getChannel(value)) return { kind: 'channel', id: value };
  if (kind === 'gate' && getGate(Number(value))) return { kind: 'gate', n: Number(value) };
  return null;
}

/** 選取某項目時，圖上哪些中心、通道、閘門應被標示為「相關」。 */
export function relatedOf(sel: Selection) {
  const centers = new Set<CenterId>();
  const channels = new Set<string>();
  const gates = new Set<number>();
  if (!sel) return { centers, channels, gates };
  if (sel.kind === 'center') {
    centers.add(sel.id);
    for (const g of CENTERS[sel.id].gates) gates.add(g);
  } else if (sel.kind === 'channel') {
    const c = getChannel(sel.id)!;
    channels.add(c.id);
    c.gates.forEach((g) => gates.add(g));
    channelCenters(c).forEach((id) => centers.add(id));
  } else {
    gates.add(sel.n);
    centers.add(getGate(sel.n)!.center);
  }
  return { centers, channels, gates };
}
