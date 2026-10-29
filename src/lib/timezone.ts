// 當地出生時間 → UTC。使用瀏覽器內建的 IANA 時區資料（Intl），
// 會依當地歷史規則處理夏令時間，不需外部服務。

export interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export type Conversion =
  | { kind: 'ok'; utc: Date; offsetMinutes: number }
  | { kind: 'ambiguous'; options: { utc: Date; offsetMinutes: number }[] }
  | { kind: 'nonexistent' }
  | { kind: 'invalid'; reason: string };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatterCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    formatter(tz);
    return true;
  } catch {
    return false;
  }
}

/** 某一瞬間在指定時區的當地時間，與 UTC 的差（分鐘）。 */
export function offsetMinutesAt(utcMs: number, tz: string): number {
  const parts = Object.fromEntries(formatter(tz).formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

function validate(t: LocalDateTime): string | null {
  const { year, month, day, hour, minute } = t;
  if (![year, month, day, hour, minute].every(Number.isInteger)) return '日期或時間格式不正確';
  if (year < 1900 || year > 2100) return '目前只支援 1900 到 2100 年';
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return '這個日期不存在';
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '時間超出範圍';
  return null;
}

/** 以 IANA 時區換算。夏令時間切換時，當地時間可能重複出現（ambiguous）或不存在（nonexistent）。 */
export function localToUtc(t: LocalDateTime, tz: string): Conversion {
  const reason = validate(t);
  if (reason) return { kind: 'invalid', reason };
  if (!isValidTimeZone(tz)) return { kind: 'invalid', reason: '無法辨識這個時區' };
  const wall = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  // 以前後一天的時差作為候選，涵蓋所有可能的偏移量。
  const offsets = new Set<number>();
  for (const probe of [wall - 86400000, wall, wall + 86400000]) offsets.add(offsetMinutesAt(probe, tz));
  const matches: { utc: Date; offsetMinutes: number }[] = [];
  for (const off of offsets) {
    const utcMs = wall - off * 60000;
    if (offsetMinutesAt(utcMs, tz) === off) matches.push({ utc: new Date(utcMs), offsetMinutes: off });
  }
  matches.sort((a, b) => a.utc.getTime() - b.utc.getTime());
  if (matches.length === 0) return { kind: 'nonexistent' };
  if (matches.length > 1) return { kind: 'ambiguous', options: matches };
  return { kind: 'ok', ...matches[0] };
}

/** 以固定 UTC 偏移換算，給知道出生地當時確切時差的人使用。 */
export function localToUtcFixed(t: LocalDateTime, offsetMinutes: number): Conversion {
  const reason = validate(t);
  if (reason) return { kind: 'invalid', reason };
  const wall = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  return { kind: 'ok', utc: new Date(wall - offsetMinutes * 60000), offsetMinutes };
}

export function formatOffset(min: number): string {
  const sign = min >= 0 ? '+' : '−';
  const a = Math.abs(min);
  return `UTC${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

export const COMMON_ZONES: { tz: string; label: string }[] = [
  { tz: 'Asia/Taipei', label: '台灣' },
  { tz: 'Asia/Hong_Kong', label: '香港' },
  { tz: 'Asia/Macau', label: '澳門' },
  { tz: 'Asia/Shanghai', label: '中國大陸' },
  { tz: 'Asia/Singapore', label: '新加坡' },
  { tz: 'Asia/Kuala_Lumpur', label: '馬來西亞' },
  { tz: 'Asia/Tokyo', label: '日本' },
  { tz: 'Asia/Seoul', label: '韓國' },
  { tz: 'Asia/Bangkok', label: '泰國' },
  { tz: 'Australia/Sydney', label: '澳洲（雪梨、墨爾本）' },
  { tz: 'Pacific/Auckland', label: '紐西蘭' },
  { tz: 'Europe/London', label: '英國' },
  { tz: 'Europe/Paris', label: '法國、德國等中歐時區' },
  { tz: 'America/New_York', label: '美國東岸、加拿大多倫多' },
  { tz: 'America/Chicago', label: '美國中部' },
  { tz: 'America/Los_Angeles', label: '美國西岸、加拿大溫哥華' },
];

export function allTimeZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  try {
    return intl.supportedValuesOf ? intl.supportedValuesOf('timeZone') : COMMON_ZONES.map((z) => z.tz);
  } catch {
    return COMMON_ZONES.map((z) => z.tz);
  }
}
