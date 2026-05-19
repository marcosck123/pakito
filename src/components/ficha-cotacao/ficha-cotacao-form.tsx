"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Plus, Trash2, Printer } from "lucide-react";

type FichaItem = {
  nome: string;
  precoUnitario: string;
  precoSubtotal: string;
};

type FichaFormValues = {
  dataDia: string;
  dataMes: string;
  dataAno: string;
  veiculoPlaca: string;
  tipo: "particular_loja" | "loja" | "consignado" | "fazenda";
  fornecedor: string;
  itens: FichaItem[];
  diasEntrega: string;
  frete: string;
  pgParcelado: boolean;
  pgParceladoQtd: string;
  pgAVista: boolean;
  pgCredito: boolean;
  pgParceladoCredito: boolean;
  observacoes: string;
  assServico: string;
  assPagamento: string;
  preparacao: boolean;
  posVenda: boolean;
  dataAssDia: string;
  dataAssMes: string;
  dataAssAno: string;
};

const parseBRL = (s: string) =>
  parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Input that looks like an underlined field inside a table cell
function LineInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`bg-transparent focus:outline-none text-xs w-full ${className}`}
    />
  );
}

export function FichaCotacaoForm() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = String(today.getFullYear());

  const { register, control } = useForm<FichaFormValues>({
    defaultValues: {
      dataDia: dd,
      dataMes: mm,
      dataAno: yyyy,
      veiculoPlaca: "",
      tipo: "loja",
      fornecedor: "",
      // Start with 5 blank rows matching the physical form
      itens: Array.from({ length: 5 }, () => ({
        nome: "",
        precoUnitario: "",
        precoSubtotal: "",
      })),
      diasEntrega: "",
      frete: "",
      pgParcelado: false,
      pgParceladoQtd: "",
      pgAVista: false,
      pgCredito: false,
      pgParceladoCredito: false,
      observacoes: "",
      assServico: "",
      assPagamento: "",
      preparacao: false,
      posVenda: false,
      dataAssDia: dd,
      dataAssMes: mm,
      dataAssAno: yyyy,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const watchedItens = useWatch({ control, name: "itens" });
  const watchedFrete = useWatch({ control, name: "frete" });
  const pgParcelado = useWatch({ control, name: "pgParcelado" });

  // PREÇO TOTAL = sum of all manually-entered subtotals + frete (matches physical form)
  const totalItens = watchedItens.reduce(
    (acc, item) => acc + parseBRL(item.precoSubtotal),
    0
  );
  const totalGeral = totalItens + parseBRL(watchedFrete);

  // Shared cell/input styles
  const cell = "border border-black";
  const hdr = "font-bold uppercase text-[10px] tracking-wide";
  const dateInput = (field: "dataDia" | "dataMes" | "dataAno" | "dataAssDia" | "dataAssMes" | "dataAssAno", maxLen: number, w: string) => (
    <input
      {...register(field)}
      maxLength={maxLen}
      className={`${w} text-center border-b border-black bg-transparent focus:outline-none text-xs`}
    />
  );

  return (
    <div>
      {/* ── Screen controls ──────────────────────────────────────────────── */}
      <div className="no-print mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ficha de Cotação de Peças</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Preencha e clique em Imprimir para gerar a folha física.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>
      </div>

      {/* ── The ficha — becomes the print-area ───────────────────────────── */}
      <div className="print-area bg-white max-w-3xl mx-auto shadow-md border-2 border-black">
        <table className="w-full border-collapse">
          <tbody>

            {/* ── Title ─────────────────────────────────────────────────── */}
            <tr>
              <td
                colSpan={4}
                className={`${cell} text-center py-1.5 font-bold uppercase tracking-widest text-sm`}
              >
                COTAÇÃO DE PEÇAS PARA PAKITO VEÍCULOS
              </td>
            </tr>

            {/* ── Data do pedido ────────────────────────────────────────── */}
            <tr>
              <td colSpan={4} className={`${cell} text-center py-1 ${hdr}`}>
                DATA DO PEDIDO:&ensp;
                {dateInput("dataDia", 2, "w-5")}
                {" / "}
                {dateInput("dataMes", 2, "w-5")}
                {" / "}
                {dateInput("dataAno", 4, "w-9")}
              </td>
            </tr>

            {/* ── Veículo/Placa + Tipo row 1 ───────────────────────────── */}
            <tr>
              <td colSpan={2} rowSpan={2} className={`${cell} p-1.5 align-top`}>
                <div className={hdr}>VEÍCULO/PLACA:</div>
                <LineInput {...register("veiculoPlaca")} className="mt-1 border-b border-gray-400" />
              </td>
              <td colSpan={2} className={`${cell} p-1.5`}>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      value="particular_loja"
                      {...register("tipo")}
                      className="accent-black"
                    />
                    <span className={hdr}>PARTICULAR LOJA</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      value="loja"
                      {...register("tipo")}
                      className="accent-black"
                    />
                    <span className={hdr}>LOJA</span>
                  </label>
                </div>
              </td>
            </tr>

            {/* ── Tipo row 2 ────────────────────────────────────────────── */}
            <tr>
              <td colSpan={2} className={`${cell} p-1.5`}>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      value="consignado"
                      {...register("tipo")}
                      className="accent-black"
                    />
                    <span className={hdr}>CONSIGNADO</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      value="fazenda"
                      {...register("tipo")}
                      className="accent-black"
                    />
                    <span className={hdr}>FAZENDA</span>
                  </label>
                </div>
              </td>
            </tr>

            {/* ── Items header (FORNECEDOR rowspan covers header + all item rows) */}
            <tr>
              <td
                rowSpan={fields.length + 1}
                className={`${cell} p-1.5 align-top w-[22%]`}
              >
                <div className={hdr}>FORNECEDOR:</div>
                <textarea
                  {...register("fornecedor")}
                  rows={Math.max(fields.length, 3)}
                  className="mt-1 w-full bg-transparent focus:outline-none text-xs resize-none leading-relaxed"
                />
              </td>
              <td className={`${cell} p-1.5 ${hdr}`}>NOME DA PEÇA:</td>
              <td className={`${cell} p-1.5 ${hdr} text-center w-[20%]`}>PREÇO UNITÁRIO</td>
              <td className={`${cell} p-1.5 ${hdr} text-center w-[20%]`}>PREÇO SUBTOTAL</td>
            </tr>

            {/* ── Item rows (dynamic) ───────────────────────────────────── */}
            {fields.map((field, index) => (
              <tr key={field.id} className="group">
                {/* NOME DA PEÇA — delete button overlaid, hidden on print */}
                <td className={`${cell} px-1.5 py-1 relative`}>
                  <LineInput
                    {...register(`itens.${index}.nome`)}
                    className="pr-5"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    className="no-print absolute right-1 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-600 disabled:opacity-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover linha"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
                <td className={`${cell} px-1.5 py-1`}>
                  <LineInput
                    {...register(`itens.${index}.precoUnitario`)}
                    inputMode="decimal"
                    placeholder="0,00"
                    className="text-right"
                  />
                </td>
                <td className={`${cell} px-1.5 py-1`}>
                  <LineInput
                    {...register(`itens.${index}.precoSubtotal`)}
                    inputMode="decimal"
                    placeholder="0,00"
                    className="text-right"
                  />
                </td>
              </tr>
            ))}

            {/* ── Add line button (hidden on print) ────────────────────── */}
            <tr className="no-print">
              <td colSpan={4} className="px-2 py-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() =>
                    append({ nome: "", precoUnitario: "", precoSubtotal: "" })
                  }
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar linha
                </button>
              </td>
            </tr>

            {/* ── Dias / Frete / Total ──────────────────────────────────── */}
            <tr>
              <td className={`${cell} p-1.5`}>
                <div className={hdr}>DIAS P/ ENTREGA:</div>
                <LineInput
                  {...register("diasEntrega")}
                  inputMode="numeric"
                  className="mt-1 border-b border-gray-400"
                />
              </td>
              <td className={`${cell} p-1.5`} />
              <td className={`${cell} p-1.5`}>
                <div className={hdr}>FRETE:</div>
                <LineInput
                  {...register("frete")}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="mt-1 text-right border-b border-gray-400"
                />
              </td>
              <td className={`${cell} p-1.5`}>
                <div className={hdr}>PREÇO TOTAL</div>
                <div className="mt-1 text-sm font-extrabold tabular-nums text-right">
                  {brl(totalGeral)}
                </div>
              </td>
            </tr>

            {/* ── Formas de pagamento ───────────────────────────────────── */}
            <tr>
              <td className={`${cell} p-1.5 align-top`}>
                <div className={hdr}>FORMAS DE PAGAMENTO:</div>
                {/* Signature line in the payment cell, matching the physical form */}
                <div className="mt-8 border-t border-black w-full" />
              </td>

              <td colSpan={2} className={`${cell} p-1.5 align-top space-y-1.5`}>
                {/* PARCELADO EM QUANTAS VEZES */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="checkbox"
                    {...register("pgParcelado")}
                    className="h-3 w-3 accent-black"
                  />
                  <span className={hdr}>PARCELADO EM QUANTAS VEZES</span>
                  <input
                    {...register("pgParceladoQtd")}
                    maxLength={2}
                    inputMode="numeric"
                    disabled={!pgParcelado}
                    className="w-8 border-b border-black bg-transparent text-xs text-center focus:outline-none disabled:opacity-30"
                  />
                </div>

                {/* A VISTA / CRÉDITO */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("pgAVista")}
                      className="h-3 w-3 accent-black"
                    />
                    <span className={hdr}>A VISTA</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("pgCredito")}
                      className="h-3 w-3 accent-black"
                    />
                    <span className={hdr}>CRÉDITO</span>
                  </label>
                </div>

                {/* PARCELADO CRÉDITO */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    {...register("pgParceladoCredito")}
                    className="h-3 w-3 accent-black"
                  />
                  <span className={hdr}>PARCELADO CRÉDITO:</span>
                  <span className="flex-1 border-b border-black" />
                </div>
              </td>

              <td className={`${cell} p-1.5 align-top`}>
                <div className={hdr}>OBS.:</div>
                <textarea
                  {...register("observacoes")}
                  rows={4}
                  className="mt-0.5 w-full bg-transparent focus:outline-none text-xs resize-none"
                />
              </td>
            </tr>

            {/* ── Assinaturas ───────────────────────────────────────────── */}
            <tr>
              {/* ASS. SERVIÇO */}
              <td className={`${cell} p-1.5`}>
                <div className="h-7 flex items-end">
                  <LineInput
                    {...register("assServico")}
                    className="border-b border-gray-400"
                  />
                </div>
                <div className={`mt-0.5 ${hdr} text-center`}>ASS. SERVIÇO</div>
              </td>

              {/* ASS. PAGAMENTO */}
              <td className={`${cell} p-1.5`}>
                <div className="h-7 flex items-end">
                  <LineInput
                    {...register("assPagamento")}
                    className="border-b border-gray-400"
                  />
                </div>
                <div className={`mt-0.5 ${hdr} text-center`}>ASS. PAGAMENTO</div>
              </td>

              {/* PREPARAÇÃO / PÓS VENDA checkboxes */}
              <td className={`${cell} p-1.5 space-y-1`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("preparacao")}
                    className="h-3.5 w-3.5 accent-black"
                  />
                  <span className={hdr}>PREPARAÇÃO</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("posVenda")}
                    className="h-3.5 w-3.5 accent-black"
                  />
                  <span className={hdr}>PÓS VENDA</span>
                </label>
              </td>

              {/* Date */}
              <td className={`${cell} p-1.5 text-center`}>
                <div className="h-7 flex items-end justify-center gap-0.5">
                  {dateInput("dataAssDia", 2, "w-5")}
                  <span>/</span>
                  {dateInput("dataAssMes", 2, "w-5")}
                  <span>/</span>
                  {dateInput("dataAssAno", 4, "w-9")}
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}
