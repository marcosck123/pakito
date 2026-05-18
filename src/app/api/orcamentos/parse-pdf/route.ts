import { NextResponse } from "next/server";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { parseOrcamentoPdf } from "@/lib/pdf/parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // ── FormData ──────────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("[parse-pdf] failed to parse formData:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Requisição inválida — não foi possível ler o formulário.",
        reason: "formdata_parse_error",
        debug: { deploymentHint: process.env.VERCEL_GIT_COMMIT_SHA ?? "local" },
      },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const cotacaoId = formData.get("cotacaoId") as string | null;

  console.log("[parse-pdf] arquivo recebido:", {
    found: !!file,
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size,
    cotacaoId,
    allKeys: [...formData.keys()],
  });

  if (!file) {
    return NextResponse.json(
      {
        success: false,
        error: "Arquivo não enviado.",
        reason: "file_missing",
        debug: {
          receivedKeys: [...formData.keys()],
          deploymentHint: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
        },
      },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      {
        success: false,
        error: "O arquivo deve ser um PDF.",
        reason: "wrong_mime_type",
        debug: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          deploymentHint: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
        },
      },
      { status: 400 }
    );
  }

  // ── Buffer ────────────────────────────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());

  console.log("[parse-pdf] buffer:", {
    bufferLength: buffer.length,
    fileName: file.name,
    fileSize: file.size,
  });

  if (!buffer.length) {
    return NextResponse.json(
      {
        success: false,
        error: "Arquivo chegou vazio no servidor.",
        reason: "empty_buffer",
        debug: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          bufferLength: 0,
          deploymentHint: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
        },
      },
      { status: 422 }
    );
  }

  // ── Extract text ──────────────────────────────────────────────────────────
  let text = "";
  try {
    const pdfParseModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }> =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdfParseModule as any).default ?? pdfParseModule;
    const data = await pdfParse(buffer);
    text = data?.text ?? "";
    console.log("[parse-pdf] pdf-parse ok:", { numpages: data?.numpages, textRawLength: text.length });
  } catch (err) {
    console.error("[parse-pdf] pdf-parse threw:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível ler o PDF. Verifique se o arquivo está corrompido.",
        reason: "pdf_parse_error",
        debug: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          bufferLength: buffer.length,
          parseError: err instanceof Error ? err.message : String(err),
          deploymentHint: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
        },
      },
      { status: 422 }
    );
  }

  const textLength = text.replace(/\s/g, "").length;
  const preview = text.slice(0, 500);

  console.log("[parse-pdf] texto extraído:", { textLength, preview });

  // ── Hard failure: no selectable text (scanned image) ─────────────────────
  if (textLength < 30) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Este PDF não possui texto selecionável (provavelmente é uma imagem escaneada). Use a inserção manual ou um PDF com texto copiável.",
        reason: "no_selectable_text",
        debug: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          bufferLength: buffer.length,
          textLength,
          preview,
          deploymentHint: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
        },
      },
      { status: 422 }
    );
  }

  // ── Parse items ───────────────────────────────────────────────────────────
  const cotacao = cotacaoId ? mockCotacoes.find((c) => c.id === cotacaoId) : null;
  const cotacaoItens =
    cotacao?.itens.map((ci) => ({
      id: ci.id,
      nome: ci.peca?.nome ?? "",
      codigoInterno: ci.peca?.codigoInterno,
      codigoOriginal: ci.peca?.codigoOriginal,
    })) ?? [];

  const { itens, freteDetectado } = parseOrcamentoPdf(text, cotacaoItens);

  console.log("[parse-pdf] parser:", { itemsFound: itens.length, freteDetectado });

  const debug = {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    bufferLength: buffer.length,
    textLength,
    preview,
    itemsFound: itens.length,
    deploymentHint: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  };

  // ── Soft: text extracted but no priced items found → let operator proceed ─
  if (itens.length === 0) {
    return NextResponse.json({
      success: true,
      requiresManualReview: true,
      message:
        "Texto extraído, mas nenhum item foi identificado automaticamente. Use a inserção manual assistida.",
      itens: [],
      freteDetectado,
      rawText: text,
      debug,
    });
  }

  return NextResponse.json({
    success: true,
    requiresManualReview: false,
    message: "Itens extraídos. Confira antes de confirmar.",
    itens,
    freteDetectado,
    rawText: text,
    debug,
  });
}
