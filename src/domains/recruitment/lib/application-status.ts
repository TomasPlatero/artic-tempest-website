export const TERMINAL_RECRUITMENT_STATUSES = [
  "accepted",
  "rejected",
  "cancelado",
] as const;

const RESOLVED_RECRUITMENT_STATUSES = TERMINAL_RECRUITMENT_STATUSES;

export const ACTIVE_RECRUITMENT_STATUSES = [
  "pending",
  "reviewing",
  "paused",
  "interview",
  "simulated",
] as const;

export const RECRUITMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Nuevo",
  reviewing: "En Revisión",
  paused: "En Pausa",
  interview: "Entrevista",
  accepted: "Aceptado",
  simulated: "Simulado",
  rejected: "Rechazado",
  cancelado: "Cancelado",
};

export const RECRUITMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reviewing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  paused: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  interview: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  simulated: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  cancelado: "bg-zinc-700/40 text-zinc-200 border-zinc-500/30",
};

export function isResolvedRecruitmentStatus(status?: string | null) {
  return !!status && RESOLVED_RECRUITMENT_STATUSES.includes(status as any);
}

export function isActiveRecruitmentStatus(status?: string | null) {
  return !!status && ACTIVE_RECRUITMENT_STATUSES.includes(status as any);
}
