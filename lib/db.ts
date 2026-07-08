import fs from "node:fs";
import path from "node:path";
import type { DB, EmailLog, MenuItem, Order, Reservation } from "./types";
import { DEFAULT_BAY_PRICE } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function seedMenu(): MenuItem[] {
  const item = (
    id: string,
    category: string,
    name: string,
    desc: string,
    price: number,
    allergens: string[],
    emoji: string,
    tint: string,
    stock: number
  ): MenuItem => ({
    id,
    category,
    name,
    desc,
    price,
    allergens,
    emoji,
    tint,
    stock,
    available: stock > 0,
  });

  return [
    // Para picar
    item("tabla", "Para picar", "Tabla Eagle Club", "Jamón serrano, quesos, aceitunas y frutos secos para compartir.", 16900, ["Lácteos", "Frutos secos"], "🧀", "#F0E7D2", 12),
    item("empanaditas", "Para picar", "Empanaditas de queso", "6 unidades, masa crujiente y queso fundido.", 7900, ["Gluten", "Lácteos"], "🥟", "#F2E3C8", 24),
    item("alitas", "Para picar", "Alitas BBQ", "8 alitas glaseadas en salsa BBQ ahumada.", 9500, ["Soja"], "🍗", "#EFD9C4", 18),
    item("papas", "Para picar", "Papas trufadas", "Papas rústicas, aceite de trufa y parmesano.", 6900, ["Lácteos"], "🍟", "#F4E9C9", 30),
    item("ceviche", "Para picar", "Ceviche de reineta", "Reineta fresca, limón de pica, cilantro y cebolla morada.", 12900, ["Pescado"], "🐟", "#DCEBE3", 8),
    // Sándwiches
    item("barrosluco", "Sándwiches", "Barros Luco", "Posta rosada y queso fundido en pan frica.", 11900, ["Gluten", "Lácteos"], "🥪", "#F2E0C6", 15),
    item("italiano", "Sándwiches", "Churrasco italiano", "Palta, tomate y mayonesa casera.", 12500, ["Gluten", "Huevo"], "🥖", "#E7EBD4", 15),
    item("club", "Sándwiches", "Club sándwich", "Pollo, tocino, huevo y verduras en pan de molde.", 12900, ["Gluten", "Huevo"], "🥪", "#F0E4CE", 15),
    // Pizzas
    item("margarita", "Pizzas", "Pizza margarita", "Salsa pomodoro, mozzarella fresca y albahaca.", 10900, ["Gluten", "Lácteos"], "🍕", "#F3E1C9", 10),
    item("pepperoni", "Pizzas", "Pizza pepperoni", "Doble pepperoni y mozzarella sobre masa madre.", 12400, ["Gluten", "Lácteos"], "🍕", "#F1DCC4", 10),
    // Dulce
    item("brownie", "Dulce", "Brownie con helado", "Brownie tibio de chocolate con helado de vainilla.", 6500, ["Gluten", "Huevo", "Lácteos", "Frutos secos"], "🍫", "#EAD9CD", 12),
    item("cheesecake", "Dulce", "Cheesecake de maracuyá", "Base de galleta y coulis de maracuyá.", 6900, ["Gluten", "Lácteos"], "🍰", "#F5E9CF", 10),
    // Bebidas & bar
    item("jugo", "Bebidas & Bar", "Jugo natural", "Naranja, frutilla o piña, recién exprimido.", 4500, [], "🧃", "#F3E5C4", 40),
    item("limonada", "Bebidas & Bar", "Limonada menta-jengibre", "Limón de pica, menta fresca y jengibre.", 4900, [], "🍋", "#EAF0D3", 40),
    item("espresso", "Bebidas & Bar", "Café espresso", "Blend de especialidad, doble shot.", 3500, [], "☕", "#E9DCC9", 60),
    item("cerveza", "Bebidas & Bar", "Cerveza artesanal 500cc", "IPA o Golden de cervecería local.", 6500, ["Gluten"], "🍺", "#F2E4C0", 36),
    item("aperol", "Bebidas & Bar", "Aperol Spritz", "Aperol, espumante brut y soda.", 8900, [], "🍹", "#F4DFC4", 20),
    item("piscosour", "Bebidas & Bar", "Pisco sour", "Receta de la casa, pisco transparente.", 7900, ["Huevo"], "🥃", "#EFEBD0", 25),
    item("vino", "Bebidas & Bar", "Copa de Carmenere", "Reserva del Valle de Colchagua.", 6900, [], "🍷", "#EAD8D2", 30),
    item("agua", "Bebidas & Bar", "Agua mineral", "Con o sin gas, 500cc.", 3000, [], "💧", "#E0EBE8", 48),
  ];
}

