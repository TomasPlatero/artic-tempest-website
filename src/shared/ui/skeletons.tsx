import { Skeleton } from "./skeleton";

export function CardSkeletonRow({ count = 3, height = "h-32" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando contenido">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} w-full rounded-2xl`} />
      ))}
    </div>
  );
}

export function SpinnerFallback({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" aria-busy="true">
      <svg className="size-8 animate-spin text-white/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm font-medium uppercase tracking-widest text-white/30">{label}</p>
    </div>
  );
}

export function PageFallback({ minHeight = "min-h-[50vh]" }: { minHeight?: string }) {
  return <div className={`${minHeight} animate-pulse rounded-3xl bg-white/[0.03]`} aria-busy="true" />;
}
