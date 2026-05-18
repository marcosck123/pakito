import Link from "next/link";
import { Paperclip } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { mockOrcamentos } from "@/lib/mock-data/orcamentos";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { StatusBadge } from "@/components/ui/status-badge";
import { orcamentoStatusLabel, orcamentoStatusColor } from "@/lib/utils/status";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";

export default async function OrcamentosPage() {
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Orçamentos recebidos</h1>
        <p className="text-sm text-gray-500">{mockOrcamentos.length} orçamentos</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Cotação</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Prazo entrega</th>
              <th className="px-4 py-3 font-medium">Frete</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Anexos</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockOrcamentos.map((o) => {
              const cotacao = mockCotacoes.find((c) => c.id === o.cotacaoId);
              const total = o.itens.reduce((s, i) => s + i.valorTotal, 0) + o.valorFrete;
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.fornecedor?.nome}</td>
                  <td className="px-4 py-3">
                    <Link href={`/cotacoes/${o.cotacaoId}`} className="text-blue-600 hover:underline text-xs">{cotacao?.codigo}</Link>
                    <p className="text-xs text-gray-400">{cotacao?.titulo}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(o.dataOrcamento)}</td>
                  <td className="px-4 py-3 text-gray-600">{o.validadePropostaDias ? `${o.validadePropostaDias} dias` : "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{o.prazoEntrega ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(o.valorFrete)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(total)}</td>
                  <td className="px-4 py-3 text-gray-600">{o.formaPagamento ?? "—"}</td>
                  <td className="px-4 py-3">
                    {o.anexos.length > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-blue-600"><Paperclip className="h-3 w-3" />{o.anexos.length}</span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge label={orcamentoStatusLabel[o.status]} colorClass={orcamentoStatusColor[o.status]} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/cotacoes/${o.cotacaoId}`} className="text-xs text-blue-600 hover:underline">Ver cotação</Link>
                      {perms.compararOrcamento && <Link href={`/comparador?cotacao=${o.cotacaoId}`} className="text-xs text-purple-600 hover:underline">Comparar</Link>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Detalhe dos itens por orçamento</h2>
        {mockOrcamentos.map((o) => {
          const cotacao = mockCotacoes.find((c) => c.id === o.cotacaoId);
          return (
            <div key={o.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
                <div>
                  <span className="text-sm font-semibold text-gray-800">{o.fornecedor?.nome}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{cotacao?.codigo} — {cotacao?.titulo}</span>
                </div>
                <StatusBadge label={orcamentoStatusLabel[o.status]} colorClass={orcamentoStatusColor[o.status]} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">Peça</th>
                    <th className="px-4 py-2 font-medium">Marca</th>
                    <th className="px-4 py-2 font-medium">Qtd</th>
                    <th className="px-4 py-2 font-medium">Unit.</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                    <th className="px-4 py-2 font-medium">Disp.</th>
                    <th className="px-4 py-2 font-medium">Obs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {o.itens.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 font-medium text-gray-800">{item.peca?.nome}</td>
                      <td className="px-4 py-2 text-gray-600">{item.marcaCotada ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-600">{item.quantidade}</td>
                      <td className="px-4 py-2 text-gray-800">{formatCurrency(item.valorUnitario)}</td>
                      <td className="px-4 py-2 font-semibold text-gray-900">{formatCurrency(item.valorTotal)}</td>
                      <td className="px-4 py-2"><span className={`text-xs ${item.disponivel ? "text-green-600" : "text-red-500"}`}>{item.disponivel ? "Sim" : "Não"}</span></td>
                      <td className="px-4 py-2 text-xs text-gray-400">{item.observacao ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Frete: {formatCurrency(o.valorFrete)}</td>
                    <td className="px-4 py-2 font-bold text-gray-900">{formatCurrency(o.itens.reduce((s, i) => s + i.valorTotal, 0) + o.valorFrete)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}