import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Valida el token de administración que ingresa el panel admin. */
export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN no está configurado en el servidor." },
      { status: 503 }
    );
  }
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
