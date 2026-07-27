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
// La lista "post publicación en redes sociales" no necesita columnas nuevas en
// la base: se define por una fecha de corte. Todo inscrito con created_at >= al
// corte pertenece a esa campaña; el resto es la lista de espera original.
// El corte se guarda en el navegador del equipo (mismo lugar que el token).
const CUTOFF_KEY = "eagle_redes_cutoff";

const LIST_SOCIAL = "post publicación en redes sociales";
const LIST_BASE = "lista de espera";

function readCutoff(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CUTOFF_KEY);
  // Guardamos un ISO; si quedó algo inválido lo ignoramos en vez de romper.
  return v && !Number.isNaN(Date.parse(v)) ? v : null;
}

function isAfterCutoff(entry: WaitlistEntry, cutoff: string | null): boolean {
  if (!cutoff) return false;
  const t = Date.parse(entry.createdAt);
  return !Number.isNaN(t) && t >= Date.parse(cutoff);
}

function Board() {
  const [entries, setEntries] = useState<WaitlistEntry[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [cutoff, setCutoff] = useState<string | null>(null);
  const [tab, setTab] = useState<"social" | "base">("social");
  const seq = useRef(0);

  // El corte vive en localStorage: lo leemos ya montados para no romper el SSR.
  useEffect(() => {
    setCutoff(readCutoff());
  }, []);

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

  /** Marca "acabo de publicar en redes": desde ahora los nuevos van a esa lista. */
  function startSocial() {
    const now = new Date().toISOString();
    localStorage.setItem(CUTOFF_KEY, now);
    setCutoff(now);
    setTab("social");
  }

  /** Cierra la campaña. No borra a nadie: solo deja de separar las listas. */
  function stopSocial() {
    if (
      !confirm(
        "¿Cerrar la campaña de redes?\n\nNadie se borra: los inscritos vuelven a verse todos juntos en la lista de espera."
      )
    ) {
      return;
    }
    localStorage.removeItem(CUTOFF_KEY);
    setCutoff(null);
    setTab("base");
  }

  const all = entries ?? [];
  const social = all.filter((e) => isAfterCutoff(e, cutoff));
  const base = all.filter((e) => !isAfterCutoff(e, cutoff));

  // Sin campaña activa solo existe la lista original.
  const active = cutoff === null ? "base" : tab;
  const shown = active === "social" ? social : base;
  const listName = active === "social" ? LIST_SOCIAL : LIST_BASE;

  function downloadCSV() {
    if (shown.length === 0) return;
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ["Nombre", "Email", "Telefono", "Inscrito", "Lista"];
    const rows = shown.map((e) => [
      e.name,
      e.email,
      e.phone,
      fmtDate(e.createdAt),
      listName,
    ]);
    const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      active === "social"
        ? "eagleclub-post-redes-sociales.csv"
        : "eagleclub-lista-espera.csv";
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
              {cutoff ? "Listas de inscritos" : "Lista de espera"}
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
        {/* Selector de lista + interruptor de campaña */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {cutoff ? (
            <div className="flex flex-wrap gap-2" role="tablist">
              <button
                role="tab"
                aria-selected={active === "social"}
                onClick={() => setTab("social")}
                className={`btn btn--sm ${active === "social" ? "btn--dark" : "btn--outline"}`}
              >
                Post publicación en redes · {social.length}
              </button>
              <button
                role="tab"
                aria-selected={active === "base"}
                onClick={() => setTab("base")}
                className={`btn btn--sm ${active === "base" ? "btn--dark" : "btn--outline"}`}
              >
                Lista de espera · {base.length}
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--mid)" }}>
              Cuando publiques en redes, activa la campaña para separar a los que
              lleguen desde ese post.
            </p>
          )}

          {cutoff ? (
            <button onClick={stopSocial} className="btn btn--outline btn--sm">
              Cerrar campaña
            </button>
          ) : (
            <button onClick={startSocial} className="btn btn--gold btn--sm">
              Publiqué en redes — empezar lista
            </button>
          )}
        </div>

        {cutoff && (
          <p className="mt-3 text-xs" style={{ color: "var(--faint)" }}>
            Campaña iniciada el {fmtDate(cutoff)}. Todo inscrito desde esa hora
            entra en «post publicación en redes sociales».
          </p>
        )}

        {/* Resumen */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              {active === "social" ? "Desde el post en redes" : "Inscritos"}
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
              {active === "social" ? (
                <>
                  Nadie se ha inscrito desde que publicaste. Quien complete el
                  formulario en <span className="mono">eagleclub.cl</span> de ahora
                  en adelante aparecerá aquí al instante.
                </>
              ) : (
                <>
                  Aún no hay inscritos. Cuando alguien complete el formulario en{" "}
                  <span className="mono">eagleclub.cl</span>, aparecerá aquí al
                  instante.
                </>
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
