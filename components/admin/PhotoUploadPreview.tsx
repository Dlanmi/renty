"use client";

import { useEffect, useState } from "react";

interface PhotoUploadPreviewProps {
  inputName: string;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
}

export default function PhotoUploadPreview({
  inputName,
}: PhotoUploadPreviewProps) {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);

  useEffect(() => {
    // Listen for changes on the file input matching inputName
    const input = document.querySelector(
      `input[name="${inputName}"]`
    ) as HTMLInputElement | null;
    if (!input) return;

    const handleChange = () => {
      // Clean up previous previews
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));

      const files = Array.from(input.files ?? []);
      const newPreviews = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setPreviews(newPreviews);
    };

    input.addEventListener("change", handleChange);
    return () => {
      input.removeEventListener("change", handleChange);
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputName]);

  if (previews.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-stone-700">
        {previews.length} {previews.length === 1 ? "archivo seleccionado" : "archivos seleccionados"}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {previews.map((preview, index) => (
          <div
            key={`preview-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.previewUrl}
              alt={preview.file.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 pb-1 pt-4">
              <p className="truncate text-[10px] text-white">
                {preview.file.name}
              </p>
              <p className="text-[10px] text-white/70">
                {(preview.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
