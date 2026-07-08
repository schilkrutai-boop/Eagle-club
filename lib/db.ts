import { broadcastChange, supabaseServer } from "./supabase";
import { santiagoDayStartISO } from "./format";
import type {
  EmailLog,
  MenuItem,
  Order,
  OrderStatus,
  Reservation,
  Settings,
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
  const todayStart = santiagoDayStartISO();

  let ordersQuery = sb.from("orders").select("*").gte("created_at", todayStart);
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
