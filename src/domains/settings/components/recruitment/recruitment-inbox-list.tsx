import type React from "react"
import { IconCheck, IconChevronDown, IconChevronUp, IconClock, IconExternalLink, IconSend, IconSelector, IconTrash } from "@/shared/ui/tabler-icons"
import Image from "next/image"
import { Button } from "@/shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

interface RecruitmentInboxListProps {
  visibleApps: any[]
  classMap: Map<number, { name: string; color: string }>
  canForceEmbed: boolean
  isDeleting: string | null
  isSendingEmbed: string | null
  statusConfig: Record<string, { label: string; color: string }>
  sortKey: "character" | "status" | "createdAt" | "notes"
  sortDirection: "asc" | "desc"
  onSortChange: (key: "character" | "status" | "createdAt" | "notes") => void
  onOpenDetails: (id: string) => void
  onDelete: (e: React.MouseEvent, id: string, name: string) => void
  onForceEmbed: (e: React.MouseEvent, id: string, name: string) => void
  CreatedAtDate: ({ createdAt }: { createdAt: string | number | Date }) => React.JSX.Element
}

function statusDotClass(status: string) {
  switch (status) {
    case "pending": return "bg-blue-500"
    case "reviewing": return "bg-purple-500"
    case "paused": return "bg-zinc-400"
    case "interview": return "bg-amber-500"
    case "accepted": return "bg-emerald-500"
    case "cancelado": return "bg-zinc-400"
    case "rejected": return "bg-rose-500"
    default: return "bg-zinc-500"
  }
}

function statusTextClass(status: string) {
  switch (status) {
    case "pending": return "text-blue-400"
    case "reviewing": return "text-purple-400"
    case "paused": return "text-zinc-300"
    case "interview": return "text-amber-400"
    case "accepted": return "text-emerald-400"
    case "cancelado": return "text-zinc-300"
    case "rejected": return "text-rose-400"
    default: return "text-zinc-400"
  }
}

