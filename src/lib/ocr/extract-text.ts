import { createWorker } from "tesseract.js";

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker(["por", "eng"], 1, {
    cachePath: "/tmp/tesseract-cache",
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
