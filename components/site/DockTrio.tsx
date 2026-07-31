"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Parallax from "@/components/site/Parallax";

/**
 * Tríptico blanco y negro con el lockup rojo flotante encima.
 * Notas de la maqueta: hover tipo dock de Mac, imágenes no clickeables,
 * el logo permanece siempre flotando en la misma posición, parallax leve.
 */
export default function DockTrio({
  left,
  center,
  right,
  isotipoRed,
}: {
  left: StaticImageData;
  center: StaticImageData;
  right: StaticImageData;
  isotipoRed: StaticImageData;
}) {
  const [hot, setHot] = useState<null | "left" | "center" | "right">(null);

  // El parallax escribe transform inline en el nodo del tile; el scale del
  // hover vive en un nodo interno (.site-trio-zoom) para que no se pisen.
  const tile = (
    key: "left" | "center" | "right",
    img: StaticImageData,
    speed: number,
    sizes: string
  ) => (
    <Parallax speed={speed} className={`site-trio-tile site-trio-tile--${key} ${hot === key ? "is-hot" : ""}`}>
      <div
        className="site-trio-zoom"
        onMouseEnter={() => setHot(key)}
        onMouseLeave={() => setHot((h) => (h === key ? null : h))}
      >
        <Image
          src={img}
          alt=""
          placeholder="blur"
          sizes={sizes}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </Parallax>
  );

  return (
    <div className={`site-trio ${hot ? "is-hovering" : ""}`}>
      {tile("left", left, 0.045, "(max-width: 900px) 100vw, 34vw")}
      {tile("center", center, 0.085, "(max-width: 900px) 100vw, 32vw")}
      {tile("right", right, 0.045, "(max-width: 900px) 100vw, 33vw")}

      <div className="site-trio-lockup" aria-hidden="true">
        <span className="site-trio-word">
          Eagle
          <br />
          Club
          <small>Estd. 2026</small>
        </span>
        <Image src={isotipoRed} alt="" />
        <span className="site-trio-word site-trio-word--right">
          Indoor
          <br />
          Golf
          <small>Stgo. Chile</small>
        </span>
      </div>
    </div>
  );
}
