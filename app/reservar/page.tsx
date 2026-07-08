"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import DonationPicker from "@/components/Donation";
import Modal from "@/components/Modal";
import { useLiveState } from "@/components/useLiveState";
import { clp, dateLabel, hourLabel, todayISO } from "@/lib/format";
import { CLOSE_HOUR, DEFAULT_BAY_PRICE, OPEN_HOUR, type Reservation } from "@/lib/types";

const HOURS = Array.from(
  { length: CLOSE_HOUR - OPEN_HOUR },
  (_, i) => OPEN_HOUR + i
);

function nextDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const tz = d.getTimezoneOffset() * 60000;
    out.push(new Date(d.getTime() - tz).toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export default function ReservarPage() {
  // Las fechas y la hora actual se calculan tras montar (no en render) para
  // evitar mismatch de hidratación entre el HTML prerenderizado y el cliente.
  const [days, setDays] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [clock, setClock] = useState<{ today: string; hour: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = nextDays(7);
      setDays(d);
      setDate((cur) => (cur && d.includes(cur) ? cur : d[0]));
      setClock({ today: todayISO(), hour: new Date().getHours() });
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  const { state } = useLiveState(date ? { date } : undefined);
  const bayPrice = state?.settings.bayPrice ?? DEFAULT_BAY_PRICE;

  const [selected, setSelected] = useState<{ bayId: number; hour: number } | null>(null);
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  const taken = useMemo(() => {
    const set = new Set<string>();
    for (const r of state?.reservations ?? []) set.add(`${r.bayId}-${r.hour}`);
    return set;
  }, [state]);

  const nowHour = clock?.hour ?? -1;
  const isToday = Boolean(clock) && date === clock!.today;

  return (
    <>
      <TopBar />
      <main className="wrap py-10 sm:py-14">
        <p className="eyebrow">Reservas</p>
        <h1 className="display mt-2 text-3xl sm:text-4xl">Tee sheet</h1>
        <p className="mt-3 max-w-[60ch]" style={{ color: "var(--mid)" }}>
          Disponibilidad en tiempo real. Elige un bloque de una hora en la
          bahía que prefieras — {clp(bayPrice)} por hora.
        </p>

        {/* Date picker */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const l = dateLabel(d);
            const active = d === date;
            return (
              <button
                key={d}
                onClick={() => {
                  setDate(d);
                  setSelected(null);
                }}
                className="card flex min-w-[76px] flex-col items-center px-4 py-3 transition-colors"
                style={
                  active
                    ? { background: "var(--wine)", color: "#fff", borderColor: "var(--wine)" }
                    : undefined
                }
                aria-pressed={active}
              >
                <span
                  className="eyebrow"
                  style={active ? { color: "var(--gold)" } : undefined}
                >
                  {l.dow}
                </span>
                <span className="mono text-2xl font-semibold">{l.day}</span>
                <span
                  className="text-xs"
                  style={{ color: active ? "var(--on-wine-dim)" : "var(--faint)" }}
                >
                  {l.month}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tee sheet grid */}
        <div className="card mt-6 overflow-x-auto p-4 sm:p-6">
          <div className="min-w-[560px]">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: "64px repeat(6, 1fr)" }}
            >
              <span />
              {(state?.bays ?? []).map((b) => (
                <div key={b.id} className="text-center">
                  <span className="eyebrow">Bahía</span>
                  <div className="mono text-lg font-semibold leading-none">
                    {String(b.id).padStart(2, "0")}
                  </div>
                </div>
              ))}

              {HOURS.map((h) => {
                const past = isToday && h <= nowHour - 1;
                return (
                  <div key={h} className="contents">
                    <div
                      className="mono self-center text-sm"
                      style={{ color: "var(--mid)" }}
                    >
                      {hourLabel(h)}
                    </div>
                    {(state?.bays ?? []).map((b) => {
                      const isTaken = taken.has(`${b.id}-${h}`) || past;
                      const isSel =
                        selected?.bayId === b.id && selected?.hour === h;
                      return (
                        <button
                          key={b.id}
                          disabled={isTaken}
                          onClick={() => setSelected({ bayId: b.id, hour: h })}
                          aria-pressed={isSel}
                          className={`slot ${isTaken ? "slot--taken" : ""} ${isSel ? "slot--selected" : ""}`}
                          aria-label={`${hourLabel(h)}, bahía ${b.id}${isTaken ? ", no disponible" : isSel ? ", seleccionado" : ""}`}
                        >
                          {isTaken ? "—" : isSel ? "✓" : hourLabel(h)}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm" style={{ color: "var(--faint)" }}>
          Los bloques achurados ya están reservados o su hora ya pasó. La
          grilla se actualiza sola cuando otro socio reserva.
        </p>
      </main>

      {selected && !confirmed && (
        <BookingPanel
          bayId={selected.bayId}
          hour={selected.hour}
          date={date}
          bayPrice={bayPrice}
          onClose={() => setSelected(null)}
          onDone={(r) => setConfirmed(r)}
        />
      )}

      {confirmed && (
        <ConfirmationPanel
          reservation={confirmed}
          onClose={() => {
            setConfirmed(null);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

function BookingPanel({
  bayId,
  hour,
  date,
  bayPrice,
  onClose,
  onDone,
}: {
  bayId: number;
  hour: number;
  date: string;
  bayPrice: number;
  onClose: () => void;
  onDone: (r: Reservation) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(2);
  const [donation, setDonation] = useState(0);
  const [saveCard, setSaveCard] = useState(true);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setHasSavedCard(Boolean(localStorage.getItem("eagle_card")));
    setName(localStorage.getItem("eagle_name") ?? "");
    setEmail(localStorage.getItem("eagle_email") ?? "");
  }, []);

  const l = dateLabel(date);
  const total = bayPrice + donation;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bayId, date, hour, name, email, guests, donation }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos crear la reserva.");
        return;
      }
      if (saveCard) localStorage.setItem("eagle_card", "4321");
      localStorage.setItem("eagle_name", name);
      localStorage.setItem("eagle_email", email);
      onDone(data.reservation);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} label={`Confirmar reserva de la bahía ${bayId}`}>
      <form onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Confirmar reserva</p>
            <h2 className="display mt-1 text-2xl">
              Bahía {String(bayId).padStart(2, "0")}
            </h2>
            <p className="mono mt-1 text-sm" style={{ color: "var(--mid)" }}>
              {l.dow} {l.day} {l.month} · {hourLabel(hour)}–{hourLabel(hour + 1)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn--outline btn--sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="field">
            <label htmlFor="rname">Nombre</label>
            <input
              id="rname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="field">
            <label htmlFor="remail">Email</label>
            <input
              id="remail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="socio@correo.cl"
            />
          </div>
          <div className="field">
            <label htmlFor="rguests">Jugadores</label>
            <select
              id="rguests"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "jugador" : "jugadores"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <DonationPicker value={donation} onChange={setDonation} />
        </div>

        {/* Payment (demo) */}
        <div
          className="mt-4 rounded-lg border p-4"
          style={{ borderColor: "var(--line)", background: "var(--cream)" }}
        >
          <div className="flex items-center justify-between">
            <span className="eyebrow">Pago</span>
            <span className="chip">Demo</span>
          </div>
          <div className="mono mt-3 grid gap-1 text-sm">
            <div className="flex justify-between">
              <span>Bahía · 1 hora</span>
              <span>{clp(bayPrice)}</span>
            </div>
            {donation > 0 && (
              <div className="flex justify-between">
                <span>Aporte Water Is Life</span>
                <span>{clp(donation)}</span>
              </div>
            )}
          </div>
          {hasSavedCard ? (
            <p className="mono mt-3 text-sm">Visa •••• 4321 — tarjeta guardada</p>
          ) : (
            <>
              <p className="mono mt-3 text-sm">Visa •••• 4321</p>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                />
                Guardar tarjeta para próximas visitas
              </label>
            </>
          )}
          <p className="mt-2 text-xs" style={{ color: "var(--faint)" }}>
            En producción esto se conecta a Webpay / Stripe. Aquí el cobro es
            simulado.
          </p>
        </div>

        {error && (
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--alert)" }}>
            {error}
          </p>
        )}

        <button className="btn btn--primary btn--lg mt-6 w-full" disabled={busy}>
          {busy ? "Procesando…" : `Pagar ${clp(total)} y reservar`}
        </button>
      </form>
    </Modal>
  );
}

function ConfirmationPanel({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const l = dateLabel(reservation.date);
  return (
    <Modal onClose={onClose} label="Reserva confirmada" className="panel fade-in text-center">
      <div>
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
          style={{ background: "var(--ok)" }}
          aria-hidden
        >
          ✓
        </div>
        <h2 className="display mt-4 text-2xl">Reserva confirmada</h2>
        <p className="mono mt-2" style={{ color: "var(--mid)" }}>
          Bahía {String(reservation.bayId).padStart(2, "0")} · {l.dow} {l.day}{" "}
          {l.month} · {hourLabel(reservation.hour)}–{hourLabel(reservation.hour + 1)}
        </p>
        <p className="mono mt-1 text-xs" style={{ color: "var(--faint)" }}>
          Código {reservation.id.toUpperCase()}
        </p>
        {reservation.donation > 0 && (
          <p className="mt-3 text-sm" style={{ color: "var(--crimson-dark)" }}>
            💧 Gracias por tu aporte de {clp(reservation.donation)} a Water Is
            Life.
          </p>
        )}
        <p className="mt-4 text-sm" style={{ color: "var(--mid)" }}>
          Te esperamos, {reservation.name}. Cuando llegues, pide directo desde
          el iPad de tu bahía o escanea el QR.
        </p>
        <div className="mt-6 grid gap-2">
          <Link href={`/b/${reservation.bayId}`} className="btn btn--dark w-full">
            Abrir menú de la bahía
          </Link>
          <button onClick={onClose} className="btn btn--outline w-full">
            Hacer otra reserva
          </button>
        </div>
      </div>
    </Modal>
  );
}
