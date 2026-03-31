// ─── Client-side image processor ────────────────────────────────────
//
// Orchestrates image processing via a Web Worker (OffscreenCanvas) with
// a main-thread <canvas> fallback. Manages concurrency, progress
// reporting, and cancellation.

import {
  IMAGE_VARIANTS,
  PREFERRED_FORMAT,
  PROCESSING_CONCURRENCY,
  formatToExtension,
  type VariantName,
} from "./image-variants";
import { canEncodeWebP } from "./webp-support";
import type {
  ProcessImageRequest,
  ProcessImageResult,
  ProcessImageError,
  ProcessedVariantOutput,
} from "./image-processor.worker";

// ─── Public types ───────────────────────────────────────────────────

export interface ProcessedVariant {
  blob: Blob;
  width: number;
  height: number;
  format: string;
  extension: string;
  size: number;
}

export interface ProcessedImage {
  originalName: string;
  variants: Map<VariantName, ProcessedVariant>;
}

export interface ProcessingProgress {
  phase: "processing" | "idle";
  current: number;
  total: number;
  currentFileName: string;
}

export interface ProcessingController {
  cancel: () => void;
}

// ─── Feature flag ───────────────────────────────────────────────────

export function isImageProcessingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const flag = process.env.NEXT_PUBLIC_ENABLE_IMAGE_PROCESSING;
  // Enabled by default unless explicitly set to "false"
  return flag !== "false";
}

// ─── Worker capability detection ────────────────────────────────────

function canUseWorker(): boolean {
  return (
    typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined"
  );
}

// ─── Concurrency-limited queue runner ───────────────────────────────

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
  signal?: AbortSignal
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => runNext()
  );

  await Promise.all(workers);
  return results;
}

// ─── Worker-based processing ────────────────────────────────────────

function processInWorker(
  imageBuffer: ArrayBuffer
): Promise<ProcessedVariantOutput[]> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("./image-processor.worker.ts", import.meta.url)
      );
    } catch {
      reject(new Error("No se pudo crear el Web Worker."));
      return;
    }

    const requestId = crypto.randomUUID();

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Timeout procesando la imagen."));
    }, 30_000);

    worker.onmessage = (
      event: MessageEvent<ProcessImageResult | ProcessImageError>
    ) => {
      clearTimeout(timeout);
      worker.terminate();

      if (event.data.type === "error") {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.variants);
      }
    };

    worker.onerror = (event) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message || "Error en el Web Worker."));
    };

    // Always try WebP first in the Worker — the Worker's OffscreenCanvas
    // has its own fallback (if convertToBlob doesn't produce WebP, it
    // re-encodes as JPEG). This avoids the main-thread detection being
    // wrong about the Worker's capabilities.
    const request: ProcessImageRequest = {
      id: requestId,
      type: "process",
      imageBuffer,
      variants: IMAGE_VARIANTS.map((v) => ({
        name: v.name,
        maxWidth: v.maxWidth,
        quality: v.quality,
        format: PREFERRED_FORMAT,
      })),
    };

    // Transfer the buffer (zero-copy)
    worker.postMessage(request, [imageBuffer]);
  });
}

// ─── Main-thread canvas fallback ────────────────────────────────────

async function processOnMainThread(
  imageBuffer: ArrayBuffer
): Promise<ProcessedVariantOutput[]> {
  const blob = new Blob([imageBuffer]);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, {
      imageOrientation: "from-image",
    });
  } catch {
    bitmap = await createImageBitmap(blob);
  }
  const results: ProcessedVariantOutput[] = [];

  for (const variant of IMAGE_VARIANTS) {
    let targetWidth = variant.maxWidth;
    let targetHeight: number;

    if (bitmap.width <= targetWidth) {
      targetWidth = bitmap.width;
      targetHeight = bitmap.height;
    } else {
      const ratio = targetWidth / bitmap.width;
      targetHeight = Math.round(bitmap.height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener contexto 2D.");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const outputBlob: Blob | null = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, PREFERRED_FORMAT, variant.quality)
    );

    if (!outputBlob || outputBlob.type !== PREFERRED_FORMAT) {
      throw new Error(
        `No se pudo codificar la variante ${variant.name} como ${PREFERRED_FORMAT}.`
      );
    }

    const buffer = await outputBlob.arrayBuffer();

    results.push({
      name: variant.name,
      buffer,
      width: targetWidth,
      height: targetHeight,
      format: PREFERRED_FORMAT,
      size: buffer.byteLength,
    });
  }

  bitmap.close();
  return results;
}

