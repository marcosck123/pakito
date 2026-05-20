import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canDo } from "@/lib/security/permissions";
import { getOrcamento } from "@/lib/db/orcamentos-repo";
import { getCotacao } from "@/lib/db/cotacoes-repo";
import ConferenciaForm from "./conferencia-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConferenciaPage({ params }: Props) {
  const { id } = await params;
  const [user, orcamento] = await Promise.all([getSession(), getOrcamento(id)]);
  if (!user) return null;
  if (!orcamento) notFound();

  const perms = canDo(user.role);
  if (!perms.adicionarOrcamento) {
    return <p className="p-4 text-sm text-red-500">Sem permissão para conferir orçamentos.</p>;
  }

  const cotacao = await getCotacao(orcamento.cotacaoId);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/cotacoes/${orcamento.cotacaoId}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à cotação
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Conferência de Orçamento</h1>
        <p className="text-sm text-gray-500">
          Valide os itens recebidos contra a cotação original.
        </p>
      </div>

      <ConferenciaForm orcamento={orcamento} cotacao={cotacao} />
    </div>
  );
}
