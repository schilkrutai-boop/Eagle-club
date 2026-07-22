import type { Metadata } from "next";
import Image from "next/image";
import HeroVideo from "@/components/HeroVideo";
import WaitlistForm from "@/components/WaitlistForm";
import logo from "@/public/media/eagleclub-logo-stacked.png";

// Solo fijamos metadataBase si hay dominio explícito. Si no, dejamos que Next
// use su fallback (la URL del deploy en Vercel); hardcodear localhost rompería
// las imágenes de OpenGraph al compartir el link en producción.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const DESCRIPTION =
  "Un nuevo club de golf indoor. Bahías con simulador, cocina y una experiencia cuidada al detalle. Súmate a la lista de espera.";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: "Eagle Club — Indoor Golf · Próximamente",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Eagle Club",
    title: "Eagle Club — Indoor Golf",
    description: DESCRIPTION,
    images: [
      {
        url: "/media/hero-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "Eagle Club en construcción",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eagle Club — Indoor Golf",
    description: DESCRIPTION,
    images: ["/media/hero-poster.jpg"],
  },
};

export default function ComingSoon() {
  return (
    <main className="lp">
      <HeroVideo />
      <div className="lp-veil" aria-hidden />

      <div className="lp-content">
        <div className="wrap lp-inner">
          <Image
            src={logo}
            alt="Eagle Club — Indoor Golf"
            className="lp-logo lp-rise"
            sizes="(max-width: 640px) 86vw, 500px"
            loading="eager"
          />

          <div
            className="lp-rule lp-rise mt-8"
            style={{ animationDelay: "120ms" }}
            aria-hidden
          />

          <p className="lp-kicker lp-rise mt-7" style={{ animationDelay: "220ms" }}>
            Próximamente
          </p>

          <h1
            className="display lp-title lp-rise mt-5"
            style={{ animationDelay: "300ms" }}
          >
            Estamos construyendo
            <br className="hidden sm:inline" /> algo excepcional
          </h1>

          <p className="lp-lead lp-rise mt-6" style={{ animationDelay: "400ms" }}>
            El primer club de golf indoor de Chile. Déjanos tus datos y sé de
            los primeros en cruzar la puerta.
          </p>

          <div
            className="lp-rise mt-11 flex w-full justify-center"
            style={{ animationDelay: "520ms" }}
          >
            <WaitlistForm />
          </div>
        </div>

        <footer className="lp-foot">
          <div className="wrap flex flex-wrap items-center justify-between gap-3 py-6">
            <span className="lp-kicker">Eagle Club · Indoor Golf</span>
            <span
              className="lp-kicker"
              style={{ color: "rgba(246, 239, 230, 0.34)" }}
            >
              Lista de espera abierta
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
