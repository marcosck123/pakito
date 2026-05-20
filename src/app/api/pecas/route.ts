import { NextResponse } from "next/server";
import { getPecas, createPeca, updatePeca } from "@/lib/db/pecas-repo";
import { logAudit } from "@/lib/db/audit-repo";
import { requireSession } from "@/lib/auth/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "COMPRAS"]);
  if (error) return error;

  try {
    const pecas = await getPecas();
    return NextResponse.json(pecas);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao buscar peças." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { user, error } = await requireSession(["ADMIN", "COMPRAS"]);
  if (error) return error;

  const body = await request.json();

  try {
    const result = await createPeca(body);
    await logAudit("peca", result.id, "CREATE", user!.id);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar peça." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { user, error } = await requireSession(["ADMIN", "COMPRAS"]);
  if (error) return error;

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

  try {
    const { id, ...data } = body;
    const result = await updatePeca(id, data);
    if (!result) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    await logAudit("peca", id, "UPDATE", user!.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao atualizar peça." },
      { status: 500 }
    );
  }
}
