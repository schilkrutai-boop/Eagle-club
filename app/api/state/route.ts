import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDB();
  const date = req.nextUrl.searchParams.get("date");
  const bayId = req.nextUrl.searchParams.get("bay");

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  return NextResponse.json({
    bays: db.bays,
    menu: db.menu,
    settings: db.settings,
    emails: db.emails.slice(0, 20),
    reservations: date ? db.reservations.filter((r) => r.date === date) : db.reservations,
    orders: db.orders.filter(
      (o) =>
        o.createdAt >= dayStart.getTime() &&
        (bayId ? o.bayId === Number(bayId) : true)
    ),
  });
}
