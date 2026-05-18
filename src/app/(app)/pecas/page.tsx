import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { mockPecas } from "@/lib/mock-data/pecas";
import { StatusBadge } from "@/components/ui/status-badge";
import { pecaStatusLabel, pecaStatusColor } from "@/lib/utils/status";
import { canDo } from "@/lib/security/permissions";

export default async function PecasPage() {
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Peças / Produtos</h1>
          <p className="text-sm text-gray-500">{mockPecas.length} cadastradas</p>
        </div>
        {perms.cadastrarPeca && (
          <Link href="/pecas/nova" className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Nova peça
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Cód. interno</th>
              <th className="px-4 py-3 font-medium">Cód. original</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Marca pref.</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockPecas.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.nome}</p>
                  {p.aplicacao && <p className="text-xs text-gray-400">{p.aplicacao}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.codigoInterno ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.codigoOriginal ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.categoria ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.marcaPreferencial ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.unidade}</td>
                <td className="px-4 py-3"><StatusBadge label={pecaStatusLabel[p.status]} colorClass={pecaStatusColor[p.status]} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    {perms.cadastrarPeca && <button className="text-xs text-gray-500 hover:text-gray-700">Editar</button>}
                    {perms.criarCotacao && <Link href={`/cotacoes/nova?peca=${p.id}`} className="text-xs text-blue-600 hover:underline">Cotar</Link>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}