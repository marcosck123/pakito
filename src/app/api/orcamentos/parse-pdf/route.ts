import { NextResponse } from "next/server";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { parseOrcamentoPdf } from "@/lib/pdf/parser";
import { extractTextFromPdf } from "@/lib/pdf/extract-text";
import { requireSession } from "@/lib/auth/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Diagnostics = {
  requestId: string;
  step: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  bufferLength: number | null;
  textLength: number | null;
  textPreview: string | null;
  itemsFound: number | null;
  reason: string | null;
  parseError: string | null;
  stack: string | null;
};

export async function POST(request: Request) {
  const { error: authError } = await requireSession(["ADMIN", "COMPRAS"]);
  if (authError) return authError;

  const requestId = crypto.randomUUID();

  const diag: Diagnostics = {
    requestId,
    step: "request_started",
    fileName: null,
    fileType: null,
    fileSize: null,
    bufferLength: null,
    textLength: null,
    textPreview: null,
    itemsFound: null,
    reason: null,
    parseError: null,
    stack: null,
  };

  function log(label: string) {
    console.log(`[parse-pdf] ${label}`, diag);
  }

  function errorResponse(status: number, userMessage: string, reason: string) {
    diag.reason = reason;
    diag.step = "response_error";
    log("error_response");
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: userMessage,
        reason,
        debug: {
          step: diag.step,
          fileName: diag.fileName,
          fileType: diag.fileType,
          fileSize: diag.fileSize,
          bufferLength: diag.bufferLength,
          textLength: diag.textLength,
          itemsFound: diag.itemsFound,
          parseError: diag.parseError,
        },
      },
      { status }
    );
  }

  try {
    diag.step = "formdata_read";
    log("reading_formdata");

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      diag.parseError = err instanceof Error ? err.message : String(err);
      return errorResponse(400, "Requisição inválida — não foi possível ler o formulário.", "form_parse_error");
    }

    diag.step = "file_received";
    const file = formData.get("file") as File | null;
    const cotacaoId = formData.get("cotacaoId") as string | null;

    diag.fileName = file?.name ?? null;
    diag.fileType = file?.type ?? null;
    diag.fileSize = file?.size ?? null;
    log("file_received");

    if (!file) {
      return errorResponse(
        400,
        `Arquivo não encontrado na requisição. Campos recebidos: [${[...formData.keys()].join(", ")}]`,
        "file_missing"
      );
    }

    if (file.type !== "application/pdf") {
      return errorResponse(
        400,
        `O arquivo deve ser um PDF. Tipo recebido: "${file.type || "(vazio)"}"`,
        "wrong_mime_type"
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        400,
        `O arquivo excede o tamanho máximo permitido (10 MB). Tamanho recebido: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        "file_too_large"
      );
    }

    diag.step = "buffer_created";
    const buffer = Buffer.from(await file.arrayBuffer());
    diag.bufferLength = buffer.length;
    log("buffer_created");

    if (!buffer.length) {
      return errorResponse(400, "O arquivo chegou vazio no servidor.", "empty_buffer");
    }

    diag.step = "pdf_parse_started";
    log("pdf_parse_started");

    let text = "";
    try {
      text = await extractTextFromPdf(buffer);
      diag.step = "pdf_parse_success";
      log("pdf_parse_success");
    } catch (err) {
      diag.step = "pdf_parse_error";
      diag.parseError = err instanceof Error ? err.message : String(err);
      diag.stack = err instanceof Error ? (err.stack ?? null) : null;
      return errorResponse(
        422,
        "Não foi possível ler o PDF. Verifique se o arquivo está corrompido.",
        "pdf_parse_error"
      );
    }

    diag.step = "text_validation";
    const textLength = text.replace(/\s/g, "").length;
    const textPreview = text.slice(0, 500);
    diag.textLength = textLength;
    diag.textPreview = textPreview;
    log("text_validation");

    if (textLength < 30) {
      return errorResponse(
        422,
        "Este PDF não possui texto selecionável (provavelmente é uma imagem escaneada). Use a inserção manual ou um PDF com texto copiável.",
        "no_selectable_text"
      );
    }

    diag.step = "parser_started";
    log("parser_started");

    const cotacao = cotacaoId ? mockCotacoes.find((c) => c.id === cotacaoId) : null;
    const cotacaoItens =
      cotacao?.itens.map((ci) => ({
        id: ci.id,
        nome: ci.peca?.nome ?? "",
        codigoInterno: ci.peca?.codigoInterno,
        codigoOriginal: ci.peca?.codigoOriginal,
      })) ?? [];

    const { itens, freteDetectado } = parseOrcamentoPdf(text, cotacaoItens);

    diag.step = "parser_success";
    diag.itemsFound = itens.length;
    log("parser_success");

    const debugBase = {
      step: diag.step,
      fileName: diag.fileName,
      fileType: diag.fileType,
      fileSize: diag.fileSize,
      bufferLength: diag.bufferLength,
      textLength: diag.textLength,
      textPreview: diag.textPreview,
      itemsFound: diag.itemsFound,
    };

    if (itens.length === 0) {
      diag.step = "response_success";
      diag.reason = "parser_no_items";
      log("response_no_items");
      return NextResponse.json({
        success: true,
        requiresManualReview: true,
        requestId,
        reason: "parser_no_items",
        message:
          "Texto extraído, mas nenhum item foi identificado automaticamente. Use a inserção manual assistida.",
        itens: [],
        freteDetectado,
        rawText: text,
        debug: { ...debugBase, itemsFound: 0 },
      });
    }

    diag.step = "response_success";
    log("response_ok");
    return NextResponse.json({
      success: true,
      requiresManualReview: false,
      requestId,
      reason: null,
      message: "Itens extraídos. Confira antes de confirmar.",
      itens,
      freteDetectado,
      rawText: text,
      debug: debugBase,
    });
  } catch (error) {
    console.error("[parse-pdf] unexpected_error", {
      requestId,
      diagnostics: diag,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: "Erro inesperado ao processar PDF.",
        reason: "unexpected_error",
        debug: {
          ...diag,
          parseError: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
