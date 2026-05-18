import { getSession } from "@/lib/auth/session";
import { mockUsers } from "@/lib/mock-data/users";
import { StatusBadge } from "@/components/ui/status-badge";
import { roleLabels, roleColors } from "@/lib/security/roles";

export default async function ConfiguracoesPage() {
  const user = await getSession();
  if (!user) return null;
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerenciamento do sistema</p>
      </div>

      {!isAdmin && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">Apenas administradores podem alterar as configurações do sistema.</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Usuários do sistema</h2>
          {isAdmin && <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">+ Novo usuário</button>}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">E-mail</th>
              <th className="px-4 py-2 font-medium">Perfil</th>
              <th className="px-4 py-2 font-medium">Setor</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{u.nome}</td>
                <td className="px-4 py-2.5 text-gray-600">{u.email}</td>
                <td className="px-4 py-2.5"><StatusBadge label={roleLabels[u.role]} colorClass={roleColors[u.role]} /></td>
                <td className="px-4 py-2.5 text-gray-600">{u.setor}</td>
                <td className="px-4 py-2.5"><span className={`text-xs font-medium ${u.ativo ? "text-green-600" : "text-red-500"}`}>{u.ativo ? "Ativo" : "Inativo"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3"><h2 className="text-sm font-semibold text-gray-800">Tabela de permissões</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-2 font-medium">Ação</th>
                <th className="px-4 py-2 font-medium text-center">Admin</th>
                <th className="px-4 py-2 font-medium text-center">Compras</th>
                <th className="px-4 py-2 font-medium text-center">Solicitante</th>
                <th className="px-4 py-2 font-medium text-center">Aprovador</th>
                <th className="px-4 py-2 font-medium text-center">Recebimento</th>
                <th className="px-4 py-2 font-medium text-center">Visualizador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {([
                ["Ver dashboard", true, true, true, true, true, true],
                ["Cadastrar fornecedor", true, true, false, false, false, false],
                ["Editar fornecedor", true, true, false, false, false, false],
                ["Cadastrar peça", true, true, true, false, false, false],
                ["Criar cotação", true, true, true, false, false, false],
                ["Adicionar fornecedor na cotação", true, true, false, false, false, false],
                ["Adicionar orçamento", true, true, false, false, false, false],
                ["Comparar orçamento", true, true, true, true, false, true],
                ["Gerar requisição", true, true, true, false, false, false],
                ["Aprovar requisição", true, false, false, true, false, false],
                ["Reprovar requisição", true, false, false, true, false, false],
                ["Solicitar ajuste", true, false, false, true, false, false],
                ["Fechar pedido", true, true, false, false, false, false],
                ["Marcar peça recebida", true, true, false, false, true, false],
                ["Cancelar requisição", true, true, false, true, false, false],
              ] as const).map(([acao, ...perms]) => (
                <tr key={String(acao)} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{acao}</td>
                  {perms.map((p, i) => (
                    <td key={i} className="px-4 py-2 text-center">{p ? <span className="text-green-600">✓</span> : <span className="text-gray-200">—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-800">Credenciais de demonstração</h2>
        <p className="text-sm text-gray-600 mb-3">Todos os usuários usam senha: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">1234</code></p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 lg:grid-cols-3">
          {mockUsers.map((u) => (
            <div key={u.id} className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="font-medium text-gray-700">{u.email}</p>
              <p className="text-gray-400">{roleLabels[u.role]} · {u.setor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}