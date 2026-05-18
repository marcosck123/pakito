import { NextResponse } from "next/server";
import { updateItemEntrega } from "@/lib/mock-data/requisicoes";
import type { RequisicaoItem, ItemEntregaStatus, CondicaoPeca } from "@/types";

export async function PATCH(request: Request) {
  const body = await request.json() as {
    requisicaoId: string;
    itemId: string;
    action: "RECEBIDA" | "PARCIAL" | "PROBLEMA";
    quemRecebeu: string;
    quantidadeRecebida?: number;
    observacao?: string;
    condicao?: CondicaoPeca;
  };

  const today = new Date().toISOString();
  let update: Partial<RequisicaoItem>;

  if (body.action === "RECEBIDA") {
    update = {
      statusEntrega: "RECEBIDA" as ItemEntregaStatus,
      quantidadeRecebida: body.quantidadeRecebida,
      dataRecebimento: today,
      quemRecebeu: body.quemRecebeu,
      condicaoPeca: "OK",
    };
  } else if (body.action === "PARCIAL") {
    update = {
      statusEntrega: "RECEBIDA_PARCIALMENTE" as ItemEntregaStatus,
      quantidadeRecebida: body.quantidadeRecebida ?? 0,
      dataRecebimento: today,
      quemRecebeu: body.quemRecebeu,
      observacaoRecebimento: body.observacao,
    };
  } else {
    update = {
      statusEntrega: "COM_PROBLEMA" as ItemEntregaStatus,
      dataRecebimento: today,
      quemRecebeu: body.quemRecebeu,
      condicaoPeca: body.condicao ?? "DANIFICADA",
      observacaoRecebimento: body.observacao,
    };
  }

  const ok = updateItemEntrega(body.requisicaoId, body.itemId, update);
  if (!ok) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
