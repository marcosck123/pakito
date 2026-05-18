export interface ExtractedItem {
  codigo?: string;
  linhaOriginal: string;
  nomeExtraido: string;
  marca?: string;
  quantidade: number | null;
  valorUnitario: number | null;
  valorTotal: number | null;
  confianca: number; // 0–1
  pecaSugeridaId?: string;
  pecaSugeridaNome?: string;
}

export interface ParsedPdf {
  itens: ExtractedItem[];
  freteDetectado: number | null;
  debugParser?: {
    normalizedLength: number;
    mainTextPreview: string;
    itemsFound: number;
  };
}

interface CotacaoItemSimple {
  id: string;
  nome: string;
  codigoInterno?: string;
  codigoOriginal?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Lines to skip — summary / header / footer content
// No trailing \b so "TOTAL GERALR$" is caught correctly
const SKIP_RE =
  /\b(?:subtotal|total\b|frete\b|desconto|pagamento|prazo|entrega\b|cnpj|fone|whats|ass\.\s|pdf\s*de\s*teste|gerado\s*com)|(?:data:|validade:|cliente:|ref:|orcamento\s*n)/i;

// Frete line detector
const FRETE_LINE_RE = /frete/i;

// Explicit unit markers for quantity extraction.
// Uses (?<!\d) instead of \b so "TECFIL02 un" (brand+qty concatenated) is still detected.
const QTY_UNIT_RE =
  /(?<!\d)(\d{1,4})\s*(?:un(?:id)?|pç|pc|par(?:es)?|jg|jogo|cx|caixa|kg|lt|litro|m(?:etro)?)\b/gi;

// Leading product code (e.g. FO-889, CR-22A, OLEO15W)
const CODE_PREFIX_RE = /^[A-Z0-9]{1,6}[-/]?[A-Z0-9]{1,8}\s*/;
const MONEY_RE =
  /(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2}|\d+\.\d{2})/gi;
const MONEY_SOURCE =
  "(?:R\\$\\s*)?(?:\\d{1,3}(?:\\.\\d{3})+,\\d{2}|\\d+,\\d{2}|\\d+\\.\\d{2})";
const BRAND_TOKEN_SOURCE = "[^\\s]+";
const CONTINUOUS_ROW_RE = new RegExp(
  "\\b(\\d{1,3})\\s+(.+?)\\s+(" +
    BRAND_TOKEN_SOURCE +
    ")\\s+(\\d+(?:[,.]\\d+)?)\\s+(" +
    MONEY_SOURCE +
    ")\\s+(" +
    MONEY_SOURCE +
    ")",
  "giu"
);
const TABLE_HEADER_RE =
  /[\s\S]*?\bItem\s+Descri[cç][aã]o(?:\s+da\s+pe[cç]a)?\s+Marca\s+Qtd\s+Valor\s+unit\.?(?:ario)?\s+Valor\s+total/i;
const TABLE_STOP_RE = /\b(?:OPCIONAIS?|Frete:?|Desconto:?|Total\b|Prazo:?)\b/i;

// ─── BRL helpers ─────────────────────────────────────────────────────────────

function normalizePdfText(text: string) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function parseMoneyBR(value: string) {
  const cleaned = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (cleaned.includes(",")) {
    return Number(cleaned.replace(/\./g, "").replace(",", "."));
  }

  return Number(cleaned);
}

function parseBRL(s: string): number | null {
  const value = parseMoneyBR(s);
  return Number.isFinite(value) ? value : null;
}

/** Extract all BRL prices from a line, handling R$-prefixed and bare formats.
 *  Filters out "concatenated" prices like "1120,00" when an R$-prefixed "120,00" exists. */
function extractPrices(line: string): number[] {
  const flexibleMatches = [...line.matchAll(MONEY_RE)].map((m) => {
    const raw = m[0];
    const clean = raw.replace(/R\$\s*/i, "");
    const value = parseBRL(raw);
    return { raw, clean, value, prefixed: /^R\$/i.test(raw.trim()) };
  });

  if (flexibleMatches.length > 0) {
    const prefixed = flexibleMatches.filter((m) => m.prefixed);
    return flexibleMatches
      .filter((match) => {
        if (match.value === null || match.value <= 0) return false;
        return !(
          !match.prefixed &&
          prefixed.some(
            (r) =>
              match.clean !== r.clean &&
              match.clean.endsWith(r.clean) &&
              match.clean.length > r.clean.length
          )
        );
      })
      .map((match) => match.value as number);
  }
  return [];
}

