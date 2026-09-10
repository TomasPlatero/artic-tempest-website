"use client";

import Link from "next/link";
import { IconArrowLeft } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";

type SeoSettingsHeaderProps = {
  canEdit: boolean;
  saving: boolean;
  onSave: () => void;
};

export function SeoSettingsHeader({ canEdit, saving, onSave }: SeoSettingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Link href="/zona-raider/configuracion">
          <Button
            variant="outline"
            size="icon"
            aria-label="Volver a configuración"
            className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
          >
            <IconArrowLeft className="size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold font-heading italic tracking-tight uppercase">
            SEO y presencia web
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 tracking-widest">
            Configura cómo aparece tu web en buscadores y redes sociales
          </p>
        </div>
      </div>

      {canEdit ? (
        <Button
          onClick={onSave}
          disabled={saving}
          className="rounded-xl h-12 px-6 text-sm shadow-lg shadow-blue-500/15"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      ) : null}
    </div>
  );
}
