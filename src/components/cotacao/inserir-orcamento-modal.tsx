"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { X, FileText, ScanLine, CheckCircle, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { CotacaoItem, Fornecedor, Orcamento } from "@/types";

type ItemForm = {
  cotacaoItemId: string;
  pecaNome: string;
  marcaCotada: string;
  quantidade: number;
  valorUnitario: number;
  disponivel: boolean;
  observacao: string;
};

type FormValues = {
  dataOrcamento: string;
  validadePropostaDias: number | "";
  prazoEntrega: string;
  valorFrete: number;
  formaPagamento: string;
  observacoes: string;
  itens: ItemForm[];
};

interface Props {
  cotacaoId: string;
  fornecedorCotacaoId: string;
  fornecedor: Fornecedor;
  cotacaoItens: CotacaoItem[];
  existingOrcamento: Orcamento | null;
  onClose: () => void;
}

export function InserirOrcamentoModal({
  cotacaoId,
  fornecedorCotacaoId,
  fornecedor,
  cotacaoItens,
  existingOrcamento,
  onClose,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"method" | "form">(existingOrcamento ? "form" : "method");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const defaultItens: ItemForm[] = existingOrcamento
    ? existingOrcamento.itens.map((oi) => ({
        cotacaoItemId: oi.cotacaoItemId,
        pecaNome: oi.peca?.nome ?? cotacaoItens.find((ci) => ci.id === oi.cotacaoItemId)?.peca?.nome ?? "",
        marcaCotada: oi.marcaCotada ?? "",
        quantidade: oi.quantidade,
        valorUnitario: oi.valorUnitario,
        disponivel: oi.disponivel,
        observacao: oi.observacao ?? "",
      }))
    : cotacaoItens.map((ci) => ({
        cotacaoItemId: ci.id,
        pecaNome: ci.peca?.nome ?? "",
        marcaCotada: "",
        quantidade: ci.quantidade,
        valorUnitario: 0,
        disponivel: true,
        observacao: "",
      }));

  const { register, control, watch } = useForm<FormValues>({
    defaultValues: {
      dataOrcamento: existingOrcamento?.dataOrcamento ?? today,
      validadePropostaDias: existingOrcamento?.validadePropostaDias ?? "",
      prazoEntrega: existingOrcamento?.prazoEntrega ?? "",
      valorFrete: existingOrcamento?.valorFrete ?? 0,
      formaPagamento: existingOrcamento?.formaPagamento ?? "",
      observacoes: existingOrcamento?.observacoes ?? "",
      itens: defaultItens,
    },
  });

  const { fields } = useFieldArray({ control, name: "itens" });
  const watched = watch();

  const totalItens = (watched.itens ?? []).reduce(
    (sum, item) => sum + (item.disponivel ? (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0) : 0),
    0
  );
  const totalGeral = totalItens + (Number(watched.valorFrete) || 0);

  async function save(action: "rascunho" | "confirmar") {
    const values = watched;
    if (action === "confirmar") {
      const validItems = (values.itens ?? []).filter(
        (i) => i.pecaNome && (Number(i.quantidade) || 0) > 0
      );
      if (validItems.length === 0) {
        setError("Adicione pelo menos 1 item com peça e quantidade.");
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        action,
        cotacaoId,
        fornecedorId: fornecedor.id,
        fornecedorCotacaoId,
        ...(existingOrcamento ? { id: existingOrcamento.id } : {}),
        dataOrcamento: values.dataOrcamento,
        validadePropostaDias: values.validadePropostaDias || undefined,
        prazoEntrega: values.prazoEntrega || undefined,
        valorFrete: Number(values.valorFrete) || 0,
        formaPagamento: values.formaPagamento || undefined,
        observacoes: values.observacoes || undefined,
        itens: (values.itens ?? []).map((item) => ({
          cotacaoItemId: item.cotacaoItemId,
          marcaCotada: item.marcaCotada || undefined,
          quantidade: Number(item.quantidade) || 0,
          valorUnitario: Number(item.valorUnitario) || 0,
          disponivel: Boolean(item.disponivel),
          observacao: item.observacao || undefined,
        })),
      };
      const res = await fetch("/api/orcamentos", {
        method: existingOrcamento ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      onClose();
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ── METHOD SELECTION ────────────────────────────────────────────────────────
  if (step === "method") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Inserir orçamento recebido</h2>
              <p className="text-sm text-gray-500">{fornecedor.nome}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <p className="mb-5 text-sm text-gray-600">Como deseja inserir o orçamento?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep("form")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-blue-500 bg-blue-50 p-5 text-center transition-colors hover:bg-blue-100"
              >
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Inserir manualmente</p>
                  <p className="mt-0.5 text-xs text-blue-600">Preencher formulário</p>
                </div>
              </button>
              <div className="flex cursor-not-allowed flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 p-5 text-center opacity-50">
                <ScanLine className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-500">Escanear PDF</p>
                  <span className="mt-1 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                    Em breve
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MANUAL FORM ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6 pb-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Inserir orçamento recebido</h1>
            <p className="text-sm text-gray-500">{fornecedor.nome}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* General fields */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Dados gerais</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Data do orçamento *</label>
              <input
                type="date"
                {...register("dataOrcamento", { required: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Validade (dias)</label>
              <input
                type="number"
                min={0}
                placeholder="Ex: 7"
                {...register("validadePropostaDias")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Prazo de entrega</label>
              <input
                type="text"
                placeholder="Ex: 3 dias úteis"
                {...register("prazoEntrega")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Frete (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                {...register("valorFrete", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Forma de pagamento</label>
              <input
                type="text"
                placeholder="Ex: Pix, boleto 30d"
                {...register("formaPagamento")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Observação geral</label>
              <input
                type="text"
                placeholder="Opcional"
                {...register("observacoes")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Itens do orçamento ({fields.length} {fields.length === 1 ? "peça" : "peças"})
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2.5 font-medium">Peça</th>
                  <th className="px-4 py-2.5 font-medium">Marca cotada</th>
                  <th className="px-4 py-2.5 text-center font-medium">Qtd</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor unit. (R$)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 text-center font-medium">Disponível</th>
                  <th className="px-4 py-2.5 font-medium">Obs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fields.map((field, i) => {
                  const qty = Number(watched.itens?.[i]?.quantidade) || 0;
                  const unit = Number(watched.itens?.[i]?.valorUnitario) || 0;
                  const disp = watched.itens?.[i]?.disponivel ?? true;
                  return (
                    <tr key={field.id} className={!disp ? "bg-red-50/50" : "hover:bg-gray-50/50"}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{field.pecaNome}</p>
                        <input type="hidden" {...register(`itens.${i}.cotacaoItemId`)} />
                        <input type="hidden" {...register(`itens.${i}.pecaNome`)} />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          {...register(`itens.${i}.marcaCotada`)}
                          placeholder="Marca"
                          className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          {...register(`itens.${i}.quantidade`, { valueAsNumber: true })}
                          className="w-16 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          {...register(`itens.${i}.valorUnitario`, { valueAsNumber: true })}
                          className="w-24 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {disp ? (
                          <span className="text-gray-900">{formatCurrency(qty * unit)}</span>
                        ) : (
                          <span className="text-gray-400 line-through">{formatCurrency(qty * unit)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          {...register(`itens.${i}.disponivel`)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          {...register(`itens.${i}.observacao`)}
                          placeholder="Observação"
                          className="w-32 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 sm:hidden">
            {fields.map((field, i) => {
              const qty = Number(watched.itens?.[i]?.quantidade) || 0;
              const unit = Number(watched.itens?.[i]?.valorUnitario) || 0;
              const disp = watched.itens?.[i]?.disponivel ?? true;
              return (
                <div key={field.id} className={`p-4 ${!disp ? "bg-red-50/50" : ""}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-medium text-gray-900">{field.pecaNome}</p>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500">
                      <input type="checkbox" {...register(`itens.${i}.disponivel`)} className="h-4 w-4 rounded" />
                      Disponível
                    </label>
                  </div>
                  <input type="hidden" {...register(`itens.${i}.cotacaoItemId`)} />
                  <input type="hidden" {...register(`itens.${i}.pecaNome`)} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Marca</label>
                      <input {...register(`itens.${i}.marcaCotada`)} placeholder="Marca"
                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Qtd</label>
                      <input type="number" min={0} step={1} {...register(`itens.${i}.quantidade`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Valor unit. (R$)</label>
                      <input type="number" min={0} step="0.01" {...register(`itens.${i}.valorUnitario`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Total</label>
                      <div className={`flex h-[34px] items-center rounded-md border border-gray-100 px-2 text-sm font-semibold ${disp ? "text-blue-700" : "text-gray-400"}`}>
                        {formatCurrency(disp ? qty * unit : 0)}
                      </div>
                    </div>
                  </div>
                  <input {...register(`itens.${i}.observacao`)} placeholder="Observação"
                    className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500" />
                </div>
              );
            })}
          </div>

          {/* Totals footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total itens: <strong>{formatCurrency(totalItens)}</strong></span>
              <span>Frete: <strong>{formatCurrency(Number(watched.valorFrete) || 0)}</strong></span>
            </div>
            <span className="text-base font-bold text-gray-900">Total geral: {formatCurrency(totalGeral)}</span>
          </div>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => save("rascunho")}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Salvar rascunho
            </button>
            <button
              type="button"
              onClick={() => save("confirmar")}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {saving ? "Salvando..." : "Confirmar orçamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
