import { NextRequest, NextResponse } from "next/server";
import { AppError, createReservation } from "@/lib/db";
import { isRealDate, todayISO } from "@/lib/format";
import { CLOSE_HOUR, MAX_DONATION, OPEN_HOUR } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bayId, date, hour, name, email, guests, donation } = body ?? {};

  if (
    typeof bayId !== "number" ||
    !Number.isInteger(hour) ||
    typeof date !== "string" ||
    !isRealDate(date) ||
    !name ||
    hour < OPEN_HOUR ||
    hour >= CLOSE_HOUR
  ) {
    return NextResponse.json({ error: "Datos de reserva incompletos." }, { status: 400 });
  }

  const today = todayISO();
  if (date < today || (date === today && hour <= new Date().getHours())) {
    return NextResponse.json(
      { error: "Ese bloque ya pasó. Elige un horario futuro." },
      { status: 409 }
    );
  }

  try {
    const reservation = await createReservation({
      bayId,
      date,
      hour,
      name: String(name).slice(0, 80),
      email: String(email ?? "").slice(0, 120),
      guests: Math.min(Math.max(Math.floor(Number(guests)) || 1, 1), 6),
      donation: Math.min(Math.max(Math.round(Number(donation) || 0), 0), MAX_DONATION),
    });
    return NextResponse.json({ reservation });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/reservations", err);
    return NextResponse.json({ error: "No pudimos crear la reserva." }, { status: 500 });
  }
}
