import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { mockRequisicoes } from "@/lib/mock-data/requisicoes";
import { StatusBadge } from "@/components/ui/status-badge";
import { itemEntregaStatusLabel, itemEntregaStatusColor, urgenciaLabel, urgenciaColor } from "@/lib/utils/status";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";

export default async function RecebimentoPage() {
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  const itensEmEntrega = mockRequisicoes
    .filter((r) => ["PEDIDO_FECHADO","AGUARDANDO_ENTREGA","PARCIALMENTE_RECEBIDA"].includes(r.status))
    .flatMap((r) => r.itens.filter((i) => ["AGUARDANDO_ENTREGA","COMPRADA","RECEBIDA_PARCIALMENTE"].includes(i.statusEntrega)).map((item) => ({ ...item, requisicao: r })));

  const itensRecebidos = mockRequisicoes
    .flatMap((r) => r.itens.filter((i) => i.statusEntrega === "RECEBIDA").map((item) => ({ ...item, requisicao: r })));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Controle de recebimento</h1>
        <p className="text-sm text-gray-500">{itensEmEntrega.length} itens aguardando recebimento</p>
      </div>

      {!perms.marcarPecaRecebida && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">Seu perfil tem acesso somente leitura nesta tela.</p>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Aguardando recebimento</h2>
        {itensEmEntrega.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-300" />
            <p className="mt-2 text-sm text-gray-400">Nenhuma peça aguardando recebimento</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Requisição</th>
                  <th className="px-4 py-3 font-medium">Peça</th>
                  <th className="px-4 py-3 font-medium">Fornecedor</th>
                  <th className="px-4 py-3 font-medium">Qtd comprada</th>
                  <th className="px-4 py-3 font-medium">Qtd recebida</th>
                  <th className="px-4 py-3 font-medium">Prev. entrega</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {perms.marcarPecaRecebida && <th className="px-4 py-3 font-medium">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itensEmEntrega.map((item) => (
                  <tr key={`${item.id}-${item.requisicao.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/requisicoes/${item.requisicao.id}`} className="font-mono text-xs text-blue-600 hover:underline">{item.requisicao.numero}</Link>
                      <div className="flex gap-1 mt-0.5"><StatusBadge label={urgenciaLabel[item.requisicao.urgencia]} colorClass={urgenciaColor[item.requisicao.urgencia]} /></div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.peca?.nome}</p>
                      {item.marca && <p className="text-xs text-gray-400">{item.marca}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.fornecedor?.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{item.quantidade}</td>
                    <td className="px-4 py-3">
                      <span className={item.quantidadeRecebida > 0 ? "text-orange-600 font-medium" : "text-gray-400"}>{item.quantidadeRecebida}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.previsaoEntrega ? formatDate(item.previsaoEntrega) : "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(item.valorTotal)}</td>
                    <td className="px-4 py-3"><StatusBadge label={itemEntregaStatusLabel[item.statusEntrega]} colorClass={itemEntregaStatusColor[item.statusEntrega]} /></td>
                    {perms.marcarPecaRecebida && (
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <button className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100">Marcar recebida</button>
                          <button className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-700 hover:bg-orange-100">Parcial</button>
                          <button className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100">Problema</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {itensRecebidos.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Recebidos recentemente ({itensRecebidos.length})</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Requisição</th>
                  <th className="px-4 py-3 font-medium">Peça</th>
                  <th className="px-4 py-3 font-medium">Fornecedor</th>
                  <th className="px-4 py-3 font-medium">Qtd recebida</th>
                  <th className="px-4 py-3 font-medium">Data recebimento</th>
                  <th className="px-4 py-3 font-medium">Quem recebeu</th>
                  <th className="px-4 py-3 font-medium">Condição</th>
                  <th className="px-4 py-3 font-medium">Obs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itensRecebidos.map((item) => (
                  <tr key={`${item.id}-rec`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/requisicoes/${item.requisicao.id}`} className="font-mono text-xs text-blue-600 hover:underline">{item.requisicao.numero}</Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.peca?.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{item.fornecedor?.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{item.quantidadeRecebida}</td>
                    <td className="px-4 py-3 text-gray-600">{item.dataRecebimento ? formatDate(item.dataRecebimento) : "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.quemRecebeu ?? "—"}</td>
                    <td className="px-4 py-3">{item.condicaoPeca ? <span className={`text-xs font-medium ${item.condicaoPeca === "OK" ? "text-green-600" : "text-red-600"}`}>{item.condicaoPeca}</span> : "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.observacaoRecebimento ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}