import { NextRequest, NextResponse } from "next/server";
import { addReservation, getDB, uid } from "@/lib/db";
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

  // No se puede reservar un bloque ya pasado (fecha anterior a hoy, o una
  // hora de hoy que ya empezó).
  const today = todayISO();
  if (date < today || (date === today && hour <= new Date().getHours())) {
    return NextResponse.json(
      { error: "Ese bloque ya pasó. Elige un horario futuro." },
      { status: 409 }
    );
  }

  const db = getDB();
  if (!db.bays.some((b) => b.id === bayId)) {
    return NextResponse.json({ error: "La bahía no existe." }, { status: 400 });
  }

  const taken = db.reservations.some(
    (r) => r.bayId === bayId && r.date === date && r.hour === hour
  );
  if (taken) {
    return NextResponse.json(
      { error: "Ese horario acaba de ser reservado. Elige otro bloque." },
      { status: 409 }
    );
  }

  const reservation = {
    id: uid(),
    bayId,
    date,
    hour,
    name: String(name).slice(0, 80),
    email: String(email ?? "").slice(0, 120),
    guests: Math.min(Math.max(Math.floor(Number(guests)) || 1, 1), 6),
    total: db.settings.bayPrice,
    donation: Math.min(Math.max(Math.round(Number(donation) || 0), 0), MAX_DONATION),
    paid: true, // pago simulado en el MVP
    createdAt: Date.now(),
  };

  addReservation(reservation);
  return NextResponse.json({ reservation });
}
