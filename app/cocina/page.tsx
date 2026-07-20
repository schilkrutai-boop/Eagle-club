"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useLiveState } from "@/components/useLiveState";
import { minutesSince, plural } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const COLUMNS: { status: OrderStatus; title: string; action: string; next: OrderStatus }[] = [
  { status: "nuevo", title: "Nuevos", action: "Empezar a preparar", next: "preparando" },
  { status: "preparando", title: "En preparación", action: "Marcar listo", next: "listo" },
  { status: "listo", title: "Listos para entregar", action: "Marcar entregado", next: "entregado" },
];

export default function CocinaPage() {
  const { state, connected } = useLiveState();
  // re-render every 30s so the ticket timers stay honest
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const orders = state?.orders ?? [];
  const delivered = orders.filter((o) => o.status === "entregado").length;

  async function advance(order: Order, next: OrderStatus) {
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  return (
    <div className="kds-body">
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: "var(--wine)", borderColor: "rgba(255,255,255,.1)" }}
      >
        <div className="wrap flex h-[60px] items-center justify-between gap-4">
          <Link href="/" className="wordmark">
            <LogoMark height={28} />
            <span className="mark">Eagle Club</span>
            <span className="sub hidden sm:inline">Cocina</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="mono text-sm" style={{ color: "#d9c9bd" }}>
              {plural(delivered, "entregado")} hoy
            </span>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: connected ? "#6fbf83" : "var(--gold)" }}
              title={connected ? "En línea" : "Reconectando…"}
            />
          </div>
        </div>
      </header>

      <main className="wrap py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = orders
              .filter((o) => o.status === col.status)
              .sort((a, b) => a.createdAt - b.createdAt);
            return (
              <section key={col.status}>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="display text-lg" style={{ color: "#f0e6dd" }}>
                    {col.title}
                  </h2>
                  <span className="mono text-sm" style={{ color: "#a8938a" }}>
                    {colOrders.length}
                  </span>
                </div>

                <div className="grid gap-3">
                  {colOrders.length === 0 && (
                    <div
                      className="rounded-lg border border-dashed p-6 text-center text-sm"
                      style={{ borderColor: "rgba(255,255,255,.15)", color: "#a8938a" }}
                    >
                      Sin pedidos aquí
                    </div>
                  )}
                  {colOrders.map((o) => {
                    const mins = minutesSince(o.createdAt);
                    return (
                      <article
                        key={o.id}
                        className={`ticket fade-in ${o.status === "nuevo" ? "ticket--nuevo" : ""}`}
                      >
                        <div
                          className="flex items-center justify-between border-b px-4 py-3"
                          style={{ borderColor: "rgba(255,255,255,.1)" }}
                        >
                          <div className="flex items-baseline gap-3">
                            <span className="eyebrow" style={{ color: "var(--gold)" }}>
                              Bahía
                            </span>
                            <span className="mono text-3xl font-semibold leading-none">
                              {String(o.bayId).padStart(2, "0")}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="mono text-sm" style={{ color: "#d9c9bd" }}>
                              #{o.number}
                            </div>
                            <div
                              className="mono text-xs font-semibold"
                              style={{ color: mins >= 15 ? "#ff9d7e" : "#a8938a" }}
                            >
                              {mins} min
                            </div>
                          </div>
                        </div>

                        {o.total - o.donation === 0 && o.items.length > 0 && (
                          <div
                            className="mx-4 mt-3 rounded-md px-3 py-1.5 text-center text-xs font-semibold"
                            style={{ background: "rgba(201,163,92,.18)", color: "var(--gold)" }}
                          >
                            🎁 Invitación de la casa
                          </div>
                        )}

                        <ul className="grid gap-1.5 px-4 py-3">
                          {o.items.map((i, idx) => (
                            <li key={idx} className="flex gap-3 text-[15px]">
                              <span className="mono font-semibold" style={{ color: "var(--gold)" }}>
                                {i.qty}×
                              </span>
                              <span>{i.name}</span>
                            </li>
                          ))}
                        </ul>

                        {o.note && (
                          <p
                            className="mx-4 mb-3 rounded-md px-3 py-2 text-sm italic"
                            style={{ background: "rgba(195,154,59,.12)", color: "#e4cf9a" }}
                          >
                            “{o.note}”
                          </p>
                        )}

                        <div className="px-4 pb-4">
                          <button
                            className={`btn w-full ${col.status === "listo" ? "btn--outline-light" : "btn--primary"}`}
                            onClick={() => advance(o, col.next)}
                          >
                            {col.action}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs" style={{ color: "#a89086" }}>
          Los pedidos llegan en tiempo real desde los iPads y QRs de cada bahía.
        </p>
      </main>
    </div>
  );
}
