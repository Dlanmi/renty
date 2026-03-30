// ─── WebP encoding detection ────────────────────────────────────────
//
// Checks once whether the current browser can *encode* WebP via canvas.
// The result is cached for the lifetime of the page.

let cachedResult: boolean | null = null;

export async function canEncodeWebP(): Promise<boolean> {
  if (cachedResult !== null) return cachedResult;

  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(1, 1);
      const blob = await canvas.convertToBlob({ type: "image/webp" });
      cachedResult = blob.type === "image/webp";
    } else if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      cachedResult = canvas
        .toDataURL("image/webp")
        .startsWith("data:image/webp");
    } else {
      cachedResult = false;
    }
  } catch {
    cachedResult = false;
  }

  return cachedResult;
}
