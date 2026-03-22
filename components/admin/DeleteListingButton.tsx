"use client";

import { useFormStatus } from "react-dom";

interface DeleteListingButtonProps {
  label?: string;
}

export default function DeleteListingButton({
  label = "Eliminar inmueble",
}: DeleteListingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (
          !window.confirm(
            "¿Seguro que quieres eliminar este inmueble? Esta acción no se puede deshacer."
          )
        ) {
          event.preventDefault();
        }
      }}
      className="lift-hover inline-flex min-h-10 items-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Eliminando..." : label}
    </button>
  );
}
