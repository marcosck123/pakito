"use client";

import { useState } from "react";
import { ClipboardList, Eye } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { fornecedorCotacaoStatusLabel, fornecedorCotacaoStatusColor } from "@/lib/utils/status";
import { formatDate } from "@/lib/utils/format";
import { InserirOrcamentoModal } from "./inserir-orcamento-modal";
import type { FornecedorCotacao, CotacaoItem, Orcamento } from "@/types";

interface Props {
  cotacaoId: string;
  fornecedores: FornecedorCotacao[];
  cotacaoItens: CotacaoItem[];
  existingOrcamentos: Record<string, Orcamento>;
  canInsert: boolean;
}

export function FornecedoresSection({
  cotacaoId,
  fornecedores,
  cotacaoItens,
  existingOrcamentos,
  canInsert,
}: Props) {
  const [modalFc, setModalFc] = useState<FornecedorCotacao | null>(null);

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Fornecedores ({fornecedores.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {fornecedores.map((fc) => {
            const existing = existingOrcamentos[fc.fornecedorId] ?? null;
            const hasOrcamento = fc.status === "ORCAMENTO_CADASTRADO";
            return (
              <div key={fc.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fc.fornecedor?.nome}</p>
                    <p className="text-xs text-gray-400">
                      {fc.mensagemEnviadaEm ? `Enviado: ${formatDate(fc.mensagemEnviadaEm)}` : "Não enviado"}
                      {fc.respostaRecebidaEm && ` · Resposta: ${formatDate(fc.respostaRecebidaEm)}`}
                    </p>
                  </div>
                  <StatusBadge
                    label={fornecedorCotacaoStatusLabel[fc.status]}
                    colorClass={fornecedorCotacaoStatusColor[fc.status]}
                  />
                </div>

                {canInsert && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fc.fornecedor?.whatsapp && (
                      <a
                        href={`https://wa.me/${fc.fornecedor.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100"
                      >
                        Abrir WA
                      </a>
                    )}
                    {!hasOrcamento && (
                      <button
                        onClick={() => setModalFc(fc)}
                        className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {existing ? "Continuar rascunho" : "Inserir orçamento recebido"}
                      </button>
                    )}
                    {hasOrcamento && (
                      <button
                        onClick={() => setModalFc(fc)}
                        className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver orçamento
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modalFc && modalFc.fornecedor && (
        <InserirOrcamentoModal
          cotacaoId={cotacaoId}
          fornecedorCotacaoId={modalFc.id}
          fornecedor={modalFc.fornecedor}
          cotacaoItens={cotacaoItens}
          existingOrcamento={existingOrcamentos[modalFc.fornecedorId] ?? null}
          onClose={() => setModalFc(null)}
        />
      )}
    </>
  );
}
