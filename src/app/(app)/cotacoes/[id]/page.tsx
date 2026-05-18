import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { mockOrcamentos } from "@/lib/mock-data/orcamentos";
import { findByCotacaoId } from "@/lib/mock-data/purchase-requisitions";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  cotacaoStatusLabel, cotacaoStatusColor, urgenciaLabel, urgenciaColor,
  fornecedorCotacaoStatusLabel, fornecedorCotacaoStatusColor,
  orcamentoStatusLabel, orcamentoStatusColor,
} from "@/lib/utils/status";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";
import { RequisicaoCompraSection } from "@/components/cotacao/requisicao-compra-section";
import type { PurchaseRequisitionItem } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ criar?: string }>;
}

export default async function CotacaoDetalhePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { criar } = await searchParams;
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  const cotacao = mockCotacoes.find((c) => c.id === id);
  if (!cotacao) notFound();

  const orcamentos = mockOrcamentos.filter((o) => o.cotacaoId === id);
  const purchaseRequisition = findByCotacaoId(id);

  const bestByItem = new Map<string, { valorUnitario: number; marca: string; fornecedor: string }>();
  for (const orc of orcamentos) {
    for (const oi of orc.itens) {
      if (!oi.disponivel) continue;
      const existing = bestByItem.get(oi.cotacaoItemId);
      if (!existing || oi.valorUnitario < existing.valorUnitario) {
        bestByItem.set(oi.cotacaoItemId, {
          valorUnitario: oi.valorUnitario,
          marca: oi.marcaCotada ?? "",
          fornecedor: orc.fornecedor?.nome ?? "",
        });
      }
    }
  }
  const suggestedItems: PurchaseRequisitionItem[] = cotacao.itens.map((ci, i) => {
    const best = bestByItem.get(ci.id);
    const parts = [
      best?.fornecedor ? best.fornecedor : null,
      best?.marca ? `Marca: ${best.marca}` : null,
    ].filter(Boolean);
    return {
      id: `s${i}`,
      peca: ci.peca?.nome ?? "",
      quantidade: ci.quantidade,
      valorUnitario: best?.valorUnitario ?? 0,
      observacao: parts.join(" · "),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/cotacoes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Cotações
        </Link>
        <div className="flex gap-2">
          {perms.compararOrcamento && orcamentos.length > 0 && (
            <Link href={`/comparador?cotacao=${id}`} className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700">Comparar orçamentos</Link>
          )}
          {perms.gerarRequisicao && (
            <Link href={`/cotacoes/${id}?criar=1#requisicao`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Gerar requisição</Link>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-gray-400">{cotacao.codigo}</span>
          <StatusBadge label={cotacaoStatusLabel[cotacao.status]} colorClass={cotacaoStatusColor[cotacao.status]} />
          <StatusBadge label={urgenciaLabel[cotacao.urgencia]} colorClass={urgenciaColor[cotacao.urgencia]} />
        </div>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{cotacao.titulo}</h1>
        <p className="text-sm text-gray-500">{cotacao.solicitante?.nome} · {cotacao.setor} · {formatDate(cotacao.criadoEm)}</p>
        {cotacao.dataLimiteResposta && <p className="text-sm text-gray-500">Prazo: {formatDate(cotacao.dataLimiteResposta)}</p>}
        {cotacao.observacoes && <p className="mt-1 text-sm text-gray-600 italic">{cotacao.observacoes}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Itens cotados ({cotacao.itens.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {cotacao.itens.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.peca?.nome}</p>
                    <p className="text-xs text-gray-400">Qtd: {item.quantidade} {item.peca?.unidade}{item.marcaDesejada && ` · Marca: ${item.marcaDesejada}`}</p>
                    {item.observacao && <p className="text-xs text-gray-400 italic">{item.observacao}</p>}
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${item.aceitaSimilar ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {item.aceitaSimilar ? "Similar OK" : "Só original"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Fornecedores ({cotacao.fornecedores.length})</h2>
            {perms.adicionarFornecedorCotacao && <button className="text-xs text-blue-600 hover:underline">+ Adicionar</button>}
          </div>
          <div className="divide-y divide-gray-50">
            {cotacao.fornecedores.map((fc) => (
              <div key={fc.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fc.fornecedor?.nome}</p>
                    <p className="text-xs text-gray-400">
                      {fc.mensagemEnviadaEm ? `Enviado: ${formatDate(fc.mensagemEnviadaEm)}` : "Não enviado"}
                      {fc.respostaRecebidaEm && ` · Resposta: ${formatDate(fc.respostaRecebidaEm)}`}
                    </p>
                  </div>
                  <StatusBadge label={fornecedorCotacaoStatusLabel[fc.status]} colorClass={fornecedorCotacaoStatusColor[fc.status]} />
                </div>
                {fc.fornecedor?.whatsapp && perms.adicionarOrcamento && (
                  <div className="mt-2 flex gap-2">
                    <a href={`https://wa.me/${fc.fornecedor.whatsapp}`} target="_blank" rel="noopener noreferrer" className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100">Abrir WA</a>
                    {fc.status !== "ORCAMENTO_CADASTRADO" && (
                      <button className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100">Cadastrar orçamento</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {perms.gerarRequisicao && (
        <div id="requisicao">
          <RequisicaoCompraSection
            cotacaoId={id}
            cotacaoCodigo={cotacao.codigo}
            userName={user.nome}
            initialRequisition={purchaseRequisition}
            autoOpen={criar === "1"}
            suggestedItems={suggestedItems}
          />
        </div>
      )}

      {orcamentos.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Orçamentos recebidos ({orcamentos.length})</h2>
            <Link href={`/comparador?cotacao=${id}`} className="text-xs text-purple-600 hover:underline">Ver comparador →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Fornecedor</th>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Frete</th>
                  <th className="px-4 py-2 font-medium">Total itens</th>
                  <th className="px-4 py-2 font-medium">Total final</th>
                  <th className="px-4 py-2 font-medium">Prazo</th>
                  <th className="px-4 py-2 font-medium">Pagamento</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orcamentos.map((o) => {
                  const totalItens = o.itens.reduce((s, i) => s + i.valorTotal, 0);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{o.fornecedor?.nome}</td>
                      <td className="px-4 py-2.5 text-gray-600">{formatDate(o.dataOrcamento)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{formatCurrency(o.valorFrete)}</td>
                      <td className="px-4 py-2.5 text-gray-800">{formatCurrency(totalItens)}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{formatCurrency(totalItens + o.valorFrete)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{o.prazoEntrega ?? "—"}</td>
                      <td className="px-4 py-2.5 text-gray-600">{o.formaPagamento ?? "—"}</td>
                      <td className="px-4 py-2.5"><StatusBadge label={orcamentoStatusLabel[o.status]} colorClass={orcamentoStatusColor[o.status]} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
