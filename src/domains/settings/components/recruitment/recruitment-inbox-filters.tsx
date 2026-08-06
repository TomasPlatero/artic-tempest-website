import { IconSearch } from "@/shared/ui/tabler-icons"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

type StatusOption = [string, { label: string; color: string }]

interface RecruitmentInboxFiltersProps {
  searchTerm: string
  statusFilter: string
  total: number
  statusOptions: StatusOption[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function RecruitmentInboxFilters({
  searchTerm,
  statusFilter,
  total,
  statusOptions,
  onSearchChange,
  onStatusChange,
}: RecruitmentInboxFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-zinc-950/20 p-3 md:flex-row md:items-center md:justify-between md:p-4">
      <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
        <div className="relative w-full sm:w-64">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-9 bg-zinc-950/50 border-white/10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full bg-zinc-950/50 border-white/10 sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10 text-white">
            <SelectItem value="all">Todos los estados</SelectItem>
            {statusOptions.map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="w-full text-center text-xs font-medium text-zinc-500 md:w-auto md:text-right">Mostrando {total} solicitudes</p>
    </div>
  )
}
