import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? undefined;
  const bayParam = req.nextUrl.searchParams.get("bay");
  const bayId = bayParam ? Number(bayParam) : undefined;

  try {
    const state = await getState({ date, bayId });
    return NextResponse.json(state);
  } catch (err) {
    console.error("GET /api/state", err);
    return NextResponse.json({ error: "No se pudo cargar el estado." }, { status: 500 });
  }
}
