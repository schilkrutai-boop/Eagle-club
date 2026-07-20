import { NextRequest, NextResponse } from "next/server";
import { AppError, createWaitlistEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Alta en la lista de espera de la landing. Es un endpoint público que
 * escribe con service_role, así que exige mismo origen: sin esto cualquier
 * sitio podría postear desde el navegador de un visitante.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("host");
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = "";
    }
    if (!host || originHost !== host) {
      return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  const { name, email, phone } = body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !EMAIL_RE.test(email.trim())
  ) {
    return NextResponse.json(
      { error: "Revisa tu nombre y tu email." },
      { status: 400 }
    );
  }

  try {
    const entry = await createWaitlistEntry({
      name: name.trim().slice(0, 80),
      email: email.trim().toLowerCase().slice(0, 120),
      phone: String(phone ?? "").trim().slice(0, 30),
    });
    return NextResponse.json({ entry });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/waitlist", err);
    return NextResponse.json({ error: "No pudimos registrarte." }, { status: 500 });
  }
}
