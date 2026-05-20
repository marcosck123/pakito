import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getCotacoes } from "@/lib/db/cotacoes-repo";
import { StatusBadge } from "@/components/ui/status-badge";
import { cotacaoStatusLabel, cotacaoStatusColor, urgenciaLabel, urgenciaColor } from "@/lib/utils/status";
import { formatDate } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";

export default async function CotacoesPage() {
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);
  const cotacoes = await getCotacoes();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cotações</h1>
          <p className="text-sm text-gray-500">{cotacoes.length} cotações</p>
        </div>
        {perms.criarCotacao && (
          <Link href="/cotacoes/nova" className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Nova cotação
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Código / Título</th>
              <th className="px-4 py-3 font-medium">Solicitante</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Urgência</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Fornecedores</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cotacoes.map((c) => {
              const orcsCadastrados = c.fornecedores.filter((f) => f.status === "ORCAMENTO_CADASTRADO").length;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-400">{c.codigo}</p>
                    <p className="font-medium text-gray-900">{c.titulo}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.solicitante?.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{c.setor}</td>
                  <td className="px-4 py-3"><StatusBadge label={urgenciaLabel[c.urgencia]} colorClass={urgenciaColor[c.urgencia]} /></td>
                  <td className="px-4 py-3"><StatusBadge label={cotacaoStatusLabel[c.status]} colorClass={cotacaoStatusColor[c.status]} /></td>
                  <td className="px-4 py-3 text-gray-600">{orcsCadastrados}/{c.fornecedores.length} respostas</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.criadoEm)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/cotacoes/${c.id}`} className="text-xs text-blue-600 hover:underline">Ver</Link>
                      {perms.compararOrcamento && orcsCadastrados > 0 && (
                        <Link href={`/comparador?cotacao=${c.id}`} className="text-xs text-purple-600 hover:underline">Comparar</Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
