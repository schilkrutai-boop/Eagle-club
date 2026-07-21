import { broadcastChange, supabaseServer } from "./supabase";
import { santiagoDayRangeISO, santiagoDayStartISO } from "./format";
import type {
  EmailLog,
  MenuItem,
  Order,
  OrderStatus,
  Reservation,
  Settings,
  WaitlistEntry,
} from "./types";

/** Error de dominio que las rutas mapean a un status HTTP. */
export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

// ---------- mappers (snake_case DB -> tipos de la app) ----------
type MenuRow = {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  allergens: string[];
  emoji: string;
  tint: string;
  available: boolean;
  stock: number;
  sort: number;
};

function mapMenu(r: MenuRow): MenuItem {
  return {
    id: r.id,
    category: r.category,
    name: r.name,
    desc: r.description,
    price: r.price,
    allergens: r.allergens ?? [],
    emoji: r.emoji,
    tint: r.tint,
    available: r.available,
    stock: r.stock,
  };
}

function mapReservation(r: Record<string, unknown>): Reservation {
  return {
    id: r.id as string,
    bayId: r.bay_id as number,
    date: r.date as string,
    hour: r.hour as number,
    name: r.name as string,
    email: (r.email as string) ?? "",
    guests: r.guests as number,
    total: r.total as number,
    donation: (r.donation as number) ?? 0,
    paid: r.paid as boolean,
    createdAt: new Date(r.created_at as string).getTime(),
  };
}

function mapOrder(r: Record<string, unknown>): Order {
  return {
    id: r.id as string,
    number: r.number as number,
    bayId: r.bay_id as number,
    items: (r.items as Order["items"]) ?? [],
    note: (r.note as string) ?? "",
    status: r.status as OrderStatus,
    total: r.total as number,
    donation: (r.donation as number) ?? 0,
    paid: r.paid as boolean,
    createdAt: new Date(r.created_at as string).getTime(),
  };
}

function mapSettings(r: Record<string, unknown> | null): Settings {
  return {
    bayPrice: (r?.bay_price as number) ?? 50000,
    notifyEmails: (r?.notify_emails as string[]) ?? [],
  };
}

function mapEmail(r: Record<string, unknown>): EmailLog {
  return {
    id: r.id as string,
    at: new Date(r.at as string).getTime(),
    to: (r.recipients as string[]) ?? [],
    subject: r.subject as string,
  };
}

// ---------- lecturas ----------
export type StateResult = {
  bays: { id: number; name: string }[];
  menu: MenuItem[];
  settings: Settings;
  emails: EmailLog[];
  reservations: Reservation[];
  orders: Order[];
};

export async function getState(opts: {
  date?: string;
  bayId?: number;
  includePII?: boolean;
}): Promise<StateResult> {
  const sb = supabaseServer();

  // Con fecha explícita (admin) miramos ese día completo; sin ella (cocina,
  // bahías) miramos "hoy" en la zona del club.
  let ordersQuery = sb.from("orders").select("*");
  if (opts.date) {
    const { start, end } = santiagoDayRangeISO(opts.date);
    ordersQuery = ordersQuery.gte("created_at", start).lt("created_at", end);
  } else {
    ordersQuery = ordersQuery.gte("created_at", santiagoDayStartISO());
  }
  if (opts.bayId) ordersQuery = ordersQuery.eq("bay_id", opts.bayId);

  const reservationsQuery = opts.date
    ? sb.from("reservations").select("*").eq("date", opts.date)
    : sb.from("reservations").select("*");

  // El email_log solo se consulta para el admin (no viaja a clientes públicos).
  const emailsPromise = opts.includePII
    ? sb.from("email_log").select("*").order("at", { ascending: false }).limit(20)
    : Promise.resolve({ data: [] as Record<string, unknown>[] });

  const [bays, menu, settings, emails, reservations, orders] = await Promise.all([
    sb.from("bays").select("*").order("id"),
    sb.from("menu_items").select("*").order("sort"),
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    emailsPromise,
    reservationsQuery,
    ordersQuery,
  ]);

  const fullSettings = mapSettings(settings.data);

  return {
    bays: (bays.data ?? []) as { id: number; name: string }[],
    menu: (menu.data ?? []).map((r) => mapMenu(r as MenuRow)),
    // notify_emails son correos internos del equipo: solo para el admin.
    settings: opts.includePII ? fullSettings : { ...fullSettings, notifyEmails: [] },
    emails: (emails.data ?? []).map(mapEmail),
    reservations: (reservations.data ?? []).map((r) =>
      opts.includePII ? mapReservation(r) : stripReservationPII(mapReservation(r))
    ),
    orders: (orders.data ?? []).map(mapOrder),
  };
}

