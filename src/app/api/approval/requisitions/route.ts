import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listApprovalRequisitions } from "@/lib/approval/repository";
import { canDo } from "@/lib/security/permissions";
import { SupabaseConfigError, SupabaseRestError } from "@/lib/db/supabase-rest";

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
    return NextResponse.json(await listApprovalRequisitions());
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json(
        {
          error: error.message,
          setup:
            "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, depois rode o SQL em supabase/migrations/202605180001_approval_requisitions.sql.",
        },
        { status: 503 }
      );
    }

    if (error instanceof SupabaseRestError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar requisicoes." },
      { status: 500 }
    );
  }
}
