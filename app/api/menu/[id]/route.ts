import { NextRequest, NextResponse } from "next/server";
import { broadcast, getDB, persist } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const item = getDB().menu.find((m) => m.id === id);
  if (!item) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  // Aplica el stock primero para que la disponibilidad se decida contra el
  // valor nuevo.
  if (typeof body.stock === "number" && body.stock >= 0 && body.stock < 100000) {
    item.stock = Math.round(body.stock);
  }
  if (typeof body.price === "number" && body.price > 0 && body.price < 10000000) {
    item.price = Math.round(body.price);
  }
  if (typeof body.available === "boolean") {
    // Reponer/agotar explícito desde el admin (nunca disponible sin stock).
    item.available = body.available && item.stock > 0;
  } else if (item.stock === 0) {
    // Sin cambio explícito: quedarse sin stock siempre agota.
    item.available = false;
  }
  // Ajustar solo el stock nunca reactiva un producto agotado a mano: eso
  // requiere pulsar "Reponer" (available: true).

  persist();
  broadcast("menu");
  return NextResponse.json({ item });
}