/** Quita nombre y email de la reserva para las vistas públicas (tee sheet). */
function stripReservationPII(r: Reservation): Reservation {
  return { ...r, name: "", email: "" };
}

// ---------- avisos por correo ----------
async function notifyTeam(subject: string) {
  const sb = supabaseServer();
  const { data } = await sb.from("settings").select("notify_emails").eq("id", 1).maybeSingle();
  const recipients = (data?.notify_emails as string[]) ?? [];
  await sb.from("email_log").insert({ id: uid(), recipients, subject });
}

// ---------- reservas ----------
export async function createReservation(input: {
  bayId: number;
  date: string;
  hour: number;
  name: string;
  email: string;
  guests: number;
  donation: number;
}): Promise<Reservation> {
  const sb = supabaseServer();

  const { data: bay } = await sb.from("bays").select("id").eq("id", input.bayId).maybeSingle();
  if (!bay) throw new AppError(400, "La bahía no existe.");

  const { data: settings } = await sb
    .from("settings")
    .select("bay_price")
    .eq("id", 1)
    .maybeSingle();
  const total = (settings?.bay_price as number) ?? 50000;

  const row = {
    id: uid(),
    bay_id: input.bayId,
    date: input.date,
    hour: input.hour,
    name: input.name,
    email: input.email,
    guests: input.guests,
    total,
    donation: input.donation,
    paid: true,
  };

  const { data, error } = await sb.from("reservations").insert(row).select().single();
  if (error) {
    if (error.code === "23505") {
      throw new AppError(409, "Ese horario acaba de ser reservado. Elige otro bloque.");
    }
    throw new AppError(500, "No pudimos crear la reserva.");
  }

  await notifyTeam(
    `Nueva reserva — Bahía ${String(input.bayId).padStart(2, "0")} · ${input.date} ${String(input.hour).padStart(2, "0")}:00 · ${input.name}`
  );
  await broadcastChange("reservations");
  return mapReservation(data);
}

// ---------- pedidos ----------
export async function createOrder(input: {
  bayId: number;
  items: { itemId: string; qty: number }[];
  note: string;
  donation: number;
}): Promise<Order> {
  const sb = supabaseServer();

  const { data, error } = await sb.rpc("place_order", {
    p_bay_id: input.bayId,
    p_items: input.items,
    p_note: input.note,
    p_donation: input.donation,
  });

  if (error) {
    const m = error.message ?? "";
    if (m.includes("BAHIA_INEXISTENTE")) throw new AppError(400, "La bahía no existe.");
    if (m.includes("PEDIDO_VACIO")) throw new AppError(400, "El pedido está vacío.");
    if (m.includes("AGOTADO:")) {
      const name = m.slice(m.indexOf("AGOTADO:") + 8).trim();
      throw new AppError(409, `${name} está agotado. Actualiza tu pedido.`);
    }
    if (m.includes("STOCK:")) {
      const rest = m.slice(m.indexOf("STOCK:") + 6);
      const lastColon = rest.lastIndexOf(":");
      const name = rest.slice(0, lastColon).trim();
      const stock = Number(rest.slice(lastColon + 1));
      throw new AppError(
        409,
        `De ${name} ${stock === 1 ? "queda solo 1 unidad" : `quedan solo ${stock} unidades`}. Ajusta tu pedido.`
      );
    }
    throw new AppError(500, "No pudimos enviar el pedido.");
  }

  const order = mapOrder(data as Record<string, unknown>);
  await notifyTeam(
    `Nuevo pedido #${order.number} — Bahía ${String(order.bayId).padStart(2, "0")} · $${order.total.toLocaleString("es-CL")}`
  );
  // Un solo aviso: el refetch trae estado completo (pedidos + stock nuevo).
  await broadcastChange("orders");
  return order;
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new AppError(500, "No pudimos actualizar el pedido.");
  if (!data) throw new AppError(404, "Pedido no encontrado.");
  await broadcastChange("orders");
  return mapOrder(data);
}

