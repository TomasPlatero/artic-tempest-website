import type { Metadata } from "next";
import { ErrorPageClient } from "./error-page-client";

const pageTitle = "Zona Raider no disponible | Artic Tempest";
const pageDescription =
	"No podemos validar tu estado con Discord. La Zona Raider queda bloqueada hasta que el bot vuelva a responder.";

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	robots: { index: false, follow: false },
	alternates: { canonical: "https://artictempest.es/zona-raider/error" },
	openGraph: {
		title: pageTitle,
		description: pageDescription,
		type: "website",
		url: "https://artictempest.es/zona-raider/error",
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

export default function ZonaRaiderErrorPage() {
	return (
		<div className="relative min-h-dvh w-full bg-[#020203] flex items-center justify-center overflow-hidden">
			{/* Background layers */}
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15]"
				style={{
					backgroundImage: 'url("/assets/images/midnight-battle.webp")',
				}}
			/>
			<div className="absolute inset-0 bg-gradient-to-b from-[#020203] via-[#020203]/60 to-[#020203]" />
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_70%)]" />

			<div className="relative z-10 w-full max-w-lg mx-auto px-4">
				<div className="rounded-3xl border border-white/[0.06] bg-black/60 backdrop-blur-xl p-10 md:p-14 text-center shadow-2xl shadow-black/50">
					<ErrorPageClient />
				</div>
			</div>
		</div>
	);
}
