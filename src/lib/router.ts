// 以 hash 為基礎的小型路由：靜態主機不需伺服器設定，每個條目都有可分享的網址。

import { useEffect, useState } from 'react';

export interface Route {
  path: string[];
  query: URLSearchParams;
  anchor: string | null;
}

export function parseHash(hash: string): Route {
  let raw = hash.replace(/^#/, '') || '/';
  // 發布到 claude.ai 時，外部連結只能帶純文字錨點（如 #centers.sacral），轉成站內路徑。
  if (!raw.startsWith('/') && /^[A-Za-z0-9._~-]+$/.test(raw)) raw = `/${raw.split('.').join('/')}`;
  const [beforeQuery, queryString = ''] = raw.split('?');
  // 頁內錨點寫成 #/types#authority
  const [pathPart, anchor = null] = beforeQuery.split('#');
  const path = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  return { path, query: new URLSearchParams(queryString), anchor };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** 更新網址但不新增瀏覽紀錄，用於圖上的選取狀態。 */
export function replaceHash(hash: string) {
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** 可分享的條目連結。發布版以 VITE_SHARE_BASE 指定網址，使用純文字錨點。 */
export function shareLink(): string {
  const base = import.meta.env.VITE_SHARE_BASE as string | undefined;
  if (!base) return window.location.href;
  const { path } = parseHash(window.location.hash);
  return path.length ? `${base}#${path.join('.')}` : base;
}