// ---------- menú / inventario ----------
export async function updateMenuItem(
  id: string,
  patch: { available?: boolean; price?: number; stock?: number }
): Promise<MenuItem> {
  const sb = supabaseServer();
  const { data: current } = await sb.from("menu_items").select("*").eq("id", id).maybeSingle();
  if (!current) throw new AppError(404, "Producto no encontrado.");

  const next: Record<string, unknown> = {};
  let stock = current.stock as number;
  if (typeof patch.stock === "number" && patch.stock >= 0 && patch.stock < 100000) {
    stock = Math.round(patch.stock);
    next.stock = stock;
  }
  if (typeof patch.price === "number" && patch.price > 0 && patch.price < 10000000) {
    next.price = Math.round(patch.price);
  }
  // La disponibilidad se decide contra el stock nuevo; editar solo el stock
  // nunca reactiva un producto agotado a mano (eso requiere available: true).
  if (typeof patch.available === "boolean") {
    next.available = patch.available && stock > 0;
  } else if (stock === 0) {
    next.available = false;
  }

  const { data, error } = await sb
    .from("menu_items")
    .update(next)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new AppError(500, "No pudimos actualizar el producto.");
  await broadcastChange("menu");
  return mapMenu(data as MenuRow);
}

// ---------- configuración ----------
export async function updateSettings(patch: {
  bayPrice?: number;
  notifyEmails?: string[];
}): Promise<Settings> {
  const sb = supabaseServer();
  const next: Record<string, unknown> = {};
  if (patch.bayPrice !== undefined) next.bay_price = patch.bayPrice;
  if (patch.notifyEmails !== undefined) next.notify_emails = patch.notifyEmails;

  const { data, error } = await sb
    .from("settings")
    .update(next)
    .eq("id", 1)
    .select()
    .single();
  if (error) throw new AppError(500, "No pudimos guardar la configuración.");
  await broadcastChange("settings");
  return mapSettings(data);
}

// ---------- cancelaciones e invitaciones (operación del club) ----------

/**
 * Cancela una reserva: borra la fila y libera el bloque para volver a
 * reservarlo. En el MVP equivale a un reembolso (nunca ocurrió).
 */
