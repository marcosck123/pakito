"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Loader2, RefreshCw, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";
import type {
  ApprovalDecisionAction,
  ApprovalRequisition,
  ApprovalRequisitionsPayload,
  ApprovalStatus,
  ApprovalUrgency,
} from "@/lib/approval/types";

const urgencyLabel: Record<ApprovalUrgency, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const urgencyColor: Record<ApprovalUrgency, string> = {
  BAIXA: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-800",
  URGENTE: "bg-red-100 text-red-800",
};

const statusLabel: Record<ApprovalStatus, string> = {
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  AJUSTE_SOLICITADO: "Ajuste solicitado",
  PEDIDO_FECHADO: "Pedido fechado",
  CANCELADA: "Cancelada",
};

const statusColor: Record<ApprovalStatus, string> = {
  AGUARDANDO_APROVACAO: "bg-yellow-100 text-yellow-800",
  APROVADA: "bg-green-100 text-green-800",
  REPROVADA: "bg-red-100 text-red-800",
  AJUSTE_SOLICITADO: "bg-orange-100 text-orange-800",
  PEDIDO_FECHADO: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-red-100 text-red-800",
};

const actionSuccess: Record<ApprovalDecisionAction, string> = {
  APROVAR: "Requisição aprovada com sucesso.",
  REPROVAR: "Requisição reprovada com sucesso.",
  SOLICITAR_AJUSTE: "Ajuste solicitado com sucesso.",
};

type SavingState = {
  requisitionId: string;
  action: ApprovalDecisionAction;
} | null;

function getActionLabel(action: ApprovalDecisionAction) {
  if (action === "APROVAR") return "Aprovar";
  if (action === "REPROVAR") return "Reprovar";
  return "Solicitar ajuste";
}

async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null);
  return payload?.error ?? "Não foi possível concluir a operação.";
}

