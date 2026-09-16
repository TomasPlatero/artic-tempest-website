"use client";

import { Button } from "@/shared/ui/button";
import { IconDeviceFloppy } from "@/shared/ui/tabler-icons";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

export function SettingsEditSheetHeader({
  isDraft,
  isCategory,
}: {
  isDraft?: boolean;
  isCategory?: boolean;
}) {
  return (
    <SheetHeader>
      <SheetTitle>
        {isDraft
          ? isCategory
            ? "Nueva Categoría"
            : "Nuevo Enlace"
          : "Editar Elemento"}
      </SheetTitle>
      <SheetDescription>
        {isDraft
          ? "Rellena los datos y pulsa Crear. El elemento no existe hasta que guardes."
          : "Configura nombre, ruta, icono, permisos y visibilidad."}
      </SheetDescription>
    </SheetHeader>
  );
}

export function SettingsEditSheetFooter({
  onCancel,
  onSave,
  submitLabel = "Guardar",
}: {
  onCancel: () => void;
  onSave: () => void;
  submitLabel?: string;
}) {
  return (
    <SheetFooter className="sm:justify-between mt-6 border-t border-white/5 pt-4">
      <Button variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button onClick={onSave} className="gap-2">
        <IconDeviceFloppy className="size-4" /> {submitLabel}
      </Button>
    </SheetFooter>
  );
}
