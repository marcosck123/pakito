import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { mockFornecedores } from "@/lib/mock-data/fornecedores";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { mockOrcamentos } from "@/lib/mock-data/orcamentos";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  fornecedorStatusLabel,
  fornecedorStatusColor,
  cotacaoStatusLabel,
  cotacaoStatusColor,
  orcamentoStatusLabel,
  orcamentoStatusColor,
} from "@/lib/utils/status";
import { formatDate, formatCurrency } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FornecedorDetalhePage({ params }: Props) {
  const { id } = await params;
  const user = await getSession();
  if (!user) return null;

  const fornecedor = mockFornecedores.find((f) => f.id === id);
  if (!fornecedor) notFound();

  const cotacoesVinculadas = mockCotacoes.filter((c) =>
    c.fornecedores.some((fc) => fc.fornecedorId === id)
  );
  const orcamentosEnviados = mockOrcamentos.filter((o) => o.fornecedorId === id);

  return (
    <div className="space-y-6">
      <Link href="/fornecedores" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Fornecedores
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{fornecedor.nome}</h1>
          {fornecedor.nomeVendedor && <p className="text-sm text-gray-500">Vendedor: {fornecedor.nomeVendedor}</p>}
        </div>
        <StatusBadge label={fornecedorStatusLabel[fornecedor.status]} colorClass={fornecedorStatusColor[fornecedor.status]} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Dados cadastrais</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-gray-600"><Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" /><span>{fornecedor.telefone}</span></div>
            {fornecedor.email && <div className="flex items-start gap-2 text-gray-600"><Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" /><span>{fornecedor.email}</span></div>}
            {fornecedor.cidade && <div className="flex items-start gap-2 text-gray-600"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" /><span>{fornecedor.cidade}{fornecedor.endereco && ` — ${fornecedor.endereco}`}</span></div>}
            {fornecedor.cnpj && <div className="flex items-start gap-2 text-gray-600"><Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" /><span>{fornecedor.cnpj}</span></div>}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Categorias</p>
            <div className="flex flex-wrap gap-1">
              {fornecedor.categorias.map((cat) => <span key={cat} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{cat}</span>)}
            </div>
          </div>
          {fornecedor.observacoes && <div><p className="mb-1 text-xs font-medium text-gray-500">Observações</p><p className="text-sm text-gray-600">{fornecedor.observacoes}</p></div>}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Cotações vinculadas ({cotacoesVinculadas.length})</h2>
            </div>
            {cotacoesVinculadas.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Nenhuma cotação encontrada</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {cotacoesVinculadas.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        <Link href={`/cotacoes/${c.id}`} className="hover:text-blue-600">{c.codigo}</Link>{" — "}{c.titulo}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(c.criadoEm)}</p>
                    </div>
                    <StatusBadge label={cotacaoStatusLabel[c.status]} colorClass={cotacaoStatusColor[c.status]} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Orçamentos enviados ({orcamentosEnviados.length})</h2>
            </div>
            {orcamentosEnviados.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Nenhum orçamento encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-4 py-2 font-medium">Cotação</th>
                      <th className="px-4 py-2 font-medium">Data</th>
                      <th className="px-4 py-2 font-medium">Total</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orcamentosEnviados.map((o) => {
                      const total = o.itens.reduce((sum, i) => sum + i.valorTotal, 0) + o.valorFrete;
                      return (
                        <tr key={o.id}>
                          <td className="px-4 py-2">
                            <Link href={`/orcamentos?cotacao=${o.cotacaoId}`} className="text-blue-600 hover:underline">
                              {mockCotacoes.find((c) => c.id === o.cotacaoId)?.codigo}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{formatDate(o.dataOrcamento)}</td>
                          <td className="px-4 py-2 font-medium text-gray-800">{formatCurrency(total)}</td>
                          <td className="px-4 py-2"><StatusBadge label={orcamentoStatusLabel[o.status]} colorClass={orcamentoStatusColor[o.status]} /></td>
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
    </div>
  );
}