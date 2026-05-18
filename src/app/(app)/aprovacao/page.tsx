import Link from "next/link";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { mockRequisicoes } from "@/lib/mock-data/requisicoes";
import { mockOrcamentos } from "@/lib/mock-data/orcamentos";
import { StatusBadge } from "@/components/ui/status-badge";
import { requisicaoStatusLabel, requisicaoStatusColor, urgenciaLabel, urgenciaColor } from "@/lib/utils/status";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";

export default async function AprovacaoPage() {
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  const pendentes = mockRequisicoes.filter((r) => r.status === "AGUARDANDO_APROVACAO");
  const historico = mockRequisicoes.filter((r) => ["APROVADA","REPROVADA","SOLICITAR_AJUSTE"].includes(r.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Aprovação de requisições</h1>
        <p className="text-sm text-gray-500">{pendentes.length} aguardando aprovação</p>
      </div>

      {!perms.aprovarRequisicao && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">Seu perfil não tem permissão para aprovar requisições. Apenas <strong>ADMIN</strong> e <strong>APROVADOR</strong> podem aprovar.</p>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Pendentes de aprovação</h2>
        {pendentes.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-300" />
            <p className="mt-2 text-sm text-gray-400">Nenhuma requisição aguardando aprovação</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendentes.map((r) => {
              const orcamentos = mockOrcamentos.filter((o) => o.cotacaoId === r.cotacaoId);
              return (
                <div key={r.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-gray-600">{r.numero}</span>
                      <StatusBadge label={urgenciaLabel[r.urgencia]} colorClass={urgenciaColor[r.urgencia]} />
                      <span className="text-sm text-gray-600">{r.solicitante?.nome} · {r.setor}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(r.valorTotal)}</p>
                      <p className="text-xs text-gray-400">{formatDate(r.criadoEm)}</p>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-gray-500">Itens solicitados:</p>
                    <div className="space-y-1">
                      {r.itens.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-gray-800">{item.peca?.nome}</span>
                            <span className="ml-2 text-gray-400">{item.quantidade}x · {item.marca ?? "—"} · {item.fornecedor?.nome}</span>
                          </div>
                          <span className="font-semibold text-gray-700">{formatCurrency(item.valorTotal)}</span>
                        </div>
                      ))}
                    </div>
                    {r.justificativa && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-600">Justificativa:</p>
                        <p className="text-sm text-blue-800 mt-0.5">{r.justificativa}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4">
                    <Link href={`/requisicoes/${r.id}`} className="text-xs text-blue-600 hover:underline">Ver requisição completa</Link>
                    {r.cotacaoId && (
                      <Link href={`/comparador?cotacao=${r.cotacaoId}`} className="text-xs text-purple-600 hover:underline">Ver comparativo de orçamentos</Link>
                    )}
                  </div>

                  {perms.aprovarRequisicao && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="mb-2 text-xs font-medium text-gray-500">Decisão:</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Aprovar
                        </button>
                        <button className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                          <XCircle className="h-4 w-4" />
                          Reprovar
                        </button>
                        <button className="flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100">
                          <RefreshCw className="h-4 w-4" />
                          Solicitar ajuste
                        </button>
                      </div>
                      <div className="mt-2">
                        <textarea placeholder="Comentário (obrigatório para reprovar ou solicitar ajuste)..." rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {historico.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Histórico de aprovações</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Número</th>
                  <th className="px-4 py-2 font-medium">Solicitante</th>
                  <th className="px-4 py-2 font-medium">Valor</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Aprovador</th>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Comentário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historico.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/requisicoes/${r.id}`} className="font-mono text-xs text-blue-600 hover:underline">{r.numero}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{r.solicitante?.nome}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{formatCurrency(r.valorTotal)}</td>
                    <td className="px-4 py-2.5"><StatusBadge label={requisicaoStatusLabel[r.status]} colorClass={requisicaoStatusColor[r.status]} /></td>
                    <td className="px-4 py-2.5 text-gray-600">{r.aprovador?.nome ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{r.dataAprovacao ? formatDate(r.dataAprovacao) : "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 italic">{r.comentarioAprovador ?? "—"}</td>
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