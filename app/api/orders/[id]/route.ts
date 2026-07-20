import { NextRequest, NextResponse } from "next/server";
import { AppError, cancelOrder, compOrder, setOrderStatus } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["nuevo", "preparando", "listo", "entregado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Invitación de la casa: mutación de administración, protegida por token.
  if (typeof body?.comp === "boolean") {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    try {
      const order = await compOrder(id, body.comp);
      return NextResponse.json({ order });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error("PATCH /api/orders/[id] (comp)", err);
      return NextResponse.json({ error: "No pudimos actualizar el pedido." }, { status: 500 });
    }
  }

  // Avance de estado en cocina (pantalla operativa, sin token).
  const { status } = body ?? {};
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await params;

  try {
    await cancelOrder(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/orders/[id]", err);
    return NextResponse.json({ error: "No pudimos cancelar el pedido." }, { status: 500 });
  }
}
