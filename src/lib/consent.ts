// 同意紀錄：條款接受、本機保存、AI 外傳、行銷四項分開，不以「全部同意」綁定。
// 只記錄條款版本與接受時間。只存在使用者瀏覽器中，不構成跨裝置或對第三方的證明。

export const TERMS_VERSION = 'terms-draft-0.1';
export const PRIVACY_VERSION = 'privacy-draft-0.1';

export interface ConsentRecord {
  termsVersion: string;
  acceptedAt: string;
}

export interface ConsentChoices {
  /** 是否同意使用條款（必要）。 */
  termsAccepted: boolean;
  /** 是否在這台裝置保存出生資料、反思筆記與條款接受紀錄（可選）。 */
  localSave: boolean;
  /** 本版本沒有 AI 功能，固定為 not_offered；不提供勾選。 */
  aiTransfer: 'not_offered';
  /** 本站不寄送行銷訊息，固定為 not_offered。 */
  marketing: 'not_offered';
}

export const DEFAULT_CHOICES: ConsentChoices = {
  termsAccepted: false,
  localSave: false,
  aiTransfer: 'not_offered',
  marketing: 'not_offered',
};

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEYS = {
  consent: 'hd-consent-v1',
  input: 'hd-birth-input-v1',
  reflection: 'hd-reflection-v1',
} as const;

export function readConsent(store: KeyValueStore | null): ConsentRecord | null {
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEYS.consent);
    if (!raw) return null;
    const r = JSON.parse(raw) as ConsentRecord;
    return typeof r.termsVersion === 'string' && typeof r.acceptedAt === 'string' ? r : null;
  } catch {
    return null;
  }
}

/** 沒有紀錄，或紀錄的條款版本與目前版本不同時，都需要重新接受。 */
export function needsAcceptance(record: ConsentRecord | null, currentVersion = TERMS_VERSION): boolean {
  return !record || record.termsVersion !== currentVersion;
}

export function makeRecord(now: Date, version = TERMS_VERSION): ConsentRecord {
  return { termsVersion: version, acceptedAt: now.toISOString() };
}

export function writeConsent(store: KeyValueStore | null, record: ConsentRecord): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEYS.consent, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** 清除本站在這台裝置保存的所有資料。 */
export function clearAll(store: KeyValueStore | null): string[] {
  const removed: string[] = [];
  if (!store) return removed;
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      if (store.getItem(key) !== null) removed.push(key);
      store.removeItem(key);
    } catch {
      /* 忽略 */
    }
  }
  return removed;
}

export function browserStore(): KeyValueStore | null {
  try {
    const s = window.localStorage;
    const probe = '__hd_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
