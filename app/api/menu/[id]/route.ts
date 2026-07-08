import { NextRequest, NextResponse } from "next/server";
import { AppError, updateMenuItem } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const item = await updateMenuItem(id, {
      available: typeof body.available === "boolean" ? body.available : undefined,
      price: typeof body.price === "number" ? body.price : undefined,
      stock: typeof body.stock === "number" ? body.stock : undefined,
    });
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PATCH /api/menu/[id]", err);
    return NextResponse.json({ error: "No pudimos actualizar el producto." }, { status: 500 });
  }
}
