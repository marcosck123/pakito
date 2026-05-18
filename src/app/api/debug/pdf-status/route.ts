import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Test pdf-parse import
  let pdfParseStatus = "unknown";
  let pdfParseVersion = "unknown";
  let pdfParseExportShape = "unknown";

  try {
    const mod = await import("pdf-parse");
    pdfParseStatus = "imported_ok";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keys = Object.keys(mod as any);
    pdfParseExportShape = keys.join(", ");

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require("pdf-parse/package.json");
      pdfParseVersion = pkg.version ?? "unknown";
    } catch {
      pdfParseVersion = "package.json_not_readable";
    }

    // Test with a minimal valid PDF buffer (a tiny but valid PDF)
    // This verifies that pdfParse is callable and returns text
    const tinyPdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj " +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj " +
      "3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n" +
      "xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n" +
      "0000000058 00000 n\n0000000115 00000 n\n" +
      "trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (mod as any).default ?? mod;
    await pdfParse(tinyPdf);
    pdfParseStatus = "callable_ok";
  } catch (err) {
    pdfParseStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    runtime: "nodejs",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      VERCEL_REGION: process.env.VERCEL_REGION ?? null,
    },
    pdfParse: {
      status: pdfParseStatus,
      version: pdfParseVersion,
      exportShape: pdfParseExportShape,
    },
    expectedBehavior: {
      "422 reasons": [
        "file_missing",
        "wrong_mime_type",
        "empty_buffer",
        "pdf_parse_error",
        "no_selectable_text (textLength < 30)",
      ],
      "200 requiresManualReview=true": "text extracted, itens.length === 0",
      "200 requiresManualReview=false": "itens found",
    },
  });
}
