import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { mockRequisicoes } from "@/lib/mock-data/requisicoes";
import { StatusBadge } from "@/components/ui/status-badge";
import { requisicaoStatusLabel, requisicaoStatusColor, urgenciaLabel, urgenciaColor } from "@/lib/utils/status";
import { formatDate, formatCurrency } from "@/lib/utils/format";

export default async function RequisicoesPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Requisições de compra</h1>
        <p className="text-sm text-gray-500">{mockRequisicoes.length} requisições</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["Todas", "Aguardando aprovação", "Aprovadas", "Pedido fechado", "Aguardando entrega", "Parcialmente recebidas", "Finalizadas"]).map((label) => (
          <button key={label} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">{label}</button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Número</th>
              <th className="px-4 py-3 font-medium">Solicitante</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Urgência</th>
              <th className="px-4 py-3 font-medium">Valor total</th>
              <th className="px-4 py-3 font-medium">Itens</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criada em</th>
              <th className="px-4 py-3 font-medium">Aprovação</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockRequisicoes.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{r.numero}</td>
                <td className="px-4 py-3 text-gray-700">{r.solicitante?.nome}</td>
                <td className="px-4 py-3 text-gray-600">{r.setor}</td>
                <td className="px-4 py-3"><StatusBadge label={urgenciaLabel[r.urgencia]} colorClass={urgenciaColor[r.urgencia]} /></td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(r.valorTotal)}</td>
                <td className="px-4 py-3 text-gray-600">{r.itens.length} itens</td>
                <td className="px-4 py-3"><StatusBadge label={requisicaoStatusLabel[r.status]} colorClass={requisicaoStatusColor[r.status]} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(r.criadoEm)}</td>
                <td className="px-4 py-3 text-gray-500">{r.dataAprovacao ? formatDate(r.dataAprovacao) : "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/requisicoes/${r.id}`} className="text-xs text-blue-600 hover:underline">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}