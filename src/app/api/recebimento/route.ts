import { NextResponse } from "next/server";
import { updateItemEntrega } from "@/lib/mock-data/requisicoes";
import type { ItemEntregaStatus, CondicaoPeca } from "@/types";

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

  let statusEntrega: ItemEntregaStatus;
  let update: Record<string, unknown>;

  if (body.action === "RECEBIDA") {
    statusEntrega = "RECEBIDA";
    update = {
      statusEntrega,
      quantidadeRecebida: body.quantidadeRecebida,
      dataRecebimento: today,
      quemRecebeu: body.quemRecebeu,
      condicaoPeca: "OK" as CondicaoPeca,
    };
  } else if (body.action === "PARCIAL") {
    statusEntrega = "RECEBIDA_PARCIALMENTE";
    update = {
      statusEntrega,
      quantidadeRecebida: body.quantidadeRecebida ?? 0,
      dataRecebimento: today,
      quemRecebeu: body.quemRecebeu,
      observacaoRecebimento: body.observacao,
    };
  } else {
    statusEntrega = "COM_PROBLEMA";
    update = {
      statusEntrega,
      dataRecebimento: today,
      quemRecebeu: body.quemRecebeu,
      condicaoPeca: body.condicao ?? "DANIFICADA",
      observacaoRecebimento: body.observacao,
    };
  }

  const ok = updateItemEntrega(body.requisicaoId, body.itemId, update as never);
  if (!ok) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
