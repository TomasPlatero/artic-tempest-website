"use client";

import { Button } from "@/shared/ui/button";
import { IconDeviceFloppy } from "@/shared/ui/tabler-icons";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

export function SettingsEditSheetHeader() {
  return (
    <SheetHeader>
      <SheetTitle>Editar Elemento</SheetTitle>
      <SheetDescription>
        Configura nombre, ruta, icono, permisos y visibilidad.
      </SheetDescription>
    </SheetHeader>
  );
}

export function SettingsEditSheetFooter({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <SheetFooter className="sm:justify-between mt-6 border-t border-white/5 pt-4">
      <Button variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button onClick={onSave} className="gap-2">
        <IconDeviceFloppy className="size-4" /> Guardar
      </Button>
    </SheetFooter>
  );
}
