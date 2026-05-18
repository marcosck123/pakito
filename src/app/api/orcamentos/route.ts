import { NextResponse } from "next/server";
import { addOrcamento, updateOrcamento } from "@/lib/mock-data/orcamentos";
import { updateFornecedorCotacaoStatus, mockCotacoes } from "@/lib/mock-data/cotacoes";
import { mockFornecedores } from "@/lib/mock-data/fornecedores";
import type { OrcamentoItem, OrcamentoStatus } from "@/types";

function buildItens(rawItens: any[], cotacaoId: string): OrcamentoItem[] {
  const cotacao = mockCotacoes.find((c) => c.id === cotacaoId);
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
  const body = await request.json();
  const itens = buildItens(body.itens ?? [], body.cotacaoId);
  const status: OrcamentoStatus = body.action === "confirmar" ? "PENDENTE_CONFERENCIA" : "EM_PREENCHIMENTO";
  const fornecedor = mockFornecedores.find((f) => f.id === body.fornecedorId);

  const result = addOrcamento({
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

  if (body.action === "confirmar") {
    updateFornecedorCotacaoStatus(body.cotacaoId, body.fornecedorCotacaoId, "ORCAMENTO_CADASTRADO");
  }

  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const itens = buildItens(body.itens ?? [], body.cotacaoId);
  const status: OrcamentoStatus = body.action === "confirmar" ? "PENDENTE_CONFERENCIA" : "EM_PREENCHIMENTO";
  const fornecedor = mockFornecedores.find((f) => f.id === body.fornecedorId);

  const result = updateOrcamento(body.id, {
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

  if (body.action === "confirmar") {
    updateFornecedorCotacaoStatus(body.cotacaoId, body.fornecedorCotacaoId, "ORCAMENTO_CADASTRADO");
  }

  return NextResponse.json(result);
}
