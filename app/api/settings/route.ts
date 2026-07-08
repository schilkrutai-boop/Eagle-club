import { NextRequest, NextResponse } from "next/server";
import { AppError, updateSettings } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const body = await req.json();
  const patch: { bayPrice?: number; notifyEmails?: string[] } = {};

  if (body.bayPrice !== undefined) {
    const n = Number(body.bayPrice);
    if (!Number.isFinite(n) || n <= 0 || n >= 10000000) {
      return NextResponse.json({ error: "Valor por hora inválido." }, { status: 400 });
    }
    patch.bayPrice = Math.round(n);
  }

  if (body.notifyEmails !== undefined) {
    if (!Array.isArray(body.notifyEmails)) {
      return NextResponse.json({ error: "Lista de correos inválida." }, { status: 400 });
    }
    const emails = body.notifyEmails
      .map((e: unknown) => String(e).trim().toLowerCase())
      .filter((e: string) => EMAIL_RE.test(e))
      .slice(0, 20);
    patch.notifyEmails = Array.from(new Set<string>(emails));
  }

  try {
    const settings = await updateSettings(patch);
    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PATCH /api/settings", err);
    return NextResponse.json({ error: "No pudimos guardar la configuración." }, { status: 500 });
  }
}
