"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Bay, EmailLog, MenuItem, Order, Reservation, Settings } from "@/lib/types";

export type LiveState = {
  bays: Bay[];
  menu: MenuItem[];
  reservations: Reservation[];
  orders: Order[];
  settings: Settings;
  emails: EmailLog[];
};

/**
 * Fetches /api/state and re-fetches whenever the server broadcasts a change
 * over SSE, so every screen (bahía, cocina, admin) stays in sync in real time.
 */
export function useLiveState(params?: { date?: string; bay?: number }) {
  const [state, setState] = useState<LiveState | null>(null);
  const [connected, setConnected] = useState(false);
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  });
  // Contador de secuencia: solo el fetch más reciente puede escribir el
  // estado, así una respuesta lenta y vieja nunca pisa a una más nueva.
  const seqRef = useRef(0);

  const refresh = useCallback(async () => {
    const p = paramsRef.current;
    const qs = new URLSearchParams();
    if (p?.date) qs.set("date", p.date);
    if (p?.bay) qs.set("bay", String(p.bay));
    const mySeq = ++seqRef.current;
    const res = await fetch(`/api/state?${qs}`, { cache: "no-store" });
    if (res.ok && mySeq === seqRef.current) setState(await res.json());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, params?.date, params?.bay]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onopen = () => {
      setConnected(true);
      // Reconexión: resincroniza el estado completo, porque los eventos
      // emitidos mientras estuvo caído no se reenvían.
      refresh();
    };
    es.onerror = () => setConnected(false);
    es.onmessage = (msg) => {
      try {
        const { event } = JSON.parse(msg.data);
        if (event !== "ping" && event !== "connected") refresh();
      } catch {
        // ignore malformed events
      }
    };
    return () => es.close();
  }, [refresh]);

  return { state, refresh, connected };
}
