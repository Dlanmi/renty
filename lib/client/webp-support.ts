// ─── WebP encoding detection ────────────────────────────────────────
//
// Checks whether the current browser can *encode* WebP via either
// OffscreenCanvas or the regular main-thread canvas. Some browsers expose
// OffscreenCanvas but still cannot encode WebP there, while the main
// thread can. We treat either capability as enough to enable processing.

let cachedResult: boolean | null = null;

async function canEncodeWithOffscreenCanvas(): Promise<boolean> {
  if (typeof OffscreenCanvas === "undefined") return false;

  try {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext("2d");
    ctx?.fillRect(0, 0, 1, 1);

    const blob = await canvas.convertToBlob({ type: "image/webp" });
    const supported = blob.type === "image/webp";

    if (!supported) {
      console.info(
        "[webp-support] OffscreenCanvas.convertToBlob produjo:",
        blob.type
      );
    }

    return supported;
  } catch (err) {
    console.warn("[webp-support] Detección OffscreenCanvas falló:", err);
    return false;
  }
}

function canEncodeWithCanvasElement(): boolean {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    const ctx = canvas.getContext("2d");
    ctx?.fillRect(0, 0, 1, 1);

    const dataUrl = canvas.toDataURL("image/webp");
    const supported = dataUrl.startsWith("data:image/webp");

    if (!supported) {
      console.info(
        "[webp-support] canvas.toDataURL produjo:",
        dataUrl.substring(0, 30)
      );
    }

    return supported;
  } catch (err) {
    console.warn("[webp-support] Detección canvas falló:", err);
    return false;
  }
}

export async function canEncodeWebP(): Promise<boolean> {
  if (cachedResult !== null) return cachedResult;

  const [offscreenSupported, canvasSupported] = await Promise.all([
    canEncodeWithOffscreenCanvas(),
    Promise.resolve(canEncodeWithCanvasElement()),
  ]);

  cachedResult = offscreenSupported || canvasSupported;
  return cachedResult;
}
