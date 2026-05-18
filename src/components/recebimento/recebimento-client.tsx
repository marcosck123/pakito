"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, X, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  itemEntregaStatusLabel, itemEntregaStatusColor,
  urgenciaLabel,
} from "@/lib/utils/status";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import type { CondicaoPeca, ItemEntregaStatus } from "@/types";

// ─── types ────────────────────────────────────────────────────────────────────

export interface ItemRow {
  id: string;
  requisicaoId: string;
  requisicaoNumero: string;
  requisicaoUrgencia: string;
  peca: string;
  marca?: string;
  fornecedor: string;
  quantidade: number;
  quantidadeRecebida: number;
  previsaoEntrega?: string;
  valorTotal: number;
  statusEntrega: ItemEntregaStatus;
}

export interface RecebidoRow {
  id: string;
  requisicaoId: string;
  requisicaoNumero: string;
  peca: string;
  fornecedor: string;
  quantidadeRecebida: number;
  dataRecebimento?: string;
  quemRecebeu?: string;
  condicaoPeca?: CondicaoPeca;
  observacaoRecebimento?: string;
}

interface ModalState {
  itemId: string;
  requisicaoId: string;
  peca: string;
  quantidade: number;
  action: "PARCIAL" | "PROBLEMA";
}

// ─── component ────────────────────────────────────────────────────────────────

interface Props {
  itensEmEntrega: ItemRow[];
  itensRecebidos: RecebidoRow[];
  userName: string;
}

