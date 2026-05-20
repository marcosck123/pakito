import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getFornecedores } from "@/lib/db/fornecedores-repo";
import { getCotacoes } from "@/lib/db/cotacoes-repo";
import { StatusBadge } from "@/components/ui/status-badge";
import { fornecedorStatusLabel, fornecedorStatusColor } from "@/lib/utils/status";
import { formatDate } from "@/lib/utils/format";
import { canDo } from "@/lib/security/permissions";

export default async function FornecedoresPage() {
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  const [fornecedores, cotacoes] = await Promise.all([getFornecedores(), getCotacoes()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-sm text-gray-500">{fornecedores.length} cadastrados</p>
        </div>
        {perms.cadastrarFornecedor && (
          <Link href="/fornecedores/novo" className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Novo fornecedor
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Nome / Vendedor</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Cidade</th>
              <th className="px-4 py-3 font-medium">Categorias</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Última cotação</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {fornecedores.map((f) => {
              const ultimaCotacao = cotacoes
                .filter((c) => c.fornecedores.some((fc) => fc.fornecedorId === f.id))
                .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))[0];

              return (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{f.nome}</p>
                    {f.nomeVendedor && <p className="text-xs text-gray-400">{f.nomeVendedor}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {f.telefone}
                    {f.whatsapp && (
                      <a href={`https://wa.me/${f.whatsapp}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-xs text-green-600 hover:underline">WA</a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.cidade ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {f.categorias.slice(0, 3).map((cat) => (
                        <span key={cat} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{cat}</span>
                      ))}
                      {f.categorias.length > 3 && <span className="text-xs text-gray-400">+{f.categorias.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={fornecedorStatusLabel[f.status]} colorClass={fornecedorStatusColor[f.status]} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ultimaCotacao ? formatDate(ultimaCotacao.criadoEm) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/fornecedores/${f.id}`} className="text-xs text-blue-600 hover:underline">Ver</Link>
                      {perms.editarFornecedor && (
                        <Link href={`/fornecedores/${f.id}/editar`} className="text-xs text-gray-500 hover:text-gray-700">Editar</Link>
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