export function ApprovalRequisitionsClient({
  canApprove,
}: {
  canApprove: boolean;
}) {
  const [payload, setPayload] = useState<ApprovalRequisitionsPayload>({
    pending: [],
    history: [],
  });
  const [comments, setComments] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SavingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const savingKey = useMemo(
    () => (saving ? `${saving.requisitionId}:${saving.action}` : null),
    [saving]
  );

  const loadRequisitions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/approval/requisitions", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setPayload(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar requisições.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequisitions();
  }, [loadRequisitions]);

  async function decide(requisition: ApprovalRequisition, action: ApprovalDecisionAction) {
    const comment = comments[requisition.id]?.trim() ?? "";

    setSuccess(null);
    setError(null);
    setRowErrors((current) => ({ ...current, [requisition.id]: "" }));

    if ((action === "REPROVAR" || action === "SOLICITAR_AJUSTE") && !comment) {
      setRowErrors((current) => ({
        ...current,
        [requisition.id]: "Informe um comentário para reprovar ou solicitar ajuste.",
      }));
      return;
    }

    setSaving({ requisitionId: requisition.id, action });

    try {
      const response = await fetch(
        `/api/approval/requisitions/${requisition.id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, comment }),
        }
      );

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const result = (await response.json()) as {
        requisition: ApprovalRequisition;
      };

      setPayload((current) => ({
        pending: current.pending.filter((item) => item.id !== requisition.id),
        history: [
          result.requisition,
          ...current.history.filter((item) => item.id !== requisition.id),
        ],
      }));
      setComments((current) => ({ ...current, [requisition.id]: "" }));
      setSuccess(actionSuccess[action]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar decisão.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Aprovação de requisições</h1>
        <p className="text-sm text-gray-500">
          {loading ? "Carregando pendências..." : `${payload.pending.length} aguardando aprovação`}
        </p>
      </div>

      {!canApprove && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Seu perfil não tem permissão para aprovar requisições. Apenas{" "}
            <strong>ADMIN</strong> e <strong>APROVADOR</strong> podem aprovar.
          </p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Pendentes de aprovação</h2>
          <button
            type="button"
            onClick={() => void loadRequisitions()}
            disabled={loading || saving !== null}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">Buscando requisições no banco</p>
          </div>
        ) : payload.pending.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-300" />
            <p className="mt-2 text-sm text-gray-400">
              Nenhuma requisição aguardando aprovação
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payload.pending.map((requisition) => (
              <div
                key={requisition.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-gray-600">
                      {requisition.code}
                    </span>
                    <StatusBadge
                      label={urgencyLabel[requisition.urgency]}
                      colorClass={urgencyColor[requisition.urgency]}
                    />
                    <span className="text-sm text-gray-600">
                      {requisition.requesterName} · {requisition.department}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(requisition.totalValue)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(requisition.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-gray-500">
                    Itens solicitados:
                  </p>
                  <div className="space-y-1">
                    {requisition.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <span className="font-medium text-gray-800">{item.partName}</span>
                          <span className="ml-2 text-gray-400">
                            {item.quantity}x · {item.brand ?? "—"} ·{" "}
                            {item.supplierName ?? "—"}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-700">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {requisition.justification && (
                    <div className="mt-3 rounded-lg bg-blue-50 p-3">
                      <p className="text-xs font-medium text-blue-600">Justificativa:</p>
                      <p className="mt-0.5 text-sm text-blue-800">
                        {requisition.justification}
                      </p>
                    </div>
                  )}
                </div>

                {canApprove && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-gray-500">Decisão:</p>
                    <div className="flex flex-wrap gap-2">
                      <DecisionButton
                        action="APROVAR"
                        savingKey={savingKey}
                        requisitionId={requisition.id}
                        disabled={saving !== null}
                        onClick={() => void decide(requisition, "APROVAR")}
                      />
                      <DecisionButton
                        action="REPROVAR"
                        savingKey={savingKey}
                        requisitionId={requisition.id}
                        disabled={saving !== null}
                        onClick={() => void decide(requisition, "REPROVAR")}
                      />
                      <DecisionButton
                        action="SOLICITAR_AJUSTE"
                        savingKey={savingKey}
                        requisitionId={requisition.id}
                        disabled={saving !== null}
                        onClick={() => void decide(requisition, "SOLICITAR_AJUSTE")}
                      />
                    </div>
                    <div className="mt-2">
                      <textarea
                        placeholder="Comentário (obrigatório para reprovar ou solicitar ajuste)..."
                        rows={2}
                        value={comments[requisition.id] ?? ""}
                        onChange={(event) =>
                          setComments((current) => ({
                            ...current,
                            [requisition.id]: event.target.value,
                          }))
                        }
                        disabled={saving !== null}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                      />
                      {rowErrors[requisition.id] && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {rowErrors[requisition.id]}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {payload.history.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Histórico de aprovações
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Número</th>
                  <th className="px-4 py-2 font-medium">Solicitante</th>
                  <th className="px-4 py-2 font-medium">Valor</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Responsável</th>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Comentário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payload.history.map((requisition) => (
                  <tr key={requisition.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                      {requisition.code}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {requisition.requesterName}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">
                      {formatCurrency(requisition.totalValue)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={statusLabel[requisition.status]}
                        colorClass={statusColor[requisition.status]}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {requisition.lastDecision?.decidedBy ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {requisition.lastDecision
                        ? formatDateTime(requisition.lastDecision.decidedAt)
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs italic text-gray-500">
                      {requisition.lastDecision?.comment || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionButton({
  action,
  requisitionId,
  savingKey,
  disabled,
  onClick,
}: {
  action: ApprovalDecisionAction;
  requisitionId: string;
  savingKey: string | null;
  disabled: boolean;
  onClick: () => void;
}) {
  const isSaving = savingKey === `${requisitionId}:${action}`;

  if (action === "APROVAR") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        {isSaving ? "Salvando..." : getActionLabel(action)}
      </button>
    );
  }

  if (action === "REPROVAR") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
        {isSaving ? "Salvando..." : getActionLabel(action)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {isSaving ? "Salvando..." : getActionLabel(action)}
    </button>
  );
}
