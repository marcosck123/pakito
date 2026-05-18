export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import avoids module-load-time crash if pdfjs-dist fails to initialize.
  // disableWorker=true is required in serverless environments (no worker thread support).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs") as any;

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true,
    disableWorker: true,
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
