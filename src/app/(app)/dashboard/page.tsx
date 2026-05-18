import Link from "next/link";
import {
  FileText,
  ClipboardList,
  CheckSquare,
  Truck,
  AlertCircle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { mockRequisicoes } from "@/lib/mock-data/requisicoes";
import {
  cotacaoStatusLabel,
  cotacaoStatusColor,
  requisicaoStatusLabel,
  requisicaoStatusColor,
  urgenciaLabel,
  urgenciaColor,
  itemEntregaStatusLabel,
  itemEntregaStatusColor,
  fornecedorCotacaoStatusColor,
  fornecedorCotacaoStatusLabel,
} from "@/lib/utils/status";
import { formatCurrency, formatDate, daysSince } from "@/lib/utils/format";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) return null;

  const cotacoesAbertas = mockCotacoes.filter(
    (c) => !["FINALIZADA", "CANCELADA", "REQUISICAO_GERADA"].includes(c.status)
  );
  const aguardandoRespostas = mockCotacoes.filter((c) =>
    ["ENVIADA_AOS_FORNECEDORES", "AGUARDANDO_RESPOSTAS"].includes(c.status)
  );
  const reqAguardandoAprovacao = mockRequisicoes.filter(
    (r) => r.status === "AGUARDANDO_APROVACAO"
  );
  const reqAprovadas = mockRequisicoes.filter((r) => r.status === "APROVADA");
  const pedidosFechados = mockRequisicoes.filter((r) => r.status === "PEDIDO_FECHADO");

  const allItems = mockRequisicoes.flatMap((r) => r.itens);
  const pecasAguardando = allItems.filter((i) =>
    ["AGUARDANDO_ENTREGA", "COMPRADA"].includes(i.statusEntrega)
  );
  const pecasParciais = allItems.filter((i) => i.statusEntrega === "RECEBIDA_PARCIALMENTE");
  const pecasRecebidas = allItems.filter((i) => i.statusEntrega === "RECEBIDA");

  const fornsSemResposta = mockCotacoes.flatMap((c) =>
    c.fornecedores.filter((f) => f.status === "AGUARDANDO_RESPOSTA" || f.status === "MENSAGEM_ENVIADA")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Bem-vindo, {user.nome}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Cotações abertas" value={cotacoesAbertas.length} icon={FileText} colorClass="text-blue-600 bg-blue-50" />
        <StatCard title="Aguardando respostas" value={aguardandoRespostas.length} icon={Clock} colorClass="text-yellow-600 bg-yellow-50" />
        <StatCard title="Req. aguardando aprovação" value={reqAguardandoAprovacao.length} icon={AlertCircle} colorClass="text-orange-600 bg-orange-50" />
        <StatCard title="Pedidos fechados" value={pedidosFechados.length} icon={ShoppingCart} colorClass="text-green-600 bg-green-50" />
        <StatCard title="Peças aguardando entrega" value={pecasAguardando.length} icon={Truck} colorClass="text-purple-600 bg-purple-50" />
        <StatCard title="Recebimento parcial" value={pecasParciais.length} icon={Package} colorClass="text-amber-600 bg-amber-50" />
        <StatCard title="Peças recebidas" value={pecasRecebidas.length} icon={CheckSquare} colorClass="text-teal-600 bg-teal-50" />
        <StatCard title="Req. aprovadas" value={reqAprovadas.length} icon={DollarSign} colorClass="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Aguardando aprovação</h2>
            <Link href="/aprovacao" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
          </div>
          {reqAguardandoAprovacao.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma pendente</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reqAguardandoAprovacao.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.numero}</p>
                    <p className="text-xs text-gray-500">{r.solicitante?.nome} · {r.setor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={urgenciaLabel[r.urgencia]} colorClass={urgenciaColor[r.urgencia]} />
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(r.valorTotal)}</p>
                    <Link href={`/requisicoes/${r.id}`} className="text-xs text-blue-600 hover:underline">Ver</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Peças aguardando entrega</h2>
            <Link href="/recebimento" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
          </div>
          {pecasAguardando.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma pendente</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pecasAguardando.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.peca?.nome}</p>
                    <p className="text-xs text-gray-500">{item.fornecedor?.nome} · Qtd: {item.quantidade}</p>
                  </div>
                  <StatusBadge label={itemEntregaStatusLabel[item.statusEntrega]} colorClass={itemEntregaStatusColor[item.statusEntrega]} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Fornecedores sem resposta</h2>
            <Link href="/cotacoes" className="text-xs text-blue-600 hover:underline">Ver cotações</Link>
          </div>
          {fornsSemResposta.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Nenhum pendente</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">Fornecedor</th>
                    <th className="px-4 py-2 font-medium">Cotação</th>
                    <th className="px-4 py-2 font-medium">Enviado em</th>
                    <th className="px-4 py-2 font-medium">Aguardando</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {fornsSemResposta.map((fc) => {
                    const cotacao = mockCotacoes.find((c) => c.id === fc.cotacaoId);
                    return (
                      <tr key={fc.id}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{fc.fornecedor?.nome}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          <Link href={`/cotacoes/${fc.cotacaoId}`} className="text-blue-600 hover:underline">{cotacao?.codigo}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{fc.mensagemEnviadaEm ? formatDate(fc.mensagemEnviadaEm) : "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{fc.mensagemEnviadaEm ? `${daysSince(fc.mensagemEnviadaEm)} dias` : "—"}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge label={fornecedorCotacaoStatusLabel[fc.status]} colorClass={fornecedorCotacaoStatusColor[fc.status]} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}