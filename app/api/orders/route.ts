import { NextRequest, NextResponse } from "next/server";
import { addOrder, broadcast, getDB, uid } from "@/lib/db";
import { MAX_DONATION, type OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bayId, items, note, donation } = body ?? {};

  if (typeof bayId !== "number" || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El pedido está vacío." }, { status: 400 });
  }

  const db = getDB();
  if (!db.bays.some((b) => b.id === bayId)) {
    return NextResponse.json({ error: "La bahía no existe." }, { status: 400 });
  }

  // Consolida cantidades por producto antes de validar: así dos líneas del
  // mismo itemId no evaden el chequeo de stock ni el tope por ítem.
  const wanted = new Map<string, number>();
  for (const it of items) {
    const qty = Math.floor(Number(it?.qty));
    if (!it?.itemId || !Number.isFinite(qty) || qty <= 0) continue;
    wanted.set(it.itemId, (wanted.get(it.itemId) ?? 0) + qty);
  }

  // Valida stock completo antes de descontar nada
  const orderItems: OrderItem[] = [];
  for (const [itemId, rawQty] of wanted) {
    const menuItem = db.menu.find((m) => m.id === itemId);
    if (!menuItem) continue;
    const qty = Math.min(rawQty, 20);
    if (!menuItem.available || menuItem.stock <= 0) {
      return NextResponse.json(
        { error: `${menuItem.name} está agotado. Actualiza tu pedido.` },
        { status: 409 }
      );
    }
    if (menuItem.stock < qty) {
      return NextResponse.json(
        {
          error: `De ${menuItem.name} ${menuItem.stock === 1 ? "queda solo 1 unidad" : `quedan solo ${menuItem.stock} unidades`}. Ajusta tu pedido.`,
        },
        { status: 409 }
      );
    }
    orderItems.push({ itemId: menuItem.id, name: menuItem.name, qty, price: menuItem.price });
  }

  if (orderItems.length === 0) {
    return NextResponse.json({ error: "El pedido está vacío." }, { status: 400 });
  }

  // Descuenta inventario; en 0 queda agotado automáticamente
  for (const it of orderItems) {
    const menuItem = db.menu.find((m) => m.id === it.itemId)!;
    menuItem.stock -= it.qty;
    if (menuItem.stock <= 0) {
      menuItem.stock = 0;
      menuItem.available = false;
    }
  }
  broadcast("menu");

  const donationClp = Math.min(Math.max(Math.round(Number(donation) || 0), 0), MAX_DONATION);
  db.orderSeq += 1;
  const order = {
    id: uid(),
    number: db.orderSeq,
    bayId,
    items: orderItems,
    note: String(note ?? "").slice(0, 200),
    status: "nuevo" as const,
    total: orderItems.reduce((s, i) => s + i.price * i.qty, 0) + donationClp,
    donation: donationClp,
    paid: true, // pago simulado en el MVP
    createdAt: Date.now(),
  };

  addOrder(order);
  return NextResponse.json({ order });
}
