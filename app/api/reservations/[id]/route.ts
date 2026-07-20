import { NextRequest, NextResponse } from "next/server";
import { AppError, cancelReservation } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await params;

  try {
    await cancelReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/reservations/[id]", err);
    return NextResponse.json({ error: "No pudimos cancelar la reserva." }, { status: 500 });
  }
}
