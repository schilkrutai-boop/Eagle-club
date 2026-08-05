import type { Metadata } from "next";
import Image from "next/image";
import SiteHeader from "@/components/site/SiteHeader";
import Reveal from "@/components/site/Reveal";
import Parallax from "@/components/site/Parallax";
import DockTrio from "@/components/site/DockTrio";
import ClubForm from "@/components/site/ClubForm";
import HeroZoom from "@/components/site/HeroZoom";
import { montserrat, formata } from "./fonts";
import "./home.css";

import heroIndoor from "@/public/media/hero-options/option-10-dark-bay-v2.jpg";
import trioExecutive from "@/public/media/site/trio-executive.jpg";
import trioBag from "@/public/media/site/trio-bag.jpg";
import trioWhisky from "@/public/media/site/trio-whisky.jpg";
import isotipoRed from "@/public/media/site/isotipo-red.png";
import isotipoCream from "@/public/media/site/isotipo-cream.png";
import practicaTrackman from "@/public/media/site/practica-trackman.jpg";
import practicaLounge from "@/public/media/site/practica-lounge.jpg";
import practicaCafe from "@/public/media/site/practica-cafe.jpg";
import entornoInterior from "@/public/media/site/entorno-interior.jpg";
import entornoCuadro from "@/public/media/site/entorno-cuadro.jpg";
import entornoLifestyle from "@/public/media/site/entorno-lifestyle.jpg";
import eventosMartini from "@/public/media/site/eventos-martini.jpg";
import ubiHotel from "@/public/media/site/ubi-hotel.jpg";
import ubiRestaurant from "@/public/media/site/ubi-restaurant.jpg";
import ubiParking from "@/public/media/site/ubi-parking.jpg";
import ubiMapa from "@/public/media/site/ubi-mapa.jpg";
import logoStacked from "@/public/media/eagleclub-logo-stacked.png";

// Página nueva según la maqueta de la agencia. Vive en /home para revisión
// del equipo; la landing "próximamente" de / no se toca hasta el visto bueno.
export const metadata: Metadata = {
  title: "Eagle Club — Indoor Golf",
  description:
    "El primer club de golf indoor de Chile. Bahías con tecnología Trackman, lounge y hospitalidad premium en Isidora Goyenechea 3000, Las Condes.",
  robots: { index: false, follow: false }, // preview: quitar al lanzar
};

const MAPS_URL =
  "https://maps.google.com/?q=Isidora+Goyenechea+3000,+Las+Condes,+Santiago";

