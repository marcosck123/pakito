import { NextResponse } from "next/server";
import { upsertPurchaseRequisition } from "@/lib/db/purchase-requisitions-repo";
import { logAudit } from "@/lib/db/audit-repo";
import { requireSession } from "@/lib/auth/require-session";

export async function POST(request: Request) {
  const { user, error } = await requireSession(["ADMIN", "COMPRAS", "SOLICITANTE"]);
  if (error) return error;

  const body = await request.json();

  try {
    const result = await upsertPurchaseRequisition(body);
    await logAudit("purchase_requisition", result.id, "CREATE", user!.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar requisição de compra." },
      { status: 500 }
    );
  }
}
