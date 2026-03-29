"use client";

import { useEffect } from "react";
import AppErrorScreen from "@/components/ui/AppErrorScreen";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppErrorScreen
      title="No pudimos mostrar esta pantalla"
      description="La aplicación encontró un error inesperado en esta vista. Puedes volver a intentarlo sin salir del sitio."
      onReset={reset}
      resetLabel="Recargar esta vista"
    />
  );
}
