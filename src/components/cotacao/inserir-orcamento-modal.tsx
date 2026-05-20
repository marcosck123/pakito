"use client";

import { useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  X,
  FileText,
  ScanLine,
  Camera,
  CheckCircle,
  Save,
  Upload,
  AlertTriangle,
  AlertCircle,
  EyeOff,
  ClipboardCopy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { CotacaoItem, Fornecedor, Orcamento } from "@/types";
import type { ExtractedItem } from "@/lib/pdf/parser";

const SHOW_PDF_DEBUG = process.env.NEXT_PUBLIC_SHOW_PDF_DEBUG === "true";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "method" | "pdf-upload" | "pdf-review" | "image-upload" | "form";

type PdfDebug = {
  requestId?: string;
  reason?: string;
  step?: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  bufferLength?: number | null;
  textLength?: number | null;
  textPreview?: string | null;
  parseError?: string | null;
  itemsFound?: number | null;
};

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

type ReviewItem = {
  id: string;
  linhaOriginal: string;
  nomeExtraido: string;
  cotacaoItemId: string;
  marcaCotada: string;
  quantidade: string;
  valorUnitario: string;
  confianca: number;
  observacao: string;
  ignorar: boolean;
};

type PdfGeneralFields = {
  dataOrcamento: string;
  validadePropostaDias: string;
  prazoEntrega: string;
  valorFrete: string;
  formaPagamento: string;
  observacoes: string;
};

interface Props {
  cotacaoId: string;
  fornecedorCotacaoId: string;
  fornecedor: Fornecedor;
  cotacaoItens: CotacaoItem[];
  existingOrcamento: Orcamento | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceBadge(c: number) {
  if (c >= 0.8) return { label: "Alta", cls: "bg-green-100 text-green-700" };
  if (c >= 0.5) return { label: "Média", cls: "bg-amber-100 text-amber-700" };
  return { label: "Baixa", cls: "bg-red-100 text-red-700" };
}

const today = new Date().toISOString().slice(0, 10);

// ── PdfErrorPanel ─────────────────────────────────────────────────────────────

function PdfErrorPanel({
  error,
  debug,
  rawText,
  expanded,
  onToggleExpand,
  onUseManual,
}: {
  error: string;
  debug: PdfDebug | null;
  rawText: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onUseManual: () => void;
}) {
  const isSoftFallback = debug?.reason === "parser_no_items";
  const borderCls = isSoftFallback ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50";
  const iconCls = isSoftFallback ? "text-amber-500" : "text-red-500";
  const textCls = isSoftFallback ? "text-amber-800" : "text-red-800";

  function copyDiag() {
    const payload = {
      requestId: debug?.requestId,
      reason: debug?.reason,
      step: debug?.step,
      fileName: debug?.fileName,
      fileType: debug?.fileType,
      fileSize: debug?.fileSize,
      bufferLength: debug?.bufferLength,
      textLength: debug?.textLength,
      parseError: debug?.parseError,
      textPreview: debug?.textPreview?.slice(0, 500) ?? null,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => null);
  }

  return (
    <div className={`rounded-lg border ${borderCls} px-4 py-3 text-sm ${textCls} space-y-3`}>
      {/* User-facing message */}
      <div className="flex items-start gap-2">
        <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${iconCls}`} />
        <span>{error}</span>
      </div>

      {/* Raw text fallback */}
      {rawText && (
        <div className="space-y-2">
          <p className="text-xs font-semibold">Texto extraído do PDF (use como referência):</p>
          <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-md bg-white border border-amber-200 px-3 py-2 text-xs text-gray-700 font-mono">
            {rawText.slice(0, 1500)}
          </pre>
          <button
            onClick={onUseManual}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <FileText className="h-3.5 w-3.5" />
            Preencher manualmente com este texto como apoio
          </button>
        </div>
      )}

      {/* Debug panel — always shown when SHOW_PDF_DEBUG=true, otherwise collapsible */}
      {debug && (
        <div>
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs font-medium opacity-70 hover:opacity-100"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {SHOW_PDF_DEBUG ? "Diagnóstico técnico" : "Ver diagnóstico técnico"}
          </button>

          {(expanded || SHOW_PDF_DEBUG) && (
            <div className="mt-2 space-y-2">
              <div className="rounded-md bg-white border border-gray-200 px-3 py-2 font-mono text-xs text-gray-800 space-y-0.5">
                {[
                  ["requestId", debug.requestId],
                  ["reason", debug.reason],
                  ["step", debug.step],
                  ["fileName", debug.fileName],
                  ["fileType", debug.fileType],
                  ["fileSize", debug.fileSize != null ? `${debug.fileSize} bytes` : null],
                  ["bufferLength", debug.bufferLength != null ? `${debug.bufferLength} bytes` : null],
                  ["textLength", debug.textLength],
                  ["itemsFound", debug.itemsFound],
                  ["parseError", debug.parseError],
                  ["textPreview", debug.textPreview ? debug.textPreview.slice(0, 200) + "…" : null],
                ]
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => (
                    <div key={k as string} className="flex gap-2">
                      <span className="text-gray-400 shrink-0 w-28">{k as string}:</span>
                      <span className="text-gray-700 break-all">{String(v)}</span>
                    </div>
                  ))}
              </div>
              <button
                onClick={copyDiag}
                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
                Copiar diagnóstico
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InserirOrcamentoModal({
  cotacaoId,
  fornecedorCotacaoId,
  fornecedor,
  cotacaoItens,
  existingOrcamento,
  onClose,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(existingOrcamento ? "form" : "method");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfRawText, setPdfRawText] = useState("");
  const [pdfDebug, setPdfDebug] = useState<PdfDebug | null>(null);
  const [debugExpanded, setDebugExpanded] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const [imageDebug, setImageDebug] = useState<PdfDebug | null>(null);
  const [imageDebugExpanded, setImageDebugExpanded] = useState(false);
  const [imageRawText, setImageRawText] = useState<string>("");

  // PDF review state
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [pdfGeneral, setPdfGeneral] = useState<PdfGeneralFields>({
    dataOrcamento: today,
    validadePropostaDias: "",
    prazoEntrega: "",
    valorFrete: "0",
    formaPagamento: "",
    observacoes: "",
  });

  // ── Manual form ────────────────────────────────────────────────────────────

  const defaultItens: ItemForm[] = existingOrcamento
    ? existingOrcamento.itens.map((oi) => ({
        cotacaoItemId: oi.cotacaoItemId,
        pecaNome:
          oi.peca?.nome ??
          cotacaoItens.find((ci) => ci.id === oi.cotacaoItemId)?.peca?.nome ??
          "",
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
    (sum, item) =>
      sum +
      (item.disponivel
        ? (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0)
        : 0),
    0
  );
  const totalGeral = totalItens + (Number(watched.valorFrete) || 0);

  async function saveManual(action: "rascunho" | "confirmar") {
    const values = watched;
    if (action === "confirmar") {
      const valid = (values.itens ?? []).filter(
        (i) => i.pecaNome && (Number(i.quantidade) || 0) > 0
      );
      if (valid.length === 0) {
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

  // ── PDF upload ─────────────────────────────────────────────────────────────

  async function processPdf() {
    if (!pdfFile) return;
    setPdfLoading(true);
    setPdfError("");
    setPdfRawText("");
    setPdfDebug(null);
    setDebugExpanded(false);
    try {
      const fd = new FormData();
      fd.append("file", pdfFile);
      fd.append("cotacaoId", cotacaoId);
      const res = await fetch("/api/orcamentos/parse-pdf", {
        method: "POST",
        body: fd,
      });

      // Always parse body — error responses also carry debug JSON
      const data = await res.json().catch(() => null);

      // Hard failures (400 / 422 / 500)
      if (!res.ok) {
        console.error("[parse-pdf frontend error]", data);
        const debug: PdfDebug = {
          requestId: data?.requestId,
          reason: data?.reason,
          ...(data?.debug ?? {}),
        };
        setPdfDebug(debug);
        setPdfError(data?.error ?? "Erro ao processar PDF.");
        return;
      }

      // Pre-fill frete if detected
      if (data?.freteDetectado != null && data.freteDetectado > 0) {
        setPdfGeneral((p) => ({ ...p, valorFrete: String(data.freteDetectado) }));
      }

      // Soft fallback: text extracted but parser found no items
      if (data?.requiresManualReview) {
        setPdfRawText(data.rawText ?? "");
        setPdfDebug({ requestId: data.requestId, reason: data.reason, ...(data.debug ?? {}) });
        setPdfError(data.message ?? "Nenhum item identificado automaticamente. Confira o texto e preencha manualmente.");
        return;
      }

      const extracted: ExtractedItem[] = data?.itens ?? [];
      setReviewItems(
        extracted.map((item, i) => ({
          id: `ri-${i}`,
          linhaOriginal: item.linhaOriginal,
          nomeExtraido: item.nomeExtraido,
          cotacaoItemId: item.pecaSugeridaId ?? "",
          marcaCotada: "",
          quantidade: item.quantidade != null ? String(item.quantidade) : "",
          valorUnitario: item.valorUnitario != null ? String(item.valorUnitario) : "",
          confianca: item.confianca,
          observacao: "",
          ignorar: false,
        }))
      );
      setStep("pdf-review");
    } catch {
      setPdfError("Erro de comunicação com o servidor. Tente novamente.");
    } finally {
      setPdfLoading(false);
    }
  }

  // ── Image upload ───────────────────────────────────────────────────────────

  async function processImage() {
    if (!imageFile) return;
    setImageLoading(true);
    setImageError("");
    setImageRawText("");
    setImageDebug(null);
    setImageDebugExpanded(false);
    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("cotacaoId", cotacaoId);
      const res = await fetch("/api/orcamentos/parse-image", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("[parse-image frontend error]", data);
        const debug: PdfDebug = {
          requestId: data?.requestId,
          reason: data?.reason,
          ...(data?.debug ?? {}),
        };
        setImageDebug(debug);
        setImageError(data?.error ?? "Erro ao processar imagem.");
        return;
      }

      if (data?.freteDetectado != null && data.freteDetectado > 0) {
        setPdfGeneral((p) => ({ ...p, valorFrete: String(data.freteDetectado) }));
      }

      if (data?.requiresManualReview) {
        setImageRawText(data.rawText ?? "");
        setImageDebug({ requestId: data.requestId, reason: data.reason, ...(data.debug ?? {}) });
        setImageError(data.message ?? "Nenhum item identificado automaticamente. Confira o texto e preencha manualmente.");
        return;
      }

      const extracted: ExtractedItem[] = data?.itens ?? [];
      setReviewItems(
        extracted.map((item, i) => ({
          id: `ri-${i}`,
          linhaOriginal: item.linhaOriginal,
          nomeExtraido: item.nomeExtraido,
          cotacaoItemId: item.pecaSugeridaId ?? "",
          marcaCotada: "",
          quantidade: item.quantidade != null ? String(item.quantidade) : "",
          valorUnitario: item.valorUnitario != null ? String(item.valorUnitario) : "",
          confianca: item.confianca,
          observacao: "",
          ignorar: false,
        }))
      );
      setStep("pdf-review");
    } catch {
      setImageError("Erro de comunicação com o servidor. Tente novamente.");
    } finally {
      setImageLoading(false);
    }
  }

  // ── PDF confirm ────────────────────────────────────────────────────────────

  async function confirmPdf() {
    const active = reviewItems.filter((r) => !r.ignorar && r.cotacaoItemId);
    if (active.length === 0) {
      setError("Vincule pelo menos 1 item a uma peça da cotação antes de confirmar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        action: "confirmar",
        cotacaoId,
        fornecedorId: fornecedor.id,
        fornecedorCotacaoId,
        dataOrcamento: pdfGeneral.dataOrcamento,
        validadePropostaDias: pdfGeneral.validadePropostaDias || undefined,
        prazoEntrega: pdfGeneral.prazoEntrega || undefined,
        valorFrete: Number(pdfGeneral.valorFrete) || 0,
        formaPagamento: pdfGeneral.formaPagamento || undefined,
        observacoes: pdfGeneral.observacoes || undefined,
        itens: active.map((r) => ({
          cotacaoItemId: r.cotacaoItemId,
          marcaCotada: r.marcaCotada || undefined,
          quantidade: Number(r.quantidade) || 0,
          valorUnitario: Number(r.valorUnitario) || 0,
          disponivel: true,
          observacao: r.observacao || undefined,
        })),
      };
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      onClose();
    } catch {
      setError("Erro ao salvar orçamento. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function updateReviewItem<K extends keyof ReviewItem>(id: string, key: K, value: ReviewItem[K]) {
    setReviewItems((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  // ── Renders ────────────────────────────────────────────────────────────────

  // METHOD SELECTION
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
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStep("form")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-center transition-colors hover:bg-blue-100"
              >
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Inserir manualmente</p>
                  <p className="mt-0.5 text-xs text-blue-600">Preencher formulário</p>
                </div>
              </button>
              <button
                onClick={() => setStep("pdf-upload")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4 text-center transition-colors hover:bg-emerald-100"
              >
                <ScanLine className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">Escanear PDF</p>
                  <p className="mt-0.5 text-xs text-emerald-600">PDF com texto selecionável</p>
                </div>
              </button>
              <button
                onClick={() => setStep("image-upload")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-violet-500 bg-violet-50 p-4 text-center transition-colors hover:bg-violet-100"
              >
                <Camera className="h-8 w-8 text-violet-600" />
                <div>
                  <p className="font-semibold text-violet-900 text-sm">Escanear foto</p>
                  <p className="mt-0.5 text-xs text-violet-600">OCR via imagem</p>
                </div>
              </button>
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

  // PDF UPLOAD
  if (step === "pdf-upload") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Escanear PDF de orçamento</h2>
              <p className="text-sm text-gray-500">{fornecedor.nome}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Apenas PDFs com texto selecionável são suportados. PDFs escaneados (imagem) não funcionarão.</span>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                pdfFile
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <Upload className={`h-8 w-8 ${pdfFile ? "text-emerald-600" : "text-gray-400"}`} />
              {pdfFile ? (
                <div className="text-center">
                  <p className="font-medium text-emerald-800">{pdfFile.name}</p>
                  <p className="text-xs text-emerald-600">
                    {(pdfFile.size / 1024).toFixed(0)} KB · Clique para trocar
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium text-gray-700">Clique para selecionar o PDF</p>
                  <p className="text-xs text-gray-400">Apenas arquivos .pdf</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setPdfFile(f); setPdfError(""); }
                }}
              />
            </div>

            {pdfError && (
              <PdfErrorPanel
                error={pdfError}
                debug={pdfDebug}
                rawText={pdfRawText}
                expanded={debugExpanded}
                onToggleExpand={() => setDebugExpanded((v) => !v)}
                onUseManual={() => setStep("form")}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => setStep("method")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={processPdf}
              disabled={!pdfFile || pdfLoading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <ScanLine className="h-4 w-4" />
              {pdfLoading ? "Processando..." : "Processar PDF"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PDF REVIEW
  if (step === "pdf-review") {
    const activeCount = reviewItems.filter((r) => !r.ignorar && r.cotacaoItemId).length;
    const reviewTotal = reviewItems
      .filter((r) => !r.ignorar)
      .reduce((s, r) => s + (Number(r.quantidade) || 0) * (Number(r.valorUnitario) || 0), 0);
    const reviewTotalFinal = reviewTotal + (Number(pdfGeneral.valorFrete) || 0);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-10">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Conferir itens extraídos do PDF</h1>
              <p className="text-sm text-gray-500">{fornecedor.nome} · {reviewItems.length} linhas detectadas</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            Verifique cada item extraído, corrija se necessário e vincule à peça correta da cotação. Itens sem vínculo serão ignorados.
          </div>

          {/* General fields (compact) */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Dados gerais do orçamento</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  { key: "dataOrcamento" as const, label: "Data *", type: "date", placeholder: "" },
                  { key: "valorFrete" as const, label: "Frete (R$)", type: "number", placeholder: "" },
                  { key: "prazoEntrega" as const, label: "Prazo entrega", type: "text", placeholder: "Ex: 3 dias" },
                  { key: "formaPagamento" as const, label: "Pagamento", type: "text", placeholder: "Ex: Pix" },
                  { key: "validadePropostaDias" as const, label: "Validade (dias)", type: "number", placeholder: "" },
                  { key: "observacoes" as const, label: "Observação", type: "text", placeholder: "Opcional" },
                ]
              ).map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={pdfGeneral[key]}
                    onChange={(e) => setPdfGeneral((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Review table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Itens detectados ({reviewItems.length}) · {activeCount} vinculados
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-3 py-2.5 font-medium w-40">Item lido no PDF</th>
                    <th className="px-3 py-2.5 font-medium w-40">Peça da cotação</th>
                    <th className="px-3 py-2.5 font-medium w-24">Marca</th>
                    <th className="px-3 py-2.5 text-center font-medium w-16">Qtd</th>
                    <th className="px-3 py-2.5 text-right font-medium w-24">Valor unit.</th>
                    <th className="px-3 py-2.5 text-right font-medium w-24">Total</th>
                    <th className="px-3 py-2.5 text-center font-medium w-20">Confiança</th>
                    <th className="px-3 py-2.5 font-medium w-28">Observação</th>
                    <th className="px-3 py-2.5 text-center font-medium w-16">Ignorar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reviewItems.map((r) => {
                    const badge = confidenceBadge(r.confianca);
                    const total = (Number(r.quantidade) || 0) * (Number(r.valorUnitario) || 0);
                    const lowConf = r.confianca < 0.5;
                    return (
                      <tr
                        key={r.id}
                        className={`${r.ignorar ? "opacity-40 bg-gray-50" : lowConf ? "bg-amber-50/40" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-800 truncate max-w-[140px]" title={r.nomeExtraido}>
                            {r.nomeExtraido}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]" title={r.linhaOriginal}>
                            {r.linhaOriginal}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={r.cotacaoItemId}
                            onChange={(e) => updateReviewItem(r.id, "cotacaoItemId", e.target.value)}
                            disabled={r.ignorar}
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="">— não vincular —</option>
                            {cotacaoItens.map((ci) => (
                              <option key={ci.id} value={ci.id}>
                                {ci.peca?.nome ?? ci.id}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            value={r.marcaCotada}
                            onChange={(e) => updateReviewItem(r.id, "marcaCotada", e.target.value)}
                            disabled={r.ignorar}
                            placeholder="Marca"
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={r.quantidade}
                            onChange={(e) => updateReviewItem(r.id, "quantidade", e.target.value)}
                            disabled={r.ignorar}
                            className="w-14 rounded-md border border-gray-200 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={r.valorUnitario}
                            onChange={(e) => updateReviewItem(r.id, "valorUnitario", e.target.value)}
                            disabled={r.ignorar}
                            className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-right text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700">
                          {r.ignorar ? "—" : formatCurrency(total)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            value={r.observacao}
                            onChange={(e) => updateReviewItem(r.id, "observacao", e.target.value)}
                            disabled={r.ignorar}
                            placeholder="Obs."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => updateReviewItem(r.id, "ignorar", !r.ignorar)}
                            title={r.ignorar ? "Incluir item" : "Ignorar item"}
                            className={`rounded-md p-1.5 transition-colors ${
                              r.ignorar
                                ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <div className="flex gap-4">
                <span>Total itens: <strong>{formatCurrency(reviewTotal)}</strong></span>
                <span>Frete: <strong>{formatCurrency(Number(pdfGeneral.valorFrete) || 0)}</strong></span>
              </div>
              <span className="text-base font-bold text-gray-900">
                Total geral: {formatCurrency(reviewTotalFinal)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setStep("pdf-upload")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              ← Voltar
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPdf}
                disabled={saving || activeCount === 0}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {saving ? "Salvando..." : `Confirmar orçamento (${activeCount} ${activeCount === 1 ? "item" : "itens"})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MANUAL FORM
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
                      <input
                        {...register(`itens.${i}.marcaCotada`)}
                        placeholder="Marca"
                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Qtd</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        {...register(`itens.${i}.quantidade`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Valor unit. (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        {...register(`itens.${i}.valorUnitario`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-500">Total</label>
                      <div
                        className={`flex h-[34px] items-center rounded-md border border-gray-100 px-2 text-sm font-semibold ${
                          disp ? "text-blue-700" : "text-gray-400"
                        }`}
                      >
                        {formatCurrency(disp ? qty * unit : 0)}
                      </div>
                    </div>
                  </div>
                  <input
                    {...register(`itens.${i}.observacao`)}
                    placeholder="Observação"
                    className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Totals footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                Total itens: <strong>{formatCurrency(totalItens)}</strong>
              </span>
              <span>
                Frete: <strong>{formatCurrency(Number(watched.valorFrete) || 0)}</strong>
              </span>
            </div>
            <span className="text-base font-bold text-gray-900">
              Total geral: {formatCurrency(totalGeral)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

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
              onClick={() => saveManual("rascunho")}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Salvar rascunho
            </button>
            <button
              type="button"
              onClick={() => saveManual("confirmar")}
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