export function RecebimentoClient({ itensEmEntrega, itensRecebidos, userName }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ItemRow[]>(itensEmEntrega);
  const [recebidos, setRecebidos] = useState<RecebidoRow[]>(itensRecebidos);
  const [loading, setLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  // modal fields
  const [qtyParcial, setQtyParcial] = useState(1);
  const [obsParcial, setObsParcial] = useState("");
  const [condicaoProblema, setCondicaoProblema] = useState<CondicaoPeca>("DANIFICADA");
  const [obsProblema, setObsProblema] = useState("");

  async function callApi(
    requisicaoId: string,
    itemId: string,
    action: "RECEBIDA" | "PARCIAL" | "PROBLEMA",
    extra?: { quantidadeRecebida?: number; observacao?: string; condicao?: CondicaoPeca }
  ) {
    setLoading(itemId);
    try {
      const item = items.find((i) => i.id === itemId);
      const res = await fetch("/api/recebimento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requisicaoId,
          itemId,
          action,
          quemRecebeu: userName,
          quantidadeRecebida: action === "RECEBIDA" ? item?.quantidade : extra?.quantidadeRecebida,
          observacao: extra?.observacao,
          condicao: extra?.condicao,
        }),
      });
      if (!res.ok) throw new Error();

      // Update local state
      const today = new Date().toISOString();

      if (action === "RECEBIDA") {
        const done = items.find((i) => i.id === itemId)!;
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setRecebidos((prev) => [
          {
            id: done.id,
            requisicaoId: done.requisicaoId,
            requisicaoNumero: done.requisicaoNumero,
            peca: done.peca,
            fornecedor: done.fornecedor,
            quantidadeRecebida: done.quantidade,
            dataRecebimento: today,
            quemRecebeu: userName,
            condicaoPeca: "OK",
          },
          ...prev,
        ]);
      } else if (action === "PARCIAL") {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, statusEntrega: "RECEBIDA_PARCIALMENTE", quantidadeRecebida: extra?.quantidadeRecebida ?? 0 }
              : i
          )
        );
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, statusEntrega: "COM_PROBLEMA" } : i
          )
        );
      }

      router.refresh();
    } catch {
      // silent — item stays in list
    } finally {
      setLoading(null);
    }
  }

  function openModal(item: ItemRow, action: "PARCIAL" | "PROBLEMA") {
    setQtyParcial(1);
    setObsParcial("");
    setCondicaoProblema("DANIFICADA");
    setObsProblema("");
    setModal({ itemId: item.id, requisicaoId: item.requisicaoId, peca: item.peca, quantidade: item.quantidade, action });
  }

  async function submitModal() {
    if (!modal) return;
    if (modal.action === "PARCIAL") {
      await callApi(modal.requisicaoId, modal.itemId, "PARCIAL", { quantidadeRecebida: qtyParcial, observacao: obsParcial });
    } else {
      await callApi(modal.requisicaoId, modal.itemId, "PROBLEMA", { condicao: condicaoProblema, observacao: obsProblema });
    }
    setModal(null);
  }

  const urgenciaColorMap: Record<string, string> = {
    URGENTE: "bg-red-100 text-red-700",
    ALTA: "bg-orange-100 text-orange-700",
    NORMAL: "bg-blue-100 text-blue-700",
    BAIXA: "bg-gray-100 text-gray-600",
  };

  return (
    <>
      {/* ── AGUARDANDO ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Aguardando recebimento</h2>
        {items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-300" />
            <p className="mt-2 text-sm text-gray-400">Nenhuma peça aguardando recebimento</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-3 font-medium">Requisição</th>
                    <th className="px-4 py-3 font-medium">Peça</th>
                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                    <th className="px-4 py-3 font-medium">Qtd comprada</th>
                    <th className="px-4 py-3 font-medium">Qtd recebida</th>
                    <th className="px-4 py-3 font-medium">Prev. entrega</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const busy = loading === item.id;
                    return (
                      <tr key={item.id} className={busy ? "opacity-50" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3">
                          <Link href={`/requisicoes/${item.requisicaoId}`} className="font-mono text-xs text-blue-600 hover:underline">{item.requisicaoNumero}</Link>
                          <div className="mt-0.5">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${urgenciaColorMap[item.requisicaoUrgencia] ?? "bg-gray-100 text-gray-600"}`}>
                              {urgenciaLabel[item.requisicaoUrgencia as keyof typeof urgenciaLabel] ?? item.requisicaoUrgencia}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.peca}</p>
                          {item.marca && <p className="text-xs text-gray-400">{item.marca}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.fornecedor}</td>
                        <td className="px-4 py-3 text-gray-600">{item.quantidade}</td>
                        <td className="px-4 py-3">
                          <span className={item.quantidadeRecebida > 0 ? "text-orange-600 font-medium" : "text-gray-400"}>{item.quantidadeRecebida}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.previsaoEntrega ? formatDate(item.previsaoEntrega) : "—"}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(item.valorTotal)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={itemEntregaStatusLabel[item.statusEntrega]}
                            colorClass={itemEntregaStatusColor[item.statusEntrega]}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <button
                              disabled={busy}
                              onClick={() => callApi(item.requisicaoId, item.id, "RECEBIDA")}
                              className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              Marcar recebida
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => openModal(item, "PARCIAL")}
                              className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                            >
                              Parcialmente
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => openModal(item, "PROBLEMA")}
                              className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Problema
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── RECEBIDOS ──────────────────────────────────────────────────────── */}
      {recebidos.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Recebidos recentemente ({recebidos.length})</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-3 font-medium">Requisição</th>
                    <th className="px-4 py-3 font-medium">Peça</th>
                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                    <th className="px-4 py-3 font-medium">Qtd recebida</th>
                    <th className="px-4 py-3 font-medium">Data recebimento</th>
                    <th className="px-4 py-3 font-medium">Quem recebeu</th>
                    <th className="px-4 py-3 font-medium">Condição</th>
                    <th className="px-4 py-3 font-medium">Obs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recebidos.map((item) => (
                    <tr key={`${item.id}-rec`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/requisicoes/${item.requisicaoId}`} className="font-mono text-xs text-blue-600 hover:underline">{item.requisicaoNumero}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.peca}</td>
                      <td className="px-4 py-3 text-gray-600">{item.fornecedor}</td>
                      <td className="px-4 py-3 text-gray-600">{item.quantidadeRecebida}</td>
                      <td className="px-4 py-3 text-gray-600">{item.dataRecebimento ? formatDate(item.dataRecebimento) : "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{item.quemRecebeu ?? "—"}</td>
                      <td className="px-4 py-3">
                        {item.condicaoPeca ? (
                          <span className={`text-xs font-medium ${item.condicaoPeca === "OK" ? "text-green-600" : "text-red-600"}`}>{item.condicaoPeca}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.observacaoRecebimento ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ──────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                {modal.action === "PARCIAL" ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <h3 className="text-sm font-semibold text-gray-900">
                  {modal.action === "PARCIAL" ? "Recebimento parcial" : "Registrar problema"}
                </h3>
              </div>
              <button onClick={() => setModal(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{modal.peca}</span>
              </p>

              {modal.action === "PARCIAL" ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Quantidade recebida <span className="text-gray-400">(de {modal.quantidade})</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={modal.quantidade - 1}
                      value={qtyParcial}
                      onChange={(e) => setQtyParcial(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Observação</label>
                    <textarea
                      rows={2}
                      value={obsParcial}
                      onChange={(e) => setObsParcial(e.target.value)}
                      placeholder="Ex: 2 unidades em falta, fornecedor confirmou reenvio..."
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Condição</label>
                    <select
                      value={condicaoProblema}
                      onChange={(e) => setCondicaoProblema(e.target.value as CondicaoPeca)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="DANIFICADA">Danificada</option>
                      <option value="INCORRETA">Incorreta (peça errada)</option>
                      <option value="PARCIAL">Quantidade incorreta</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Descrição do problema</label>
                    <textarea
                      rows={2}
                      value={obsProblema}
                      onChange={(e) => setObsProblema(e.target.value)}
                      placeholder="Descreva o problema..."
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
              <button
                onClick={submitModal}
                disabled={loading !== null}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  modal.action === "PARCIAL" ? "bg-orange-500 hover:bg-orange-600" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading !== null ? "Salvando..." : modal.action === "PARCIAL" ? "Confirmar parcial" : "Registrar problema"}
              </button>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
