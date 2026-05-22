import { CheckCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getRequisicoes } from "@/lib/db/requisicoes-repo";
import { canDo } from "@/lib/security/permissions";
import { RecebimentoClient } from "@/components/recebimento/recebimento-client";
import type { ItemRow, RecebidoRow } from "@/components/recebimento/recebimento-client";

export default async function RecebimentoPage() {
  const user = await getSession();
  if (!user) return null;
  const perms = canDo(user.role);

  const requisicoes = await getRequisicoes();

  const itensEmEntrega: ItemRow[] = requisicoes
    .filter((r) => ["PEDIDO_FECHADO", "AGUARDANDO_ENTREGA", "PARCIALMENTE_RECEBIDA"].includes(r.status))
    .flatMap((r) =>
      r.itens
        .filter((i) => ["AGUARDANDO_ENTREGA", "COMPRADA", "RECEBIDA_PARCIALMENTE"].includes(i.statusEntrega))
        .map((item) => ({
          id: item.id,
          requisicaoId: r.id,
          requisicaoNumero: r.numero,
          requisicaoUrgencia: r.urgencia,
          peca: item.peca?.nome ?? "",
          marca: item.marca,
          fornecedor: item.fornecedor?.nome ?? "",
          quantidade: item.quantidade,
          quantidadeRecebida: item.quantidadeRecebida,
          previsaoEntrega: item.previsaoEntrega,
          valorTotal: item.valorTotal,
          statusEntrega: item.statusEntrega,
        }))
    );

  const itensRecebidos: RecebidoRow[] = requisicoes
    .flatMap((r) =>
      r.itens
        .filter((i) => i.statusEntrega === "RECEBIDA")
        .map((item) => ({
          id: item.id,
          requisicaoId: r.id,
          requisicaoNumero: r.numero,
          peca: item.peca?.nome ?? "",
          fornecedor: item.fornecedor?.nome ?? "",
          quantidadeRecebida: item.quantidadeRecebida,
          dataRecebimento: item.dataRecebimento,
          quemRecebeu: item.quemRecebeu,
          condicaoPeca: item.condicaoPeca,
          observacaoRecebimento: item.observacaoRecebimento,
        }))
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Controle de recebimento</h1>
        <p className="text-sm text-gray-500">{itensEmEntrega.length} itens aguardando recebimento</p>
      </div>

      {!perms.marcarPecaRecebida && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">Seu perfil tem acesso somente leitura nesta tela.</p>
        </div>
      )}

      {perms.marcarPecaRecebida ? (
        <RecebimentoClient
          itensEmEntrega={itensEmEntrega}
          itensRecebidos={itensRecebidos}
          userName={user.nome}
        />
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Aguardando recebimento</h2>
          {itensEmEntrega.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-300" />
              <p className="mt-2 text-sm text-gray-400">Nenhuma peça aguardando recebimento</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <p className="px-4 py-3 text-sm text-gray-500">{itensEmEntrega.length} itens aguardando</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