export async function cancelReservation(id: string): Promise<void> {
  const sb = supabaseServer();
  const { data: r, error } = await sb
    .from("reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(500, "No pudimos leer la reserva.");
  if (!r) throw new AppError(404, "Reserva no encontrada.");

  const { error: delErr } = await sb.from("reservations").delete().eq("id", id);
  if (delErr) throw new AppError(500, "No pudimos cancelar la reserva.");

  await notifyTeam(
    `Reserva cancelada — Bahía ${String(r.bay_id).padStart(2, "0")} · ${r.date} ${String(r.hour).padStart(2, "0")}:00 · ${r.name}`
  );
  await broadcastChange("reservations");
}

/**
 * Cancela un pedido: repone el stock de sus productos y borra la fila, de modo
 * que desaparece de la cocina y deja de contar como venta.
 */
export async function cancelOrder(id: string): Promise<void> {
  const sb = supabaseServer();
  const { data: order, error } = await sb
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(500, "No pudimos leer el pedido.");
  if (!order) throw new AppError(404, "Pedido no encontrado.");

  const items = (order.items as Order["items"]) ?? [];
  // Devuelve al inventario lo que este pedido había descontado.
  for (const it of items) {
    const { data: mi } = await sb
      .from("menu_items")
      .select("stock")
      .eq("id", it.itemId)
      .maybeSingle();
    if (mi) {
      await sb
        .from("menu_items")
        .update({ stock: (mi.stock as number) + it.qty, available: true })
        .eq("id", it.itemId);
    }
  }

  const { error: delErr } = await sb.from("orders").delete().eq("id", id);
  if (delErr) throw new AppError(500, "No pudimos cancelar el pedido.");

  await notifyTeam(
    `Pedido #${order.number} cancelado — Bahía ${String(order.bay_id).padStart(2, "0")}`
  );
  await broadcastChange("orders");
}

/**
 * Invitación de la casa: deja la comida en $0 (total = solo la donación) sin
 * sacar el pedido de la cocina. Reversible: recalcula el total desde los ítems.
 */
export async function compOrder(id: string, comp: boolean): Promise<Order> {
  const sb = supabaseServer();
  const { data: order, error } = await sb
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError(500, "No pudimos leer el pedido.");
  if (!order) throw new AppError(404, "Pedido no encontrado.");

  const items = (order.items as Order["items"]) ?? [];
  const food = items.reduce((s, i) => s + i.price * i.qty, 0);
  const donation = (order.donation as number) ?? 0;
  const total = comp ? donation : food + donation;

  const { data, error: upErr } = await sb
    .from("orders")
    .update({ total })
    .eq("id", id)
    .select()
    .single();
  if (upErr) throw new AppError(500, "No pudimos actualizar el pedido.");
  await broadcastChange("orders");
  return mapOrder(data);
}

// ---------- lista de espera (landing "próximamente") ----------

type WaitlistRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

/**
 * Guarda a una persona en la lista de espera. El email es único (índice sobre
 * lower(email)), así que un alta repetida se responde como conflicto amable
 * en vez de error. Ver supabase/waitlist.sql para crear la tabla.
 */
export async function createWaitlistEntry(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<WaitlistEntry> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("waitlist")
    .insert({
      id: uid(),
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      source: "landing",
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation
    if (error.code === "23505") {
      throw new AppError(409, "Ese email ya está en la lista. Te avisaremos.");
    }
    // Falta correr supabase/waitlist.sql. PostgREST responde PGRST205
    // ("table not found in schema cache"); 42P01 es el código de Postgres.
    if (error.code === "PGRST205" || error.code === "42P01") {
      console.error("createWaitlistEntry: falta la tabla waitlist", error);
      throw new AppError(
        503,
        "La lista de espera aún no está habilitada. Vuelve a intentar en unos minutos."
      );
    }
    console.error("createWaitlistEntry", error);
    throw new AppError(500, "No pudimos registrarte.");
  }

  await broadcastChange("waitlist");
  return mapWaitlist(data as WaitlistRow);
}

function mapWaitlist(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    createdAt: row.created_at,
  };
}

/**
 * Lista completa de inscritos, más nuevos primero. Contiene PII, así que la
 * ruta que la expone debe estar detrás del gate de admin.
 */
export async function listWaitlist(): Promise<WaitlistEntry[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("waitlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      throw new AppError(503, "La lista de espera aún no está habilitada.");
    }
    console.error("listWaitlist", error);
    throw new AppError(500, "No pudimos cargar la lista.");
  }
  return (data as WaitlistRow[]).map(mapWaitlist);
}

// ---------- reinicio de la demo ----------
// Stock inicial de cada producto (igual al seed de supabase/schema.sql).
const SEED_STOCK: Record<string, number> = {
  tabla: 12, empanaditas: 24, alitas: 18, papas: 30, ceviche: 8,
  barrosluco: 15, italiano: 15, club: 15, margarita: 10, pepperoni: 10,
  brownie: 12, cheesecake: 10, jugo: 40, limonada: 40, espresso: 60,
  cerveza: 36, aperol: 20, piscosour: 25, vino: 30, agua: 48,
};

/**
 * Reinicia la demo a cero: borra pedidos, reservas y avisos, y restaura el
 * stock de cada producto a su valor inicial. Pensado para empezar una demo
 * limpia sin tocar la base a mano.
 */
export async function resetDemo(): Promise<{ menu: number }> {
  const sb = supabaseServer();
  await sb.from("orders").delete().neq("id", "");
  await sb.from("reservations").delete().neq("id", "");
  await sb.from("email_log").delete().neq("id", "");
  for (const [id, stock] of Object.entries(SEED_STOCK)) {
    await sb.from("menu_items").update({ stock, available: true }).eq("id", id);
  }
  await broadcastChange("reset");
  return { menu: Object.keys(SEED_STOCK).length };
}
