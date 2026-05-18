import { NextResponse } from "next/server";
import { mockCotacoes } from "@/lib/mock-data/cotacoes";
import { parseOrcamentoPdf } from "@/lib/pdf/parser";

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
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "O arquivo deve ser um PDF." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    // Use lib path to bypass test-file loading in Next.js (pdf-parse v1 quirk)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const data = await pdfParse(buffer);
    text = data.text ?? "";
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler o PDF. Verifique se o arquivo está corrompido." },
      { status: 422 }
    );
  }

  const textLength = text.replace(/\s/g, "").length;
  if (textLength < 30) {
    return NextResponse.json(
      {
        error:
          "Este PDF não possui texto selecionável (parece ser uma imagem escaneada). Use a opção de inserção manual ou utilize um PDF com texto copiável.",
      },
      { status: 422 }
    );
  }

  const cotacao = cotacaoId ? mockCotacoes.find((c) => c.id === cotacaoId) : null;
  const cotacaoItens =
    cotacao?.itens.map((ci) => ({
      id: ci.id,
      nome: ci.peca?.nome ?? "",
      codigoInterno: ci.peca?.codigoInterno,
      codigoOriginal: ci.peca?.codigoOriginal,
    })) ?? [];

  const { itens, freteDetectado } = parseOrcamentoPdf(text, cotacaoItens);

  if (itens.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhum item com valor foi detectado no PDF. O formato pode ser incompatível — use a inserção manual.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ itens, freteDetectado });
}
