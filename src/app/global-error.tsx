"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { IconServerOff } from "@/shared/ui/tabler-icons";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
	preload: false,
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
	preload: false,
});

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html
			lang="es"
			className={`${geistSans.variable} ${geistMono.variable} dark`}
		>
			<body className="antialiased bg-[#09090b] text-white min-h-dvh flex items-center justify-center">
				<div className="flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
					<div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
						<IconServerOff className="size-16 text-red-500" />
					</div>

					<h1 className="text-4xl font-semibold mb-4 tracking-tight">
						Fallo en el sistema
					</h1>
					<p className="text-zinc-400 mb-8 text-lg">
						Ha ocurrido un error inesperado al renderizar el entorno principal
						de la aplicación.
					</p>

					<button
						type="button"
						onClick={() => reset()}
						className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
					>
						Recargar aplicación
					</button>
				</div>
			</body>
		</html>
	);
}
