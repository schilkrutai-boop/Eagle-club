"use client";

import { useEffect, useRef } from "react";

/**
 * Capa del hero con el zoom Ken Burns. La animación es infinita: la pausamos
 * cuando el hero sale del viewport para no quemar GPU/batería con la página
 * scrolleada (la capa tiene will-change y quedaría componiendo para siempre).
 */
export default function HeroZoom({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      el.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="site-hero-zoom">
      {children}
    </div>
  );
}
