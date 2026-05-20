import { NextResponse } from "next/server";
import { createOrcamento, updateOrcamento } from "@/lib/db/orcamentos-repo";
import { getCotacao } from "@/lib/db/cotacoes-repo";
import { getFornecedor } from "@/lib/db/fornecedores-repo";
import { updateCotacao } from "@/lib/db/cotacoes-repo";
import { logAudit } from "@/lib/db/audit-repo";
import { requireSession } from "@/lib/auth/require-session";
import type { OrcamentoItem, OrcamentoStatus } from "@/types";

async function buildItens(rawItens: any[], cotacaoId: string): Promise<OrcamentoItem[]> {
  const cotacao = await getCotacao(cotacaoId);
  return rawItens.map((item, i) => {
    const cotacaoItem = cotacao?.itens.find((ci) => ci.id === item.cotacaoItemId);
    const qty = Number(item.quantidade) || 0;
    const unit = Number(item.valorUnitario) || 0;
    return {
      id: `oi-${Date.now()}-${i}`,
      cotacaoItemId: item.cotacaoItemId,
      peca: cotacaoItem?.peca,
      marcaCotada: item.marcaCotada || undefined,
      quantidade: qty,
      valorUnitario: unit,
      valorTotal: qty * unit,
      disponivel: Boolean(item.disponivel),
      observacao: item.observacao || undefined,
    };
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireSession(["ADMIN", "COMPRAS"]);
  if (error) return error;

  const body = await request.json();
  const itens = await buildItens(body.itens ?? [], body.cotacaoId);
  const status: OrcamentoStatus = body.action === "confirmar" ? "PENDENTE_CONFERENCIA" : "EM_PREENCHIMENTO";
  const fornecedor = await getFornecedor(body.fornecedorId).catch(() => undefined) ?? undefined;

  const result = await createOrcamento({
    cotacaoId: body.cotacaoId,
    fornecedorId: body.fornecedorId,
    fornecedor,
    dataOrcamento: body.dataOrcamento,
    validadePropostaDias: body.validadePropostaDias || undefined,
    prazoEntrega: body.prazoEntrega || undefined,
    valorFrete: Number(body.valorFrete) || 0,
    formaPagamento: body.formaPagamento || undefined,
    observacoes: body.observacoes || undefined,
    status,
    itens,
    anexos: [],
  });

  if (body.action === "confirmar" && body.cotacaoId && body.fornecedorCotacaoId) {
    const cotacao = await getCotacao(body.cotacaoId);
    if (cotacao) {
      const updatedFornecedores = cotacao.fornecedores.map((f) =>
        f.id === body.fornecedorCotacaoId
          ? { ...f, status: "ORCAMENTO_CADASTRADO" as const, respostaRecebidaEm: new Date().toISOString() }
          : f
      );
      await updateCotacao(body.cotacaoId, { fornecedores: updatedFornecedores });
    }
  }

  await logAudit("orcamento", result.id, "CREATE", user!.id);

  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const { user, error } = await requireSession(["ADMIN", "COMPRAS"]);
  if (error) return error;

  const body = await request.json();
  const itens = await buildItens(body.itens ?? [], body.cotacaoId);
  const status: OrcamentoStatus = body.action === "confirmar" ? "PENDENTE_CONFERENCIA" : "EM_PREENCHIMENTO";
  const fornecedor = await getFornecedor(body.fornecedorId).catch(() => undefined) ?? undefined;

  const result = await updateOrcamento(body.id, {
    fornecedor,
    dataOrcamento: body.dataOrcamento,
    validadePropostaDias: body.validadePropostaDias || undefined,
    prazoEntrega: body.prazoEntrega || undefined,
    valorFrete: Number(body.valorFrete) || 0,
    formaPagamento: body.formaPagamento || undefined,
    observacoes: body.observacoes || undefined,
    status,
    itens,
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "confirmar" && body.cotacaoId && body.fornecedorCotacaoId) {
    const cotacao = await getCotacao(body.cotacaoId);
    if (cotacao) {
      const updatedFornecedores = cotacao.fornecedores.map((f) =>
        f.id === body.fornecedorCotacaoId
          ? { ...f, status: "ORCAMENTO_CADASTRADO" as const, respostaRecebidaEm: new Date().toISOString() }
          : f
      );
      await updateCotacao(body.cotacaoId, { fornecedores: updatedFornecedores });
    }
  }

  await logAudit("orcamento", body.id, "UPDATE", user!.id);

  return NextResponse.json(result);
}
