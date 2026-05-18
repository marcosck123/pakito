import { NextResponse } from "next/server";
import type { ApprovalDecisionAction } from "@/lib/approval/types";
import { decidePurchaseRequisition } from "@/lib/approval/repository";
import { getSession } from "@/lib/auth/session";
import { canDo } from "@/lib/security/permissions";
import { SupabaseConfigError, SupabaseRestError } from "@/lib/db/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = ["APROVAR", "REPROVAR", "SOLICITAR_AJUSTE"] as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isAction(value: unknown): value is ApprovalDecisionAction {
  return typeof value === "string" && ACTIONS.includes(value as ApprovalDecisionAction);
}

function actionNeedsComment(action: ApprovalDecisionAction) {
  return action === "REPROVAR" || action === "SOLICITAR_AJUSTE";
}

export async function POST(request: Request, context: RouteContext) {
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
      { error: "Seu perfil nao tem permissao para decidir requisicoes." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

  if (!isAction(action)) {
    return NextResponse.json(
      { error: "Acao de aprovacao invalida." },
      { status: 400 }
    );
  }

  if (actionNeedsComment(action) && !comment) {
    return NextResponse.json(
      { error: "Comentario obrigatorio para reprovar ou solicitar ajuste." },
      { status: 400 }
    );
  }

  try {
    const requisition = await decidePurchaseRequisition(
      id,
      action,
      comment || null
    );

    return NextResponse.json({
      success: true,
      requisition,
    });
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
      { error: error instanceof Error ? error.message : "Erro ao salvar decisao." },
      { status: 500 }
    );
  }
}
