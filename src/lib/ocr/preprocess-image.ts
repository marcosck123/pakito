/**
 * Preprocess an image for better OCR accuracy:
 * 1. Scale up to at least MIN_WIDTH so Tesseract has enough pixels
 * 2. Convert to grayscale
 * 3. Boost contrast (stretches histogram toward black/white)
 * 4. Apply unsharp-mask sharpening (makes text edges crisper)
 *
 * Returns a PNG Blob ready to be passed to Tesseract.
 */

const MIN_WIDTH = 2000; // ~200 DPI for an A4 page at 10 cm wide
const CONTRAST_FACTOR = 1.6; // >1 increases contrast
const SHARPEN_AMOUNT = 0.4; // 0 = off, 1 = strong

function buildSharpenKernel(amount: number): number[] {
  // Simple unsharp-mask approximation via 3×3 laplacian blend
  const c = 1 + 4 * amount;
  const s = -amount;
  return [0, s, 0, s, c, s, 0, s, 0];
}

function applyConvolution(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  kernel: number[]
): void {
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      let r = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const k = kernel[(ky + 1) * 3 + (kx + 1)];
          const srcIdx = ((y + ky) * w + (x + kx)) * 4;
          r += src[srcIdx] * k; // grayscale: R=G=B, pick R
        }
      }
      const clamped = Math.max(0, Math.min(255, r));
      dst[idx] = dst[idx + 1] = dst[idx + 2] = clamped;
      dst[idx + 3] = 255;
    }
  }
}

export async function preprocessImageForOcr(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const srcUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(srcUrl);

      // ── 1. Scale up if too small ─────────────────────────────────────────
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w < MIN_WIDTH) {
        const scale = MIN_WIDTH / w;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // ── 2. Grayscale + contrast ──────────────────────────────────────────
      for (let i = 0; i < data.length; i += 4) {
        // Luminance-weighted grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Contrast stretch around mid-point (128)
        const contrasted = Math.max(0, Math.min(255, (gray - 128) * CONTRAST_FACTOR + 128));
        data[i] = data[i + 1] = data[i + 2] = contrasted;
        data[i + 3] = 255;
      }

      // ── 3. Unsharp-mask sharpening ───────────────────────────────────────
      const sharpened = new Uint8ClampedArray(data.length);
      // Copy edges as-is (convolution skips 1px border)
      sharpened.set(data);
      applyConvolution(data, sharpened, w, h, buildSharpenKernel(SHARPEN_AMOUNT));

      ctx.putImageData(new ImageData(sharpened, w, h), 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("canvas.toBlob returned null"));
        },
        "image/png"
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(srcUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = srcUrl;
  });
}
