import { useEffect, useRef, useState, type ReactNode } from 'react';
import './associateTableScroll.css';

export default function AssociateTableScroll({ children }: { children: ReactNode }) {
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const measure = () => setWidth(bottom.current?.scrollWidth ?? 0);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    if (bottom.current) observer.observe(bottom.current);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  return <>
    <div ref={top} role="region" aria-label="Desplazamiento horizontal superior de asociados" tabIndex={0}
      className="associate-table-scroll mt-5 overflow-x-auto" onScroll={() => {
        if (top.current && bottom.current && bottom.current.scrollLeft !== top.current.scrollLeft) bottom.current.scrollLeft = top.current.scrollLeft;
      }}>
      <div style={{ width, height: 16 }} />
    </div>
    <div ref={bottom} role="region" aria-label="Tabla de asociados" tabIndex={0}
      className="associate-table-scroll overflow-x-auto" onScroll={() => {
        if (top.current && bottom.current && top.current.scrollLeft !== bottom.current.scrollLeft) top.current.scrollLeft = bottom.current.scrollLeft;
      }}>
      <div ref={content} className="min-w-[860px]">{children}</div>
    </div>
  </>;
}
