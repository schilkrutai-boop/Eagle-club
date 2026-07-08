import { NextRequest, NextResponse } from "next/server";
import { broadcast, getDB, persist } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["nuevo", "preparando", "listo", "entregado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const order = getDB().orders.find((o) => o.id === id);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  order.status = status;
  persist();
  broadcast("orders");
  return NextResponse.json({ order });
}
