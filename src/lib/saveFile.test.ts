import { outcomeFromError, platformDownloads, saveFile, SAVE_MESSAGE, type PlatformDownloads } from './saveFile';

const HTML = '<!doctype html><p>報告</p>';

describe('報告存檔', () => {
  it('不在 claude.ai 檢視器中時沒有平台下載功能', async () => {
    expect(await platformDownloads()).toBeNull();
  });

  it('有平台下載功能時交給它，檔名與內容不變，不使用瀏覽器下載', async () => {
    const calls: { filename: string; text: string; keys: string[] }[] = [];
    const ns: PlatformDownloads = {
      save: async (req) => {
        calls.push({ filename: req.filename, text: await (req.data as Blob).text(), keys: Object.keys(req).sort() });
        return { status: 'saved' };
      },
    };
    const fallback = vi.fn();
    expect(await saveFile('human-design-report.html', HTML, 'text/html;charset=utf-8', ns, fallback)).toBe('saved');
    expect(calls).toEqual([{ filename: 'human-design-report.html', text: HTML, keys: ['data', 'filename'] }]);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('沒有平台下載功能時改用瀏覽器下載', async () => {
    const fallback = vi.fn();
    expect(await saveFile('a.html', HTML, 'text/html', null, fallback)).toBe('browser');
    expect(fallback).toHaveBeenCalledWith('a.html', HTML, 'text/html');
  });

  it('平台拒絕時依錯誤代碼處理，不自動重試，也不改用其他格式', async () => {
    let n = 0;
    const ns: PlatformDownloads = {
      save: async () => {
        n++;
        throw { code: 'declined', message: '' };
      },
    };
    const fallback = vi.fn();
    expect(await saveFile('a.html', HTML, 'text/html', ns, fallback)).toBe('declined');
    expect(n).toBe(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('錯誤代碼對應', () => {
    const code = (c: string) => outcomeFromError({ code: c, message: '' });
    expect(code('declined')).toBe('declined');
    expect(code('rate_limited')).toBe('busy');
    expect(code('rejected_extension')).toBe('format-blocked');
    expect(code('extension_not_enabled')).toBe('format-blocked');
    expect(code('bad_request')).toBe('failed');
    expect(code('unavailable')).toBe('unavailable');
    expect(code('not_granted')).toBe('unavailable');
    expect(code('capability_removed')).toBe('unavailable');
    expect(code('something_new')).toBe('unavailable');
    expect(outcomeFromError(new Error('x'))).toBe('unavailable');
  });

  it('每種結果都有說明文字；失敗時都指向「複製純文字」', () => {
    for (const k of ['format-blocked', 'unavailable', 'failed'] as const) expect(SAVE_MESSAGE[k]).toContain('複製純文字');
    expect(SAVE_MESSAGE.declined).toContain('沒有存檔');
  });
});
