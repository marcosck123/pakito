export interface ExtractedItem {
  linhaOriginal: string;
  nomeExtraido: string;
  quantidade: number | null;
  valorUnitario: number | null;
  valorTotal: number | null;
  confianca: number; // 0–1
  pecaSugeridaId?: string;
  pecaSugeridaNome?: string;
}

interface CotacaoItemSimple {
  id: string;
  nome: string;
  codigoInterno?: string;
  codigoOriginal?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse BRL: "1.234,56" | "45,00" | "45.00"
function parseBRL(s: string): number | null {
  const clean = s.replace(/R\$\s*/i, "").trim();
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(clean)) {
    return parseFloat(clean.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d+,\d{2}$/.test(clean)) return parseFloat(clean.replace(",", "."));
  if (/^\d+\.\d{2}$/.test(clean)) return parseFloat(clean);
  return null;
}

const PRICE_RE = /(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}(?!\d)|\d+\.\d{2}(?!\d)/gi;
const QTY_RE = /\b(\d{1,4})\s*(?:un|unid|pç|pc|par|jg|jogo|cx|caixa|kg|lt|m\b)/i;
const LEADING_QTY_RE = /^(\d{1,4})\s+/;

function matchPecas(desc: string, cotacaoItens: CotacaoItemSimple[]) {
  const normDesc = normalizeText(desc);
  let bestScore = 0;
  let pecaSugeridaId: string | undefined;
  let pecaSugeridaNome: string | undefined;

  for (const ci of cotacaoItens) {
    const normNome = normalizeText(ci.nome);
    const words = normNome.split(" ").filter((w) => w.length > 2);
    if (words.length === 0) continue;

    const matches = words.filter((w) => normDesc.includes(w)).length;
    const wordScore = matches / words.length;

    const codeBonus =
      (ci.codigoInterno && normDesc.includes(normalizeText(ci.codigoInterno))) ||
      (ci.codigoOriginal && normDesc.includes(normalizeText(ci.codigoOriginal)))
        ? 0.4
        : 0;

    const total = Math.min(1, wordScore + codeBonus);
    if (total > bestScore && total >= 0.3) {
      bestScore = total;
      pecaSugeridaId = ci.id;
      pecaSugeridaNome = ci.nome;
    }
  }
  return { pecaSugeridaId, pecaSugeridaNome };
}

export function parseOrcamentoPdf(
  text: string,
  cotacaoItens: CotacaoItemSimple[]
): ExtractedItem[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 4);

  const results: ExtractedItem[] = [];

  for (const line of lines) {
    const priceMatches = [...line.matchAll(PRICE_RE)];
    const prices = priceMatches
      .map((m) => parseBRL(m[0]))
      .filter((v): v is number => v !== null && v > 0);

    if (prices.length === 0) continue;

    // Extract qty
    let quantidade: number | null = null;
    const qtyMatch = line.match(QTY_RE) || line.match(LEADING_QTY_RE);
    if (qtyMatch) {
      const q = parseFloat(qtyMatch[1]);
      if (q > 0 && q <= 9999) quantidade = q;
    }

    // Build description by removing prices and qty markers
    let desc = line;
    for (const m of priceMatches) desc = desc.replace(m[0], " ");
    desc = desc
      .replace(/^[\d]+[.\)]\s*/, "") // leading "01. " "1) "
      .replace(/\b(?:un|unid|pç|pc|par|jg|jogo|cx|caixa|kg|lt|metro)\b/gi, "")
      .replace(/R\$/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (desc.length < 3) continue;

    // Determine valorUnitario / valorTotal
    let valorUnitario: number | null = null;
    let valorTotal: number | null = null;

    if (prices.length >= 2) {
      const sorted = [...prices].sort((a, b) => a - b);
      valorUnitario = sorted[0];
      valorTotal = sorted[sorted.length - 1];
    } else {
      valorUnitario = prices[0];
    }

    // Confidence
    let confianca = 0.3;
    if (valorUnitario !== null) confianca += 0.15;
    if (valorTotal !== null) confianca += 0.15;
    if (quantidade !== null) confianca += 0.2;
    if (valorUnitario !== null && valorTotal !== null && quantidade !== null) {
      const computed = Math.round(valorUnitario * quantidade * 100) / 100;
      const diff = Math.abs(computed - valorTotal);
      if (diff < 0.02) confianca = 1.0;
      else if (diff < 1.0) confianca = Math.max(confianca, 0.8);
    }

    const { pecaSugeridaId, pecaSugeridaNome } = matchPecas(desc, cotacaoItens);
    if (pecaSugeridaId) confianca = Math.min(1, confianca + 0.1);

    results.push({
      linhaOriginal: line,
      nomeExtraido: desc,
      quantidade,
      valorUnitario,
      valorTotal,
      confianca: Math.round(confianca * 100) / 100,
      pecaSugeridaId,
      pecaSugeridaNome,
    });
  }

  return results;
}
