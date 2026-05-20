import { getSession } from "@/lib/auth/session";
import { canDo } from "@/lib/security/permissions";
import { getCotacoes } from "@/lib/db/cotacoes-repo";
import { getOrcamentos } from "@/lib/db/orcamentos-repo";
import { getRequisicoes } from "@/lib/db/requisicoes-repo";
import { formatCurrency } from "@/lib/utils/format";

export default async function RelatoriosPage() {
  const user = await getSession();
  if (!user) return null;

  const perms = canDo(user.role);
  if (!perms.verRelatorios) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Sem permissão para acessar relatórios.</p>
      </div>
    );
  }

  const [cotacoes, orcamentos, requisicoes] = await Promise.all([
    getCotacoes(),
    getOrcamentos(),
    getRequisicoes(),
  ]);

  // ── Métricas ─────────────────────────────────────────────────────────────────
  const totalAprovado = requisicoes
    .filter((r) => r.status === "APROVADA" || r.status === "FINALIZADA" || r.status === "PEDIDO_FECHADO")
    .reduce((s, r) => s + r.valorTotal, 0);

  const totalAguardando = requisicoes
    .filter((r) => r.status === "AGUARDANDO_APROVACAO")
    .reduce((s, r) => s + r.valorTotal, 0);

  const cotacoesAtivas = cotacoes.filter(
    (c) => c.status !== "CANCELADA" && c.status !== "FINALIZADA"
  ).length;

  const orcamentosConferidos = orcamentos.filter((o) => o.status === "CONFERIDO").length;

  // ── Top 5 fornecedores por valor total ───────────────────────────────────────
  const valorPorFornecedor = new Map<string, { nome: string; total: number; count: number }>();
  for (const o of orcamentos) {
    const total = o.itens.reduce((s, i) => s + i.valorTotal, 0) + o.valorFrete;
    const fornNome = o.fornecedor?.nome ?? o.fornecedorId;
    const existing = valorPorFornecedor.get(o.fornecedorId);
    if (existing) {
      existing.total += total;
      existing.count += 1;
    } else {
      valorPorFornecedor.set(o.fornecedorId, { nome: fornNome, total, count: 1 });
    }
  }
  const topFornecedores = Array.from(valorPorFornecedor.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // ── Status distribution ───────────────────────────────────────────────────────
  const statusCotacoes = cotacoes.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const statusRequisicoes = requisicoes.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Resumo operacional do sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Valor aprovado</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{formatCurrency(totalAprovado)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {requisicoes.filter((r) => ["APROVADA","FINALIZADA","PEDIDO_FECHADO"].includes(r.status)).length} requisições
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Aguardando aprovação</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{formatCurrency(totalAguardando)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {requisicoes.filter((r) => r.status === "AGUARDANDO_APROVACAO").length} pendentes
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Cotações ativas</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{cotacoesAtivas}</p>
          <p className="text-xs text-gray-400 mt-1">de {cotacoes.length} total</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Orçamentos conferidos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{orcamentosConferidos}</p>
          <p className="text-xs text-gray-400 mt-1">de {orcamentos.length} recebidos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top fornecedores */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-gray-800">Top 5 fornecedores por volume</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Fornecedor</th>
                <th className="px-4 py-2.5 font-medium">Orçamentos</th>
                <th className="px-4 py-2.5 font-medium">Volume total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topFornecedores.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{f.nome}</td>
                  <td className="px-4 py-2.5 text-gray-600">{f.count}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{formatCurrency(f.total)}</td>
                </tr>
              ))}
              {topFornecedores.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Status breakdown */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-gray-800">Cotações por status</h2>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {Object.entries(statusCotacoes).map(([status, count]) => (
                <div key={status} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-center min-w-[80px]">
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 leading-tight">{status.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-gray-800">Requisições por status</h2>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {Object.entries(statusRequisicoes).map(([status, count]) => (
                <div key={status} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-center min-w-[80px]">
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 leading-tight">{status.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
