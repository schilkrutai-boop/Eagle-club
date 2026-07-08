"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REALTIME_CHANNEL, supabaseBrowser } from "@/lib/supabase";
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
 * Carga /api/state y lo vuelve a pedir cada vez que el servidor emite un
 * cambio por Supabase Realtime (broadcast), para que todas las pantallas
 * (bahía, cocina, admin) queden sincronizadas en tiempo real.
 */
export function useLiveState(params?: { date?: string; bay?: number }) {
  const [state, setState] = useState<LiveState | null>(null);
  const [connected, setConnected] = useState(false);
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  });
  // Solo el fetch más reciente puede escribir el estado: una respuesta lenta
  // y vieja nunca pisa a una más nueva.
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
    const sb = supabaseBrowser();
    if (!sb) {
      setConnected(false);
      return;
    }
    const channel = sb
      .channel(REALTIME_CHANNEL)
      .on("broadcast", { event: "change" }, () => refresh())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          // (Re)conexión: resincroniza el estado completo.
          refresh();
        } else {
          setConnected(false);
        }
      });
    return () => {
      sb.removeChannel(channel);
    };
  }, [refresh]);

  return { state, refresh, connected };
}
