// Applies Node.js polyfills required by pdfjs-dist v5+ before the library loads.
// DOMMatrix, ImageData and Path2D are browser globals unavailable in Node.
// Must be called (and awaited) BEFORE any dynamic import of pdfjs-dist.
export async function setupPdfJsNodePolyfills(): Promise<void> {
  if (typeof globalThis.DOMMatrix !== "undefined") {
    return;
  }

  try {
    const canvas = await import("@napi-rs/canvas");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeCanvas = canvas as any;

    if (maybeCanvas.DOMMatrix) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).DOMMatrix = maybeCanvas.DOMMatrix;
    }
    if (maybeCanvas.ImageData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).ImageData = maybeCanvas.ImageData;
    }
    if (maybeCanvas.Path2D) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).Path2D = maybeCanvas.Path2D;
    }
  } catch {
    // @napi-rs/canvas not available — pdfjs may still throw DOMMatrix errors;
    // the caller's try/catch will capture and surface the real error.
  }
}
