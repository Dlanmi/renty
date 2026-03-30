// ─── Image processing Web Worker ────────────────────────────────────
//
// Receives raw image bytes, decodes via createImageBitmap (which auto-
// applies EXIF orientation in modern browsers), then resizes and encodes
// each requested variant using OffscreenCanvas.
//
// Communication:
//   main → worker : ProcessImageRequest  (ArrayBuffer is transferred)
//   worker → main : ProcessImageResult | ProcessImageError

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface VariantInput {
  name: string;
  maxWidth: number;
  quality: number;
  format: string;
  fallbackFormat: string;
  fallbackQuality: number;
}

export interface ProcessImageRequest {
  id: string;
  type: "process";
  imageBuffer: ArrayBuffer;
  variants: VariantInput[];
}

export interface ProcessedVariantOutput {
  name: string;
  buffer: ArrayBuffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessImageResult {
  id: string;
  type: "result";
  variants: ProcessedVariantOutput[];
}

export interface ProcessImageError {
  id: string;
  type: "error";
  error: string;
}

// ─── Dimension calculation ──────────────────────────────────────────

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }
  const ratio = maxWidth / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(originalHeight * ratio),
  };
}

// ─── Message handler ────────────────────────────────────────────────

const workerSelf = self as any;
workerSelf.onmessage = async (event: MessageEvent<ProcessImageRequest>) => {
  const { id, imageBuffer, variants } = event.data;

  try {
    const blob = new Blob([imageBuffer]);
    const bitmap = await createImageBitmap(blob);
    const results: ProcessedVariantOutput[] = [];

    for (const variant of variants) {
      const { width, height } = calculateDimensions(
        bitmap.width,
        bitmap.height,
        variant.maxWidth
      );

      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo obtener contexto 2D del canvas.");

      // High-quality downscale
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, width, height);

      // Try preferred format
      let outputBlob = await canvas.convertToBlob({
        type: variant.format as "image/webp" | "image/jpeg" | "image/png",
        quality: variant.quality,
      });

      let finalFormat = variant.format;

      // If the browser didn't produce the requested format, fall back
      if (outputBlob.type !== variant.format) {
        outputBlob = await canvas.convertToBlob({
          type: variant.fallbackFormat as "image/jpeg",
          quality: variant.fallbackQuality,
        });
        finalFormat = outputBlob.type || variant.fallbackFormat;
      }

      const buffer = await outputBlob.arrayBuffer();

      results.push({
        name: variant.name,
        buffer,
        width,
        height,
        format: finalFormat,
        size: buffer.byteLength,
      });
    }

    bitmap.close();

    const response: ProcessImageResult = {
      id,
      type: "result",
      variants: results,
    };

    // Transfer ownership of the ArrayBuffers for zero-copy performance
    workerSelf.postMessage(response, results.map((r) => r.buffer));
  } catch (error) {
    const errorResponse: ProcessImageError = {
      id,
      type: "error",
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido procesando la imagen.",
    };
    workerSelf.postMessage(errorResponse);
  }
};
