"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DonationPicker from "@/components/Donation";
import Modal from "@/components/Modal";
import { LogoMark } from "@/components/Logo";
import { useLiveState } from "@/components/useLiveState";
import { clp, minutesSince } from "@/lib/format";
import type { MenuItem, Order, OrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  nuevo: "Recibido",
  preparando: "En preparación",
  listo: "¡Listo! Va en camino",
  entregado: "Entregado",
};

const STATUS_STEP: Record<OrderStatus, number> = {
  nuevo: 1,
  preparando: 2,
  listo: 3,
  entregado: 4,
};

// Máximo por producto en un pedido (alineado con la validación del servidor).
const MAX_PER_ITEM = 20;
const cap = (item: MenuItem) => Math.min(item.stock, MAX_PER_ITEM);

type Cart = Record<string, number>;

export default function BayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const bayId = Number(id);
  const { state, connected } = useLiveState({ bay: bayId });

  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  // Tick para que los timers "hace X min" avancen sin depender de eventos.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const menu = useMemo(() => state?.menu ?? [], [state]);

  // Si el stock baja (otro pedido) o un ítem se agota, reajusta el carrito
  // solo a lo que aún se puede comprar.
  useEffect(() => {
    if (menu.length === 0) return;
    setCart((c) => {
      let changed = false;
      const next: Cart = {};
      for (const [itemId, qty] of Object.entries(c)) {
        const item = menu.find((m) => m.id === itemId);
        const max = item && item.available ? cap(item) : 0;
        const clamped = Math.min(qty, max);
        if (clamped !== qty) changed = true;
        if (clamped > 0) next[itemId] = clamped;
      }
      return changed ? next : c;
    });
  }, [menu]);
  const categories = useMemo(
    () => Array.from(new Set(menu.map((m) => m.category))),
    [menu]
  );
  const cat = activeCat ?? categories[0];

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([itemId, qty]) => ({ item: menu.find((m) => m.id === itemId), qty }))
        .filter((e): e is { item: MenuItem; qty: number } => Boolean(e.item) && e.qty > 0),
    [cart, menu]
  );
  const total = cartItems.reduce((s, e) => s + e.item.price * e.qty, 0);
  const count = cartItems.reduce((s, e) => s + e.qty, 0);

  const activeOrders = (state?.orders ?? [])
    .filter((o) => o.status !== "entregado")
    .sort((a, b) => b.createdAt - a.createdAt);

  const add = (item: MenuItem) =>
    setCart((c) => ({
      ...c,
      [item.id]: Math.min((c[item.id] ?? 0) + 1, cap(item)),
    }));
  const remove = (id: string) =>
    setCart((c) => ({ ...c, [id]: Math.max((c[id] ?? 0) - 1, 0) }));

  if (!Number.isInteger(bayId) || bayId < 1 || bayId > 6) {
    return (
      <main className="wrap py-20 text-center">
        <h1 className="display text-3xl">Bahía no encontrada</h1>
        <Link href="/" className="btn btn--dark mt-6">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <>
      {/* Bay header */}
      <header className="topbar">
        <div className="wrap topbar-inner" style={{ height: 74 }}>
          <Link href="/" className="wordmark">
            <LogoMark height={32} />
            <span className="mark">Eagle Club</span>
          </Link>
          <div className="flex items-baseline gap-3">
            <span className="eyebrow" style={{ color: "var(--gold)" }}>
              Bahía
            </span>
            <span className="mono text-4xl font-semibold leading-none text-white">
              {String(bayId).padStart(2, "0")}
            </span>
            <span
              className="ml-2 inline-block h-2 w-2 rounded-full"
              style={{ background: connected ? "#6fbf83" : "var(--gold)" }}
              title={connected ? "Conectado a cocina" : "Reconectando…"}
            />
          </div>
        </div>
      </header>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <section style={{ background: "#f0e9de", borderBottom: "1px solid var(--line)" }}>
          <div className="wrap grid gap-2 py-4">
            {activeOrders.map((o) => (
              <OrderStatusCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      <main className="wrap pb-32 pt-8">
        <p className="eyebrow">Menú del club</p>
        <h1 className="display mt-1 text-2xl sm:text-3xl">
          Pide sin soltar el palo
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--mid)" }}>
          Tu pedido llega directo a cocina y te lo llevamos a la bahía.
        </p>

        {/* Category tabs */}
        <div
          className="sticky z-30 -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 py-3"
          style={{ top: 74, background: "var(--cream)" }}
        >
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className="btn btn--sm"
              style={
                c === cat
                  ? { background: "var(--wine)", color: "#fff" }
                  : { background: "var(--card)", border: "1px solid var(--line)" }
              }
              aria-pressed={c === cat}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {menu
            .filter((m) => m.category === cat)
            .map((m) => {
              const soldOut = !m.available || m.stock <= 0;
              const inCart = cart[m.id] ?? 0;
              const maxed = inCart >= cap(m);
              return (
                <article
                  key={m.id}
                  className="card flex gap-4 p-4"
                  style={soldOut ? { opacity: 0.55 } : undefined}
                >
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-4xl"
                    style={{ background: m.tint }}
                    aria-hidden
                  >
                    {m.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold leading-tight">{m.name}</h3>
                      <span className="mono text-sm font-semibold whitespace-nowrap">
                        {clp(m.price)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-snug" style={{ color: "var(--mid)" }}>
                      {m.desc}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {m.allergens.map((a) => (
                        <span key={a} className="chip">
                          {a}
                        </span>
                      ))}
                      {soldOut && <span className="badge-sold">Agotado</span>}
                      {!soldOut && m.stock <= 5 && (
                        <span
                          className="chip"
                          style={{ color: "var(--crimson-dark)", borderColor: "var(--crimson)" }}
                        >
                          {m.stock === 1 ? "Queda 1" : `Quedan ${m.stock}`}
                        </span>
                      )}
                    </div>
                    {!soldOut && (
                      <div className="mt-3 flex items-center gap-2">
                        {inCart ? (
                          <>
                            <button
                              className="btn btn--outline btn--sm mono"
                              onClick={() => remove(m.id)}
                              aria-label={`Quitar ${m.name}`}
                            >
                              −
                            </button>
                            <span className="mono w-6 text-center font-semibold">
                              {inCart}
                            </span>
                            <button
                              className="btn btn--dark btn--sm mono"
                              onClick={() => add(m)}
                              disabled={maxed}
                              aria-label={`Agregar ${m.name}`}
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button className="btn btn--outline btn--sm" onClick={() => add(m)}>
                            Agregar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </main>

      {/* Cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4">
          <div className="wrap">
            <button
              onClick={() => setCartOpen(true)}
              className="btn btn--primary btn--lg w-full justify-between shadow-lg"
            >
              <span>
                Ver pedido · {count} {count === 1 ? "ítem" : "ítems"}
              </span>
              <span className="mono">{clp(total)}</span>
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <CartPanel
          bayId={bayId}
          entries={cartItems}
          subtotal={total}
          onAdd={add}
          onRemove={remove}
          onClose={() => setCartOpen(false)}
          onSent={() => {
            setCart({});
            setCartOpen(false);
          }}
        />
      )}
    </>
  );
}

function OrderStatusCard({ order }: { order: Order }) {
  const step = STATUS_STEP[order.status];
  return (
    <div className="card flex items-center gap-4 p-4 fade-in">
      <span className="mono text-lg font-semibold">#{order.number}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{STATUS_LABEL[order.status]}</span>
          <span className="mono text-xs" style={{ color: "var(--faint)" }}>
            hace {minutesSince(order.createdAt)} min
          </span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: s <= step ? "var(--crimson)" : "var(--line)" }}
            />
          ))}
        </div>
        <p className="mt-1.5 truncate text-xs" style={{ color: "var(--mid)" }}>
          {order.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
        </p>
      </div>
    </div>
  );
}

function CartPanel({
  bayId,
  entries,
  subtotal,
  onAdd,
  onRemove,
  onClose,
  onSent,
}: {
  bayId: number;
  entries: { item: MenuItem; qty: number }[];
  subtotal: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onSent: () => void;
}) {
  const [note, setNote] = useState("");
  const [donation, setDonation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasSavedCard, setHasSavedCard] = useState(false);

  useEffect(() => {
    setHasSavedCard(Boolean(localStorage.getItem("eagle_card")));
  }, []);

  // Si el carrito cambia (p. ej. un ítem se agotó y se removió solo),
  // descarta el error anterior: ya no describe el estado actual.
  const sig = entries.map((e) => `${e.item.id}:${e.qty}`).join(",");
  useEffect(() => {
    setError("");
  }, [sig]);

  const total = subtotal + donation;

  async function send() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bayId,
          note,
          donation,
          items: entries.map((e) => ({ itemId: e.item.id, qty: e.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos enviar el pedido.");
        return;
      }
      localStorage.setItem("eagle_card", "4321");
      onSent();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} label={`Tu pedido en la bahía ${bayId}`}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Tu pedido</p>
            <h2 className="display mt-1 text-2xl">
              Bahía {String(bayId).padStart(2, "0")}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn--outline btn--sm" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {entries.map(({ item, qty }) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{item.name}</div>
                <div className="mono text-xs" style={{ color: "var(--mid)" }}>
                  {clp(item.price)}
                </div>
              </div>
              <button
                className="btn btn--outline btn--sm mono"
                onClick={() => onRemove(item.id)}
                aria-label={`Quitar ${item.name}`}
              >
                −
              </button>
              <span className="mono w-5 text-center text-sm font-semibold">{qty}</span>
              <button
                className="btn btn--outline btn--sm mono"
                onClick={() => onAdd(item)}
                disabled={qty >= cap(item)}
                aria-label={`Agregar ${item.name}`}
              >
                +
              </button>
            </div>
          ))}
        </div>

        <div className="field mt-5">
          <label htmlFor="onote">Nota para la cocina (opcional)</label>
          <textarea
            id="onote"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sin cebolla, salsa aparte…"
          />
        </div>

        <div className="mt-5">
          <DonationPicker value={donation} onChange={setDonation} />
        </div>

        <div
          className="mt-4 rounded-lg border p-4"
          style={{ borderColor: "var(--line)", background: "var(--cream)" }}
        >
          <div className="flex items-center justify-between">
            <span className="eyebrow">Pago</span>
            <span className="chip">Demo</span>
          </div>
          <div className="mono mt-2 grid gap-1 text-sm">
            <div className="flex justify-between">
              <span>Pedido</span>
              <span>{clp(subtotal)}</span>
            </div>
            {donation > 0 && (
              <div className="flex justify-between">
                <span>Aporte Water Is Life</span>
                <span>{clp(donation)}</span>
              </div>
            )}
          </div>
          <p className="mono mt-2 text-sm">
            Visa •••• 4321 {hasSavedCard ? "— tarjeta guardada" : ""}
          </p>
        </div>

        {error && (
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--alert)" }}>
            {error}
          </p>
        )}

        <button className="btn btn--primary btn--lg mt-6 w-full justify-between" onClick={send} disabled={busy}>
          <span>{busy ? "Enviando…" : "Enviar a cocina"}</span>
          <span className="mono">{clp(total)}</span>
        </button>
      </div>
    </Modal>
  );
}
