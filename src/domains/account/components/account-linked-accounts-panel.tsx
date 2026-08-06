"use client";

import { Button } from "@/shared/ui/button";
import {
  IconCheck,
  IconDeviceGamepad,
  IconRefresh,
  IconTrash,
  IconUnlink,
} from "@/shared/ui/tabler-icons";

type Props = {
  battletag: string | null;
  isBnetLinked: boolean;
  unlinking: boolean;
  deleting: boolean;
  onLinkAccount: () => void;
  onUnlink: () => void;
  onOpenDeleteDialog: () => void;
};

export function AccountLinkedAccountsPanel({
  battletag,
  isBnetLinked,
  unlinking,
  deleting,
  onLinkAccount,
  onUnlink,
  onOpenDeleteDialog,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 uppercase tracking-tight text-white/90">
          Cuentas vinculadas
        </h2>
        <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col gap-4 backdrop-blur-sm">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Para poder interactuar con las herramientas de reclutamiento,
            necesitas vincular tus personajes.
          </p>
          <div className="space-y-3">
            {isBnetLinked ? (
              <div className="border border-white/10 rounded-xl overflow-hidden shadow-sm bg-zinc-950/40">
                <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-2">
                    <IconDeviceGamepad className="size-4 text-[#00aeff]" />
                    <span className="text-xs font-bold uppercase tracking-tight text-white/80">
                      Battle.net
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <IconCheck className="size-3 text-emerald-500" />
                    <span className="text-[9px] font-semibold text-emerald-500 uppercase tracking-tight">
                      Activo
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 group">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-white/50 leading-none mb-1">
                      BattleTag
                    </span>
                    <span
                      className="text-sm font-bold truncate text-white/90"
                      title={battletag ?? undefined}
                    >
                      {battletag}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                    onClick={onUnlink}
                    disabled={unlinking}
                    title="Desvincular cuenta"
                  >
                    {unlinking ? (
                      <IconRefresh className="size-4 animate-spin" />
                    ) : (
                      <IconUnlink className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/5">
                <span className="text-xs font-bold uppercase tracking-tight flex items-center gap-2 text-zinc-300">
                  <IconDeviceGamepad className="size-4 grayscale opacity-30" />
                  Battle.net
                </span>
                <div className="flex items-center gap-2 text-[9px] font-semibold text-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                  No vinculado
                </div>
              </div>
            )}
          </div>
          {!isBnetLinked && (
            <Button
              variant="glow"
              className="w-full text-[10px] font-semibold uppercase tracking-widest"
              onClick={onLinkAccount}
            >
              Vincular cuenta
            </Button>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400/80 mb-4 px-2">
          Zona de Peligro
        </h2>
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
          <p className="text-[10px] text-red-300/90 leading-relaxed mb-4 font-medium italic">
            Esta acción eliminará permanentemente tu cuenta y todos tus datos
            personales de Artic Tempest. No podrá ser revertida.
          </p>
          <Button
            variant="ghost"
            className="w-full text-red-500 hover:bg-red-500/10 border border-red-500/20 text-[10px] font-semibold uppercase tracking-widest h-10 gap-2"
            onClick={onOpenDeleteDialog}
            disabled={deleting}
          >
            {deleting ? (
              <IconRefresh className="size-3.5 animate-spin" />
            ) : (
              <IconTrash className="size-3.5" />
            )}
            Borrar mi cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
