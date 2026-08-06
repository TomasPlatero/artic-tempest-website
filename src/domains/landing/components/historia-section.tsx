"use client";

import NextImage from "next/image";
import Link from "next/link";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { Button } from "@/shared/ui/button";
import { blurDataUrls } from "@/shared/images/blur-data-urls";

export function HistoriaSection() {
	return (
		<section
			className={cn(
				"relative overflow-hidden px-6 py-24 text-center",
				"animate-fade-in animate-duration-slow motion-reduce:animate-none",
			)}
			aria-labelledby="historia-title"
		>
			<div className="absolute inset-0">
				<NextImage
					src="/assets/images/historia-cultura.webp"
					alt="Historia y cultura de Artic Tempest"
					fill
					sizes="100vw"
					placeholder="blur"
					blurDataURL={blurDataUrls.historiaCultura}
					className="object-cover object-center opacity-38"
				/>
				<div className="absolute inset-0 bg-linear-to-b from-[#04070f]/68 via-[#04070f]/52 to-[#04070f]/78" />
			</div>

			<div
				className={cn(
					"relative z-10 mx-auto max-w-5xl rounded-[2.5rem] border border-white/10 bg-white/8 px-6 py-14 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur sm:px-10",
					"animate-fade-in-up animate-duration-slow motion-reduce:animate-none",
				)}
			>
				<h2
					id="historia-title"
					className="mb-8 text-4xl font-semibold uppercase tracking-[0.18em]"
				>
					<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)]">
						Nuestra historia y cultura
					</span>
				</h2>

				<div className="mx-auto max-w-3xl space-y-6">
					<p className="text-lg text-blue-100/80 leading-relaxed">
						<strong className="text-white font-semibold">Artic Tempest</strong>{" "}
						nace con una idea clara: progresar con seriedad sin perder el buen
						ambiente que hace que una hermandad funcione a largo plazo.
					</p>

					<p className="text-lg text-blue-100/80 leading-relaxed">
						Somos un grupo consolidado en{" "}
						<span className="text-blue-400 font-bold">Dun Modr</span>, con un
						primer{" "}
						<span className="text-white font-bold">
							Cutting Edge en The War Within
						</span>{" "}
						y un puesto como hermandad{" "}
						<span className="text-white font-bold">Top 25 de España</span>. Aquí
						hay organización, constancia y una cultura de raid centrada en la
						preparación, la mejora continua y el trabajo en equipo.
					</p>

					<div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
						<Button variant="landingPrimary" size="landing" asChild>
							<Link href="/historia-y-cultura">Leer historia y cultura</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
