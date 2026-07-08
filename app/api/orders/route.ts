import { NextRequest, NextResponse } from "next/server";
import { AppError, createOrder } from "@/lib/db";
import { MAX_DONATION } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bayId, items, note, donation } = body ?? {};

  if (typeof bayId !== "number" || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El pedido está vacío." }, { status: 400 });
  }

  try {
    const order = await createOrder({
      bayId,
      items: items.map((it) => ({ itemId: String(it?.itemId), qty: Number(it?.qty) })),
      note: String(note ?? "").slice(0, 200),
      donation: Math.min(Math.max(Math.round(Number(donation) || 0), 0), MAX_DONATION),
    });
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/orders", err);
    return NextResponse.json({ error: "No pudimos enviar el pedido." }, { status: 500 });
  }
}