// ─── Quantity + price inference ───────────────────────────────────────────────

function inferPrices(
  line: string,
  prices: number[]
): { quantidade: number | null; valorUnitario: number | null; valorTotal: number | null } {
  if (prices.length === 0) return { quantidade: null, valorUnitario: null, valorTotal: null };

  // Explicit unit-marker quantity (most reliable)
  let qtyFromUnit: number | null = null;
  for (const m of line.matchAll(new RegExp(QTY_UNIT_RE.source, "gi"))) {
    const q = parseInt(m[1], 10);
    if (q > 0 && q <= 9999) { qtyFromUnit = q; break; }
  }

  if (prices.length === 1) {
    return { quantidade: qtyFromUnit, valorUnitario: prices[0], valorTotal: null };
  }

  // Try all ordered pairs (unit, total) where total >= unit
  let bestUnit: number | null = null;
  let bestTotal: number | null = null;
  let bestQty: number | null = qtyFromUnit;
  let bestScore = -Infinity;

  const unique = [...new Set(prices)].sort((a, b) => a - b);

  for (const unit of unique) {
    for (const total of unique) {
      if (total < unit) continue;

      // Identical: qty=1, unit=total
      if (Math.abs(unit - total) < 0.02) {
        // Only high confidence when the same value genuinely appears twice in the price list
        const dupCount = prices.filter((p) => Math.abs(p - unit) < 0.02).length;
        const score =
          0.6 +
          (dupCount >= 2 ? 0.3 : -0.2) +
          (qtyFromUnit === 1 ? 0.2 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestUnit = unit;
          bestTotal = total;
          bestQty = 1;
        }
        continue;
      }

      // Try integer quantities 1..500
      const ratio = total / unit;
      const roundedQ = Math.round(ratio);
      if (roundedQ < 1 || roundedQ > 500) continue;
      const computed = unit * roundedQ;
      const diff = Math.abs(computed - total);
      if (diff > Math.max(0.05 * total, 0.5)) continue;

      // Perfect math → high base; good qty match → bonus
      let score = diff < 0.02 ? 0.8 : 0.4 - diff / total;
      if (qtyFromUnit !== null && qtyFromUnit === roundedQ) score += 0.3;
      else if (qtyFromUnit !== null) score -= 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestUnit = unit;
        bestTotal = total;
        bestQty = roundedQ;
      }
    }
  }

  if (bestUnit !== null) {
    return { quantidade: bestQty, valorUnitario: bestUnit, valorTotal: bestTotal };
  }

  // Fallback: smallest = unit, largest = total
  return { quantidade: qtyFromUnit, valorUnitario: unique[0], valorTotal: unique[unique.length - 1] };
}

// ─── Description extraction ───────────────────────────────────────────────────

function buildDescription(line: string): string {
  let desc = line;
  // Remove R$ blocks
  desc = desc.replace(MONEY_RE, " ");
  // Remove bare BRL numbers
  desc = desc.replace(MONEY_RE, " ");
  // Remove R$ symbol
  desc = desc.replace(/R\$/gi, " ");
  // Remove leading product code
  desc = desc.replace(CODE_PREFIX_RE, "");
  // Remove unit markers (word+qty e.g. "02 un", "01 jogo")
  desc = desc.replace(
    /\b\d{1,4}\s*(?:un(?:id)?|pç|pc|par(?:es)?|jg|jogo|cx|caixa|kg|lt|litro|m(?:etro)?)\b/gi,
    " "
  );
  // Remove leading row numbers "01. " or "1) "
  desc = desc.replace(/^\s*\d{1,3}[.)]\s*/, "");
  // Remove lone 1–2 digit integers (qty artifacts like a standalone "1" or "02")
  desc = desc.replace(/(?<!\w)\d{1,2}(?!\w)/g, " ");
  // Collapse whitespace
  return desc.replace(/\s{2,}/g, " ").trim();
}

