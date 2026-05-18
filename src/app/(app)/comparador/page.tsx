import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { mockOrcamentos } from "@/lib/mock-data/orcamentos";
import { formatCurrency } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";

interface Props { searchParams: Promise<{ cotacao?: string }>; }

export default async function ComparadorPage({ searchParams }: Props) {
  const { cotacao: cotacaoId } = await searchParams;
  const user = await getSession();
  if (!user) return null;

  const cotacoesComOrcamentos = mockCotacoes.filter((c) => mockOrcamentos.some((o) => o.cotacaoId === c.id));
  const cotacao = cotacaoId ? mockCotacoes.find((c) => c.id === cotacaoId) : cotacoesComOrcamentos[0];
  const orcamentos = cotacao ? mockOrcamentos.filter((o) => o.cotacaoId === cotacao.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/cotacoes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Cotações
        </Link>
        {cotacao && (
          <Link href={`/requisicoes/nova?cotacao=${cotacao.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Gerar requisição</Link>
        )}
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Comparador de orçamentos</h1>
        {cotacao && <p className="text-sm text-gray-500">{cotacao.codigo} — {cotacao.titulo}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {cotacoesComOrcamentos.map((c) => (
          <Link key={c.id} href={`/comparador?cotacao=${c.id}`} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            cotacao?.id === c.id ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}>{c.codigo}</Link>
        ))}
      </div>

      {!cotacao && (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-gray-400">Selecione uma cotação para comparar os orçamentos</p>
        </div>
      )}

      {cotacao && orcamentos.length > 0 && (
        <>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Comparação por peça</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-medium">Peça</th>
                    <th className="px-4 py-2.5 font-medium">Qtd</th>
                    {orcamentos.map((o) => <th key={o.id} className="px-4 py-2.5 font-medium">{o.fornecedor?.nome}</th>)}
                    <th className="px-4 py-2.5 font-medium bg-green-50 text-green-700">Menor preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cotacao.itens.map((cotItem) => {
                    const valoresPorOrcamento = orcamentos.map((o) => ({ orcamento: o, item: o.itens.find((i) => i.cotacaoItemId === cotItem.id) }));
                    const valoresValidos = valoresPorOrcamento.filter((v) => v.item && v.item.disponivel).map((v) => v.item!.valorTotal);
                    const menorValor = valoresValidos.length > 0 ? Math.min(...valoresValidos) : null;
                    return (
                      <tr key={cotItem.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900">{cotItem.peca?.nome}</p>
                          {cotItem.marcaDesejada && <p className="text-xs text-gray-400">Desej.: {cotItem.marcaDesejada}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{cotItem.quantidade}</td>
                        {valoresPorOrcamento.map(({ orcamento, item }) => (
                          <td key={orcamento.id} className={`px-4 py-2.5 ${item && item.disponivel && item.valorTotal === menorValor ? "bg-green-50 font-semibold text-green-800" : "text-gray-700"}`}>
                            {item ? (
                              <div>
                                <p className={item.disponivel ? "" : "line-through text-gray-400"}>{formatCurrency(item.valorTotal)}</p>
                                {item.marcaCotada && <p className="text-xs text-gray-400">{item.marcaCotada}</p>}
                                {!item.disponivel && <p className="text-xs text-red-500">Indisponível</p>}
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 bg-green-50 font-bold text-green-800">{menorValor !== null ? formatCurrency(menorValor) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Resumo por fornecedor</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-medium">Fornecedor</th>
                    <th className="px-4 py-2.5 font-medium">Total itens</th>
                    <th className="px-4 py-2.5 font-medium">Frete</th>
                    <th className="px-4 py-2.5 font-medium font-bold">Total final</th>
                    <th className="px-4 py-2.5 font-medium">Prazo</th>
                    <th className="px-4 py-2.5 font-medium">Pagamento</th>
                    <th className="px-4 py-2.5 font-medium">Validade</th>
                    <th className="px-4 py-2.5 font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orcamentos.map((o) => {
                    const totalItens = o.itens.reduce((s, i) => s + i.valorTotal, 0);
                    const totalFinal = totalItens + o.valorFrete;
                    const menorTotal = Math.min(...orcamentos.map((oo) => oo.itens.reduce((s, i) => s + i.valorTotal, 0) + oo.valorFrete));
                    const isMelhor = totalFinal === menorTotal;
                    return (
                      <tr key={o.id} className={isMelhor ? "bg-green-50" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{o.fornecedor?.nome}</p>
                          {isMelhor && <span className="text-xs text-green-600 font-medium">✓ Menor preço total</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatCurrency(totalItens)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatCurrency(o.valorFrete)}</td>
                        <td className={`px-4 py-3 font-bold ${isMelhor ? "text-green-800" : "text-gray-900"}`}>{formatCurrency(totalFinal)}</td>
                        <td className="px-4 py-3 text-gray-600">{o.prazoEntrega ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{o.formaPagamento ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{o.validadePropostaDias ? `${o.validadePropostaDias} dias` : "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{o.observacoes ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <strong>Atenção:</strong> O sistema sugere o menor preço, mas a decisão final é sua. Considere prazo de entrega, disponibilidade de estoque, confiabilidade do fornecedor e outros fatores antes de gerar a requisição.
            </p>
          </div>
        </>
      )}
    </div>
  );
}