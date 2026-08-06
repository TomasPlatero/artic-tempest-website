import type React from "react"
import { IconRefresh, IconSearch } from "@/shared/ui/tabler-icons"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Separator } from "@/shared/ui/separator"
import { WOW_REALMS } from "@/shared/integrations/bnet/realms"

interface ManualDialogState {
  name: string
  realm: string
  open: boolean
}

interface SettingsBnetManualDialogProps {
  manualDialog: ManualDialogState
  addingManual: boolean
  charNameRef: React.RefObject<HTMLInputElement | null>
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onRealmChange: (realm: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function SettingsBnetManualDialog({ manualDialog, addingManual, charNameRef, onOpenChange, onNameChange, onRealmChange, onSubmit }: SettingsBnetManualDialogProps) {
  return (
    <Dialog open={manualDialog.open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 px-6 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl font-bold uppercase tracking-widest text-xs gap-2 shrink-0">
          Añadir Personaje a Mano
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/5 shadow-2xl rounded-2xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold uppercase tracking-tight italic">AÑADIR PERSONAJE</DialogTitle>
          <DialogDescription className="text-white/40 font-medium">Introduce el nombre y el reino del personaje para buscarlo en WoWAudit y añadirlo al roster.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="char-name" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Nombre del Personaje</Label>
              <Input id="char-name" placeholder="Ej: Thrall" value={manualDialog.name} onChange={(e) => onNameChange(e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl text-lg font-bold placeholder:text-white/10 placeholder:font-normal" ref={charNameRef} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-realm" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Reino</Label>
              <Select value={manualDialog.realm} onValueChange={onRealmChange}>
                <SelectTrigger className="bg-white/5 border-white/5 h-12 rounded-xl text-lg font-bold">
                  <SelectValue placeholder="Selecciona el reino" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/5 max-h-[300px]">
                  {WOW_REALMS.map((realm) => (
                    <SelectItem key={realm.slug} value={realm.slug} className="font-bold py-3">{realm.name}</SelectItem>
                  ))}
                  <Separator className="my-2 bg-white/5" />
                  <div className="p-2 text-[10px] text-white/20 italic text-center">Si no aparece el reino, puedes escribirlo manualmente arriba</div>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={addingManual || !manualDialog.name || !manualDialog.realm} className="w-full h-14 rounded-xl font-semibold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 group">
              {addingManual ? <IconRefresh className="size-5 animate-spin" /> : <><IconSearch className="size-5 mr-2 group-hover:scale-110 transition-transform" />Buscar y Añadir</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