// ─── Text normalisation + peça matching ──────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchPeca(desc: string, cotacaoItens: CotacaoItemSimple[]) {
  const normDesc = normalizeText(desc);
  let bestScore = 0;
  let pecaSugeridaId: string | undefined;
  let pecaSugeridaNome: string | undefined;

  for (const ci of cotacaoItens) {
    const normNome = normalizeText(ci.nome);
    const words = normNome.split(" ").filter((w) => w.length > 2);
    if (words.length === 0) continue;
    const matches = words.filter((w) => normDesc.includes(w)).length;
    let score = matches / words.length;
    if (ci.codigoInterno && normDesc.includes(normalizeText(ci.codigoInterno))) score += 0.4;
    if (ci.codigoOriginal && normDesc.includes(normalizeText(ci.codigoOriginal))) score += 0.4;
    score = Math.min(1, score);
    if (score > bestScore && score >= 0.3) {
      bestScore = score;
      pecaSugeridaId = ci.id;
      pecaSugeridaNome = ci.nome;
    }
  }
  return { pecaSugeridaId, pecaSugeridaNome };
}

function extractMainTableText(normalizedText: string): string {
  const headerMatch = normalizedText.match(TABLE_HEADER_RE);
  let mainText = headerMatch
    ? normalizedText.slice(headerMatch[0].length)
    : normalizedText;

  const stopMatch = mainText.search(TABLE_STOP_RE);
  if (stopMatch > -1) {
    mainText = mainText.slice(0, stopMatch);
  }

  return mainText.trim();
}

function parseQuantity(value: string): number | null {
  const quantity = Number(value.replace(",", "."));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

function confidenceForRow(
  quantidade: number | null,
  valorUnitario: number | null,
  valorTotal: number | null
): number {
  let confianca = 0.55;

  if (quantidade !== null) confianca += 0.15;
  if (valorUnitario !== null) confianca += 0.15;
  if (valorTotal !== null) confianca += 0.15;

  if (quantidade !== null && valorUnitario !== null && valorTotal !== null) {
    const computed = Math.round(quantidade * valorUnitario * 100) / 100;
    const diff = Math.abs(computed - valorTotal);

    if (diff < 0.02) return 1;
    if (diff < 0.5) confianca = Math.max(confianca, 0.85);
  }

  return Math.min(1, Math.round(confianca * 100) / 100);
}

function buildContinuousItem(
  row: {
    codigo: string;
    descricao: string;
    marca: string;
    quantidadeRaw: string;
    valorUnitarioRaw: string;
    valorTotalRaw: string;
    linhaOriginal: string;
  },
  cotacaoItens: CotacaoItemSimple[]
): ExtractedItem | null {
  const quantidade = parseQuantity(row.quantidadeRaw);
  const valorUnitario = parseBRL(row.valorUnitarioRaw);
  const valorTotal = parseBRL(row.valorTotalRaw);
  const nomeExtraido = row.descricao.replace(/\s+/g, " ").trim();
  const marca = row.marca.replace(/\s+/g, " ").trim();

  if (!nomeExtraido || quantidade === null || valorUnitario === null || valorTotal === null) {
    return null;
  }

  const { pecaSugeridaId, pecaSugeridaNome } = matchPeca(nomeExtraido, cotacaoItens);
  const confianca = confidenceForRow(quantidade, valorUnitario, valorTotal);

  return {
    codigo: row.codigo,
    linhaOriginal: row.linhaOriginal.replace(/\s+/g, " ").trim(),
    nomeExtraido,
    marca,
    quantidade,
    valorUnitario,
    valorTotal,
    confianca: pecaSugeridaId ? Math.min(1, confianca + 0.1) : confianca,
    pecaSugeridaId,
    pecaSugeridaNome,
  };
}

function parseContinuousItems(
  mainText: string,
  cotacaoItens: CotacaoItemSimple[]
): ExtractedItem[] {
  const itens: ExtractedItem[] = [];
  CONTINUOUS_ROW_RE.lastIndex = 0;

  for (const match of mainText.matchAll(CONTINUOUS_ROW_RE)) {
    const item = buildContinuousItem(
      {
        codigo: match[1],
        descricao: match[2],
        marca: match[3],
        quantidadeRaw: match[4],
        valorUnitarioRaw: match[5],
        valorTotalRaw: match[6],
        linhaOriginal: match[0],
      },
      cotacaoItens
    );

    if (item) itens.push(item);
  }

  if (itens.length > 0) return itens;

  const chunkRegex = new RegExp(
    "^\\s*(\\d{1,3})\\s+(.+?)\\s+(" +
      BRAND_TOKEN_SOURCE +
      ")\\s+(\\d+(?:[,.]\\d+)?)\\s+(" +
      MONEY_SOURCE +
      ")\\s+(" +
      MONEY_SOURCE +
      ")\\s*$",
    "iu"
  );

  const chunks = mainText
    .split(/(?=\b\d{2,3}\s+[A-Za-zÀ-ÿ])/u)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const match = chunk.match(chunkRegex);
    if (!match) continue;

    const item = buildContinuousItem(
      {
        codigo: match[1],
        descricao: match[2],
        marca: match[3],
        quantidadeRaw: match[4],
        valorUnitarioRaw: match[5],
        valorTotalRaw: match[6],
        linhaOriginal: chunk,
      },
      cotacaoItens
    );

    if (item) itens.push(item);
  }

  return itens;
}

