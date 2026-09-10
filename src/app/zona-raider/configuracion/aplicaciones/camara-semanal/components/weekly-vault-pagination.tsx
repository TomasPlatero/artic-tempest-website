import { IconChevronLeft, IconChevronRight } from "@/shared/ui/tabler-icons"
import { Button } from "@/shared/ui/button"

interface WeeklyVaultPaginationProps {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    totalItems: number
    onPageChange: (page: number) => void
}

export function WeeklyVaultPagination({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange }: WeeklyVaultPaginationProps) {
    if (totalPages <= 1) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-card/60 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-sm">
            <span className="text-sm text-muted-foreground text-center sm:text-left">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} capturas
            </span>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Página anterior" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="size-8 rounded-lg">
                    <IconChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center justify-center min-w-[40px] text-sm font-medium">
                    {currentPage} / {totalPages}
                </div>
                <Button variant="outline" size="icon" aria-label="Página siguiente" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="size-8 rounded-lg">
                    <IconChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    )
}
