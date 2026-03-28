"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const LIGHT_THEME_COLOR = "#FFFFFF";
const DARK_THEME_COLOR = "#0F1117";

export default function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const isDark = resolvedTheme === "dark";
    const color = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    let meta = document.querySelector(
      'meta[name="theme-color"][data-renty-dynamic="true"]'
    ) as HTMLMetaElement | null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("data-renty-dynamic", "true");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", color);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [resolvedTheme]);

  return null;
}
