import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";
import { setupPdfJsNodePolyfills } from "./pdfjs-polyfill";

const nodeRequire = createRequire(import.meta.url);
const PDFJS_WORKER_MODULE = "pdfjs-dist/legacy/build/pdf.worker.mjs";
const PDFJS_WORKER_FALLBACK_PATH = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.mjs"
);

export function resolvePdfJsWorkerPath(): string {
  try {
    const resolveModule = nodeRequire.resolve.bind(nodeRequire);
    const workerPath = resolveModule(PDFJS_WORKER_MODULE);

    if (typeof workerPath === "string") {
      return workerPath;
    }
  } catch {
    // Fall through to the traced node_modules path used by Vercel.
  }

  return PDFJS_WORKER_FALLBACK_PATH;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Polyfill must run before pdfjs-dist is imported; pdfjs reads DOMMatrix at
  // module-evaluation time and throws ReferenceError if it is absent.
  await setupPdfJsNodePolyfills();

  // Dynamic import so a failed module load is catchable by the caller.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs") as any;
  const workerPath = resolvePdfJsWorkerPath();
  const workerUrl = pathToFileURL(workerPath).href;

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pagesText: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    pagesText.push(pageText);
  }
  return pagesText.join("\n").trim();
}
