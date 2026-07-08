import { NextRequest, NextResponse } from "next/server";
import { broadcast, getDB, persist } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const settings = getDB().settings;

  if (body.bayPrice !== undefined) {
    const n = Number(body.bayPrice);
    if (!Number.isFinite(n) || n <= 0 || n >= 10000000) {
      return NextResponse.json({ error: "Valor por hora inválido." }, { status: 400 });
    }
    settings.bayPrice = Math.round(n);
  }

  if (body.notifyEmails !== undefined) {
    if (!Array.isArray(body.notifyEmails)) {
      return NextResponse.json({ error: "Lista de correos inválida." }, { status: 400 });
    }
    const emails = body.notifyEmails
      .map((e: unknown) => String(e).trim().toLowerCase())
      .filter((e: string) => EMAIL_RE.test(e))
      .slice(0, 20);
    settings.notifyEmails = Array.from(new Set(emails));
  }

  persist();
  broadcast("settings");
  return NextResponse.json({ settings });
}
