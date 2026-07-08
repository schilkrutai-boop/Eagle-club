import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const REALTIME_CHANNEL = "eagleclub";

let serverClient: SupabaseClient | null = null;

/**
 * Cliente de servidor con service_role: omite RLS y hace todas las
 * lecturas/escrituras. Solo debe usarse en route handlers / código de servidor.
 */
export function supabaseServer(): SupabaseClient {
  if (!URL || !SERVICE) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno."
    );
  }
  if (!serverClient) {
    serverClient = createClient(URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

/** Cliente de navegador con anon key: solo para suscribirse a Realtime. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

/** Avisa a todas las pantallas conectadas que algo cambió (patrón broadcast). */
export async function broadcastChange(event: string) {
  if (!URL || !SERVICE) return;
  try {
    await fetch(`${URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
      },
      body: JSON.stringify({
        messages: [
          { topic: REALTIME_CHANNEL, event: "change", payload: { event } },
        ],
      }),
    });
  } catch (err) {
    console.error("broadcastChange falló:", err);
  }
}
