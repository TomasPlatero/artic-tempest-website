export function NewsSectionSkeleton() {
  return (
    <section className="relative bg-[#050814] px-6 py-24" aria-busy="true">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end md:mb-12">
          <div className="space-y-3 text-center sm:text-left">
            <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-white/[0.03] sm:mx-0" />
            <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-white/[0.03] sm:mx-0" />
          </div>
          <div className="h-12 w-48 animate-pulse rounded-full bg-white/[0.03]" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <div className="h-[400px] w-full animate-pulse rounded-3xl bg-white/[0.03] md:h-[500px]" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="h-48 w-full animate-pulse rounded-2xl bg-white/[0.03]" />
              <div className="h-48 w-full animate-pulse rounded-2xl bg-white/[0.03]" />
            </div>
          </div>
          <div className="space-y-8 lg:col-span-4">
            <div className="h-64 w-full animate-pulse rounded-3xl bg-white/[0.03]" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-white/[0.03]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProgresoSkeleton() {
  return (
    <section
      className="mx-auto max-w-7xl px-6 py-24 text-center"
      aria-busy="true"
    >
      <div className="mx-auto mb-12 h-10 w-80 animate-pulse rounded-lg bg-white/[0.03]" />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="mx-auto h-3 w-16 animate-pulse rounded-full bg-white/[0.03]" />
            <div className="h-64 w-full animate-pulse rounded-3xl bg-white/[0.03]" />
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="h-4 w-48 animate-pulse rounded-full bg-white/[0.03]" />
        <div className="h-12 w-56 animate-pulse rounded-full bg-white/[0.03]" />
      </div>
    </section>
  );
}

export function StreamersSkeleton() {
  return (
    <section
      className="bg-zinc-950 px-6 py-24 text-center"
      aria-busy="true"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-4 h-10 w-72 animate-pulse rounded-lg bg-white/[0.03]" />
        <div className="mx-auto mb-12 h-5 w-96 animate-pulse rounded-full bg-white/[0.03]" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4"
            >
              <div className="mb-4 aspect-video w-full animate-pulse rounded-xl bg-white/[0.03]" />
              <div className="flex items-center gap-3">
                <div className="size-10 shrink-0 animate-pulse rounded-full bg-white/[0.03]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.03]" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/[0.03]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecruitmentSkeleton() {
  return (
    <section
      className="relative isolate w-full overflow-hidden px-6 py-16 md:py-20"
      aria-busy="true"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 text-center md:mb-10">
          <div className="mx-auto mb-4 h-9 w-56 animate-pulse rounded-lg bg-white/[0.03] md:h-10" />
          <div className="mx-auto h-1 w-16 animate-pulse rounded-full bg-white/[0.03]" />
          <div className="mx-auto mt-3 h-5 w-96 animate-pulse rounded-full bg-white/[0.03]" />
        </div>

        <div className="mb-8 rounded-[2rem] border border-white/[0.04] bg-white/[0.01] p-6 md:mb-10 md:p-8">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-20 animate-pulse rounded-full bg-white/[0.03]"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 w-full animate-pulse rounded-[1.75rem] bg-white/[0.03]"
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:mt-12">
          <div className="h-14 w-64 animate-pulse rounded-full bg-white/[0.03]" />
        </div>
      </div>
    </section>
  );
}
