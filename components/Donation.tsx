"use client";

import { useState } from "react";
import { clp } from "@/lib/format";

const AMOUNTS = [500, 1000, 2000];

/**
 * Aporte opcional a la fundación Water Is Life en el checkout,
 * con un botón que explica qué es la fundación.
 */
export default function DonationPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--line)", background: "var(--cream)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow" style={{ color: "var(--mid)" }}>
          💧 Water Is Life
        </span>
        <button
          type="button"
          className="text-xs font-semibold underline underline-offset-2"
          style={{ color: "var(--crimson-dark)" }}
          onClick={() => setShowInfo((s) => !s)}
          aria-expanded={showInfo}
        >
          ¿Qué es Water Is Life?
        </button>
      </div>

      {showInfo && (
        <p className="fade-in mt-2 text-sm" style={{ color: "var(--mid)" }}>
          Water Is Life es una fundación sin fines de lucro que lleva agua
          potable, filtros y pozos a comunidades que viven sin acceso a agua
          segura. Tu aporte se suma a tu boleta y se entrega íntegro a la
          fundación.
        </p>
      )}

      <p className="mt-2 text-sm" style={{ color: "var(--mid)" }}>
        ¿Quieres sumar un aporte a tu pago?
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Aporte a Water Is Life">
        <button
          type="button"
          className="btn btn--sm"
          style={
            value === 0
              ? { background: "var(--wine)", color: "#fff" }
              : { background: "var(--card)", border: "1px solid var(--line-strong)" }
          }
          onClick={() => onChange(0)}
          aria-pressed={value === 0}
        >
          Sin aporte
        </button>
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            className="btn btn--sm mono"
            style={
              value === a
                ? { background: "var(--wine)", color: "#fff" }
                : { background: "var(--card)", border: "1px solid var(--line-strong)" }
            }
            onClick={() => onChange(a)}
            aria-pressed={value === a}
          >
            {clp(a)}
          </button>
        ))}
      </div>
    </div>
  );
}
