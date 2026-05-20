import { NextResponse } from "next/server";
import { getRequisicao, updateRequisicao } from "@/lib/db/requisicoes-repo";
import { logAudit } from "@/lib/db/audit-repo";
import { requireSession } from "@/lib/auth/require-session";
import type { RequisicaoItem, ItemEntregaStatus, CondicaoPeca, RequisicaoStatus } from "@/types";

export async function PATCH(request: Request) {
  const { user, error } = await requireSession(["ADMIN", "COMPRAS", "RECEBIMENTO"]);
  if (error) return error;

  const body = await request.json() as {
    requisicaoId: string;
    itemId: string;
    action: "RECEBIDA" | "PARCIAL" | "PROBLEMA";
    quantidadeRecebida?: number;
    observacao?: string;
    condicao?: CondicaoPeca;
  };

  const today = new Date().toISOString();
  const quemRecebeu = user!.nome;

  const requisicao = await getRequisicao(body.requisicaoId);
  if (!requisicao) return NextResponse.json({ error: "Requisição não encontrada" }, { status: 404 });

  const itemIndex = requisicao.itens.findIndex((i) => i.id === body.itemId);
  if (itemIndex < 0) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  let itemUpdate: Partial<RequisicaoItem>;

  if (body.action === "RECEBIDA") {
    itemUpdate = {
      statusEntrega: "RECEBIDA" as ItemEntregaStatus,
      quantidadeRecebida: body.quantidadeRecebida,
      dataRecebimento: today,
      quemRecebeu,
      condicaoPeca: "OK",
    };
  } else if (body.action === "PARCIAL") {
    itemUpdate = {
      statusEntrega: "RECEBIDA_PARCIALMENTE" as ItemEntregaStatus,
      quantidadeRecebida: body.quantidadeRecebida ?? 0,
      dataRecebimento: today,
      quemRecebeu,
      observacaoRecebimento: body.observacao,
    };
  } else {
    itemUpdate = {
      statusEntrega: "COM_PROBLEMA" as ItemEntregaStatus,
      dataRecebimento: today,
      quemRecebeu,
      condicaoPeca: body.condicao ?? "DANIFICADA",
      observacaoRecebimento: body.observacao,
    };
  }

  const updatedItens = requisicao.itens.map((item, idx) =>
    idx === itemIndex ? { ...item, ...itemUpdate } : item
  );

  const allReceived = updatedItens.every((i) => i.statusEntrega === "RECEBIDA");
  const anyReceived = updatedItens.some((i) =>
    ["RECEBIDA", "RECEBIDA_PARCIALMENTE"].includes(i.statusEntrega)
  );

  let novoStatus: RequisicaoStatus = requisicao.status;
  if (allReceived) novoStatus = "RECEBIDA";
  else if (anyReceived) novoStatus = "PARCIALMENTE_RECEBIDA";

  await updateRequisicao(body.requisicaoId, {
    itens: updatedItens,
    status: novoStatus,
  });

  await logAudit("requisicao", body.requisicaoId, "UPDATE", user!.id, {
    itemId: body.itemId,
    action: body.action,
  });

  return NextResponse.json({ ok: true });
}
