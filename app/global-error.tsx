"use client";

import "@/styles/globals.css";
import { useEffect } from "react";
import AppErrorScreen from "@/components/ui/AppErrorScreen";

const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = stored || 'system';
      var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
`;

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          id="renty-global-error-theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-screen bg-bg-base font-sans text-t-primary antialiased">
        <AppErrorScreen
          title="La aplicación tuvo un problema serio"
          description="Algo falló a nivel global y por eso no pudimos terminar de renderizar la página. Puedes intentar recargar o volver a entrar al flujo que estabas usando."
          onReset={reset}
          resetLabel="Intentar recuperar"
          fullViewport
        />
      </body>
    </html>
  );
}
