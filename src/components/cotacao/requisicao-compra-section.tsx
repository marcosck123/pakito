"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Printer, Plus, Trash2, Save, X, FileText, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { PurchaseRequisition, PurchaseRequisitionItem } from "@/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

type FormValues = {
  numero: string;
  data: string;
  solicitante: string;
  responsavel: string;
  observacaoGeral: string;
  itens: PurchaseRequisitionItem[];
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankItem(): PurchaseRequisitionItem {
  return { id: uid(), peca: "", quantidade: 1, valorUnitario: 0, observacao: "" };
}

function itemTotal(item: Pick<PurchaseRequisitionItem, "quantidade" | "valorUnitario">) {
  return (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0);
}

function totalGeral(itens: PurchaseRequisitionItem[]) {
  return itens.reduce((s, i) => s + itemTotal(i), 0);
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── preview ─────────────────────────────────────────────────────────────────

function RequisicaoPreview({
  values,
  cotacaoCodigo,
}: {
  values: FormValues;
  cotacaoCodigo: string;
}) {
  const itens = values.itens ?? [];
  const total = totalGeral(itens);

  return (
    <div className="print-area rounded-lg border border-gray-300 bg-white p-6 text-sm leading-relaxed">
      <div className="mb-5 border-b border-gray-800 pb-3 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-500">Referência: {cotacaoCodigo}</p>
        <h1 className="mt-1 text-base font-bold uppercase tracking-widest">Requisição de Compra</h1>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-1">
        <p><span className="font-semibold">Nº:</span> {values.numero || "—"}</p>
        <p><span className="font-semibold">Data:</span> {fmtDate(values.data)}</p>
        <p><span className="font-semibold">Solicitante da peça:</span> {values.solicitante || "—"}</p>
        <p><span className="font-semibold">Responsável / Dono:</span> {values.responsavel || "—"}</p>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-1.5 pr-3 text-left font-semibold">Item</th>
              <th className="py-1.5 pr-3 text-left font-semibold">Peça</th>
              <th className="py-1.5 px-3 text-center font-semibold">Qtd</th>
              <th className="py-1.5 px-3 text-right font-semibold">Valor Unit.</th>
              <th className="py-1.5 px-3 text-right font-semibold">Valor Total</th>
              <th className="py-1.5 pl-3 text-left font-semibold">Observação</th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-400">Nenhum item adicionado</td>
              </tr>
            ) : (
              itens.map((item, i) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-1.5 pr-3">{pad(i + 1)}</td>
                  <td className="py-1.5 pr-3 font-medium">{item.peca || <span className="text-gray-300">—</span>}</td>
                  <td className="py-1.5 px-3 text-center">{item.quantidade || 0}</td>
                  <td className="py-1.5 px-3 text-right">{formatCurrency(Number(item.valorUnitario) || 0)}</td>
                  <td className="py-1.5 px-3 text-right font-semibold">{formatCurrency(itemTotal(item))}</td>
                  <td className="py-1.5 pl-3 text-gray-600">{item.observacao || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800">
              <td colSpan={4} className="py-2 font-bold">Valor total geral</td>
              <td className="py-2 text-right font-bold">{formatCurrency(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {values.observacaoGeral && (
        <div className="mb-6">
          <p className="font-semibold">Observação geral:</p>
          <p className="mt-1 text-gray-700">{values.observacaoGeral}</p>
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-12">
        <div>
          <div className="border-b border-gray-800" />
          <p className="mt-1.5 text-center text-xs text-gray-500">Assinatura do solicitante da peça</p>
        </div>
        <div>
          <div className="border-b border-gray-800" />
          <p className="mt-1.5 text-center text-xs text-gray-500">Assinatura do responsável / dono</p>
        </div>
      </div>
    </div>
  );
}

// ─── field row ────────────────────────────────────────────────────────────────

function ItemRow({
  index,
  onRemove,
  canRemove,
  register,
  quantidade,
  valorUnitario,
  fornecedor,
}: {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  quantidade: number;
  valorUnitario: number;
  fornecedor?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Item {pad(index + 1)}</span>
          {fornecedor && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {fornecedor}
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600"
            title="Remover item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <input
          {...register(`itens.${index}.peca`, { required: true })}
          placeholder="Nome da peça *"
          className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-0.5 block text-xs text-gray-500">Qtd</label>
            <input
              type="number"
              min={1}
              step={1}
              {...register(`itens.${index}.quantidade`, { valueAsNumber: true, min: 1 })}
              className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-gray-500">Valor unit. (R$)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              {...register(`itens.${index}.valorUnitario`, { valueAsNumber: true, min: 0 })}
              className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-gray-500">Total</label>
            <div className="flex h-[34px] items-center rounded-md border border-gray-100 bg-white px-2.5 text-sm font-semibold text-blue-700">
              {formatCurrency(itemTotal({ quantidade, valorUnitario }))}
            </div>
          </div>
        </div>

        <input
          {...register(`itens.${index}.observacao`)}
          placeholder="Observação (opcional)"
          className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

// ─── section ─────────────────────────────────────────────────────────────────

interface Props {
  cotacaoId: string;
  cotacaoCodigo: string;
  userName: string;
  initialRequisition: PurchaseRequisition | null;
  autoOpen?: boolean;
  suggestedItems?: PurchaseRequisitionItem[];
  fornecedorNome?: string;
  defaultNumero?: string;
}

export function RequisicaoCompraSection({
  cotacaoId,
  cotacaoCodigo,
  userName,
  initialRequisition,
  autoOpen = false,
  suggestedItems,
  fornecedorNome,
  defaultNumero,
}: Props) {
  const [saved, setSaved] = useState<PurchaseRequisition | null>(initialRequisition);
  const [mode, setMode] = useState<"view" | "form">(() =>
    autoOpen && !initialRequisition ? "form" : "view"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const defaultNumber = defaultNumero ?? `RC-${cotacaoCodigo.replace("COT-", "")}`;
  const defaultItems = suggestedItems && suggestedItems.length > 0 ? suggestedItems : [blankItem()];

  const { register, control, watch, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: saved
      ? { numero: saved.numero, data: saved.data, solicitante: saved.solicitante, responsavel: saved.responsavel, observacaoGeral: saved.observacaoGeral, itens: saved.itens }
      : { numero: defaultNumber, data: today, solicitante: userName, responsavel: "", observacaoGeral: "", itens: defaultItems },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const watched = watch();

  function openCreate() {
    reset({ numero: defaultNumber, data: today, solicitante: userName, responsavel: "", observacaoGeral: "", itens: defaultItems });
    setError("");
    setMode("form");
  }

  function openEdit() {
    if (!saved) return;
    reset({ numero: saved.numero, data: saved.data, solicitante: saved.solicitante, responsavel: saved.responsavel, observacaoGeral: saved.observacaoGeral, itens: saved.itens });
    setError("");
    setMode("form");
  }

  function handleCancel() {
    setMode("view");
    setError("");
  }

  function handlePrint() {
    window.print();
  }

  async function onSubmit(data: FormValues) {
    const validItems = data.itens.filter((i) => i.peca.trim() !== "");
    if (validItems.length === 0) {
      setError("Adicione pelo menos 1 item com nome da peça.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        id: saved?.id,
        cotacaoId,
        cotacaoCodigo,
        fornecedorNome: fornecedorNome ?? "",
        numero: data.numero,
        data: data.data,
        solicitante: data.solicitante,
        responsavel: data.responsavel,
        observacaoGeral: data.observacaoGeral,
        itens: validItems,
        status: "GERADA" as const,
      };

      const res = await fetch("/api/purchase-requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha ao salvar.");

      const savedReq: PurchaseRequisition = await res.json();
      setSaved(savedReq);
      setMode("view");
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ── VIEW MODE ──────────────────────────────────────────────────────────────

  if (mode === "view") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">Requisição de Compra</h2>
            {fornecedorNome && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {fornecedorNome}
              </span>
            )}
          </div>

          {saved ? (
            <div className="flex gap-2">
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </button>
            </div>
          ) : (
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Criar requisição
            </button>
          )}
        </div>

        {saved ? (
          <div className="p-4">
            <RequisicaoPreview
              values={{ numero: saved.numero, data: saved.data, solicitante: saved.solicitante, responsavel: saved.responsavel, observacaoGeral: saved.observacaoGeral, itens: saved.itens }}
              cotacaoCodigo={cotacaoCodigo}
            />
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            Nenhuma requisição criada para esta cotação.
          </div>
        )}
      </div>
    );
  }

  // ── FORM MODE ──────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-800">
            {saved ? "Editar Requisição de Compra" : "Nova Requisição de Compra"}
          </h2>
          {fornecedorNome && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {fornecedorNome}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 p-4 xl:grid-cols-2">
          {/* ── LEFT: FORMULÁRIO ── */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Nº Requisição</label>
                <input
                  {...register("numero", { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Data</label>
                <input
                  type="date"
                  {...register("data", { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Solicitante da peça</label>
                <input
                  {...register("solicitante", { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Responsável / Dono</label>
                <input
                  {...register("responsavel")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Observação geral</label>
              <textarea
                {...register("observacaoGeral")}
                rows={2}
                placeholder="Observação opcional..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Itens */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Itens</span>
                <button
                  type="button"
                  onClick={() => append(blankItem())}
                  className="flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar item
                </button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <ItemRow
                    key={field.id}
                    index={index}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                    register={register}
                    quantidade={Number(watched.itens?.[index]?.quantidade) || 0}
                    valorUnitario={Number(watched.itens?.[index]?.valorUnitario) || 0}
                    fornecedor={watched.itens?.[index]?.fornecedor}
                  />
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                <span className="text-xs text-blue-700">{fields.length} {fields.length === 1 ? "item" : "itens"}</span>
                <span className="text-sm font-bold text-blue-800">
                  Total geral: {formatCurrency(totalGeral(watched.itens ?? []))}
                </span>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="flex gap-2 border-t border-gray-100 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar requisição"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </div>

          {/* ── RIGHT: PRÉVIA ── */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prévia em tempo real</span>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </button>
            </div>
            <RequisicaoPreview values={watched} cotacaoCodigo={cotacaoCodigo} />
          </div>
        </div>
      </form>
    </div>
  );
}
