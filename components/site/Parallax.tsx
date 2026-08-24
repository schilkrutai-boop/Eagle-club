"use client";

import { useEffect, useRef } from "react";

/**
 * Parallax de dos capas, al estilo de las galerías de moda (obys.agency):
 *  - el MARCO se desplaza en Y a una fracción del scroll (`speed`), así unas
 *    fotos suben más lento que otras y se escalonan.
 *  - la IMAGEN dentro del marco se mueve en sentido contrario y un poco
 *    escalada, de modo que "flota" dentro de su recuadro (efecto profundidad).
 *
 * Un solo listener global mueve todas las instancias en el mismo frame, con
 * interpolación suave (lerp) para que el movimiento tenga inercia y no vaya
 * pegado al scroll. Respeta prefers-reduced-motion.
 */

type Instancia = {
  frame: HTMLElement;
  media: HTMLElement | null;
  speed: number;
  actual: number;
  objetivo: number;
};

const instancias = new Set<Instancia>();
let corriendo = false;
let raf = 0;

function medirObjetivos() {
  const vh = window.innerHeight;
  for (const it of instancias) {
    const r = it.frame.getBoundingClientRect();
    // distancia del centro del elemento al centro de la pantalla, normalizada
    const desde = r.top + r.height / 2 - vh / 2;
    it.objetivo = desde;
  }
}

function loop() {
  let vivo = false;
  for (const it of instancias) {
    // lerp: acercar suavemente el valor actual al objetivo -> inercia
    it.actual += (it.objetivo - it.actual) * 0.085;
    if (Math.abs(it.objetivo - it.actual) > 0.4) vivo = true;

    const y = -it.actual * it.speed;
    it.frame.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;

    // la imagen flota en sentido contrario, dentro del margen que da el
    // scale: con scale 1.14 sobra 7% de alto por lado, y nunca asoma borde.
    if (it.media) {
      const margen = it.media.offsetHeight * 0.06; // 6% < 7% de holgura
      let yi = it.actual * it.speed * 0.5;
      if (yi > margen) yi = margen;
      if (yi < -margen) yi = -margen;
      it.media.style.transform = `translate3d(0, ${yi.toFixed(2)}px, 0) scale(1.14)`;
    }
  }
  if (vivo) {
    raf = requestAnimationFrame(loop);
  } else {
    corriendo = false;
  }
}

function despertar() {
  medirObjetivos();
  if (!corriendo) {
    corriendo = true;
    raf = requestAnimationFrame(loop);
  }
}

export default function Parallax({
  children,
  speed = 0.07,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const media = el.querySelector<HTMLElement>("img, video, picture");
    if (media) media.style.willChange = "transform";

    const it: Instancia = { frame: el, media, speed, actual: 0, objetivo: 0 };
    instancias.add(it);

    // primer cálculo sin salto
    const r = el.getBoundingClientRect();
    it.objetivo = it.actual = r.top + r.height / 2 - window.innerHeight / 2;
    loop();

    const onScroll = () => despertar();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      instancias.delete(it);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (!instancias.size) {
        cancelAnimationFrame(raf);
        corriendo = false;
      }
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
