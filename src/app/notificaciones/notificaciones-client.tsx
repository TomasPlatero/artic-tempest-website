"use client";

import { useEffect, useState } from "react";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import {
	IconBell,
	IconInfoCircle,
	IconAlertCircle,
	IconTimeline,
	IconCheck,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import {
	markNotificationAsRead,
	markAllNotificationsAsRead,
} from "@/shared/actions/notifications.server";
import { stripRichHtmlToText } from "@/shared/security/sanitize-html";
import { ClientDateText } from "@/shared/components/client-date-text";

interface Notification {
	id: string;
	title: string;
	content: string;
	type: "info" | "update" | "warning" | "important";
	created_at: string;
	isRead: boolean;
}

type NotificationFilterId =
	| "all"
	| "unread"
	| "read"
	| "info"
	| "update"
	| "warning"
	| "important";

type NotificationCardModel = Notification;

function getNotificationTypeIcon(type: Notification["type"]) {
	switch (type) {
		case "update":
			return <IconTimeline className="size-5 text-blue-400" />;
		case "warning":
			return <IconAlertCircle className="size-5 text-amber-400" />;
		case "important":
			return <IconBell className="size-5 text-rose-400" />;
		default:
			return <IconInfoCircle className="size-5 text-emerald-400" />;
	}
}

function NotificationSkeletonList() {
	return (
		<div className="space-y-4">
			{[
				"notification-skeleton-1",
				"notification-skeleton-2",
				"notification-skeleton-3",
			].map((skeletonKey) => (
				<div
					key={skeletonKey}
					className="h-32 w-full bg-white/5 animate-pulse rounded-3xl border border-white/5"
				/>
			))}
		</div>
	);
}

function NotificationEmptyState({
	activeFilter,
}: {
	activeFilter: NotificationFilterId;
}) {
	return (
		<div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center backdrop-blur-md animate-in fade-in zoom-in duration-500">
			<IconBell className="size-16 text-zinc-700 mx-auto mb-6 opacity-20" />
			<p className="text-zinc-500 font-medium italic">
				{activeFilter === "unread" || activeFilter === "all"
					? "¡Estás al día! No tienes mensajes sin leer."
					: activeFilter === "read"
						? "No tienes mensajes leídos todavía."
						: "No se han encontrado mensajes sin leer en esta categoría."}
			</p>
		</div>
	);
}

function NotificationFilters({
	notifications,
	activeFilter,
	onSelect,
}: {
	notifications: Notification[];
	activeFilter: NotificationFilterId;
	onSelect: (filter: NotificationFilterId) => void;
}) {
	const unreadCount = notifications.filter((n) => !n.isRead).length;
	const readCount = notifications.filter((n) => n.isRead).length;
	const infoCount = notifications.filter(
		(n) => n.type === "info" && !n.isRead,
	).length;
	const updateCount = notifications.filter(
		(n) => n.type === "update" && !n.isRead,
	).length;
	const warningCount = notifications.filter(
		(n) => n.type === "warning" && !n.isRead,
	).length;
	const importantCount = notifications.filter(
		(n) => n.type === "important" && !n.isRead,
	).length;

	const filters: Array<{
		id: NotificationFilterId;
		label: string;
		count?: number;
	}> = [
		{ id: "all", label: "Todos" },
		{ id: "unread", label: "Sin leer", count: unreadCount },
		{ id: "read", label: "Leídos", count: readCount },
		{ id: "info", label: "Informativo", count: infoCount },
		{ id: "update", label: "Actualización", count: updateCount },
		{ id: "warning", label: "Aviso", count: warningCount },
		{ id: "important", label: "Importante", count: importantCount },
	];

	return (
		<div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
			{filters.map((filter) => (
				<button
					type="button"
					key={filter.id}
					onClick={() => onSelect(filter.id)}
					className={cn(
						"whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest border  flex items-center gap-2",
						activeFilter === filter.id
							? "bg-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
							: "bg-white/5 text-zinc-500 border-white/10 hover:border-white/20 hover:text-zinc-300",
					)}
				>
					{filter.label}
					{filter.count !== undefined && filter.count > 0 && (
						<span
							className={cn(
								"px-1.5 py-0.5 rounded-md text-[9px] min-w-4 flex items-center justify-center font-bold",
								activeFilter === filter.id
									? "bg-white/20 text-white"
									: "bg-white/10 text-zinc-400",
							)}
						>
							{filter.count}
						</span>
					)}
				</button>
			))}
		</div>
	);
}

function NotificationCard({
	notification,
	expanded,
	onToggleExpand,
	onMarkAsRead,
}: {
	notification: NotificationCardModel;
	expanded: boolean;
	onToggleExpand: (id: string) => void;
	onMarkAsRead: (id: string) => void;
}) {
	return (
		<article
			className={cn(
				"group relative p-6 rounded-3xl border  backdrop-blur-md overflow-hidden",
				notification.isRead
					? "bg-white/[0.02] border-white/5 opacity-60"
					: "bg-white/[0.05] border-blue-500/20 shadow-2xl shadow-blue-500/5 ring-1 ring-blue-500/10",
			)}
		>
			{!notification.isRead && (
				<div className="absolute top-0 right-0 size-32 bg-blue-500/10 blur-[60px] -z-10" />
			)}

			<div className="flex items-start gap-6">
				<div
					className={cn(
						"p-3.5 rounded-2xl border shrink-0 transition-colors duration-500",
						notification.isRead
							? "bg-white/5 border-white/5"
							: "bg-blue-500/10 border-blue-500/20",
					)}
				>
					{getNotificationTypeIcon(notification.type)}
				</div>
				<div className="flex-1 min-w-0 space-y-2">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<h3
							className={cn(
								"text-xl font-bold transition-colors duration-500",
								notification.isRead ? "text-zinc-500" : "text-white",
							)}
						>
							{notification.title}
						</h3>
						<time className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 whitespace-nowrap">
							<ClientDateText
								value={notification.created_at}
								options={{
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								}}
							/>
						</time>
					</div>
					<div className="relative">
						<div
							className={cn(
								"text-base leading-relaxed transition-colors duration-500 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-li:my-0.5 prose-img:rounded-xl whitespace-pre-line break-words",
								notification.isRead ? "text-zinc-600" : "text-zinc-400",
								!expanded && "line-clamp-3 overflow-hidden",
							)}
						>
							{stripRichHtmlToText(notification.content)}
						</div>
						{notification.content?.length > 150 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onToggleExpand(notification.id)}
								className="h-8 text-[10px] font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-0 mt-2"
							>
								{expanded ? "Ver menos" : "Seguir leyendo"}
							</Button>
						)}
					</div>
				</div>
				{!notification.isRead && (
					<Button
						size="sm"
						variant="outline"
						className="rounded-full bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 md:opacity-0 group-hover:opacity-100  text-[10px] font-semibold uppercase tracking-widest px-4"
						onClick={() => onMarkAsRead(notification.id)}
					>
						<IconCheck className="size-3.5 mr-2" />
						Leído
					</Button>
				)}
			</div>
		</article>
	);
}

