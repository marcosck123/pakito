"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Orcamento, Cotacao } from "@/types";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  orcamento: Orcamento;
  cotacao: Cotacao | null;
}

export default function ConferenciaForm({ orcamento, cotacao }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [obs, setObs] = useState(orcamento.observacoes ?? "");

  // Calculate min price per cotacaoItemId across all items in this orcamento
  // (In practice, you'd compare across other orçamentos, but this shows relative analysis)
  const precosPorItem = new Map<string, number>();
  for (const item of orcamento.itens) {
    const existing = precosPorItem.get(item.cotacaoItemId);
    if (!existing || item.valorUnitario < existing) {
      precosPorItem.set(item.cotacaoItemId, item.valorUnitario);
    }
  }

  function getAlerts(item: Orcamento["itens"][number]) {
    const alerts: { type: "error" | "warning" | "info"; message: string }[] = [];
    const cotItem = cotacao?.itens.find((ci) => ci.id === item.cotacaoItemId);

    if (!item.disponivel) {
      alerts.push({ type: "error", message: "Item indisponível" });
    }
    if (cotItem && !cotItem.aceitaSimilar && item.marcaCotada && cotItem.marcaDesejada) {
      if (item.marcaCotada.toLowerCase() !== cotItem.marcaDesejada.toLowerCase()) {
        alerts.push({
          type: "warning",
          message: `Marca diferente: cotado "${item.marcaCotada}", solicitado "${cotItem.marcaDesejada}" (não aceita similar)`,
        });
      }
    }
    if (cotItem && item.quantidade !== cotItem.quantidade) {
      alerts.push({
        type: "info",
        message: `Quantidade diverge: recebido ${item.quantidade}, solicitado ${cotItem.quantidade}`,
      });
    }
    return alerts;
  }

  async function handleAction(status: "CONFERIDO" | "INVALIDO") {
    setLoading(true);
    try {
      await fetch("/api/orcamentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orcamento.id, status, observacoes: obs }),
      });
      router.push(`/cotacoes/${orcamento.cotacaoId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const alertCount = orcamento.itens.flatMap(getAlerts).length;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400">Fornecedor</p>
          <p className="font-semibold text-gray-900">{orcamento.fornecedor?.nome ?? orcamento.fornecedorId}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Data</p>
          <p className="font-medium text-gray-700">{orcamento.dataOrcamento}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Prazo</p>
          <p className="font-medium text-gray-700">{orcamento.prazoEntrega ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Frete</p>
          <p className="font-medium text-gray-700">{formatCurrency(orcamento.valorFrete)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Pagamento</p>
          <p className="font-medium text-gray-700">{orcamento.formaPagamento ?? "—"}</p>
        </div>
        {alertCount > 0 && (
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" />
            {alertCount} {alertCount === 1 ? "alerta" : "alertas"} encontrados
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-gray-800">Itens recebidos vs. solicitados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-4 py-2.5 font-medium">Peça</th>
                <th className="px-4 py-2.5 font-medium">Marca recebida</th>
                <th className="px-4 py-2.5 font-medium">Qtd solicitada</th>
                <th className="px-4 py-2.5 font-medium">Qtd recebida</th>
                <th className="px-4 py-2.5 font-medium">Vlr unit.</th>
                <th className="px-4 py-2.5 font-medium">Vlr total</th>
                <th className="px-4 py-2.5 font-medium">Disp.</th>
                <th className="px-4 py-2.5 font-medium">Alertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orcamento.itens.map((item) => {
                const cotItem = cotacao?.itens.find((ci) => ci.id === item.cotacaoItemId);
                const alerts = getAlerts(item);
                const hasError = alerts.some((a) => a.type === "error");
                const hasWarning = alerts.some((a) => a.type === "warning");

                return (
                  <tr
                    key={item.id}
                    className={hasError ? "bg-red-50" : hasWarning ? "bg-amber-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.peca?.nome ?? cotItem?.peca?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>
                        <p>{item.marcaCotada ?? "—"}</p>
                        {cotItem?.marcaDesejada && (
                          <p className="text-xs text-gray-400">Solicitado: {cotItem.marcaDesejada}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cotItem?.quantidade ?? "—"}</td>
                    <td className={`px-4 py-3 font-medium ${item.quantidade !== cotItem?.quantidade ? "text-amber-700" : "text-gray-900"}`}>
                      {item.quantidade}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{formatCurrency(item.valorUnitario)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(item.valorTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${item.disponivel ? "text-green-600" : "text-red-600"}`}>
                        {item.disponivel ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {alerts.map((a, i) => (
                          <div key={i} className={`flex items-start gap-1 text-xs ${
                            a.type === "error" ? "text-red-600" :
                            a.type === "warning" ? "text-amber-700" : "text-blue-600"
                          }`}>
                            {a.type === "error" ? <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                             a.type === "warning" ? <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                             <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                            {a.message}
                          </div>
                        ))}
                        {alerts.length === 0 && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td colSpan={5} className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                  Total itens + frete
                </td>
                <td className="px-4 py-2.5 font-bold text-gray-900">
                  {formatCurrency(
                    orcamento.itens.reduce((s, i) => s + i.valorTotal, 0) + orcamento.valorFrete
                  )}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Observações */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Observações da conferência
        </label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Registre observações sobre a conferência…"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => handleAction("INVALIDO")}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Marcar como inválido
        </button>
        <button
          onClick={() => handleAction("CONFERIDO")}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
          Confirmar conferência
        </button>
      </div>
    </div>
  );
}
