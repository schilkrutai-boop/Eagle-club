import { NextRequest, NextResponse } from "next/server";
import { AppError, resetDemo } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Reinicia la demo a cero. Solo administración. */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const result = await resetDemo();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/admin/reset", err);
    return NextResponse.json({ error: "No pudimos reiniciar la demo." }, { status: 500 });
  }
}
