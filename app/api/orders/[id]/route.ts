import { NextRequest, NextResponse } from "next/server";
import { AppError, setOrderStatus } from "@/lib/db";
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

  try {
    const order = await setOrderStatus(id, status);
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PATCH /api/orders/[id]", err);
    return NextResponse.json({ error: "No pudimos actualizar el pedido." }, { status: 500 });
  }
}
