"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REALTIME_CHANNEL, supabaseBrowser } from "@/lib/supabase";
import { plural } from "@/lib/format";
import type { WaitlistEntry } from "@/lib/types";

function adminToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("eagle_admin") : null;
}

export default function ListaPage() {
  const [gate, setGate] = useState<"checking" | "locked" | "ok">("checking");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const check = useCallback(async (t: string) => {
    const res = await fetch("/api/admin/check", { headers: { "x-admin-token": t } });
    return res.ok;
  }, []);

  useEffect(() => {
    const saved = adminToken();
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

  if (gate === "checking") {
    return (
      <main className="wrap flex min-h-[70vh] items-center justify-center py-10">
        <p className="eyebrow">Verificando…</p>
      </main>
    );
  }

  if (gate === "locked") {
    return (
      <main className="wrap flex min-h-[70vh] items-center justify-center py-10">
        <form onSubmit={unlock} className="card w-full max-w-[380px] p-7">
          <p className="eyebrow">Eagle Club · Equipo</p>
          <h1 className="display mt-2 text-2xl">Lista de espera</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--mid)" }}>
            Ingresa el token del equipo para ver quiénes se han inscrito.
          </p>
          <div className="field mt-5">
            <label htmlFor="tk">Token</label>
            <input
              id="tk"
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
      </main>
    );
  }

  return <Board />;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Santiago",
    });
  } catch {
    return "—";
  }
}

// ---------- listas por fecha de corte ----------
// Las listas se separan por fecha de cierre, sin columnas nuevas en la base.
// Los cierres viven en el código (no en localStorage) para que valgan igual
// para todo el equipo y sobrevivan cambios de navegador. Para cerrar la lista
// activa y abrir la siguiente, se agrega un elemento a LIST_CLOSURES.
//
// Lista 1: todos los inscritos hasta el 3 de agosto de 2026, 16:00 hora de
// Chile (161 personas; ya recibieron el correo de bienvenida). Desde esa hora
// los nuevos inscritos entran a la Lista 2.
const LIST_CLOSURES: { name: string; closedAt: string }[] = [
  { name: "Lista 1", closedAt: "2026-08-03T20:00:00Z" },
];

const ACTIVE_LIST_NAME = `Lista ${LIST_CLOSURES.length + 1}`;

/** Nombre de la lista a la que pertenece un inscrito según su fecha de alta. */
function listOf(entry: WaitlistEntry): string {
  const t = Date.parse(entry.createdAt);
  for (const c of LIST_CLOSURES) {
    if (!Number.isNaN(t) && t < Date.parse(c.closedAt)) return c.name;
  }
  return ACTIVE_LIST_NAME;
}

