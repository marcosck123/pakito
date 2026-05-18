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
    // Use lib path to avoid test-file loading issue in Next.js
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
          "Este PDF parece ser uma imagem escaneada e não possui texto selecionável. Use a opção de inserção manual ou digitalize um PDF com texto copiável.",
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

  const itens = parseOrcamentoPdf(text, cotacaoItens);

  return NextResponse.json({ itens, totalLinhas: text.split("\n").length });
}
