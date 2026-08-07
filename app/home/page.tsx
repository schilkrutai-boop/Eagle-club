import type { Metadata } from "next";
import Image from "next/image";
import SiteHeader from "@/components/site/SiteHeader";
import Reveal from "@/components/site/Reveal";
import DockTrio from "@/components/site/DockTrio";
import SiteHeroVideo from "@/components/site/SiteHeroVideo";
import { montserrat, formata } from "./fonts";
import "./home.css";

import trioExecutive from "@/public/media/site/trio-executive.jpg";
import trioBag from "@/public/media/site/trio-bag.jpg";
import trioWhisky from "@/public/media/site/trio-whisky.jpg";
import isotipoRed from "@/public/media/site/isotipo-red.png";
import isotipoCream from "@/public/media/site/isotipo-cream.png";

// Página nueva según la maqueta de la agencia. Vive en /home para revisión
// del equipo; la landing "próximamente" de / no se toca hasta el visto bueno.
export const metadata: Metadata = {
  title: "Eagle Club — Indoor Golf",
  description:
    "El primer club de golf indoor de Chile. Bahías con tecnología Trackman, lounge y hospitalidad premium en Isidora Goyenechea 3000, Las Condes.",
  robots: { index: false, follow: false }, // preview: quitar al lanzar
};

// El botón de socio abre un correo al equipo comercial del club.
const SOCIO_MAILTO =
  "mailto:matias@eagleclub.cl" +
  "?cc=nicolas@eagleclub.cl,sofia@eagleclub.cl" +
  "&subject=" + encodeURIComponent("Quiero ser socio de Eagle Club") +
  "&body=" +
  encodeURIComponent(
    "Hola,\n\nMe interesa ser socio de Eagle Club y quisiera recibir la información de la Membresía Fundadores.\n\nNombre:\nTeléfono:\n\nGracias."
  );

const MAPS_URL =
  "https://maps.google.com/?q=Isidora+Goyenechea+3000,+Las+Condes,+Santiago";

export default function HomePage() {
  return (
    <div
      id="inicio"
      className={`site ${montserrat.variable} ${formata.variable}`}
    >
      <SiteHeader />

      {/* ============ HERO — video a sangre ============ */}
      <section className="site-hero" aria-label="Eagle Club">
        <div className="site-hero-media">
          <SiteHeroVideo poster="/media/hero-poster.jpg" />
          <div className="site-hero-veil" />
        </div>
      </section>

      {/* ============ 1 · CLUB ============ */}
      <section id="club" className="site-section">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow">
              El
              <br />
              club
            </p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="site-h2" style={{ marginTop: 46 }}>
              La diferencia está en los detalles
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="site-body" style={{ marginTop: 30 }}>
              Eagle Club nace para ofrecer una nueva forma de vivir el golf: un
              espacio exclusivo donde la tecnología, el diseño y la
              hospitalidad crean una experiencia pensada para quienes valoran
              la excelencia en cada detalle.
            </p>
          </Reveal>
        </div>

        <div className="site-wrap" style={{ marginTop: "clamp(36px, 3.5vw, 64px)" }}>
          <Reveal>
            <DockTrio
              left={trioExecutive}
              center={trioBag}
              right={trioWhisky}
              isotipoRed={isotipoRed}
            />
          </Reveal>
        </div>

      </section>

      {/* ============ 2 · RESERVAR ============ */}
      <section id="reservar" className="site-section site-eventos">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow">Reservar</p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal delay={280}>
            <dl className="site-prices">
              <p className="site-prices-title">Precio</p>
              <div className="site-price-row">
                <dt>Horario punta</dt>
                <dd>$70.000</dd>
              </div>
              <div className="site-price-row">
                <dt>Horario valle</dt>
                <dd>$50.000</dd>
              </div>
              <div className="site-price-row site-price-row--socios">
                <dt>Socios</dt>
                <dd>Gratis</dd>
              </div>
              <p className="site-price-note">
                Los socios no pagan la bahía: su membresía la incluye.
              </p>
            </dl>
          </Reveal>

          <Reveal>
            <div className="site-actions">
              <a className="site-btn" href="/demo">
                Reserva tu bahía
              </a>
              <a className="site-btn site-btn--ghost" href={SOCIO_MAILTO}>
                Quiero ser socio
              </a>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ============ 3 · UBICACIÓN ============ */}
      <section id="ubicacion" className="site-section">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow site-eyebrow--bright">Ubicación</p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal>
            <div className="site-info" style={{ marginTop: "clamp(34px, 3.4vw, 60px)" }}>
              <div>
                <h4>Dirección</h4>
                <p style={{ margin: 0 }}>
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                    Isidora Goyenechea 3000, segundo piso
                    <br />
                    Las Condes, Santiago, Chile.
                  </a>
                </p>
              </div>
              <div>
                <h4>Horario</h4>
                <p style={{ margin: 0 }}>
                  Lunes a sábado / 07:00 AM - 10:00 PM
                  <br />
                  Domingos y festivos / Cerrado
                </p>
              </div>
              <div>
                <h4>Contacto</h4>
                <p style={{ margin: 0 }}>
                  <a href="mailto:contacto@eagleclub.cl">contacto@eagleclub.cl</a>
                  <br />
                  <a
                    href="https://www.instagram.com/eagleclub.cl/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @eagleclub.cl
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="site-section" style={{ paddingTop: 0 }}>
        <div className="site-wrap">
          <Reveal>
            <div className="site-footer-lockup">
              <span className="site-footer-word">Eagle</span>
              <Image src={isotipoCream} alt="" />
              <span className="site-footer-word">Club</span>
            </div>
            <p className="site-footer-tag">Indoor Golf</p>
          </Reveal>

          <hr className="site-hairline" style={{ marginTop: "clamp(40px, 4vw, 76px)" }} />

          <div className="site-footer-bar" style={{ marginTop: 26 }}>
            <span>Eagle Club - Indoor Golf</span>
            <span>Estd. 2026 - Stgo. CL.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