function detectFreteValue(normalizedText: string, lines: string[]): number | null {
  const freteRegex = new RegExp("\\bfrete\\b[^\\n]{0,80}?(" + MONEY_SOURCE + ")", "iu");
  const match = normalizedText.match(freteRegex);
  if (match) {
    const value = parseBRL(match[1]);
    if (value !== null && value > 0) return value;
  }

  for (const line of lines) {
    if (!FRETE_LINE_RE.test(line)) continue;
    const prices = extractPrices(line);
    if (prices.length > 0 && prices[0] > 0) {
      return Math.min(...prices.filter((v) => v > 0));
    }
  }

  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function parseOrcamentoPdf(
  text: string,
  cotacaoItens: CotacaoItemSimple[]
): ParsedPdf {
  const normalizedText = normalizePdfText(text);
  const mainText = extractMainTableText(normalizedText);
  const lines = normalizedText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 4);

  const freteDetectado = detectFreteValue(normalizedText, lines);
  const continuousItems = parseContinuousItems(mainText, cotacaoItens);
  const debugParser = {
    normalizedLength: normalizedText.length,
    mainTextPreview: mainText.slice(0, 500),
    itemsFound: continuousItems.length,
  };

  if (continuousItems.length > 0) {
    return { itens: continuousItems, freteDetectado, debugParser };
  }

  const itens: ExtractedItem[] = [];

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue;

    const prices = extractPrices(line);
    if (prices.length === 0) continue;

    // Skip lines where removing prices leaves almost nothing (pure summary)
    const textOnly = line
      .replace(MONEY_RE, "")
      .replace(/R\$/gi, "")
      .trim();
    if (textOnly.length < 4) continue;

    const { quantidade, valorUnitario, valorTotal } = inferPrices(line, prices);
    const desc = buildDescription(line);

    if (desc.length < 3) continue;

    // Confidence
    let confianca = 0.3;
    if (valorUnitario !== null) confianca += 0.15;
    if (valorTotal !== null) confianca += 0.15;
    if (quantidade !== null) confianca += 0.2;
    if (valorUnitario !== null && valorTotal !== null && quantidade !== null) {
      const computed = Math.round(valorUnitario * quantidade * 100) / 100;
      const diff = Math.abs(computed - valorTotal);
      if (diff < 0.02) confianca = 1.0;
      else if (diff < 0.5) confianca = Math.max(confianca, 0.85);
    } else if (
      valorUnitario !== null &&
      valorTotal !== null &&
      Math.abs(valorUnitario - valorTotal) < 0.02
    ) {
      confianca = Math.max(confianca, 0.75);
    }

    const { pecaSugeridaId, pecaSugeridaNome } = matchPeca(desc, cotacaoItens);
    if (pecaSugeridaId) confianca = Math.min(1, confianca + 0.1);

    itens.push({
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

  return {
    itens,
    freteDetectado,
    debugParser: {
      ...debugParser,
      itemsFound: itens.length,
    },
  };
}
