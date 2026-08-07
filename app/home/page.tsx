import type { Metadata } from "next";
import Image from "next/image";
import SiteHeader from "@/components/site/SiteHeader";
import Reveal from "@/components/site/Reveal";
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
              quality={88}
              sizes="100vw"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </HeroZoom>
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

        </div>
      </section>

      {/* ============ LA EXPERIENCIA (degradado + índice informativo) ============ */}
      <section id="experiencia" className="site-section site-grad">
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
              Todo lo que incluye una visita a Eagle Club
            </p>
          </Reveal>

          <Reveal>
            <div className="site-index">
              <div className="site-index-row">
                <div className="site-index-term">Bahías privadas</div>
                <p className="site-index-desc">
                  Espacios reservados por hora para jugar entre amigos, cerrar
                  una reunión o entrenar en serio: <strong>hasta seis
                  personas</strong> por bahía, con sofás, mesa y servicio
                  directo del bar.
                </p>
              </div>
              <div className="site-index-row">
                <div className="site-index-term">Tecnología Trackman</div>
                <p className="site-index-desc">
                  El mismo sistema con que entrenan los profesionales del tour:
                  mide <strong>cada tiro en tiempo real</strong> y te permite
                  jugar los campos más famosos del mundo sin salir de Santiago,
                  en condiciones perfectas todo el año.
                </p>
              </div>
              <div className="site-index-row">
                <div className="site-index-term">Bar y cocina</div>
                <p className="site-index-desc">
                  Pides desde el iPad de la bahía o <strong>desde tu celular
                  escaneando el código QR</strong>, sin interrumpir el juego. La
                  cocina recibe tu pedido al instante y te lo llevamos a la
                  bahía.
                </p>
              </div>
              <div className="site-index-row">
                <div className="site-index-term">Academia</div>
                <p className="site-index-desc">
                  Clases individuales y programas con instructores, sobre los
                  datos reales de tu swing. Tu progreso queda registrado en tu
                  perfil de socio, sesión a sesión.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h2 className="site-h2" style={{ marginTop: "clamp(48px, 5vw, 88px)" }}>
              Así de simple
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="site-steps">
              <div className="site-step">
                <div className="site-step-num" aria-hidden>
                  1
                </div>
                <h3>Reserva tu bahía</h3>
                <p>
                  Elige día, hora y bahía en línea, con confirmación inmediata.
                  También puedes llegar sin reserva y tomar una bahía libre.
                </p>
              </div>
              <div className="site-step">
                <div className="site-step-num" aria-hidden>
                  2
                </div>
                <h3>Juega</h3>
                <p>
                  Tu sesión parte puntual. Trackman registra cada golpe y el
                  tiempo restante siempre está a la vista. ¿Quieren seguir? La
                  extensión se pide con un toque.
                </p>
              </div>
              <div className="site-step">
                <div className="site-step-num" aria-hidden>
                  3
                </div>
                <h3>Disfruta</h3>
                <p>
                  La carta completa del bar y la cocina llega a tu bahía. Al
                  final, una sola cuenta: tiempo de juego y consumo juntos, y
                  pagas desde tu asiento.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 2 · MEMBRESÍAS ============ */}
      <section id="membresias" className="site-section">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow">Membresías</p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal delay={120}>
            <Image
              src={logoStacked}
              alt="Eagle Club — Indoor Golf"
              className="site-club-logo"
              sizes="(max-width: 900px) 70vw, 24vw"
              style={{ marginTop: "clamp(28px, 2.6vw, 48px)" }}
            />
          </Reveal>
          <Reveal delay={200}>
            <p className="site-body" style={{ marginTop: "clamp(30px, 3vw, 56px)" }}>
              Un club privado en el corazón de Las Condes. Membresías
              limitadas, beneficios exclusivos y una comunidad que comparte una
              misma forma de entender el juego.
            </p>
          </Reveal>
          <Reveal>
            <div className="site-index" style={{ maxWidth: 880, marginInline: "auto" }}>
              <div className="site-index-row">
                <div className="site-index-term">Horas incluidas</div>
                <p className="site-index-desc">
                  Cada membresía incluye <strong>horas de bahía todos los
                  meses</strong>, con acceso preferente para reservar antes que
                  el público general.
                </p>
              </div>
              <div className="site-index-row">
                <div className="site-index-term">Cuenta de socio</div>
                <p className="site-index-desc">
                  Firma tus consumos con tu número de socio y paga todo junto a
                  fin de mes. Sin sacar la tarjeta en cada visita.
                </p>
              </div>
              <div className="site-index-row">
                <div className="site-index-term">Invitados</div>
                <p className="site-index-desc">
                  Trae a quienes quieras a tu bahía y comparte los beneficios
                  del club con tus invitados.
                </p>
              </div>
              <div className="site-index-row">
                <div className="site-index-term">Torneos y ligas</div>
                <p className="site-index-desc">
                  Competencias internas con ranking, y tus estadísticas de juego
                  registradas en tu perfil para seguir tu progreso.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div style={{ marginTop: "clamp(40px, 4vw, 80px)" }}>
              <p className="site-body">
                Las membresías son limitadas y los primeros cupos se abrirán a
                quienes estén en la lista.
                <br />
                Déjanos tus datos y te contactaremos con la información completa.
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

      {/* ============ 3 · RESERVAR (absorbe eventos privados) ============ */}
      <section id="reservar" className="site-section site-eventos">
        <div className="site-wrap">
          <Reveal>
            <p className="site-eyebrow">Reservar</p>
            <div className="site-eyebrow-rule" />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="site-h2" style={{ marginTop: 46 }}>
              Tu bahía, a la hora que quieras
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="site-body" style={{ marginTop: 30 }}>
              Elige día, hora y bahía en línea, con confirmación inmediata.
              También puedes llegar sin reserva y tomar una bahía libre según
              disponibilidad.
            </p>
          </Reveal>
          <Reveal>
            <div style={{ textAlign: "center", marginTop: "clamp(30px, 3vw, 52px)" }}>
              <a className="site-btn" href="/demo">
                Reserva tu bahía
              </a>
            </div>
          </Reveal>

          <Reveal>
            <hr className="site-hairline" style={{ marginTop: "clamp(40px, 4vw, 76px)" }} />
          </Reveal>

          <Reveal delay={120}>
            <h2 className="site-h2" style={{ marginTop: "clamp(34px, 3.4vw, 60px)" }}>
              ¿Un evento privado?
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="site-body" style={{ marginTop: 26 }}>
              Lanzamientos, encuentros corporativos y celebraciones privadas en
              un espacio único. Podemos reservar bahías o el club completo, y
              nuestro equipo produce cada evento a la medida.
            </p>
          </Reveal>
          <Reveal>
            <div style={{ textAlign: "center", marginTop: "clamp(26px, 2.6vw, 44px)" }}>
              <a
                className="site-btn"
                href="mailto:contacto@eagleclub.cl?subject=Evento%20en%20Eagle%20Club"
              >
                Contáctanos
              </a>
            </div>
          </Reveal>
        </div>
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

          <Reveal>
            <div className="site-index" style={{ maxWidth: 880, marginInline: "auto" }}>
              <div className="site-index-row">
                <div className="site-index-term">Barrio El Golf</div>
                <p className="site-index-desc">
                  A pasos del metro El Golf, rodeado de los principales hoteles,
                  oficinas y la mejor oferta gastronómica de Santiago — para
                  antes o después de tu práctica.
                </p>
              </div>
              <div className="site-index-row">
                <div className="site-index-term">Estacionamiento</div>
                <p className="site-index-desc">
                  Estacionamiento en el mismo edificio y seguridad durante toda
                  tu visita. Llegas, subes al segundo piso y juegas.
                </p>
              </div>
            </div>
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
