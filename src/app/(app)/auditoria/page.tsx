import { getSession } from "@/lib/auth/session";
import { canDo } from "@/lib/security/permissions";
import { getAuditLogs } from "@/lib/db/audit-repo";
import { formatDate } from "@/lib/utils/format";

const acaoBadge: Record<string, string> = {
  CREATE:        "bg-green-100 text-green-700",
  UPDATE:        "bg-blue-100 text-blue-700",
  DELETE:        "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-purple-100 text-purple-700",
  APPROVE:       "bg-emerald-100 text-emerald-700",
  REJECT:        "bg-red-100 text-red-700",
  LOGIN:         "bg-gray-100 text-gray-700",
  EXPORT:        "bg-amber-100 text-amber-700",
};

const acaoLabel: Record<string, string> = {
  CREATE:        "Criação",
  UPDATE:        "Atualização",
  DELETE:        "Exclusão",
  STATUS_CHANGE: "Mudança de status",
  APPROVE:       "Aprovação",
  REJECT:        "Reprovação",
  LOGIN:         "Login",
  EXPORT:        "Exportação",
};

export default async function AuditoriaPage() {
  const user = await getSession();
  if (!user) return null;

  const perms = canDo(user.role);
  if (!perms.verRelatorios) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Sem permissão para acessar a auditoria.</p>
      </div>
    );
  }

  const logs = await getAuditLogs({ limit: 200 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-sm text-gray-500">
          Registro das últimas {logs.length} ações no sistema
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Data / Hora</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Entidade</th>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                  {formatDate(log.criadoEm)}
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs">{log.usuarioNome ?? log.usuarioId}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${acaoBadge[log.acao] ?? "bg-gray-100 text-gray-700"}`}>
                    {acaoLabel[log.acao] ?? log.acao}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 capitalize">{log.entidade}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.entidadeId.slice(0, 12)}…</td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
                  {log.detalhes ? JSON.stringify(log.detalhes).slice(0, 80) : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                  Nenhum registro de auditoria encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
