"use client";

import React from "react";
import {
	IconBrandX,
	IconBrandFacebook,
	IconBrandWhatsapp,
	IconBrandTelegram,
	IconLink,
	IconCheck,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/shared/lib/use-prefers-reduced-motion";

interface ShareBarProps {
	title: string;
	url: string;
	children?: React.ReactNode;
}

export function ShareBar({ title, url, children }: ShareBarProps) {
	const [copied, setCopied] = React.useState(false);
	const prefersReducedMotion = usePrefersReducedMotion();

	const encodedTitle = encodeURIComponent(title);
	const encodedUrl = encodeURIComponent(url);

	const shareLinks = [
		{
			name: "X",
			icon: IconBrandX,
			href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
			color: "hover:bg-zinc-800",
		},
		{
			name: "Facebook",
			icon: IconBrandFacebook,
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			color: "hover:bg-blue-700",
		},
		{
			name: "WhatsApp",
			icon: IconBrandWhatsapp,
			href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
			color: "hover:bg-green-600",
		},
		{
			name: "Telegram",
			icon: IconBrandTelegram,
			href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
			color: "hover:bg-sky-500",
		},
	];

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success("Enlace copiado al portapapeles");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Error al copiar el enlace");
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-2 py-6 border-b border-white/5 mb-8">
			<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mr-2">
				Compartir:
			</span>

			<div className="flex items-center gap-2">
				{shareLinks.map((platform) => (
					<Button
						key={platform.name}
						variant="publicGhost"
						size="icon"
						className={`rounded-2xl text-white/60 transition-colors duration-300 ${platform.color} hover:text-white hover:border-transparent hover:scale-110 active:scale-95 shadow-lg`}
						onClick={() =>
							window.open(platform.href, "_blank", "noopener,noreferrer")
						}
						aria-label={`Compartir en ${platform.name}`}
						title={`Compartir en ${platform.name}`}
					>
						<platform.icon className="size-5 transition-transform group-hover:rotate-6" />
					</Button>
				))}

				<Button
					variant="publicGhost"
					size="icon"
					onClick={() => void copyToClipboard()}
					aria-label="Copiar enlace"
					className="rounded-2xl text-white/60 hover:bg-blue-700 hover:text-white hover:border-transparent transition-colors duration-300 hover:scale-110 active:scale-95 shadow-lg group"
					title="Copiar enlace"
				>
					<LazyMotion features={domAnimation}>
						<AnimatePresence mode="wait">
							{copied ? (
								<m.div
									key="check"
									initial={
										prefersReducedMotion
											? { opacity: 1, scale: 1 }
											: { opacity: 0, scale: 0.5 }
									}
									animate={{ opacity: 1, scale: 1 }}
									exit={
										prefersReducedMotion
											? { opacity: 1, scale: 1 }
											: { opacity: 0, scale: 0.5 }
									}
								>
									<IconCheck className="size-5" />
								</m.div>
							) : (
								<m.div
									key="link"
									initial={
										prefersReducedMotion
											? { opacity: 1, scale: 1 }
											: { opacity: 0, scale: 0.5 }
									}
									animate={{ opacity: 1, scale: 1 }}
									exit={
										prefersReducedMotion
											? { opacity: 1, scale: 1 }
											: { opacity: 0, scale: 0.5 }
									}
								>
									<IconLink className="size-5 transition-transform group-hover:-rotate-12" />
								</m.div>
							)}
						</AnimatePresence>
					</LazyMotion>
				</Button>
			</div>

			{children && (
				<div className="ml-auto flex items-center gap-2">{children}</div>
			)}
		</div>
	);
}
