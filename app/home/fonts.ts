// Fuentes de la maqueta (empaquetadas por el diseñador), convertidas a WOFF2
// (next/font sirve el archivo tal cual: el TTF variable pesaba 394 KB, el
// WOFF2 124 KB). Self-hosted vía next/font/local: cero requests externos y sin
// layout shift.
//
//   Montserrat  — titulares (Thin/Light con tracking amplio) y cuerpo.
//   Formata Condensed SC — menú, eyebrows y botones (small caps condensada).
//
// Readex Pro venía en el paquete pero la maqueta no la usa en ningún texto:
// no se carga (eran 285 KB de peso muerto precargado).
import localFont from "next/font/local";

export const montserrat = localFont({
  src: "../fonts/Montserrat-Variable.woff2",
  variable: "--font-mont",
  weight: "100 900",
  display: "swap",
});

export const formata = localFont({
  src: "../fonts/Formata-CondensedSC.woff2",
  variable: "--font-formata",
  weight: "400",
  display: "swap",
});
