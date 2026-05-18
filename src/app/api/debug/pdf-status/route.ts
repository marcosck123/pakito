import { NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/pdf/extract-text";

export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toISOString();

  let pdfjsStatus: string = "not_tested";
  let pdfjsVersion: string = "unknown";

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("pdfjs-dist/package.json");
    pdfjsVersion = pkg.version ?? "unknown";
  } catch {
    pdfjsVersion = "package_json_unreadable";
  }

  try {
    // Minimal valid PDF to verify extractTextFromPdf is callable
    const tinyPdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj " +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj " +
      "3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\n" +
      "xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n" +
      "0000000058 00000 n\n0000000115 00000 n\n" +
      "trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
    );
    await extractTextFromPdf(tinyPdf);
    pdfjsStatus = "callable_ok";
  } catch (err) {
    pdfjsStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    ok: true,
    timestamp,
    runtime: "nodejs",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ?? null,
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      VERCEL_REGION: process.env.VERCEL_REGION ?? null,
    },
    pdfjs: {
      status: pdfjsStatus,
      version: pdfjsVersion,
    },
    endpoint: {
      path: "/api/orcamentos/parse-pdf",
      method: "POST",
      expectedField: "file",
      expectedMime: "application/pdf",
      reasons422: [
        "empty_buffer",
        "pdf_parse_error",
        "no_selectable_text",
      ],
      reasons400: ["file_missing", "wrong_mime_type", "form_parse_error"],
      softFallback200: "parser_no_items → requiresManualReview=true",
    },
  });
}
