import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconRefresh,
} from "@/shared/ui/tabler-icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

type RaiderRulesUnavailableProps = {
  message: string;
  detail?: string | null;
};

export function RaiderRulesUnavailable({
  message,
  detail,
}: RaiderRulesUnavailableProps) {
  return (
    <div className="flex min-h-[72vh] items-center justify-center py-6">
      <Card className="w-full max-w-3xl border-rose-500/20 bg-rose-500/[0.04] shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
        <CardHeader className="space-y-4">
          <div className="flex size-14 items-center justify-center rounded-3xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
            <IconAlertTriangle className="size-7" />
          </div>
          <CardTitle className="text-2xl uppercase tracking-tight text-white">
            Zona Raider temporalmente indisponible
          </CardTitle>
          <p className="max-w-2xl text-sm leading-relaxed text-white/65">
            {message}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {detail ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-4 text-sm leading-relaxed text-white/75">
              {detail}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/zona-raider"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
            >
              <IconRefresh className="size-4" />
              Reintentar
            </Link>

            <Link
              href="/zona-raider"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/75 transition-colors hover:bg-white/5 hover:text-white"
            >
              <IconArrowLeft className="size-4" />
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
