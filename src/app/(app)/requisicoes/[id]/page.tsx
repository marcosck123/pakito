import Link from "next/link";
import { ArrowLeft, Paperclip, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { mockRequisicoes } from "@/lib/mock-data/requisicoes";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  requisicaoStatusLabel, requisicaoStatusColor, urgenciaLabel, urgenciaColor,
  itemEntregaStatusLabel, itemEntregaStatusColor,
} from "@/lib/utils/status";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";

interface Props { params: Promise<{ id: string }>; }

export default async function RequisicaoDetalhePage({ params }: Props) {
  const { id } = await params;
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  const req = mockRequisicoes.find((r) => r.id === id);
  if (!req) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/requisicoes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Requisições
        </Link>
        <div className="flex gap-2">
          {perms.aprovarRequisicao && req.status === "AGUARDANDO_APROVACAO" && (
            <Link href={`/aprovacao?req=${req.id}`} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">Ir para aprovação</Link>
          )}
          {perms.fecharPedido && req.status === "APROVADA" && (
            <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Fechar pedido</button>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-bold text-gray-500">{req.numero}</span>
          <StatusBadge label={requisicaoStatusLabel[req.status]} colorClass={requisicaoStatusColor[req.status]} />
          <StatusBadge label={urgenciaLabel[req.urgencia]} colorClass={urgenciaColor[req.urgencia]} />
        </div>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Requisição de compra</h1>
        <p className="text-sm text-gray-500">{req.solicitante?.nome} · {req.setor} · {formatDate(req.criadoEm)}</p>
        {req.justificativa && <p className="mt-1 text-sm text-gray-700 italic">{req.justificativa}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Resumo</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Cotação de origem</dt>
              <dd>{req.cotacao && <Link href={`/cotacoes/${req.cotacaoId}`} className="text-blue-600 hover:underline">{req.cotacao.codigo}</Link>}</dd>
            </div>
            <div className="flex justify-between"><dt className="text-gray-500">Valor total</dt><dd className="font-bold text-gray-900">{formatCurrency(req.valorTotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Itens</dt><dd className="text-gray-700">{req.itens.length}</dd></div>
            {req.formaPagamento && <div className="flex justify-between"><dt className="text-gray-500">Pagamento</dt><dd className="text-gray-700">{req.formaPagamento}</dd></div>}
            {req.previsaoEntregaGeral && <div className="flex justify-between"><dt className="text-gray-500">Prev. entrega</dt><dd className="text-gray-700">{formatDate(req.previsaoEntregaGeral)}</dd></div>}
          </dl>
          {req.aprovador && (
            <div className="border-t border-gray-100 pt-3 space-y-1">
              <p className="text-xs font-medium text-gray-500">Aprovação</p>
              <p className="text-sm text-gray-700">{req.aprovador.nome}</p>
              {req.dataAprovacao && <p className="text-xs text-gray-400">{formatDateTime(req.dataAprovacao)}</p>}
              {req.comentarioAprovador && <p className="text-sm text-gray-600 italic">{req.comentarioAprovador}</p>}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white lg:col-span-2">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Itens da requisição</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Peça</th>
                  <th className="px-4 py-2 font-medium">Fornecedor</th>
                  <th className="px-4 py-2 font-medium">Marca</th>
                  <th className="px-4 py-2 font-medium">Qtd</th>
                  <th className="px-4 py-2 font-medium">Unit.</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  <th className="px-4 py-2 font-medium">Entrega</th>
                  <th className="px-4 py-2 font-medium">Rec.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {req.itens.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900">{item.peca?.nome}</p>
                      {item.justificativa && <p className="text-xs text-gray-400 italic">{item.justificativa}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{item.fornecedor?.nome}</td>
                    <td className="px-4 py-2.5 text-gray-600">{item.marca ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{item.quantidade}</td>
                    <td className="px-4 py-2.5 text-gray-700">{formatCurrency(item.valorUnitario)}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{formatCurrency(item.valorTotal)}</td>
                    <td className="px-4 py-2.5"><StatusBadge label={itemEntregaStatusLabel[item.statusEntrega]} colorClass={itemEntregaStatusColor[item.statusEntrega]} /></td>
                    <td className="px-4 py-2.5 text-gray-600">{item.quantidadeRecebida}/{item.quantidade}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={5} className="px-4 py-2.5 text-right text-sm text-gray-500">Total da requisição:</td>
                  <td className="px-4 py-2.5 font-bold text-gray-900">{formatCurrency(req.valorTotal)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {req.historico.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3"><h2 className="text-sm font-semibold text-gray-800">Histórico</h2></div>
          <div className="divide-y divide-gray-50">
            {req.historico.map((h) => (
              <div key={h.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5">
                  {h.statusNovo === "AGUARDANDO_APROVACAO" && <Clock className="h-4 w-4 text-yellow-500" />}
                  {h.statusNovo === "APROVADA" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {h.statusNovo === "REPROVADA" && <XCircle className="h-4 w-4 text-red-500" />}
                  {h.statusNovo === "PEDIDO_FECHADO" && <CheckCircle className="h-4 w-4 text-blue-500" />}
                  {!["AGUARDANDO_APROVACAO","APROVADA","REPROVADA","PEDIDO_FECHADO"].includes(h.statusNovo ?? "") && <AlertCircle className="h-4 w-4 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{h.acao}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(h.data)}</p>
                  </div>
                  <p className="text-xs text-gray-500">{h.usuario?.nome}</p>
                  {h.comentario && <p className="mt-0.5 text-sm text-gray-600 italic">{h.comentario}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {req.anexos.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3"><h2 className="text-sm font-semibold text-gray-800">Anexos ({req.anexos.length})</h2></div>
          <div className="divide-y divide-gray-50">
            {req.anexos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Paperclip className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{a.nome}</p>
                  <p className="text-xs text-gray-400">{a.tipo} · {formatDate(a.enviadoEm)}</p>
                </div>
                <button className="text-xs text-blue-600 hover:underline">Ver</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}