// ─── Convert worker output to public type ───────────────────────────

function toProcessedVariant(output: ProcessedVariantOutput): ProcessedVariant {
  return {
    blob: new Blob([output.buffer], { type: output.format }),
    width: output.width,
    height: output.height,
    format: output.format,
    extension: formatToExtension(output.format),
    size: output.size,
  };
}

function encodedAllVariantsAsWebP(rawVariants: ProcessedVariantOutput[]): boolean {
  return rawVariants.every((variant) => variant.format === PREFERRED_FORMAT);
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Process a list of image files: resize to lg + th variants and encode
 * as WebP (or JPEG fallback). Returns one ProcessedImage per input file
 * with a Map of variants.
 *
 * If processing fails for a file, it throws — the caller should handle
 * fallback to uploading the original.
 */
export async function processImages(
  files: File[],
  onProgress?: (progress: ProcessingProgress) => void,
  controller?: ProcessingController
): Promise<(ProcessedImage | null)[]> {
  if (files.length === 0) return [];

  const useWebP = await canEncodeWebP();
  const useWorker = canUseWorker();

  console.info(
    "[image-processor] Iniciando procesamiento:",
    { files: files.length, useWebP, useWorker }
  );

  if (!useWebP) {
    console.info(
      "[image-processor] Este navegador no puede codificar WebP. Se subirán los originales."
    );
    return files.map(() => null);
  }

  let cancelled = false;
  const abortController = new AbortController();

  if (controller) {
    controller.cancel = () => {
      cancelled = true;
      abortController.abort();
    };
  }

  let processedCount = 0;

  const tasks = files.map((file) => async (): Promise<ProcessedImage | null> => {
    if (cancelled) throw new DOMException("Cancelado", "AbortError");

    onProgress?.({
      phase: "processing",
      current: processedCount + 1,
      total: files.length,
      currentFileName: file.name,
    });

    try {
      const buffer = await file.arrayBuffer();

      let rawVariants: ProcessedVariantOutput[];

      if (useWorker) {
        try {
          rawVariants = await processInWorker(buffer);

          if (!encodedAllVariantsAsWebP(rawVariants)) {
            console.warn(
              "[image-processor] Worker no devolvió WebP real para",
              file.name,
              "— intentando main thread."
            );
            const retryBuffer = await file.arrayBuffer();
            rawVariants = await processOnMainThread(retryBuffer);
          }
        } catch (workerError) {
          console.warn(
            "[image-processor] Worker falló para",
            file.name,
            "— intentando main thread:",
            workerError
          );
          try {
            const retryBuffer = await file.arrayBuffer();
            rawVariants = await processOnMainThread(retryBuffer);
          } catch (mainThreadError) {
            console.warn(
              "[image-processor] Main thread también falló para",
              file.name,
              ":",
              mainThreadError
            );
            return null;
          }
        }
      } else {
        rawVariants = await processOnMainThread(buffer);
      }

      const variants = new Map<VariantName, ProcessedVariant>();
      for (const raw of rawVariants) {
        variants.set(raw.name as VariantName, toProcessedVariant(raw));
      }

      return {
        originalName: file.name,
        variants,
      };
    } catch (fileError) {
      console.warn("[image-processor] Error procesando", file.name, ":", fileError);
      return null;
    } finally {
      processedCount++;

      onProgress?.({
        phase: "processing",
        current: processedCount,
        total: files.length,
        currentFileName: processedCount < files.length ? files[processedCount]?.name ?? "" : "",
      });
    }
  });

  const results = await runWithConcurrency(
    tasks,
    PROCESSING_CONCURRENCY,
    abortController.signal
  );

  const succeeded = results.filter(Boolean).length;
  console.info(
    `[image-processor] Completado: ${succeeded}/${files.length} procesadas exitosamente`
  );

  onProgress?.({
    phase: "idle",
    current: files.length,
    total: files.length,
    currentFileName: "",
  });

  return results;
}
