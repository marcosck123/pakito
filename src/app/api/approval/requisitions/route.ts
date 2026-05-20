import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getApprovalRequisitions } from "@/lib/db/approval-repo";
import { canDo } from "@/lib/security/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Sessao expirada. Faca login novamente." },
      { status: 401 }
    );
  }

  const perms = canDo(user.role);
  if (!perms.aprovarRequisicao) {
    return NextResponse.json(
      { error: "Seu perfil nao tem permissao para acessar aprovacoes." },
      { status: 403 }
    );
  }

  try {
    return NextResponse.json(await getApprovalRequisitions());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar requisicoes." },
      { status: 500 }
    );
  }
}
