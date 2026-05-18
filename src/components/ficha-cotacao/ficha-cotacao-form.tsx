"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Plus, Trash2, Printer } from "lucide-react";

type FichaItem = {
  nome: string;
  quantidade: string;
  precoUnitario: string;
  observacao: string;
};

type FichaFormValues = {
  dataPedido: string;
  veiculo: string;
  placa: string;
  solicitante: string;
  fornecedor: string;
  tipo: "particular_loja" | "loja" | "consignado" | "fazenda";
  itens: FichaItem[];
  diasEntrega: string;
  frete: string;
  pgAVista: boolean;
  pgPix: boolean;
  pgCredito: boolean;
  pgParcelado: boolean;
  pgParceladoQtd: string;
  pgParceladoCredito: boolean;
  observacoes: string;
  assServico: string;
  assPagamento: string;
  assPreparacao: string;
  assPosVenda: string;
  assData: string;
};

const TIPOS = [
  { value: "particular_loja" as const, label: "Particular Loja" },
  { value: "loja" as const, label: "Loja" },
  { value: "consignado" as const, label: "Consignado" },
  { value: "fazenda" as const, label: "Fazenda" },
];

const parseDecimal = (s: string) =>
  parseFloat(String(s).replace(",", ".")) || 0;

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FichaInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-transparent border-b border-gray-400 focus:border-blue-500 focus:outline-none px-1 py-0.5 text-sm leading-snug ${className}`}
    />
  );
}

export function FichaCotacaoForm() {
  const today = new Date().toLocaleDateString("pt-BR");

  const { register, control } = useForm<FichaFormValues>({
    defaultValues: {
      dataPedido: today,
      veiculo: "",
      placa: "",
      solicitante: "",
      fornecedor: "",
      tipo: "loja",
      itens: [{ nome: "", quantidade: "1", precoUnitario: "", observacao: "" }],
      diasEntrega: "",
      frete: "0,00",
      pgAVista: false,
      pgPix: false,
      pgCredito: false,
      pgParcelado: false,
      pgParceladoQtd: "",
      pgParceladoCredito: false,
      observacoes: "",
      assServico: "",
      assPagamento: "",
      assPreparacao: "",
      assPosVenda: "",
      assData: today,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const watchedItens = useWatch({ control, name: "itens" });
  const watchedFrete = useWatch({ control, name: "frete" });
  const pgParcelado = useWatch({ control, name: "pgParcelado" });

  const subtotais = watchedItens.map((item) => {
    const qty = parseDecimal(item.quantidade);
    const price = parseDecimal(item.precoUnitario);
    return qty * price;
  });
  const totalItens = subtotais.reduce((a, b) => a + b, 0);
  const totalGeral = totalItens + parseDecimal(watchedFrete);

  return (
    <div>
      {/* Page controls — hidden on print */}
      <div className="no-print mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ficha de Cotação de Peças</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Preencha os dados e clique em Imprimir para gerar o formulário físico.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>
      </div>

      {/* ── The ficha — this div becomes the print area ───────────────────── */}
      <div className="print-area bg-white rounded-lg shadow border border-gray-200 p-6 max-w-4xl mx-auto">

        {/* Title */}
        <div className="text-center mb-4">
          <p className="text-base font-bold uppercase tracking-widest leading-tight">
            Cotação de Peças para Pakito Veículos
          </p>
        </div>

        {/* Row 1: Data / Veículo / Placa */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wide">
              Data do Pedido
            </label>
            <FichaInput {...register("dataPedido")} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wide">
              Veículo
            </label>
            <FichaInput {...register("veiculo")} placeholder="Modelo / ano" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wide">
              Placa
            </label>
            <FichaInput
              {...register("placa")}
              placeholder="AAA-0000"
              className="uppercase"
            />
          </div>
        </div>

        {/* Row 2: Solicitante / Fornecedor */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wide">
              Solicitante
            </label>
            <FichaInput {...register("solicitante")} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wide">
              Fornecedor
            </label>
            <FichaInput {...register("fornecedor")} />
          </div>
        </div>

        {/* Row 3: Tipo */}
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wide">
            Tipo:
          </span>
          {TIPOS.map((t) => (
            <label key={t.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                value={t.value}
                {...register("tipo")}
                className="accent-blue-600"
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>

        <hr className="border-gray-300 mb-3" />

        {/* Items table */}
        <div className="mb-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-2 py-1 text-center text-[10px] font-bold uppercase w-8">
                  #
                </th>
                <th className="border border-gray-400 bg-gray-100 px-2 py-1 text-left text-[10px] font-bold uppercase">
                  Nome da Peça
                </th>
                <th className="border border-gray-400 bg-gray-100 px-2 py-1 text-center text-[10px] font-bold uppercase w-16">
                  Qtd
                </th>
                <th className="border border-gray-400 bg-gray-100 px-2 py-1 text-center text-[10px] font-bold uppercase w-28">
                  Preço Unit.
                </th>
                <th className="border border-gray-400 bg-gray-100 px-2 py-1 text-center text-[10px] font-bold uppercase w-28">
                  Subtotal
                </th>
                <th className="border border-gray-400 bg-gray-100 px-2 py-1 text-left text-[10px] font-bold uppercase">
                  Observação
                </th>
                {/* Delete col — hidden on print */}
                <th className="no-print border border-gray-400 bg-gray-100 w-8" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 text-center text-xs text-gray-400 select-none">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-1 py-0.5">
                    <FichaInput
                      {...register(`itens.${index}.nome`)}
                      placeholder="Nome da peça"
                    />
                  </td>
                  <td className="border border-gray-300 px-1 py-0.5">
                    <FichaInput
                      {...register(`itens.${index}.quantidade`)}
                      inputMode="numeric"
                      placeholder="1"
                      className="text-center"
                    />
                  </td>
                  <td className="border border-gray-300 px-1 py-0.5">
                    <FichaInput
                      {...register(`itens.${index}.precoUnitario`)}
                      inputMode="decimal"
                      placeholder="0,00"
                      className="text-right"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right text-xs tabular-nums font-medium">
                    {brl(subtotais[index] ?? 0)}
                  </td>
                  <td className="border border-gray-300 px-1 py-0.5">
                    <FichaInput
                      {...register(`itens.${index}.observacao`)}
                      placeholder="—"
                    />
                  </td>
                  <td className="no-print border border-gray-300 px-1 py-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={() =>
              append({ nome: "", quantidade: "1", precoUnitario: "", observacao: "" })
            }
            className="no-print mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar item
          </button>
        </div>

        <hr className="border-gray-300 mb-3" />

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wide">
              Dias p/ entrega
            </label>
            <FichaInput
              {...register("diasEntrega")}
              inputMode="numeric"
              placeholder="—"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5 tracking-wide">
              Frete (R$)
            </label>
            <FichaInput
              {...register("frete")}
              inputMode="decimal"
              placeholder="0,00"
              className="text-right"
            />
          </div>
          <div className="flex flex-col justify-end">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wide">
              Preço Total
            </span>
            <span className="text-xl font-extrabold tabular-nums text-gray-900 leading-tight">
              {brl(totalGeral)}
            </span>
          </div>
        </div>

        <hr className="border-gray-300 mb-3" />

        {/* Payment */}
        <div className="mb-4 text-sm">
          <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-2">
            Forma de Pagamento
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {(
              [
                ["pgAVista", "À vista"],
                ["pgPix", "Pix"],
                ["pgCredito", "Crédito"],
              ] as const
            ).map(([name, label]) => (
              <label key={name} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register(name)}
                  className="accent-blue-600 h-3.5 w-3.5"
                />
                <span>{label}</span>
              </label>
            ))}

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                {...register("pgParcelado")}
                className="accent-blue-600 h-3.5 w-3.5"
              />
              <span>Parcelado em</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                {...register("pgParceladoQtd")}
                type="number"
                min="1"
                max="24"
                disabled={!pgParcelado}
                placeholder="—"
                className="w-12 bg-transparent border-b border-gray-400 text-center text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40 transition-opacity"
              />
              <span>vezes</span>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                {...register("pgParceladoCredito")}
                className="accent-blue-600 h-3.5 w-3.5"
              />
              <span>Parcelado Crédito</span>
            </label>
          </div>
        </div>

        {/* Observations */}
        <div className="mb-5 text-sm">
          <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1">
            Observações
          </label>
          <textarea
            {...register("observacoes")}
            rows={3}
            placeholder="Observações gerais sobre o orçamento..."
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <hr className="border-gray-300 mb-4" />

        {/* Signatures */}
        <div className="grid grid-cols-5 gap-3 text-sm">
          {(
            [
              ["assServico", "Ass. Serviço"],
              ["assPagamento", "Ass. Pagamento"],
              ["assPreparacao", "Preparação"],
              ["assPosVenda", "Pós-Venda"],
              ["assData", "Data"],
            ] as const
          ).map(([name, label]) => (
            <div key={name} className="flex flex-col">
              <div className="h-10 flex items-end">
                <FichaInput {...register(name)} className="text-center" />
              </div>
              <span className="mt-1.5 text-center text-[10px] font-semibold uppercase text-gray-500 tracking-wide border-t border-gray-400 pt-1">
                {label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
