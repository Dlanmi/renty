"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { getButtonClasses } from "@/components/ui/Button";

type ShareStatus = "idle" | "copied" | "shared" | "error";

interface ShareListingButtonProps {
  url: string;
  title: string;
  description: string;
  compact?: boolean;
  className?: string;
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  if (typeof document === "undefined") return false;
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  return copied;
}

export default function ShareListingButton({
  url,
  title,
  description,
  compact = false,
  className = "",
}: ShareListingButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");

  const statusLabel = useMemo(() => {
    if (status === "copied") return "Enlace copiado";
    if (status === "shared") return "Compartido";
    if (status === "error") return "No se pudo compartir";
    return "Compartir";
  }, [status]);

  useEffect(() => {
    if (status === "idle") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title,
      text: description,
      url,
    };

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share(shareData);
        setStatus("shared");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    try {
      const copied = await copyToClipboard(url);
      setStatus(copied ? "copied" : "error");
    } catch {
      setStatus("error");
    }
  }, [description, title, url]);

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`lift-hover inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-50 ${className}`}
        aria-label={statusLabel}
        title={statusLabel}
      >
        <Icon name={status === "error" ? "error" : "share"} size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={getButtonClasses("secondary", `lift-hover w-full ${className}`)}
      aria-live="polite"
    >
      <Icon name={status === "error" ? "error" : "share"} size={18} />
      {statusLabel}
    </button>
  );
}
