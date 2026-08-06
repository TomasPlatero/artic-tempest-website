/**
 * Static H1 rendered in root layout body, BEFORE RSC children.
 * Guaranteed in initial HTML for crawlers.
 */
import { getGuildBranding } from "@/shared/guild/guild-branding";

export async function LayoutH1() {
	const guild = await getGuildBranding();
	const name = guild?.name || "Artic Tempest";

	return (
		<h1
			style={{
				position: "absolute",
				width: "1px",
				height: "1px",
				padding: 0,
				margin: "-1px",
				overflow: "hidden",
				clip: "rect(0, 0, 0, 0)",
				whiteSpace: "nowrap",
				borderWidth: 0,
			}}
		>
			{name} — Hermandad WoW | Progreso Mítico en Dun Modr
		</h1>
	);
}
