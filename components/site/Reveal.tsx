"use client";

import { useEffect, useRef } from "react";

/**
 * Aparece con fade + rise cuando entra al viewport (estilo Rolls-Royce).
 * Respeta prefers-reduced-motion. `delay` en ms escalona elementos hermanos.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }
    // El HTML del servidor llega VISIBLE (si el JS falla, la página completa
    // se lee igual). Solo ocultamos aquí lo que aún está bajo el viewport,
    // para animarlo cuando entre; lo ya visible queda como está.
    if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
      el.classList.add("will-reveal");
    } else {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-in");
            el.classList.remove("will-reveal");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`site-reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