export default function PublicNotificationsPage() {
	const { status } = useSession();
	const [activeFilter, setActiveFilter] = useState<NotificationFilterId>("all");
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const {
		data: notificationsData,
		isLoading,
		mutate: mutateNotifications,
	} = useApiQuery<Notification[]>(
		status === "authenticated" ? "/api/notifications" : null,
		{
			refreshInterval: 60 * 1000,
		},
	);
	const notifications = notificationsData ?? [];
	const unreadCount = notifications.filter((n) => !n.isRead).length;

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	useEffect(() => {
		if (status === "unauthenticated") {
			redirect("/");
		}
	}, [status]);

	const markAsRead = async (id: string) => {
		try {
			const result = await markNotificationAsRead(id);
			if (result.success) {
				await mutateNotifications(
					(prev) =>
						Array.isArray(prev)
							? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
							: prev,
					{ revalidate: false },
				);
			}
		} catch (error) {
			console.error("Error marking as read:", error);
		}
	};

	const markAllAsRead = async () => {
		const unreadIds = notifications.reduce((acc: string[], n) => {
			if (!n.isRead) acc.push(n.id);
			return acc;
		}, []);
		if (unreadIds.length === 0) return;

		try {
			const result = await markAllNotificationsAsRead();
			if (result.success) {
				await mutateNotifications(
					(prev) =>
						Array.isArray(prev)
							? prev.map((n) => ({ ...n, isRead: true }))
							: prev,
					{ revalidate: false },
				);
			}
		} catch (error) {
			console.error("Error marking all as read:", error);
		}
	};

	const filteredNotifications = notifications.filter((n) => {
		if (activeFilter === "all") return true;
		if (activeFilter === "unread") return !n.isRead;
		if (activeFilter === "read") return n.isRead;
		return n.type === activeFilter;
	});

	if (status === "loading") return null;

	return (
		<div className="min-h-dvh bg-zinc-950 flex flex-col relative overflow-hidden animate-fade-in animate-duration-slow motion-reduce:animate-none">
			{/* Background Image & Decor */}
			<div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden size-full">
				<Image
					src="/assets/images/housing-contact.webp"
					alt="Background"
					fill
					className="object-cover blur-[2px] opacity-30 scale-105"
					sizes="100vw"
					priority
				/>
				<div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/40 to-black/90" />
			</div>

			<LandingNavigation />

			<div className="relative z-10 flex-1 py-32 px-6 max-w-7xl mx-auto w-full">
				<header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="flex items-center gap-4">
						<div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/20">
							<IconBell className="size-8 text-blue-500" />
						</div>
						<div>
							<h1 className="text-4xl font-semibold text-white uppercase tracking-tight">
								Bandeja de Entrada
							</h1>
							<p className="text-zinc-500 mt-1">
								Mensajes directos del equipo de Artic Tempest.
							</p>
						</div>
					</div>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => void markAllAsRead()}
							className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 h-9 px-4 rounded-xl border border-white/5 mb-1"
						>
							Marcar todo como leído
						</Button>
					)}
				</header>

				{/* Filtros / Categorías */}
				<NotificationFilters
					notifications={notifications}
					activeFilter={activeFilter}
					onSelect={setActiveFilter}
				/>

				<div className="space-y-4">
					{isLoading ? (
						<NotificationSkeletonList />
					) : filteredNotifications.length === 0 ? (
						<NotificationEmptyState activeFilter={activeFilter} />
					) : (
						<div className="grid gap-4">
							{filteredNotifications.map((notification) => (
								<NotificationCard
									key={notification.id}
									notification={notification}
									expanded={expandedIds.has(notification.id)}
									onToggleExpand={toggleExpand}
									onMarkAsRead={(id) => void markAsRead(id)}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<LandingFooter />
		</div>
	);
}
