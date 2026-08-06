"use client";

import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { IconBellRinging } from "@/shared/ui/tabler-icons";
import { toast } from "sonner";

export function NotificationPermissionModal() {
	const [open, setOpen] = useState(false);
	const storageKey = "notification_permission_prompt_dismissed";

	const dismissPrompt = () => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(storageKey, "true");
	};

	useEffect(() => {
		// En Next.js, window solo está disponible en el cliente
		if (typeof window === "undefined") return;

		let timer: ReturnType<typeof setTimeout> | null = null;

		const checkPermission = () => {
			if (!("Notification" in window) || Notification.permission !== "default")
				return;

			const hasDismissed = window.localStorage.getItem(storageKey);
			if (!hasDismissed) {
				// Pequeño retardo para que la página cargue y el usuario se sitúe
				timer = setTimeout(() => setOpen(true), 3000);
			}
		};
		checkPermission();

		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, []);

	const handleAccept = async () => {
		setOpen(false);
		dismissPrompt();

		try {
			const permission = await Notification.requestPermission();
			if (permission === "granted") {
				toast.success("¡Notificaciones activadas!", {
					description:
						"Recibirás avisos importantes directamente en tu escritorio.",
				});
			}
		} catch (error) {
			console.error("Error requesting permission:", error);
		}
	};

	const handleDecline = () => {
		setOpen(false);
		// Guardamos que ya hemos preguntado para no volver a mostrarlo en el navegador
		dismissPrompt();
	};

	// No renderizamos nada si no está abierto (Dialog se encarga, pero por seguridad)
	if (!open) return null;

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) dismissPrompt();
			}}
		>
			<DialogContent className="sm:max-w-[400px] bg-[#12121a]/95 backdrop-blur-xl border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] p-0 overflow-hidden border">
				<div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-50" />

				<div className="p-8 flex flex-col items-center text-center">
					<div className="size-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
						<IconBellRinging className="size-8 text-blue-400 animate-pulse" />
					</div>

					<DialogTitle className="text-2xl font-semibold italic uppercase tracking-tighter mb-2 leading-none">
						¿Quieres estar al día?
					</DialogTitle>

					<DialogDescription className="text-muted-foreground text-sm leading-relaxed px-2">
						Activa las notificaciones de escritorio para recibir alertas de la
						hermandad y avisos de oficiales al instante.
					</DialogDescription>
				</div>

				<div className="p-6 bg-white/5 border-t border-white/5 flex flex-col gap-2">
					<Button
						onClick={() => void handleAccept()}
						className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold uppercase tracking-widest h-12 shadow-[0_4px_12px_rgba(37,99,235,0.3)]  active:scale-[0.98]"
					>
						Activar Notificaciones
					</Button>
					<Button
						variant="ghost"
						onClick={handleDecline}
						className="w-full text-muted-foreground/30 hover:text-white/60 text-[10px] font-bold uppercase tracking-widest h-8 transition-colors"
					>
						Ahora no, gracias
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
