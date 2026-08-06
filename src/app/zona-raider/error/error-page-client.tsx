"use client";

import { Button } from "@/shared/ui/button";
import Link from "next/link";
import {
	IconShieldOff,
	IconRefresh,
	IconArrowLeft,
} from "@/shared/ui/tabler-icons";

export function ErrorPageClient() {
	return (
		<>
			<div className="mx-auto mb-8 size-24 rounded-full bg-gradient-to-br from-rose-500/20 to-rose-800/20 border border-rose-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
				<IconShieldOff className="size-12 text-rose-400" />
			</div>

			<h1 className="text-4xl md:text-5xl font-bold font-heading italic tracking-tight text-white">
				Acceso bloqueado
			</h1>

			<div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

			<p className="mt-6 text-base text-white/50 leading-relaxed">
				No podemos verificar tu identidad con Discord en este momento.
			</p>

			<p className="mt-6 text-sm text-white/30 leading-relaxed">
				Si el problema persiste, contacta con un Oficial de la hermandad o{" "}
				<Link
					href="/ayuda"
					className="text-rose-400 hover:text-rose-300 underline underline-offset-2 transition-colors"
				>
					consulta la página de ayuda
				</Link>
				.
			</p>

			<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
				<Button
					variant="outline"
					className="w-full sm:w-auto rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white gap-2 h-11 px-6"
					onClick={() => window.location.reload()}
				>
					<IconRefresh className="size-4" />
					Reintentar
				</Button>
				<Button asChild className="w-full sm:w-auto rounded-xl gap-2 h-11 px-6">
					<Link href="/">
						<IconArrowLeft className="size-4" />
						Volver al inicio
					</Link>
				</Button>
			</div>
		</>
	);
}
