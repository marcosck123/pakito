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

export interface ParsedPdf {
  itens: ExtractedItem[];
  freteDetectado: number | null;
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

// ─── BRL helpers ─────────────────────────────────────────────────────────────

function parseBRL(s: string): number | null {
  const clean = s.replace(/R\$\s*/i, "").trim();
  // 1.234,56
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(clean))
    return parseFloat(clean.replace(/\./g, "").replace(",", "."));
  // 45,00
  if (/^\d+,\d{2}$/.test(clean)) return parseFloat(clean.replace(",", "."));
  return null;
}

/** Extract all BRL prices from a line, handling R$-prefixed and bare formats.
 *  Filters out "concatenated" prices like "1120,00" when an R$-prefixed "120,00" exists. */
function extractPrices(line: string): number[] {
  // Step 1: R$-prefixed prices — most reliable
  const rsPriceRe = /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g;
  const rsPrices: Array<{ value: number; str: string }> = [];
  for (const m of line.matchAll(rsPriceRe)) {
    const v = parseBRL(m[1]);
    if (v !== null && v > 0) rsPrices.push({ value: v, str: m[1] });
  }

  // Step 2: Bare BRL prices from a copy of the line with R$-blocks removed
  const bareSearch = line.replace(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/g, (m) =>
    " ".repeat(m.length)
  );
  const barePriceRe = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
  const barePrices: number[] = [];
  for (const m of bareSearch.matchAll(barePriceRe)) {
    const v = parseBRL(m[0]);
    if (v === null || v <= 0) continue;
    // Reject if this looks like qty-concatenated with an R$ price
    // e.g. "1120,00" ends with "120,00" (the R$ price) and is longer → concatenation
    const str = m[0];
    const isConcatenation = rsPrices.some(
      (r) => str !== r.str && str.endsWith(r.str) && str.length > r.str.length
    );
    if (!isConcatenation) barePrices.push(v);
  }

  // Combine; keep duplicates (identical unit=total means qty=1)
  return [...rsPrices.map((r) => r.value), ...barePrices];
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
  desc = desc.replace(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/gi, " ");
  // Remove bare BRL numbers
  desc = desc.replace(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g, " ");
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

// ─── Main export ──────────────────────────────────────────────────────────────

export function parseOrcamentoPdf(
  text: string,
  cotacaoItens: CotacaoItemSimple[]
): ParsedPdf {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 4);

  // Detect frete (separate pass before item loop)
  let freteDetectado: number | null = null;
  for (const line of lines) {
    if (!FRETE_LINE_RE.test(line)) continue;
    const prices = extractPrices(line);
    if (prices.length > 0 && prices[0] > 0) {
      freteDetectado = Math.min(...prices.filter((v) => v > 0));
      break;
    }
  }

  const itens: ExtractedItem[] = [];

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue;

    const prices = extractPrices(line);
    if (prices.length === 0) continue;

    // Skip lines where removing prices leaves almost nothing (pure summary)
    const textOnly = line
      .replace(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/gi, "")
      .replace(/\d{1,3}(?:\.\d{3})*,\d{2}/g, "")
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

  return { itens, freteDetectado };
}
