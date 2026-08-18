import type { Metadata } from "next";
import { toProxyImagePath } from "@/shared/lib/storage-url";
import {
	RAIDER_PAGE_FADE_IN_CLASSES,
	RAIDER_CARD_REVEAL_CLASSES,
	RAIDER_STAGGER_DELAY_CLASSES,
} from "@/shared/components/raider-motion";
import { IconUsers } from "@/shared/ui/tabler-icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ViserioJoinGuide } from "./viserio-join-guide";
import {
	viserioGuideSteps,
	type ViserioGuideStep,
} from "./viserio-join-guide-data";

const pageTitle = "Guía Viserio / WowUtils | Artic Tempest";
const pageDescription =
	"Cómo unirte al grupo de Viserio / WowUtils del equipo de raid.";

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: { canonical: "https://artictempest.es/zona-raider/viserio" },
	openGraph: {
		title: pageTitle,
		description: pageDescription,
		type: "website",
		url: "https://artictempest.es/zona-raider/viserio",
		siteName: "Artic Tempest",
		images: ["/assets/images/artic-tempest-og.webp"],
	},
	twitter: {
		card: "summary_large_image",
		title: pageTitle,
		description: pageDescription,
		images: ["/assets/images/artic-tempest-og.webp"],
	},
};

export default function ViserioGuidePage() {
	const guide = viserioGuideSteps.map(
		(step): ViserioGuideStep => ({
			...step,
			images: step.images?.map((image) => ({
				...image,
				src: toProxyImagePath(image.src) ?? image.src,
			})),
		}),
	);

	return (
		<div className={`space-y-6 pb-6 ${RAIDER_PAGE_FADE_IN_CLASSES}`}>
			<section
				className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-blue-500/10 via-white/[0.03] to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 ${RAIDER_CARD_REVEAL_CLASSES}`}
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%)] pointer-events-none" />
				<div className="relative space-y-5">
					<div className="space-y-3 max-w-4xl">
						<h1 className="text-3xl md:text-5xl font-semibold uppercase tracking-tighter text-white">
							Guía Viserio / WowUtils
						</h1>
						<p className="text-sm md:text-base text-white/65 leading-relaxed max-w-3xl">
							Sigue estos pasos para unirte al grupo del equipo en Viserio /
							WowUtils. Es obligatorio para participar en raid.
						</p>
					</div>

					<div
						className={`grid gap-3 md:grid-cols-3 ${RAIDER_STAGGER_DELAY_CLASSES[1]}`}
					>
						{[
							{ label: "Plataforma", value: "wowutils.com" },
							{ label: "Acceso", value: "Battle.net" },
							{ label: "Obligatorio", value: "Para raid" },
						].map((item) => (
							<div
								key={item.label}
								className="rounded-2xl border border-white/10 bg-zinc-950/20 px-4 py-3"
							>
								<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
									{item.label}
								</p>
								<p className="mt-2 text-sm font-semibold text-white">
									{item.value}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<div className="space-y-6">
				<Card
					className={`border-white/10 bg-white/[0.03] ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[2]}`}
				>
					<CardHeader className="space-y-3">
						<div className="flex items-center gap-3 text-white">
							<div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
								<IconUsers className="size-5" />
							</div>
							<CardTitle className="text-xl uppercase tracking-tight">
								Cómo unirse
							</CardTitle>
						</div>
						<p className="text-sm text-white/55">
							Haz clic en cada paso para ver el detalle y ampliar las capturas.
						</p>
					</CardHeader>
					<CardContent>
						{guide.length > 0 ? (
							<ViserioJoinGuide steps={guide} />
						) : (
							<p className="text-sm leading-relaxed text-white/65">
								La guía estará disponible próximamente.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
