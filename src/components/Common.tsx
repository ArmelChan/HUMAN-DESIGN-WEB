import { useState, type ReactNode } from 'react';
import { shareLink } from '../lib/router';
import { LAYER_LABEL, VERIFICATION_LABEL, type Layer, type Verification } from '../data/sources';

export function VerificationBadge({ status }: { status: Verification }) {
  const info = VERIFICATION_LABEL[status];
  return (
    <span className={`badge badge-${status}`} title={info.description}>
      <span aria-hidden="true">{status === 'crossChecked' ? '✓' : status === 'commonReference' ? '◐' : status === 'pending' ? '?' : '—'}</span>
      {info.label}
    </span>
  );
}

export function LayerTag({ layer }: { layer: Layer }) {
  const info = LAYER_LABEL[layer];
  return (
    <span className={`layer layer-${layer}`} title={info.description}>
      {info.label}
    </span>
  );
}

export function ShareButton({ label = '複製這個條目的連結' }: { label?: string }) {
  const [status, setStatus] = useState('');
  const copy = async () => {
    const url = shareLink();
    try {
      await navigator.clipboard.writeText(url);
      setStatus('已複製連結。');
    } catch {
      setStatus(`無法自動複製，請手動複製網址：${url}`);
    }
  };
  return (
    <span className="share">
      <button type="button" className="btn btn-quiet" onClick={copy}>
        {label}
      </button>
      <span className="share-status" role="status" aria-live="polite">
        {status}
      </span>
    </span>
  );
}

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="section" id={id} aria-labelledby={id ? `${id}-h` : undefined}>
      <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
      {children}
    </section>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'caution'; title: string; children: ReactNode }) {
  return (
    <aside className={`callout callout-${tone}`}>
      <p className="callout-title">{title}</p>
      <div>{children}</div>
    </aside>
  );
}

export function NotFoundBlock({ what }: { what: string }) {
  return (
    <div className="empty">
      <p>找不到{what}。可能是網址打錯，或本站尚未收錄。</p>
      <p>
        <a href="#/">回到圖像探索</a>
      </p>
    </div>
  );
}
