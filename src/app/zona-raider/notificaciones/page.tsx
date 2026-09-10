"use client";

import React, { Suspense } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
	IconBell,
	IconCheck,
	IconInfoCircle,
	IconAlertCircle,
	IconClock,
} from "@/shared/ui/tabler-icons";
import { toast } from "sonner";

import { cn } from "@/shared/tailwind/tailwind-utils";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import {
	markNotificationAsRead,
	markAllNotificationsAsRead,
} from "@/shared/actions/notifications.server";
import { stripRichHtmlToText } from "@/shared/security/sanitize-html";
import { ClientDateText } from "@/shared/components/client-date-text";
import {
	RAIDER_PAGE_FADE_IN_CLASSES,
	RAIDER_SECTION_REVEAL_CLASSES,
} from "@/shared/components/raider-motion";
import { CardSkeletonRow, SpinnerFallback } from "@/shared/ui/skeletons";

function getTypeIcon(type: string) {
	switch (type) {
		case "warning":
			return <IconAlertCircle className="size-5 text-amber-500" />;
		case "important":
			return <IconBell className="size-5 text-rose-500" />;
		default:
			return <IconInfoCircle className="size-5 text-blue-500" />;
	}
}

export default function NotificationsPage() {
	return useNotificationsPage();
}

function resolveEmptyNotificationsCopy(activeFilter: string) {
	if (activeFilter === "unread" || activeFilter === "all") {
		return {
			title: "¡Todo al día!",
			message: "No tienes mensajes nuevos por revisar en esta sección.",
		};
	}
	if (activeFilter === "read") {
		return {
			title: "No hay leídos",
			message: "Todavía no has marcado ninguna notificación como leída.",
		};
	}
	return {
		title: "Sin resultados",
		message: "No se han encontrado mensajes sin leer en esta categoría.",
	};
}

