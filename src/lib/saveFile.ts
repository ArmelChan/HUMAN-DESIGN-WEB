// 報告存檔：在 claude.ai 的檢視器中改用平台的下載功能（會先顯示檔名與大小請你確認），
// 其他環境（一般靜態主機、本機開啟）用瀏覽器一般的下載。
// 兩種方式都只把檔案交給你的瀏覽器或檢視器存檔；本站程式不把內容傳送到其他地方。

export interface PlatformDownloads {
  save(req: { filename: string; data: string | Blob }): Promise<{ status: 'saved' | 'delivered' }>;
}

interface ClaudeHost {
  use?: (name: string) => Promise<unknown>;
}

let pending: Promise<PlatformDownloads | null> | null = null;

/**
 * 取得平台的下載功能。不在 claude.ai 檢視器中、或檢視器未提供時為 null。
 * 只詢問一次；詢問本身不會跳出任何提示，確認視窗只在按下下載時出現。
 */
export function platformDownloads(): Promise<PlatformDownloads | null> {
  if (!pending) {
    const host = typeof window === 'undefined' ? undefined : (window as unknown as { claude?: ClaudeHost }).claude;
    pending =
      typeof host?.use === 'function'
        ? host.use('downloads').then(
            (ns) => (ns && typeof (ns as PlatformDownloads).save === 'function' ? (ns as PlatformDownloads) : null),
            () => null,
          )
        : Promise.resolve(null);
  }
  return pending;
}

export type SaveOutcome = 'saved' | 'browser' | 'declined' | 'busy' | 'format-blocked' | 'unavailable' | 'failed';

/** 平台的錯誤代碼 → 本站的處理方式。未知代碼視同 unavailable。 */
export function outcomeFromError(e: unknown): SaveOutcome {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  switch (code) {
    case 'declined':
      return 'declined';
    case 'rate_limited':
      return 'busy';
    case 'rejected_extension':
    case 'extension_not_enabled':
      return 'format-blocked';
    case 'bad_request':
    case 'transform_error':
    case 'too_large':
      return 'failed';
    default:
      return 'unavailable';
  }
}

export const SAVE_MESSAGE: Record<SaveOutcome, string> = {
  saved: '已交給瀏覽器存檔。',
  browser: '已產生 HTML 檔。若瀏覽器沒有開始下載（部分內嵌環境會阻擋），請改用「複製純文字」。',
  declined: '已取消下載，沒有存檔。',
  busy: '已有一個下載確認視窗開著，請先處理它，稍後再試。',
  'format-blocked': '這個環境目前不允許下載 HTML 檔，請改用「複製純文字」。',
  unavailable: '這個檢視環境無法下載檔案，請改用「複製純文字」。',
  failed: '下載沒有完成，請改用「複製純文字」。',
};

/** 一般瀏覽器的下載方式。 */
export function browserDownload(filename: string, data: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 存檔。只在使用者按下下載按鈕時呼叫。
 * downloads 參數省略時自動判斷環境；測試時可直接傳入。
 */
export async function saveFile(
  filename: string,
  data: string,
  mime: string,
  downloads?: PlatformDownloads | null,
  fallback: (filename: string, data: string, mime: string) => void = browserDownload,
): Promise<SaveOutcome> {
  const ns = downloads === undefined ? await platformDownloads() : downloads;
  if (!ns) {
    fallback(filename, data, mime);
    return 'browser';
  }
  try {
    await ns.save({ filename, data: new Blob([data], { type: mime }) });
    return 'saved';
  } catch (e) {
    return outcomeFromError(e);
  }
}
