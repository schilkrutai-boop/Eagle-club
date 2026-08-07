"use client";

import { useEffect, useRef, useState } from "react";

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

/**
 * Portada en video a sangre, como la referencia de Rolls-Royce.
 *
 * El `src` se asigna después de montar para: elegir la versión según el ancho
 * sin descargar las dos, respetar `prefers-reduced-motion` y no gastar datos en
 * modo ahorro. En esos casos queda el poster, que es una imagen del propio
 * video, así que la portada nunca se ve vacía.
 *
 * Para cambiar el video basta reemplazar los archivos de /public/media:
 * hero-1080.mp4, hero-720.mp4 y hero-poster.jpg.
 */
export default function SiteHeroVideo({ poster }: { poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator as SaveDataNavigator).connection?.saveData) return;
    setSrc(window.innerWidth >= 1024 ? "/media/hero-1080.mp4" : "/media/hero-720.mp4");
  }, []);

  useEffect(() => {
    if (!src || !ref.current) return;
    // Safari en iOS ignora autoPlay cuando el src llega después del montaje.
    ref.current.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={ref}
      poster={poster}
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