function seed(): DB {
  return {
    bays: [1, 2, 3, 4, 5, 6].map((id) => ({ id, name: `Bahía ${id}` })),
    menu: seedMenu(),
    reservations: [],
    orders: [],
    orderSeq: 0,
    settings: {
      bayPrice: DEFAULT_BAY_PRICE,
      notifyEmails: [
        "martin@schilkrut.app",
        "sofia@eagleclub.cl",
        "matias@eagleclub.cl",
        "nicolas@eagleclub.cl",
      ],
    },
    emails: [],
  };
}

/** Rellena campos nuevos cuando data/db.json viene de una versión anterior. */
function normalize(raw: Partial<DB>): DB {
  const s = seed();
  const seedStock = new Map(s.menu.map((m) => [m.id, m.stock]));
  return {
    bays: raw.bays?.length ? raw.bays : s.bays,
    menu: (raw.menu?.length ? raw.menu : s.menu).map((m) => ({
      ...m,
      stock: typeof m.stock === "number" ? m.stock : (seedStock.get(m.id) ?? 20),
    })),
    reservations: (raw.reservations ?? []).map((r) => ({ ...r, donation: r.donation ?? 0 })),
    orders: (raw.orders ?? []).map((o) => ({ ...o, donation: o.donation ?? 0 })),
    orderSeq: raw.orderSeq ?? 0,
    settings: { ...s.settings, ...(raw.settings ?? {}) },
    emails: raw.emails ?? [],
  };
}

type Store = {
  db: DB;
  listeners: Set<(event: string) => void>;
};

declare global {
  var __eagleStore: Store | undefined;
}

function load(): DB {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return normalize(JSON.parse(raw) as Partial<DB>);
  } catch {
    return seed();
  }
}

function store(): Store {
  if (!globalThis.__eagleStore) {
    globalThis.__eagleStore = { db: load(), listeners: new Set() };
  }
  return globalThis.__eagleStore;
}

export function getDB(): DB {
  return store().db;
}

export function persist() {
  // La memoria es la fuente de verdad durante la sesión; el disco solo
  // sirve para sobrevivir un reinicio. Un fallo de escritura no debe tumbar
  // la request (y provocar reintentos que descuenten stock dos veces).
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store().db, null, 2));
  } catch (err) {
    console.error("No se pudo persistir data/db.json:", err);
  }
}

export function broadcast(event: string) {
  for (const fn of store().listeners) {
    try {
      fn(event);
    } catch {
      // listener already gone
    }
  }
}

export function subscribe(fn: (event: string) => void): () => void {
  store().listeners.add(fn);
  return () => store().listeners.delete(fn);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

/**
 * Aviso por correo al equipo del club. En el MVP no se envía de verdad:
 * queda registrado en db.emails y visible en el panel de administración.
 */
export function notifyTeam(subject: string) {
  const db = getDB();
  const entry: EmailLog = {
    id: uid(),
    at: Date.now(),
    to: [...db.settings.notifyEmails],
    subject,
  };
  db.emails.unshift(entry);
  db.emails = db.emails.slice(0, 50);
}

export function addReservation(r: Reservation) {
  const db = getDB();
  db.reservations.push(r);
  notifyTeam(
    `Nueva reserva — Bahía ${String(r.bayId).padStart(2, "0")} · ${r.date} ${String(r.hour).padStart(2, "0")}:00 · ${r.name}`
  );
  persist();
  broadcast("reservations");
}

export function addOrder(o: Order) {
  const db = getDB();
  db.orders.push(o);
  notifyTeam(
    `Nuevo pedido #${o.number} — Bahía ${String(o.bayId).padStart(2, "0")} · $${o.total.toLocaleString("es-CL")}`
  );
  persist();
  broadcast("orders");
}