function useNotificationsPage() {
	const { data: _session } = useSession();
	const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
	const [activeFilter, setActiveFilter] = React.useState<
		"all" | "unread" | "read" | "info" | "update" | "warning" | "important"
	>("all");
	const {
		data: notificationsData,
		isLoading,
		mutate: mutateNotifications,
	} = useApiQuery<any[]>("/api/notifications", {
		refreshInterval: 60 * 1000,
	});

	const notifications = notificationsData ?? [];

	React.useEffect(() => {
		if (!Array.isArray(notificationsData)) return;
		const unreadIds = notificationsData.reduce((acc: string[], n: any) => {
			if (!n.isRead) acc.push(n.id);
			return acc;
		}, []);
		// react-doctor-disable-next-line
		setExpandedIds(new Set(unreadIds));
	}, [notificationsData]);

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	React.useEffect(() => {
		const handleNotificationUpdate = () => {
			void mutateNotifications();
		};

		window.addEventListener("notifications-updated", handleNotificationUpdate);
		return () => {
			window.removeEventListener(
				"notifications-updated",
				handleNotificationUpdate,
			);
		};
	}, [mutateNotifications]);

	const filteredNotifications = notifications.filter((n) => {
		if (activeFilter === "all") return true;
		if (activeFilter === "unread") return !n.isRead;
		if (activeFilter === "read") return n.isRead;
		return n.type === activeFilter;
	});

	const markAsRead = async (id: string) => {
		try {
			const result = await markNotificationAsRead(id);
			if (result.success) {
				await mutateNotifications(
					(prev) =>
						Array.isArray(prev)
							? prev.map((n: any) => (n.id === id ? { ...n, isRead: true } : n))
							: prev,
					{ revalidate: false },
				);
				window.dispatchEvent(new CustomEvent("notifications-updated"));
				toast.success("Leído", {
					description: "Notificación movida a la bandeja de leídos",
				});
			}
		} catch {
			toast.error("Error", {
				description: "No se pudo marcar como leída",
			});
		}
	};

	const markAllAsRead = async () => {
		const unread = notifications.filter((n) => !n.isRead);
		if (unread.length === 0) return;

		try {
			const result = await markAllNotificationsAsRead();
			if (result.success) {
				await mutateNotifications(
					(prev) =>
						Array.isArray(prev)
							? prev.map((n: any) => ({ ...n, isRead: true }))
							: prev,
					{ revalidate: false },
				);
				window.dispatchEvent(new CustomEvent("notifications-updated"));
				toast.success("Éxito", {
					description: "Todas las notificaciones movidas a leídos",
				});
			}
		} catch {
			toast.error("Error", {
				description: "Error al marcar todas como leídas",
			});
		}
	};

	const filters = [
		{ id: "all", label: "Todos" },
		{
			id: "unread",
			label: "Sin leer",
			count: notifications.filter((n) => !n.isRead).length,
		},
		{
			id: "read",
			label: "Leídos",
			count: notifications.filter((n) => n.isRead).length,
		},
		{
			id: "info",
			label: "Informativo",
			count: notifications.filter((n) => n.type === "info" && !n.isRead).length,
		},
		{
			id: "update",
			label: "Actualización",
			count: notifications.filter((n) => n.type === "update" && !n.isRead)
				.length,
		},
		{
			id: "warning",
			label: "Aviso",
			count: notifications.filter((n) => n.type === "warning" && !n.isRead)
				.length,
		},
		{
			id: "important",
			label: "Importante",
			count: notifications.filter((n) => n.type === "important" && !n.isRead)
				.length,
		},
	];

	return (
		<Suspense fallback={<SpinnerFallback label="Cargando sistema…" />}>
			<div
				className={`flex w-full flex-col gap-4 ${RAIDER_PAGE_FADE_IN_CLASSES}`}
				data-tour-step="notifications-page"
			>
				<div
					className={`flex flex-col justify-between gap-4 md:flex-row md:items-center ${RAIDER_SECTION_REVEAL_CLASSES}`}
				>
					<div>
						<h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tighter uppercase">
							<IconBell className="size-7 text-blue-500" />
							Bandeja de Entrada
						</h1>
						<p className="text-sm text-muted-foreground mt-1 font-medium">
							Comunicados oficiales y actualizaciones del equipo de Artic
							Tempest.
						</p>
					</div>
					<button
						type="button"
						className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-colors h-10 px-4 py-2 bg-blue-500/5 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 disabled:opacity-50 disabled:pointer-events-none"
						onClick={() => void markAllAsRead()}
						disabled={!notifications.some((n) => !n.isRead)}
					>
						<IconCheck className="size-4 mr-2" />
						Marcar todo como leído
					</button>
				</div>

				{/* Filtros */}
				<div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar scrollbar-hide mt-4 w-full flex-nowrap touch-pan-x translate-z-0 relative z-10">
					{filters.map((filter) => (
						<button
							type="button"
							key={filter.id}
							onClick={() => setActiveFilter(filter.id as any)}
							className={cn(
								"whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest border  flex items-center gap-2 shrink-0",
								activeFilter === filter.id
									? "bg-blue-500 text-white border-blue-400 shadow-[0_5px_15px_rgba(59,130,246,0.3)]"
									: "bg-background/50 text-muted-foreground border-border/40 hover:border-blue-500/30 hover:text-blue-400",
							)}
						>
							{filter.label}
							{((filter.id === "all" &&
								notifications.filter((n) => !n.isRead).length > 0) ||
								(filter.count !== undefined && filter.count > 0)) && (
								<span
									className={cn(
										"px-1.5 py-0.5 rounded text-[9px] min-w-4 flex items-center justify-center font-bold",
										activeFilter === filter.id
											? "bg-white/20 text-white"
											: "bg-blue-500/10 text-blue-500",
									)}
								>
									{filter.id === "all"
										? notifications.filter((n) => !n.isRead).length
										: filter.count}
								</span>
							)}
						</button>
					))}
				</div>

				<div className="flex flex-col gap-4 mt-2">
					{isLoading ? (
						<CardSkeletonRow count={3} />
					) : filteredNotifications.length === 0 ? (
						<Card className="bg-card/30 border-dashed border-border/40 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
							<CardContent className="py-24 flex flex-col items-center justify-center text-center">
								<div className="size-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-6 opacity-30">
									<IconBell className="size-8 text-muted-foreground" />
								</div>
								<h3 className="text-xl font-semibold uppercase tracking-tight">
									{resolveEmptyNotificationsCopy(activeFilter).title}
								</h3>
								<p className="text-sm text-muted-foreground max-w-xs mt-2 italic font-medium">
									{resolveEmptyNotificationsCopy(activeFilter).message}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4">
							{filteredNotifications.map((n) => {
								const isExpanded = expandedIds.has(n.id);

								return (
									<Card
										key={n.id}
										className={cn(
											"relative overflow-hidden  border-border/40 group",
											!n.isRead
												? "bg-blue-500/[0.03] border-blue-500/20"
												: "bg-card/20 opacity-70",
											isExpanded &&
												"hover:border-blue-500/30 shadow-xl shadow-blue-500/5",
										)}
									>
										{!n.isRead && (
											<div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
										)}
										<CardHeader
											className="flex flex-row items-center gap-4 py-4 cursor-pointer select-none"
											onClick={() => toggleExpand(n.id)}
										>
											<div
												className={cn(
													"p-2.5 rounded-xl border shadow-sm ",
													!n.isRead
														? "bg-blue-500/10 border-blue-500/20"
														: "bg-muted/10 border-border/20",
													!isExpanded && "opacity-50",
												)}
											>
												{getTypeIcon(n.type)}
											</div>
											<div className="flex-1 flex flex-col gap-0.5 min-w-0">
												<div className="flex items-center justify-between gap-4">
													<CardTitle
														className={cn(
															"text-lg font-semibold tracking-tight transition-colors duration-500 truncate",
															!n.isRead ? "text-white" : "text-zinc-500",
															!isExpanded && "text-zinc-400",
														)}
													>
														{n.title}
													</CardTitle>
													<div className="flex items-center gap-3">
														{!n.isRead && (
															<Badge className="bg-blue-500 text-white text-[8px] font-semibold uppercase tracking-[0.2em] px-1.5 h-4.5 rounded-md animate-pulse">
																Nuevo
															</Badge>
														)}
														<div
															className={cn(
																"size-6 rounded-lg bg-white/5 flex items-center justify-center transition-transform duration-300",
																isExpanded ? "rotate-180" : "rotate-0",
															)}
														>
															<svg
																className="size-3 text-muted-foreground"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
																strokeWidth={3}
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="M19 9l-7 7-7-7"
																/>
															</svg>
														</div>
													</div>
												</div>
												<div
													className="flex items-center gap-2 text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-widest leading-none"
													suppressHydrationWarning
												>
													<IconClock className="size-2.5" />
													<ClientDateText
														value={n.created_at}
														options={{
															day: "2-digit",
															month: "long",
															hour: "2-digit",
															minute: "2-digit",
														}}
													/>
												</div>
											</div>
										</CardHeader>

										<div
											className={cn(
												" ease-in-out overflow-hidden",
												isExpanded
													? "max-h-[2000px] opacity-100"
													: "max-h-0 opacity-0",
											)}
										>
											<CardContent className="pt-0 pb-6">
												<div className="h-px bg-white/5 mb-6" />
												<div
													className={cn(
														"text-sm leading-relaxed transition-colors duration-500 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-li:my-0.5 prose-img:rounded-xl whitespace-pre-line break-words",
														!n.isRead ? "text-zinc-200" : "text-zinc-600",
													)}
												>
													{stripRichHtmlToText(n.content)}
												</div>
												{!n.isRead && (
													<div className="flex justify-end mt-6">
														<button
															type="button"
															className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-colors h-9 px-5 bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40"
															onClick={(e) => {
																e.stopPropagation();
																void markAsRead(n.id);
															}}
														>
															<IconCheck className="size-3.5 mr-2" />
															Marcar como leído
														</button>
													</div>
												)}
											</CardContent>
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</Suspense>
	);
}