function Board() {
  const [entries, setEntries] = useState<WaitlistEntry[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<string>(ACTIVE_LIST_NAME);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    const token = adminToken();
    const mySeq = ++seq.current;
    try {
      const res = await fetch("/api/waitlist", {
        cache: "no-store",
        headers: token ? { "x-admin-token": token } : undefined,
      });
      if (!res.ok) {
        if (mySeq === seq.current) setErr("No pudimos cargar la lista.");
        return;
      }
      const data = await res.json();
      if (mySeq === seq.current) {
        setEntries(data.entries ?? []);
        setErr("");
      }
    } catch {
      if (mySeq === seq.current) setErr("Revisa tu conexión.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Tiempo real: cada nuevo inscrito emite un "change" por Supabase Realtime.
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setConnected(false);
      return;
    }
    const ch = sb
      .channel(REALTIME_CHANNEL)
      .on("broadcast", { event: "change" }, () => refresh())
      .subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        setConnected(ok);
        if (ok) refresh();
      });
    return () => {
      sb.removeChannel(ch);
    };
  }, [refresh]);

  // Respaldo por si el tiempo real se cae: recarga cada 25 s.
  useEffect(() => {
    const id = setInterval(refresh, 25000);
    return () => clearInterval(id);
  }, [refresh]);

  function logout() {
    localStorage.removeItem("eagle_admin");
    window.location.reload();
  }

  const all = entries ?? [];
  // Nombres de lista en orden: primero la activa, luego las cerradas (más
  // reciente primero), con su cantidad de inscritos.
  const listNames = [ACTIVE_LIST_NAME, ...LIST_CLOSURES.map((c) => c.name).reverse()];
  const byList = new Map<string, WaitlistEntry[]>(listNames.map((n) => [n, []]));
  for (const e of all) byList.get(listOf(e))?.push(e);

  const shown = byList.get(tab) ?? [];
  const isActiveList = tab === ACTIVE_LIST_NAME;

  function downloadCSV() {
    if (shown.length === 0) return;
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ["Nombre", "Email", "Telefono", "Inscrito", "Lista"];
    const rows = shown.map((e) => [e.name, e.email, e.phone, fmtDate(e.createdAt), tab]);
    const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eagleclub-${tab.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyEmails() {
    if (shown.length === 0) return;
    try {
      await navigator.clipboard.writeText(shown.map((e) => e.email).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard bloqueado: no pasa nada */
    }
  }

  const count = shown.length;

  return (
    <>
      <header style={{ background: "var(--wine)", color: "var(--on-wine)" }}>
        <div className="wrap flex items-center justify-between py-4">
          <div>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--on-wine-dim)",
              }}
            >
              Eagle Club · Equipo
            </span>
            <div className="display text-lg" style={{ letterSpacing: "0.06em" }}>
              Listas de inscritos
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn--outline-light btn--sm"
            style={{ color: "var(--on-wine)" }}
          >
            Salir
          </button>
        </div>
        <div className="brand-stripe" aria-hidden />
      </header>

      <main className="wrap py-8 sm:py-10">
        {/* Selector de lista */}
        <div className="flex flex-wrap gap-2" role="tablist">
          {listNames.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`btn btn--sm ${tab === name ? "btn--dark" : "btn--outline"}`}
            >
              {name === ACTIVE_LIST_NAME ? `${name} · activa` : `${name} · cerrada`} ·{" "}
              {byList.get(name)?.length ?? 0}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs" style={{ color: "var(--faint)" }}>
          La {LIST_CLOSURES[LIST_CLOSURES.length - 1].name} se cerró el{" "}
          {fmtDate(LIST_CLOSURES[LIST_CLOSURES.length - 1].closedAt)}. Todo
          inscrito desde esa hora entra a la {ACTIVE_LIST_NAME}.
        </p>

        {/* Resumen */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              {isActiveList ? `Inscritos en la ${ACTIVE_LIST_NAME}` : `${tab} (cerrada)`}
            </p>
            <div className="flex items-baseline gap-3">
              <span
                className="display"
                style={{ fontSize: "clamp(40px,9vw,64px)", lineHeight: 1 }}
              >
                {entries === null ? "—" : count}
              </span>
              {entries !== null && (
                <span style={{ color: "var(--mid)" }}>{plural(count, "persona")}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                color: connected ? "var(--ok)" : "var(--faint)",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: connected ? "var(--ok)" : "var(--faint)",
                  display: "inline-block",
                }}
              />
              {connected ? "En vivo" : "Reconectando…"}
            </span>
            <button onClick={copyEmails} className="btn btn--outline btn--sm" disabled={count === 0}>
              {copied ? "¡Copiado!" : "Copiar correos"}
            </button>
            <button onClick={downloadCSV} className="btn btn--dark btn--sm" disabled={count === 0}>
              Descargar CSV
            </button>
          </div>
        </div>

        {err && (
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--alert)" }}>
            {err}
          </p>
        )}

        {/* Tabla */}
        <div className="card mt-7 overflow-x-auto">
          {entries === null ? (
            <p className="p-8 text-center eyebrow">Cargando…</p>
          ) : count === 0 ? (
            <p className="p-10 text-center" style={{ color: "var(--mid)" }}>
              {isActiveList ? (
                <>
                  La {ACTIVE_LIST_NAME} está recién abierta. Quien complete el
                  formulario en <span className="mono">eagleclub.cl</span> desde
                  ahora aparecerá aquí al instante.
                </>
              ) : (
                <>Esta lista está cerrada y no tiene inscritos.</>
              )}
            </p>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["#", "Nombre", "Teléfono", "Email", "Inscrito"].map((h) => (
                    <th
                      key={h}
                      className="eyebrow"
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--line-strong)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td
                      className="mono"
                      style={{ padding: "12px 16px", color: "var(--faint)" }}
                    >
                      {count - i}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{e.name}</td>
                    <td className="mono" style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      {e.phone ? (
                        <a href={`tel:${e.phone.replace(/\s+/g, "")}`} style={{ color: "var(--ink)" }}>
                          {e.phone}
                        </a>
                      ) : (
                        <span style={{ color: "var(--faint)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <a href={`mailto:${e.email}`} style={{ color: "var(--crimson-dark)" }}>
                        {e.email}
                      </a>
                    </td>
                    <td
                      className="mono"
                      style={{ padding: "12px 16px", color: "var(--mid)", whiteSpace: "nowrap" }}
                    >
                      {fmtDate(e.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--faint)" }}>
          Se actualiza sola en tiempo real. Datos privados — no compartas este enlace ni el token.
        </p>
      </main>
    </>
  );
}
