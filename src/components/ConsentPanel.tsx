// 首次產生報告前的同意畫面。條款可以在勾選前完整閱讀；所有選項預設不勾選；
// 條款接受、本機保存、AI 外傳、行銷四項分開，不提供「全部同意」。

import { TERMS_META, TERMS_SECTIONS } from '../data/legal/terms';
import { DISCLAIMER } from '../data/disclaimer';
import { TERMS_VERSION, type ConsentRecord } from '../lib/consent';

interface Props {
  /** 已接受的紀錄（這次瀏覽期間，或勾選保存時從本機讀回）。 */
  record: ConsentRecord | null;
  /** 有舊版本的接受紀錄時顯示更新提示。 */
  outdatedVersion: string | null;
  termsChecked: boolean;
  onTermsChecked: (v: boolean) => void;
  localSave: boolean;
  onLocalSave: (v: boolean) => void;
}

export function ConsentPanel({ record, outdatedVersion, termsChecked, onTermsChecked, localSave, onLocalSave }: Props) {
  const accepted = record?.termsVersion === TERMS_VERSION;
  return (
    <section className="consent" aria-labelledby="consent-h">
      <h2 id="consent-h">產生報告前請先閱讀</h2>
      <p className="consent-notice">{DISCLAIMER}</p>

      {outdatedVersion && !accepted && (
        <p className="form-error" role="status">
          使用條款已由 {outdatedVersion} 更新為 {TERMS_VERSION}，請閱讀新版本後重新接受。
        </p>
      )}

      <details className="more terms-full">
        <summary>閱讀完整使用條款（{TERMS_META.version}・{TERMS_META.status}）</summary>
        {TERMS_SECTIONS.map((s) => (
          <div key={s.id}>
            <h3>{s.title}</h3>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        ))}
        <p>
          另見<a href="#/terms">使用條款頁</a>、<a href="#/privacy">隱私聲明</a>與<a href="#/copyright">版權與使用指引</a>。
        </p>
      </details>

      <fieldset className="consent-choices">
        <legend>各項同意分開選擇</legend>
        {accepted ? (
          <p className="consent-done">
            已接受使用條款 {record!.termsVersion}（{new Date(record!.acceptedAt).toLocaleString('zh-TW')}）。這只是你瀏覽器中的紀錄，不構成跨裝置的證明。
          </p>
        ) : (
          <label className="check-line">
            <input id="consent-terms" type="checkbox" checked={termsChecked} onChange={(e) => onTermsChecked(e.target.checked)} />
            <span>
              <strong>必要：</strong>我已閱讀並同意使用條款（{TERMS_VERSION}）。
            </span>
          </label>
        )}
        <label className="check-line">
          <input id="consent-local" type="checkbox" checked={localSave} onChange={(e) => onLocalSave(e.target.checked)} />
          <span>
            <strong>可選：</strong>在這台裝置保存我的出生資料、反思筆記與條款接受紀錄。不勾選時，關閉頁面後就不保留；之後取消勾選，會立即刪除已保存的資料。
          </span>
        </label>
        <p className="consent-static">
          <strong>AI 處理：</strong>本版本沒有 AI 功能，不會把你的資料傳送給 AI 或任何第三方，因此不需要、也沒有這項同意。
        </p>
        <p className="consent-static">
          <strong>行銷訊息：</strong>本站不收集聯絡方式，也不寄送行銷訊息，因此沒有這項同意。
        </p>
      </fieldset>
    </section>
  );
}
