"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import TopBar from "@/components/TopBar";
import Modal from "@/components/Modal";
import { useLiveState } from "@/components/useLiveState";
import { clp, hourLabel, plural, todayISO } from "@/lib/format";
import type { EmailLog, MenuItem, Order, Settings } from "@/lib/types";

/** Un pedido queda "invitado" (comida gratis) cuando su total es solo la donación. */
function foodValue(o: Order): number {
  return o.items.reduce((s, i) => s + i.price * i.qty, 0);
}
function isComped(o: Order): boolean {
  return o.items.length > 0 && o.total - o.donation === 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Headers con el token de admin para las mutaciones protegidas. */
function adminHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("eagle_admin") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "x-admin-token": token } : {}),
  };
}

type Tab = "resumen" | "reservas" | "pedidos" | "menu" | "config" | "qr";

const TABS: [Tab, string][] = [
  ["resumen", "Resumen"],
  ["reservas", "Reservas"],
  ["pedidos", "Pedidos"],
  ["menu", "Menú e inventario"],
  ["config", "Configuración"],
  ["qr", "QR de bahías"],
];

const DATE_TABS: Tab[] = ["resumen", "reservas", "pedidos"];

export default function AdminPage() {
  // "checking" hasta validar el token guardado; "locked" pide token; "ok" entra.
  const [gate, setGate] = useState<"checking" | "locked" | "ok">("checking");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const check = useMemo(
    () => async (t: string) => {
      const res = await fetch("/api/admin/check", { headers: { "x-admin-token": t } });
      return res.ok;
    },
    []
  );

  useEffect(() => {
    const saved = localStorage.getItem("eagle_admin");
    if (!saved) {
      setGate("locked");
      return;
    }
    check(saved).then((ok) => {
      if (ok) setGate("ok");
      else {
        localStorage.removeItem("eagle_admin");
        setGate("locked");
      }
    });
  }, [check]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ok = await check(token.trim());
    setBusy(false);
    if (ok) {
      localStorage.setItem("eagle_admin", token.trim());
      setToken("");
      setGate("ok");
    } else {
      setError("Token incorrecto.");
    }
  }

  if (gate !== "ok") {
    return (
      <>
        <TopBar />
        <main className="wrap flex min-h-[60vh] items-center justify-center py-10">
          {gate === "checking" ? (
            <p className="eyebrow">Verificando…</p>
          ) : (
            <form onSubmit={unlock} className="card w-full max-w-[380px] p-7">
              <p className="eyebrow">Administración</p>
              <h1 className="display mt-2 text-2xl">Acceso del equipo</h1>
              <p className="mt-2 text-sm" style={{ color: "var(--mid)" }}>
                Ingresa el token de administración para ver reservas, ventas e
                inventario.
              </p>
              <div className="field mt-5">
                <label htmlFor="admtoken">Token</label>
                <input
                  id="admtoken"
                  type="password"
                  autoFocus
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--alert)" }}>
                  {error}
                </p>
              )}
              <button className="btn btn--primary btn--lg mt-5 w-full" disabled={busy || !token.trim()}>
                {busy ? "Verificando…" : "Entrar"}
              </button>
            </form>
          )}
        </main>
      </>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [date, setDate] = useState(todayISO());
  const { state, refresh } = useLiveState({ date });

  const reservations = (state?.reservations ?? []).sort(
    (a, b) => a.hour - b.hour || a.bayId - b.bayId
  );
  const orders = state?.orders ?? [];
  const isToday = date === todayISO();

  // Reservas y pedidos vienen filtrados por la fecha elegida, así que las
  // ventas del día cuadran para cualquier fecha (no solo hoy).
  const foodSales = orders.reduce((s, o) => s + (o.total - o.donation), 0);
  const baySales = reservations.reduce((s, r) => s + r.total, 0);
  const donations =
    orders.reduce((s, o) => s + o.donation, 0) +
    reservations.reduce((s, r) => s + r.donation, 0);

  async function cancelReservation(id: string) {
    if (
      !window.confirm(
        "¿Cancelar esta reserva? El bloque quedará libre para reservar de nuevo."
      )
    )
      return;
    await fetch(`/api/reservations/${id}`, { method: "DELETE", headers: adminHeaders() });
    refresh();
  }

  async function cancelOrder(id: string) {
    if (
      !window.confirm(
        "¿Cancelar este pedido? Se repone el stock y desaparece de la cocina."
      )
    )
      return;
    await fetch(`/api/orders/${id}`, { method: "DELETE", headers: adminHeaders() });
    refresh();
  }

  async function compOrder(id: string, comp: boolean) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ comp }),
    });
    refresh();
  }

  const dateHint = isToday ? "hoy" : date;

  return (
    <>
      <TopBar />
      <main className="wrap py-10">
        <p className="eyebrow">Administración</p>
        <h1 className="display mt-2 text-3xl">Panel del club</h1>

        {/* Tabs */}
        <div
          className="mt-8 flex gap-1 overflow-x-auto border-b"
          style={{ borderColor: "var(--line)" }}
        >
          {TABS.map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold"
              style={
                tab === t
                  ? { borderBottom: "2px solid var(--crimson)", color: "var(--ink)" }
                  : { color: "var(--faint)" }
              }
              aria-pressed={tab === t}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Selector de fecha compartido por Resumen, Reservas y Pedidos */}
        {DATE_TABS.includes(tab) && (
          <div className="field mt-6 max-w-[220px]">
            <label htmlFor="adate">Fecha</label>
            <input
              id="adate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}

        {tab === "resumen" && (
          <section className="mt-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Reservas" value={String(reservations.length)} hint={dateHint} />
              <Stat label="Pedidos" value={String(orders.length)} hint={dateHint} />
              <Stat label="Venta del día" value={clp(foodSales + baySales)} hint="bahías + cocina" />
              <Stat label="💧 Water Is Life" value={clp(donations)} hint="aportes de socios" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <TopItems orders={orders} />
              <LowStock menu={state?.menu ?? []} />
            </div>

            <EmailLogCard emails={state?.emails ?? []} />
          </section>
        )}

        {tab === "reservas" && (
          <section className="mt-6">
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr
                    className="text-left"
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    {["Hora", "Bahía", "Socio", "Jugadores", "Pago", "Código", ""].map((h, i) => (
                      <th key={i} className="eyebrow px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center" style={{ color: "var(--faint)" }}>
                        Sin reservas para esta fecha todavía.
                      </td>
                    </tr>
                  )}
                  {reservations.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td className="mono px-4 py-3">
                        {hourLabel(r.hour)}–{hourLabel(r.hour + 1)}
                      </td>
                      <td className="mono px-4 py-3 font-semibold">
                        {String(r.bayId).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-xs" style={{ color: "var(--faint)" }}>
                          {r.email || "—"}
                        </div>
                      </td>
                      <td className="mono px-4 py-3">{r.guests}</td>
                      <td className="px-4 py-3">
                        <span
                          className="chip"
                          style={{ color: "var(--ok)", borderColor: "var(--ok)" }}
                        >
                          Pagada · {clp(r.total)}
                        </span>
                        {r.donation > 0 && (
                          <span className="chip ml-1" title="Aporte Water Is Life">
                            💧 {clp(r.donation)}
                          </span>
                        )}
                      </td>
                      <td className="mono px-4 py-3 text-xs uppercase" style={{ color: "var(--faint)" }}>
                        {r.id}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="btn btn--outline btn--sm"
                          onClick={() => cancelReservation(r.id)}
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "pedidos" && (
          <OrdersAdmin
            orders={orders}
            dateHint={dateHint}
            onCancel={cancelOrder}
            onComp={compOrder}
          />
        )}

        {tab === "menu" && <MenuAdmin menu={state?.menu ?? []} />}

        {tab === "config" && state && (
          <ConfigAdmin settings={state.settings} />
        )}

        {tab === "qr" && <QRAdmin />}
      </main>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card px-5 py-4">
      <div className="eyebrow">{label}</div>
      <div className="mono mt-1 text-2xl font-semibold">{value}</div>
      <div className="text-xs" style={{ color: "var(--faint)" }}>
        {hint}
      </div>
    </div>
  );
}

function TopItems({ orders }: { orders: { items: { itemId: string; name: string; qty: number }[] }[] }) {
  const top = useMemo(() => {
    const counts = new Map<string, { name: string; qty: number }>();
    for (const o of orders) {
      for (const i of o.items) {
        const prev = counts.get(i.itemId) ?? { name: i.name, qty: 0 };
        prev.qty += i.qty;
        counts.set(i.itemId, prev);
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="card p-5">
      <div className="eyebrow">Más pedidos hoy</div>
      {top.length === 0 ? (
        <p className="mt-3 text-sm" style={{ color: "var(--faint)" }}>
          Aún no hay pedidos hoy.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {top.map((t, i) => (
            <li key={t.name} className="flex items-center gap-3 text-sm">
              <span className="mono w-5 font-semibold" style={{ color: "var(--crimson-dark)" }}>
                {i + 1}
              </span>
              <span className="flex-1">{t.name}</span>
              <span className="mono font-semibold">{t.qty}×</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LowStock({ menu }: { menu: MenuItem[] }) {
  const low = menu
    .filter((m) => m.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  return (
    <div className="card p-5">
      <div className="eyebrow">Stock bajo</div>
      {low.length === 0 ? (
        <p className="mt-3 text-sm" style={{ color: "var(--faint)" }}>
          Todo el inventario está sobre 5 unidades.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {low.map((m) => (
            <li key={m.id} className="flex items-center gap-3 text-sm">
              <span aria-hidden>{m.emoji}</span>
              <span className="flex-1">{m.name}</span>
              {m.stock === 0 ? (
                <span className="badge-sold">Agotado</span>
              ) : (
                <span className="mono font-semibold" style={{ color: "var(--crimson-dark)" }}>
                  {m.stock} un.
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmailLogCard({ emails }: { emails: EmailLog[] }) {
  return (
    <div className="card mt-4 p-5">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Avisos por correo al equipo</div>
        <span className="chip">Demo</span>
      </div>
      {emails.length === 0 ? (
        <p className="mt-3 text-sm" style={{ color: "var(--faint)" }}>
          Cada reserva y pedido genera un aviso a los correos configurados.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {emails.slice(0, 6).map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span className="min-w-0 flex-1">{e.subject}</span>
              <span className="mono text-xs" style={{ color: "var(--faint)" }}>
                {new Date(e.at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                {" · "}
                {plural(e.to.length, "destinatario")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_ES: Record<string, string> = {
  nuevo: "Nuevo",
  preparando: "En preparación",
  listo: "Listo",
  entregado: "Entregado",
};

function OrdersAdmin({
  orders,
  dateHint,
  onCancel,
  onComp,
}: {
  orders: Order[];
  dateHint: string;
  onCancel: (id: string) => void;
  onComp: (id: string, comp: boolean) => void;
}) {
  const sorted = useMemo(() => [...orders].sort((a, b) => b.number - a.number), [orders]);

  return (
    <section className="mt-6">
      <p className="text-sm" style={{ color: "var(--mid)" }}>
        Pedidos de {dateHint}. Cancela un pedido para reponer su stock y sacarlo
        de la cocina, o invítalo (comida gratis) sin sacarlo del flujo.
      </p>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left" style={{ borderBottom: "1px solid var(--line)" }}>
              {["#", "Bahía", "Productos", "Estado", "Total", "Hora", ""].map((h, i) => (
                <th key={i} className="eyebrow px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center" style={{ color: "var(--faint)" }}>
                  Sin pedidos para esta fecha todavía.
                </td>
              </tr>
            )}
            {sorted.map((o) => {
              const comped = isComped(o);
              return (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="mono px-4 py-3 font-semibold">#{o.number}</td>
                  <td className="mono px-4 py-3 font-semibold">
                    {String(o.bayId).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[280px]">
                      {o.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
                    </div>
                    {o.note && (
                      <div className="text-xs italic" style={{ color: "var(--faint)" }}>
                        “{o.note}”
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip">{STATUS_ES[o.status] ?? o.status}</span>
                  </td>
                  <td className="mono px-4 py-3">
                    {comped ? (
                      <span className="flex flex-col">
                        <span className="badge-sold" style={{ background: "var(--gold)" }}>
                          🎁 Invitación
                        </span>
                        <span className="mt-1 text-xs line-through" style={{ color: "var(--faint)" }}>
                          {clp(foodValue(o))}
                        </span>
                      </span>
                    ) : (
                      <>
                        {clp(o.total)}
                        {o.donation > 0 && (
                          <span className="ml-1 text-xs" style={{ color: "var(--crimson-dark)" }}>
                            💧
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="mono px-4 py-3 text-xs" style={{ color: "var(--faint)" }}>
                    {new Date(o.createdAt).toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {comped ? (
                        <button className="btn btn--outline btn--sm" onClick={() => onComp(o.id, false)}>
                          Cobrar
                        </button>
                      ) : (
                        <button className="btn btn--outline btn--sm" onClick={() => onComp(o.id, true)}>
                          Invitar
                        </button>
                      )}
                      <button className="btn btn--outline btn--sm" onClick={() => onCancel(o.id)}>
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MenuAdmin({ menu }: { menu: MenuItem[] }) {
  const categories = useMemo(
    () => Array.from(new Set(menu.map((m) => m.category))),
    [menu]
  );

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/menu/${id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify(body),
    });
  }

  return (
    <section className="mt-6 grid gap-8">
      <p className="text-sm" style={{ color: "var(--mid)" }}>
        Ajusta precio y stock de cada producto. Al llegar a 0 unidades el
        producto queda agotado y desaparece como opción en las bahías; el
        stock también baja solo con cada pedido.
      </p>
      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="display text-lg">{cat}</h2>
          <div className="card mt-3 divide-y" style={{ borderColor: "var(--line)" }}>
            {menu
              .filter((m) => m.category === cat)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="text-2xl" aria-hidden>
                    {m.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold" style={m.available ? undefined : { color: "var(--faint)" }}>
                      {m.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--faint)" }}>
                      {m.allergens.length ? m.allergens.join(" · ") : "Sin alérgenos"}
                    </div>
                  </div>
                  <NumberEditor
                    label={`Precio de ${m.name}`}
                    prefix="$"
                    value={m.price}
                    min={1}
                    onSave={(price) => patch(m.id, { price })}
                  />
                  <NumberEditor
                    label={`Stock de ${m.name}`}
                    prefix="stock"
                    value={m.stock}
                    min={0}
                    onSave={(stock) => patch(m.id, { stock })}
                  />
                  <button
                    className={`btn btn--sm ${m.available ? "btn--outline" : "btn--dark"}`}
                    onClick={() => patch(m.id, { available: !m.available })}
                    disabled={!m.available && m.stock === 0}
                    title={!m.available && m.stock === 0 ? "Sube el stock para reponer" : undefined}
                  >
                    {m.available ? "Marcar agotado" : "Reponer"}
                  </button>
                  {!m.available && <span className="badge-sold">Agotado</span>}
                </div>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function NumberEditor({
  label,
  prefix,
  value,
  min,
  onSave,
}: {
  label: string;
  prefix: string;
  value: number;
  min: number;
  onSave: (n: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);

  // Sincroniza con el valor del servidor solo si el admin no está escribiendo,
  // para no borrar el borrador cuando entra un pedido u otra actualización.
  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  function commit() {
    focused.current = false;
    const n = Number(draft);
    if (Number.isFinite(n) && n >= min && n !== value) onSave(n);
    else setDraft(String(value));
  }

  return (
    <label className="mono flex items-center gap-1.5 text-sm" style={{ color: "var(--mid)" }}>
      {prefix}
      <input
        className="w-20 rounded-md border px-2 py-1.5 text-right"
        style={{ borderColor: "var(--line-strong)", background: "#fff", color: "var(--ink)" }}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        aria-label={label}
      />
    </label>
  );
}

function ConfigAdmin({ settings }: { settings: Settings }) {
  // El precio es un borrador local hasta pulsar Guardar; no se resincroniza
  // desde SSE para no borrar lo que el admin está escribiendo.
  const [price, setPrice] = useState(String(settings.bayPrice));
  const [emails, setEmails] = useState<string[]>(settings.notifyEmails);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saved, setSaved] = useState(false);

  // La lista de correos sí refleja lo que quedó guardado en el servidor.
  useEffect(() => {
    setEmails(settings.notifyEmails);
  }, [settings]);

  async function save(body: Record<string, unknown>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function addEmail() {
    const e = newEmail.trim().toLowerCase();
    if (!e) return;
    if (!EMAIL_RE.test(e)) {
      setEmailError("Ingresa un correo válido, por ejemplo nombre@eagleclub.cl.");
      return;
    }
    if (emails.includes(e)) {
      setEmailError("Ese correo ya está en la lista.");
      return;
    }
    setEmailError("");
    const next = [...emails, e];
    setEmails(next);
    setNewEmail("");
    save({ notifyEmails: next });
  }

  function removeEmail(e: string) {
    const next = emails.filter((x) => x !== e);
    setEmails(next);
    save({ notifyEmails: next });
  }

  return (
    <section className="mt-6 grid max-w-[640px] gap-4">
      <div className="card p-5">
        <div className="eyebrow">Valor de la bahía</div>
        <p className="mt-1 text-sm" style={{ color: "var(--mid)" }}>
          Se cobra por bloque de una hora. El cambio rige para las próximas
          reservas.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <label className="mono flex items-center gap-1.5 text-sm">
            $
            <input
              className="w-28 rounded-md border px-3 py-2 text-right"
              style={{ borderColor: "var(--line-strong)", background: "#fff" }}
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              aria-label="Valor de la bahía por hora"
            />
          </label>
          <span className="text-sm" style={{ color: "var(--mid)" }}>
            / hora
          </span>
          <button
            className="btn btn--dark btn--sm"
            onClick={() => save({ bayPrice: Number(price) })}
            disabled={!Number(price)}
          >
            Guardar
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Correos de aviso</div>
          <span className="chip">Demo</span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--mid)" }}>
          Estos correos reciben un aviso por cada reserva y pedido. En el MVP
          los avisos quedan registrados en el Resumen; en producción se envían
          de verdad.
        </p>
        <ul className="mt-3 grid gap-2">
          {emails.map((e) => (
            <li key={e} className="flex items-center gap-2">
              <span className="mono flex-1 text-sm">{e}</span>
              <button
                className="btn btn--outline btn--sm"
                onClick={() => removeEmail(e)}
                aria-label={`Quitar ${e}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line-strong)", background: "#fff" }}
            type="email"
            placeholder="nuevo@eagleclub.cl"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && addEmail()}
            aria-label="Agregar correo de aviso"
          />
          <button className="btn btn--dark btn--sm" onClick={addEmail}>
            Agregar
          </button>
        </div>
        {emailError && (
          <p className="mt-2 text-sm font-semibold" style={{ color: "var(--alert)" }}>
            {emailError}
          </p>
        )}
      </div>

      {saved && (
        <p className="fade-in text-sm font-semibold" style={{ color: "var(--ok)" }}>
          ✓ Configuración guardada
        </p>
      )}

      <DangerZone />
    </section>
  );
}

function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function reset() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: adminHeaders(),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="card p-5" style={{ borderColor: "var(--line-strong)" }}>
      <div className="eyebrow" style={{ color: "var(--alert)" }}>
        Zona de reinicio
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--mid)" }}>
        Borra todas las reservas, pedidos y avisos, y restaura el inventario a su
        stock inicial. Úsalo para empezar una demo desde cero.
      </p>
      <button
        className="btn btn--sm mt-3"
        style={{ background: "var(--alert)", color: "#fff" }}
        onClick={() => setConfirming(true)}
      >
        Reiniciar demo
      </button>
      {done && (
        <p className="fade-in mt-2 text-sm font-semibold" style={{ color: "var(--ok)" }}>
          ✓ Demo reiniciada
        </p>
      )}

      {confirming && (
        <Modal
          onClose={() => {
            if (!busy) setConfirming(false);
          }}
          label="Confirmar reinicio de la demo"
        >
          <div>
            <p className="eyebrow" style={{ color: "var(--alert)" }}>
              Reiniciar demo
            </p>
            <h2 className="display mt-1 text-2xl">¿Empezar de cero?</h2>
            <p className="mt-3 text-sm" style={{ color: "var(--mid)" }}>
              Se borrarán todas las reservas y pedidos de la demo y el inventario
              volverá a su stock inicial. Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                className="btn btn--outline"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                className="btn"
                style={{ background: "var(--alert)", color: "#fff" }}
                onClick={reset}
                disabled={busy}
              >
                {busy ? "Reiniciando…" : "Sí, reiniciar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function QRAdmin() {
  const [codes, setCodes] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<number, string> = {};
      for (const id of [1, 2, 3, 4, 5, 6]) {
        out[id] = await QRCode.toDataURL(`${window.location.origin}/b/${id}`, {
          width: 360,
          margin: 1,
          color: { dark: "#4b211e", light: "#fffdf8" },
        });
      }
      if (!cancelled) setCodes(out);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-6">
      <p className="no-print max-w-[60ch] text-sm" style={{ color: "var(--mid)" }}>
        Imprime estos códigos y pégalos en cada bahía. Al escanearlos, el
        socio abre el menú de su bahía en el celular — sin descargar nada.
      </p>
      <div className="qr-grid mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <div key={id} className="qr-card card flex flex-col items-center gap-2 p-5">
            <span className="eyebrow">Bahía</span>
            <span className="mono text-3xl font-semibold">{String(id).padStart(2, "0")}</span>
            {codes[id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={codes[id]} alt={`QR de la bahía ${id}`} className="w-full max-w-[180px]" />
            ) : (
              <div className="h-[180px]" />
            )}
            <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
              /b/{id}
            </span>
          </div>
        ))}
      </div>
      <button className="no-print btn btn--outline mt-6" onClick={() => window.print()}>
        Imprimir QRs
      </button>
    </section>
  );
}
