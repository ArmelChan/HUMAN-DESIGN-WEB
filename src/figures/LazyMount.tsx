// 非首屏圖解的延遲掛載：接近可視範圍時才計算與繪製；先保留固定高度，避免版面跳動。
// 不支援 IntersectionObserver 的環境直接繪製。

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function LazyMount({ minHeight, children, label }: { minHeight: number; children: () => ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);
  return (
    <div ref={ref} className="lazy-mount" style={visible ? undefined : { minHeight }} aria-busy={!visible} aria-label={visible ? undefined : label}>
      {visible ? children() : null}
    </div>
  );
}
