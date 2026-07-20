"use client";

import { useEffect, useRef, useState } from "react";

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

/**
 * Video de fondo de la landing. El `src` se asigna recién después de montar
 * para: (1) elegir la versión según el ancho de pantalla sin bajar las dos,
 * (2) respetar `prefers-reduced-motion` y (3) no gastar datos en modo ahorro.
 * Mientras tanto se ve el poster, que es lo que queda fijo en esos casos.
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator as SaveDataNavigator).connection?.saveData) return;
    setSrc(window.innerWidth >= 1024 ? "/media/hero-1080.mp4" : "/media/hero-720.mp4");
  }, []);

  useEffect(() => {
    if (!src || !ref.current) return;
    // Safari en iOS a veces ignora autoPlay cuando el src llega después.
    ref.current.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={ref}
      className="lp-video"
      poster="/media/hero-poster.jpg"
      src={src ?? undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
