import { NextResponse } from "next/server";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { parseOrcamentoPdf } from "@/lib/pdf/parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const cotacaoId = formData.get("cotacaoId") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "Arquivo não enviado.", receivedKeys: [...formData.keys()] },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "O arquivo deve ser um PDF.", receivedType: file.type },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!buffer.length) {
    return NextResponse.json(
      { error: "Arquivo chegou vazio no servidor.", fileName: file.name, fileSize: file.size },
      { status: 422 }
    );
  }

  // ── Extract text ──────────────────────────────────────────────────────────
  let text = "";
  try {
    const pdfParseModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdfParseModule as any).default ?? pdfParseModule;
    const data = await pdfParse(buffer);
    text = data?.text ?? "";
  } catch (err) {
    console.error("[parse-pdf] pdf-parse threw:", err);
    return NextResponse.json(
      {
        error: "Não foi possível ler o PDF. Verifique se o arquivo está corrompido.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 422 }
    );
  }

  const textLength = text.replace(/\s/g, "").length;

  // ── Hard failure: no text at all (scanned image) ──────────────────────────
  if (textLength < 30) {
    return NextResponse.json(
      {
        error:
          "Este PDF não possui texto selecionável (provavelmente é uma imagem escaneada). Use a opção de inserção manual ou utilize um PDF com texto copiável.",
        debug: { fileName: file.name, fileSize: file.size, textLength, preview: text.slice(0, 200) },
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

  const debug = {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    textLength,
    preview: text.slice(0, 1000),
    itemsFound: itens.length,
  };

  // ── Soft failure: text found but parser detected no priced items ──────────
  // Return 200 so the operator can still proceed manually.
  if (itens.length === 0) {
    return NextResponse.json({
      success: true,
      requiresManualReview: true,
      message:
        "Texto extraído, mas nenhum item com valor foi identificado automaticamente. Confira o texto abaixo e preencha manualmente.",
      itens: [],
      freteDetectado,
      rawText: text,
      debug,
    });
  }

  return NextResponse.json({
    success: true,
    requiresManualReview: false,
    message: "Itens extraídos com sucesso. Confira e corrija antes de confirmar.",
    itens,
    freteDetectado,
    rawText: text,
    debug,
  });
}