function SortIndicator({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <IconSelector className="size-3.5 text-zinc-600" />
  return direction === "asc"
    ? <IconChevronUp className="size-3.5 text-blue-400" />
    : <IconChevronDown className="size-3.5 text-blue-400" />
}

function MobileSortChip({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active: boolean
  direction: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center justify-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:px-3 sm:py-2 sm:text-xs ${active ? "border-blue-500/30 bg-blue-500/15 text-blue-200" : "border-white/10 bg-white/5 text-zinc-300"}`}
    >
      {label}
      <SortIndicator active={active} direction={direction} />
    </button>
  )
}

export function RecruitmentInboxList({
  visibleApps,
  classMap,
  canForceEmbed,
  isDeleting,
  isSendingEmbed,
  statusConfig,
  sortKey,
  sortDirection,
  onSortChange,
  onOpenDetails,
  onDelete,
  onForceEmbed,
  CreatedAtDate,
}: RecruitmentInboxListProps) {
  return (
    <div className="space-y-4">
      <div className="md:hidden grid grid-cols-1 gap-2 sm:grid-cols-2">
        <MobileSortChip label="Personaje" active={sortKey === "character"} direction={sortDirection} onClick={() => onSortChange("character")} />
        <MobileSortChip label="Estado" active={sortKey === "status"} direction={sortDirection} onClick={() => onSortChange("status")} />
        <MobileSortChip label="Fecha" active={sortKey === "createdAt"} direction={sortDirection} onClick={() => onSortChange("createdAt")} />
        <MobileSortChip label="Notas" active={sortKey === "notes"} direction={sortDirection} onClick={() => onSortChange("notes")} />
      </div>

      <div className="md:hidden space-y-3">
        {visibleApps.map((app) => {
          const cls = classMap.get(app.character_class)

          return (
            <div
              key={app.id}
              className="w-full rounded-2xl border border-white/8 bg-zinc-950/40 p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                  <Image
                    src={`/assets/images/classes/${app.character_class}.webp`}
                    alt="Clase"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{app.character_name}</h3>
                      <p className="truncate text-xs font-medium" style={{ color: cls?.color }}>
                        {app.character_spec} {cls?.name} · {app.character_realm}
                      </p>
                      {app.rio_guild?.name && (
                        <p className="truncate text-[11px] text-blue-400/70 mt-0.5">
                          &lt;{app.rio_guild.name}&gt;
                        </p>
                      )}
                    </div>

                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusTextClass(app.status)} border-white/5 bg-white/5`}>
                      <div className={`size-1.5 rounded-full ${statusDotClass(app.status)}`} />
                      {statusConfig[app.status]?.label}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
                    <IconClock className="size-3" />
                    <CreatedAtDate createdAt={app.created_at} />
                    {app.status === "interview" && app.hasNewApplicantMessage && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-semibold uppercase tracking-[0.14em] text-emerald-300">
                        <IconCheck className="size-3" />
                        Nuevo mensaje
                      </span>
                    )}
                    {app.internal_notes && (
                      <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-semibold uppercase tracking-[0.14em] text-blue-300">
                        Con notas
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {canForceEmbed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-full justify-center rounded-xl border-[#5865F2]/20 bg-[#5865F2]/10 px-0 text-[#cfd6ff] hover:bg-[#5865F2] hover:text-white"
                        aria-label="Forzar embed"
                        onClick={(e) => onForceEmbed(e, app.id, app.character_name)}
                        disabled={isSendingEmbed === app.id}
                      >
                        <IconSend className={`size-4 ${isSendingEmbed === app.id ? "animate-pulse" : ""}`} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-full justify-center rounded-xl border border-white/10 bg-white/5 px-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Borrar"
                      onClick={(e) => onDelete(e, app.id, app.character_name)}
                      disabled={isDeleting === app.id}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full justify-center rounded-xl border-white/10 bg-white/5 px-0 text-white hover:bg-blue-500 hover:text-white"
                      aria-label="Ver detalles"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDetails(app.id)
                      }}
                    >
                      <IconExternalLink className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="w-[260px] lg:w-[320px] text-xs uppercase tracking-[0.2em] text-zinc-500">
              <button type="button" className="flex items-center gap-2 text-left" onClick={() => onSortChange("character")}>
                Personaje
                <SortIndicator active={sortKey === "character"} direction={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell text-xs uppercase tracking-[0.2em] text-zinc-500">
              <button type="button" className="flex items-center gap-2 text-left" onClick={() => onSortChange("status")}>
                Estado
                <SortIndicator active={sortKey === "status"} direction={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell text-xs uppercase tracking-[0.2em] text-zinc-500">
              <button type="button" className="flex items-center gap-2 text-left" onClick={() => onSortChange("createdAt")}>
                Fecha
                <SortIndicator active={sortKey === "createdAt"} direction={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="hidden xl:table-cell text-xs uppercase tracking-[0.2em] text-zinc-500">
              <button type="button" className="flex items-center gap-2 text-left" onClick={() => onSortChange("notes")}>
                Notas
                <SortIndicator active={sortKey === "notes"} direction={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="text-right text-xs uppercase tracking-[0.2em] text-zinc-500">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleApps.map((app) => {
            const cls = classMap.get(app.character_class)

            return (
              <TableRow
                key={app.id}
                onClick={() => onOpenDetails(app.id)}
                className="cursor-pointer border-white/5 transition-colors hover:bg-white/5"
              >
                <TableCell className="max-w-[260px] lg:max-w-[320px] py-4 pr-4 align-top">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative size-12 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                      <Image
                        src={`/assets/images/classes/${app.character_class}.webp`}
                        alt="Clase"
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {app.character_name}
                        </h3>
                      </div>
                      <p className="text-xs font-medium truncate" style={{ color: cls?.color }}>
                        {app.character_spec} {cls?.name} · {app.character_realm}
                      </p>
                      {app.rio_guild?.name && (
                        <p className="text-[11px] text-blue-400/70 mt-0.5">
                          &lt;{app.rio_guild.name}&gt;
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell py-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5">
                    <div className={`size-2 rounded-full ${statusDotClass(app.status)}`} />
                    <span className={`text-xs font-semibold ${statusTextClass(app.status)}`}>
                      {statusConfig[app.status]?.label}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell py-4 text-zinc-400">
                  <div className="flex items-center gap-2 text-sm">
                    <IconClock className="size-3.5 text-zinc-500" />
                    <CreatedAtDate createdAt={app.created_at} />
                  </div>
                </TableCell>

                <TableCell className="hidden xl:table-cell py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {app.internal_notes && (
                      <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">
                        ✓ Con notas
                      </span>
                    )}
                    {app.status === "interview" && app.hasNewApplicantMessage && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        <IconCheck className="size-3" />
                        Nuevo mensaje
                      </span>
                    )}
                    {!app.internal_notes && !(app.status === "interview" && app.hasNewApplicantMessage) && (
                      <span className="text-sm text-zinc-500">—</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-4 align-top">
                  <div className="flex flex-row flex-wrap gap-2 items-center justify-end">
                    {canForceEmbed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 sm:w-auto sm:h-10 justify-center rounded-xl border-[#5865F2]/20 bg-[#5865F2]/10 text-[#cfd6ff] hover:bg-[#5865F2] hover:text-white  text-xs px-0 sm:px-4"
                        aria-label="Forzar embed"
                        onClick={(e) => onForceEmbed(e, app.id, app.character_name)}
                        disabled={isSendingEmbed === app.id}
                      >
                        <IconSend className={`size-4 sm:size-3.5 ${isSendingEmbed === app.id ? "animate-pulse" : ""}`} />
                        <span className="hidden sm:inline sm:ml-2">Forzar embed</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 sm:w-9 sm:h-9 justify-center rounded-xl text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors px-0"
                      aria-label="Borrar"
                      onClick={(e) => onDelete(e, app.id, app.character_name)}
                      disabled={isDeleting === app.id}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-10 h-10 sm:w-auto sm:h-10 justify-center rounded-xl border-white/10 bg-white/5 hover:bg-blue-500 hover:text-white  text-xs px-0 sm:px-4"
                      aria-label="Ver detalles"
                      onClick={() => onOpenDetails(app.id)}
                    >
                      <IconExternalLink className="size-4 sm:size-3 mr-0 sm:mr-2" />
                      <span className="hidden sm:inline">Ver Detalles</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
