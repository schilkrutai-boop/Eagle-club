import Link from "next/link";
import TopBar from "@/components/TopBar";
import { LogoLockup } from "@/components/Logo";

const BAYS = [1, 2, 3, 4, 5, 6];

export default function DemoHome() {
  return (
    <>
      <TopBar />

      {/* HERO */}
      <section style={{ background: "var(--wine)", color: "var(--on-wine)" }}>
        <div className="wrap py-16 sm:py-24">
          <LogoLockup />
          <h1 className="display mt-12 text-[clamp(30px,5.5vw,54px)]">
            Juega. Pide. Repite.
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg" style={{ color: "var(--on-wine-dim)" }}>
            Reserva tu bahía de simulador y pide del menú sin levantarte del
            tee. La cocina recibe tu pedido al instante.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/reservar" className="btn btn--primary btn--lg">
              Reservar una bahía
            </Link>
            <a href="#bahias" className="btn btn--outline-light btn--lg">
              Ver el menú
            </a>
          </div>
        </div>
        <div className="brand-stripe" aria-hidden />
      </section>

      {/* BAYS */}
      <section id="bahias" className="wrap scroll-mt-16 py-14 sm:py-20">
        <p className="eyebrow">¿Ya estás en el club?</p>
        <h2 className="display mt-2 text-2xl sm:text-3xl">
          Elige tu bahía y pide desde ahí
        </h2>
        <p className="mt-3 max-w-[58ch]" style={{ color: "var(--mid)" }}>
          Cada bahía tiene un iPad y un código QR. Escanéalo con tu celular o
          toca tu bahía aquí para abrir el menú.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BAYS.map((id) => (
            <Link
              key={id}
              href={`/b/${id}`}
              className="card group flex flex-col items-center gap-1 py-7 no-underline transition-colors hover:border-[var(--crimson)]"
            >
              <span className="eyebrow">Bahía</span>
              <span className="mono text-5xl font-semibold group-hover:text-[var(--crimson-dark)]">
                {String(id).padStart(2, "0")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* STAFF */}
      <section
        className="border-t"
        style={{ borderColor: "var(--line)", background: "#f0e9de" }}
      >
        <div className="wrap py-12">
          <p className="eyebrow">Operación del club</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/cocina"
              className="card flex items-center justify-between p-6 no-underline transition-colors hover:border-[var(--crimson)]"
            >
              <div>
                <div className="display text-lg">Pantalla de cocina</div>
                <p className="mt-1 text-sm" style={{ color: "var(--mid)" }}>
                  Los pedidos de cada bahía llegan en vivo, con timer y estados.
                </p>
              </div>
              <span className="mono text-2xl" aria-hidden>
                →
              </span>
            </Link>
            <Link
              href="/admin"
              className="card flex items-center justify-between p-6 no-underline transition-colors hover:border-[var(--crimson)]"
            >
              <div>
                <div className="display text-lg">Administración</div>
                <p className="mt-1 text-sm" style={{ color: "var(--mid)" }}>
                  Ventas, inventario, precios, reservas y QR por bahía.
                </p>
              </div>
              <span className="mono text-2xl" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="wrap flex flex-wrap justify-between gap-2 py-8">
        <span className="eyebrow">Eagle Club · MVP Versión 1</span>
        <span className="eyebrow">Pagos en modo demostración</span>
      </footer>
    </>
  );
}