export default function HomePage() {
  return (
    <div
      id="inicio"
      className={`site ${montserrat.variable} ${formata.variable}`}
    >
      <SiteHeader />

      {/* ============ HERO ============ */}
      <section className="site-hero" aria-label="Eagle Club">
        <div className="site-hero-media">
          <HeroZoom>
            <Image
              src={heroIndoor}
              placeholder="blur"
              alt="Bahía de golf indoor de Eagle Club"
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </HeroZoom>
          <div className="site-hero-veil" />
        </div>
      </section>

      {/* ============ NUESTRA MIRADA ============ */}
      <section id="mirada" className="site-section">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow">
              Nuestra
              <br />
              mirada
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

        <div className="site-wrap" style={{ marginTop: "clamp(48px, 5vw, 96px)" }}>
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

      {/* ============ LA PRÁCTICA ============ */}
      <section id="practica" className="site-section site-practica">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow">
              La
              <br />
              práctica
            </p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="site-h2 site-h2--ink" style={{ marginTop: 46 }}>
              La excelencia no necesita un campo,
              <br />
              solo un espacio para jugar
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="site-body site-body--ink" style={{ marginTop: 30 }}>
              Bahías equipadas con tecnología Trackman, un lounge para
              compartir y un servicio pensado para que cada práctica sea una
              experiencia completa.
            </p>
          </Reveal>

          <div className="site-cards" style={{ marginTop: "clamp(40px, 4vw, 80px)" }}>
            <Reveal className="site-card">
              <div className="site-card-img">
                <Image
                  src={practicaTrackman}
                  placeholder="blur"
                  alt="Bahía de práctica con simulador Trackman"
                  sizes="(max-width: 900px) 100vw, 28vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3>Juega como un profesional</h3>
              <p>
                Tecnología Trackman en cada bahía: datos precisos de tu swing y
                los mejores campos del mundo, en condiciones perfectas todo el
                año.
              </p>
            </Reveal>

            <Reveal delay={120} className="site-card">
              <div className="site-card-img">
                <Image
                  src={practicaLounge}
                  placeholder="blur"
                  alt="Lounge de Eagle Club"
                  sizes="(max-width: 900px) 100vw, 28vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3>Pasar un momento o tener una reunión</h3>
              <p>
                Lounge y sala de estar para reuniones y sobremesas, con espacio
                para guardar tus palos. Un lugar pensado para quedarse.
              </p>
            </Reveal>

            <Reveal delay={240} className="site-card">
              <div className="site-card-img">
                <Image
                  src={practicaCafe}
                  placeholder="blur"
                  alt="Café de especialidad en Eagle Club"
                  sizes="(max-width: 900px) 100vw, 28vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3>¿Café, té o un trago?</h3>
              <p>
                Servicio de cafetería y bar disponible durante toda tu visita,
                sin levantarte de la bahía.
              </p>
            </Reveal>
          </div>

          <Reveal>
            <div style={{ textAlign: "center", marginTop: "clamp(40px, 4vw, 76px)" }}>
              <a className="site-btn" href="/demo">
                Reserva tu práctica
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ EL ENTORNO (degradado + collage) ============ */}
      <section className="site-section site-grad">
        <div className="site-wrap" style={{ paddingTop: "clamp(30px, 4vw, 90px)" }}>
          <Reveal>
            <h2 className="site-h2 site-h2--xl">
              Cuando el entorno inspira,
              <br />
              el rendimiento cambia
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="site-sub" style={{ marginTop: 34 }}>
              La mejor versión de tu juego comienza aquí
            </p>
          </Reveal>

          <div className="site-collage">
            <Parallax speed={0.03} className="site-collage-tile site-collage-tile--interior">
              <Reveal>
                <Image
                  src={entornoInterior}
                  placeholder="blur"
                  alt="Interior del club: lounge con bolsa de palos"
                  sizes="(max-width: 900px) 100vw, 42vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Reveal>
            </Parallax>
            <Parallax speed={0.07} className="site-collage-tile site-collage-tile--cuadro">
              <Reveal delay={120}>
                <Image
                  src={entornoCuadro}
                  placeholder="blur"
                  alt="Palos de golf clásicos"
                  sizes="(max-width: 900px) 80vw, 27vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Reveal>
            </Parallax>
            <Parallax speed={0.1} className="site-collage-tile site-collage-tile--lifestyle">
              <Reveal delay={200}>
                <Image
                  src={entornoLifestyle}
                  placeholder="blur"
                  alt="Detalle lifestyle: guante y pelota de golf"
                  sizes="(max-width: 900px) 100vw, 63vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Reveal>
            </Parallax>
          </div>
        </div>
      </section>

      {/* ============ EL CLUB ============ */}
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
            <Image
              src={logoStacked}
              alt="Eagle Club — Indoor Golf"
              className="site-club-logo"
              sizes="(max-width: 900px) 70vw, 24vw"
              style={{ marginTop: "clamp(40px, 4vw, 80px)" }}
            />
          </Reveal>
          <Reveal delay={200}>
            <p className="site-body" style={{ marginTop: "clamp(30px, 3vw, 56px)" }}>
              Un club privado en el corazón de Las Condes. Membresías
              limitadas, beneficios exclusivos y una comunidad que comparte una
              misma forma de entender el juego.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <h2 className="site-h2" style={{ marginTop: "clamp(40px, 4vw, 80px)" }}>
              El golf es mucho más que un deporte,
              <br />
              es un estilo de vida
            </h2>
          </Reveal>

          <Reveal>
            <div style={{ marginTop: "clamp(40px, 4vw, 80px)" }}>
              <p className="site-body">
                ¿Te gustaría saber más acerca de Eagle Club, su membresía y
                beneficios?
                <br />
                Llena el formulario y pronto nos comunicaremos contigo.
              </p>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div style={{ marginTop: "clamp(36px, 3.5vw, 64px)" }}>
              <ClubForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ EVENTOS ============ */}
      <section id="eventos" className="site-section site-eventos" style={{ paddingBottom: 0 }}>
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow">Eventos</p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="site-h2" style={{ marginTop: 46 }}>
              Un espacio donde cada encuentro
              <br />
              se convierte en una experiencia
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="site-body" style={{ marginTop: 30 }}>
              Lanzamientos, encuentros corporativos y celebraciones privadas en
              un espacio único. Nuestro equipo produce cada evento a la medida.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <p className="site-sub" style={{ marginTop: "clamp(36px, 3.5vw, 64px)" }}>
              Cuéntanos tu idea, evento, proyecto o lanzamiento
              <br />y pronto nos comunicaremos contigo
            </p>
          </Reveal>
          <Reveal>
            <div style={{ textAlign: "center", marginTop: "clamp(30px, 3vw, 56px)" }}>
              <a
                className="site-btn"
                href="mailto:contacto@eagleclub.cl?subject=Evento%20en%20Eagle%20Club"
              >
                Contáctanos
              </a>
            </div>
          </Reveal>

          <Reveal>
            <div className="site-eventos-img" style={{ marginTop: "clamp(40px, 4vw, 80px)" }}>
              <Image
                src={eventosMartini}
                alt="Brindis con copas de martini y pelotas de golf"
                sizes="(max-width: 900px) 100vw, 82vw"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 18%" }}
              />
            </div>
          </Reveal>
        </div>
        <div className="site-eventos-fade" />
      </section>

      {/* ============ UBICACIÓN ============ */}
      <section id="ubicacion" className="site-section">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow site-eyebrow--bright">Ubicación</p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="site-h2" style={{ marginTop: 46 }}>
              El lujo no es el lugar,
              <br />
              es la experiencia
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="site-body" style={{ marginTop: 30 }}>
              En el corazón de El Golf, sobre el eje Isidora Goyenechea: la
              mejor gastronomía, servicios y seguridad en un mismo entorno.
            </p>
          </Reveal>

          <div
            className="site-cards site-ubi-cards"
            style={{ marginTop: "clamp(40px, 4vw, 80px)" }}
          >
            <Reveal className="site-card">
              <div className="site-card-img">
                <Image
                  src={ubiHotel}
                  placeholder="blur"
                  alt="Skyline del barrio El Golf al atardecer"
                  sizes="(max-width: 900px) 100vw, 28vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3>Barrio El Golf</h3>
              <p>
                En el barrio más exclusivo de Santiago, rodeado de los
                principales hoteles y oficinas.
              </p>
            </Reveal>

            <Reveal delay={120} className="site-card">
              <div className="site-card-img">
                <Image
                  src={ubiRestaurant}
                  placeholder="blur"
                  alt="Mesa de restaurant"
                  sizes="(max-width: 900px) 100vw, 28vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3>Restaurants y bares a tu alcance</h3>
              <p>
                Rodeado de la mejor oferta gastronómica para antes o después de
                tu práctica.
              </p>
            </Reveal>

            <Reveal delay={240} className="site-card">
              <div className="site-card-img">
                <Image
                  src={ubiParking}
                  placeholder="blur"
                  alt="Estacionamiento con bolsa de palos"
                  sizes="(max-width: 900px) 100vw, 28vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3>Estacionamiento y seguridad</h3>
              <p>
                Estacionamiento en el edificio y seguridad durante toda tu
                visita.
              </p>
            </Reveal>
          </div>

          <Reveal>
            <hr className="site-hairline" style={{ marginTop: "clamp(48px, 5vw, 96px)" }} />
          </Reveal>

          <Reveal>
            <div className="site-info" style={{ marginTop: "clamp(30px, 3vw, 56px)" }}>
              <div>
                <h4>Dirección</h4>
                <p style={{ margin: 0 }}>
                  Isidora Goyenechea 3000, segundo piso
                  <br />
                  Las Condes, Santiago, Chile.
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

          <Reveal>
            <a
              className="site-mapa"
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir la ubicación de Eagle Club en Google Maps"
              style={{ marginTop: "clamp(40px, 4vw, 80px)" }}
            >
              <Image
                src={ubiMapa}
                alt="Mapa: Isidora Goyenechea 3000, Las Condes"
                sizes="(max-width: 900px) 100vw, 82vw"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </a>
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
