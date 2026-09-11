"use client";

import {
	IconAlertCircle,
	IconArrowLeft,
	IconBell,
	IconClock,
	IconInfoCircle,
	IconSend,
	IconSettings,
	IconShieldCheck,
	IconTimeline,
	IconTrash,
} from "@/shared/ui/tabler-icons";
import Link from "next/link";
import DOMPurify from "dompurify";
import { useEffect, useReducer, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	getScrollBehavior,
	usePrefersReducedMotion,
} from "@/shared/lib/use-prefers-reduced-motion";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const DATE_TIME_FORMATTER_UTC = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "long",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	timeZone: "UTC",
});

function fmtDateTimeUTC(value: string): string {
	return DATE_TIME_FORMATTER_UTC.format(Date.parse(value));
}

function SanitizedHtml({
	html,
	className,
}: {
	html: string;
	className: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		element.innerHTML = DOMPurify.sanitize(html);
	}, [html]);
	return <div ref={ref} className={className} />;
}

type NotificationForm = {
	title: string;
	content: string;
	type: "info" | "update" | "warning" | "important";
	target_roles: string[];
};

type NotificationRecord = {
	id: string;
	title: string;
	content: string;
	type: string;
	target_roles?: string[];
	created_at: string;
};

type NotificationTypeOption = {
	id: NotificationForm["type"];
	label: string;
	icon: typeof IconInfoCircle;
	color: string;
	bg: string;
};

type RoleLevelOption = {
	id: string;
	label: string;
	color: string;
	bg: string;
};

const INITIAL_FORM: NotificationForm = {
	title: "",
	content: "",
	type: "info",
	target_roles: [],
};

const NOTIFICATION_TYPES: NotificationTypeOption[] = [
	{
		id: "info",
		label: "Informativo",
		icon: IconInfoCircle,
		color: "text-emerald-400",
		bg: "bg-emerald-500/10",
	},
	{
		id: "update",
		label: "Actualización",
		icon: IconTimeline,
		color: "text-blue-400",
		bg: "bg-blue-500/10",
	},
	{
		id: "warning",
		label: "Aviso",
		icon: IconAlertCircle,
		color: "text-amber-400",
		bg: "bg-amber-500/10",
	},
	{
		id: "important",
		label: "Importante",
		icon: IconBell,
		color: "text-rose-400",
		bg: "bg-rose-500/10",
	},
];

const ROLE_LEVELS: RoleLevelOption[] = [
	{ id: "gm", label: "GM", color: "text-rose-500", bg: "bg-rose-500/10" },
	{
		id: "officer",
		label: "Oficial",
		color: "text-amber-500",
		bg: "bg-amber-500/10",
	},
	{
		id: "raider",
		label: "Raider",
		color: "text-purple-500",
		bg: "bg-purple-500/10",
	},
	{
		id: "member",
		label: "Miembro",
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
	{
		id: "invitado",
		label: "Invitado",
		color: "text-zinc-500",
		bg: "bg-zinc-500/10",
	},
];

type FormAction =
	| { type: "SET_FIELD"; field: keyof NotificationForm; value: unknown }
	| { type: "RESET" }
	| { type: "START_EDIT"; form: NotificationForm; id: string }
	| { type: "CANCEL_EDIT" };

function formReducer(
	state: { form: NotificationForm; editingId: string | null },
	action: FormAction,
): { form: NotificationForm; editingId: string | null } {
	switch (action.type) {
		case "SET_FIELD":
			return {
				...state,
				form: { ...state.form, [action.field]: action.value },
			};
		case "RESET":
			return { form: INITIAL_FORM, editingId: null };
		case "START_EDIT":
			return { form: action.form, editingId: action.id };
		case "CANCEL_EDIT":
			return { form: INITIAL_FORM, editingId: null };
		default:
			return state;
	}
}

type UiAction =
	| { type: "SET_TAB"; tab: string }
	| { type: "TOGGLE_EXPAND"; id: string }
	| { type: "SET_PAGE"; page: number };

function uiReducer(
	state: { activeTab: string; expandedIds: Set<string>; currentPage: number },
	action: UiAction,
): { activeTab: string; expandedIds: Set<string>; currentPage: number } {
	switch (action.type) {
		case "SET_TAB":
			return { ...state, activeTab: action.tab };
		case "TOGGLE_EXPAND": {
			const next = new Set(state.expandedIds);
			if (next.has(action.id)) next.delete(action.id);
			else next.add(action.id);
			return { ...state, expandedIds: next };
		}
		case "SET_PAGE":
			return { ...state, currentPage: action.page };
		default:
			return state;
	}
}

async function doSendNotification(
	form: NotificationForm,
	editingId: string | null,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/notifications", {
			method: editingId ? "PATCH" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
		});
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.error || "Error al procesar");
		}
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error al procesar",
		};
	}
}

async function doDeleteNotification(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/notifications", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.error || "Error al eliminar");
		}
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error al eliminar",
		};
	}
}

function HistoryPager({
	currentPage,
	totalPages,
	onPageChange,
}: {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-border/20 bg-card/20 px-4 py-3">
			<Button
				variant="outline"
				size="sm"
				disabled={currentPage === 1}
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				className="rounded-full text-[9px] font-semibold tracking-widest"
			>
				Anterior
			</Button>
			<span className="text-[10px] font-semibold tracking-widest text-muted-foreground/50">
				Página {currentPage} de {totalPages}
			</span>
			<Button
				variant="outline"
				size="sm"
				disabled={currentPage === totalPages}
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				className="rounded-full text-[9px] font-semibold tracking-widest"
			>
				Siguiente
			</Button>
		</div>
	);
}

function NotificationCard({
	notification,
	isExpanded,
	deletingId,
	onToggleExpand,
	onEdit,
	onDelete,
}: {
	notification: NotificationRecord;
	isExpanded: boolean;
	deletingId: string | null;
	onToggleExpand: (id: string) => void;
	onEdit: (n: NotificationRecord) => void;
	onDelete: (id: string) => void;
}) {
	const styles =
		NOTIFICATION_TYPES.find((x) => x.id === notification.type) ??
		NOTIFICATION_TYPES[0];
	return (
		<Card className="bg-card/30 border-border/20 hover:border-blue-500/20  group hover:shadow-2xl hover:shadow-blue-500/5 rounded-2xl overflow-hidden">
			<button
				type="button"
				onClick={() => onToggleExpand(notification.id)}
				className="w-full text-left"
				aria-expanded={isExpanded}
				aria-label={notification.title || "Notificación"}
			>
				<CardContent className="p-0">
					<div className="flex items-stretch">
						<div className={cn("w-1.5 shrink-0 transition-opacity", styles.bg)} />
						<div className="flex-1 px-6 py-5 flex items-center justify-between gap-4">
							<h3 className="font-semibold text-lg text-zinc-100 tracking-tight group-hover:text-blue-400 transition-colors truncate">
								{notification.title}
							</h3>
							<div
								className={cn(
									"size-6 rounded-lg bg-white/5 flex items-center justify-center transition-transform duration-300 shrink-0",
									isExpanded ? "rotate-180" : "rotate-0",
								)}
							>
								▾
							</div>
						</div>
					</div>
				</CardContent>
			</button>
			<div
				className={cn(
					"grid overflow-hidden ",
					isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="min-h-0">
					<CardContent className="pt-0 pb-5 px-6">
						<div className="h-px bg-white/5 mb-5" />
						<div className="flex flex-wrap items-center gap-3 mb-4">
							<span
								className={cn(
									"text-[9px] font-semibold tracking-[0.2em] px-3 py-1.5 rounded-lg border border-current/20 shadow-sm",
									styles.color,
									styles.bg,
								)}
							>
								{styles.label}
							</span>
							{notification.target_roles && notification.target_roles.length > 0 ? (
								<div className="flex flex-wrap gap-1.5">
									{notification.target_roles.map((r) => (
										<Badge
											key={r}
											variant="outline"
											className="text-[7px] font-semibold tracking-tighter bg-white/5 border-white/10 px-1.5 h-5"
										>
											{ROLE_LEVELS.find((rl) => rl.id === r)?.label || r}
										</Badge>
									))}
								</div>
							) : (
								<Badge
									variant="outline"
									className="text-[7px] font-semibold tracking-tighter bg-blue-500/10 border-blue-500/20 text-blue-400 px-1.5 h-5"
								>
									GLOBAL
								</Badge>
							)}
							<div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/40 tracking-widest ml-auto">
								<IconClock className="size-4" />
								{fmtDateTimeUTC(notification.created_at)}
							</div>
						</div>
						<SanitizedHtml
							html={notification.content}
							className="text-sm text-muted-foreground font-medium leading-relaxed mb-4 group-hover:text-zinc-200 transition-colors prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-li:my-0.5 prose-img:rounded-xl"
						/>
						<div className="flex justify-end gap-2">
							<Button
								variant="ghost"
								size="icon"
								aria-label="Editar notificación"
								onClick={() => onEdit(notification)}
								className="size-10 rounded-xl text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10"
							>
								<IconSettings className="size-5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Eliminar notificación"
								onClick={() => onDelete(notification.id)}
								disabled={deletingId === notification.id}
								className="size-10 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
							>
								{deletingId === notification.id ? (
									<div className="size-5 border-2 border-rose-500/30 border-t-rose-500 animate-spin rounded-full" />
								) : (
									<IconTrash className="size-5" />
								)}
							</Button>
						</div>
					</CardContent>
				</div>
			</div>
		</Card>
	);
}

function NotificationsForm({
	form,
	editingId,
	sending,
	onSetField,
	onToggleRole,
	onCancelEdit,
	onSend,
}: {
	form: NotificationForm;
	editingId: string | null;
	sending: boolean;
	onSetField: (field: keyof NotificationForm, value: unknown) => void;
	onToggleRole: (role: string) => void;
	onCancelEdit: () => void;
	onSend: () => void;
}) {
	return (
		<div className="w-full space-y-6">
			<Card className="border-2 border-primary/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-zinc-500 to-purple-500 shadow-[0_5px_15px_rgba(59,130,246,0.3)]" />
				<CardHeader>
					<CardTitle className="flex items-center gap-3 font-semibold text-xs tracking-[0.3em] text-blue-400">
						<IconSend className="size-5" />
						{editingId ? "Editar Notificación" : "Nuevo Mensaje Global"}
					</CardTitle>
					<CardDescription className="text-xs font-medium italic opacity-60">
						{editingId
							? "Estás modificando un comunicado existente. Los cambios se actualizarán para todos los usuarios."
							: "Este mensaje aparecerá en la bandeja de entrada de cada miembro con su respectivo aviso."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<label
							htmlFor="notification-title"
							className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 px-1"
						>
							Título del Aviso
						</label>
						<Input
							id="notification-title"
							placeholder="Ej: Nueva versión v0.9 Beta"
							value={form.title}
							onChange={(e) => onSetField("title", e.target.value)}
							className="h-14 bg-muted/20 border-border/40 focus:border-blue-500/50 text-base font-bold rounded-2xl "
						/>
					</div>
					<div className="space-y-2">
						<p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 px-1">
							Categoría
						</p>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
							{NOTIFICATION_TYPES.map((t) => (
								<Button
									key={t.id}
									variant={form.type === t.id ? "glow" : "outline"}
									size="sm"
									onClick={() => onSetField("type", t.id)}
									className={cn(
										"rounded-xl h-12 flex flex-col items-center justify-center gap-1 border-border/40 h-auto py-3",
										form.type === t.id
											? t.color
											: "opacity-40 grayscale hover:grayscale-0 hover:opacity-100 bg-muted/10",
									)}
								>
									<t.icon className="size-4" />
									<span className="text-[8px] font-semibold tracking-widest leading-none">
										{t.label}
									</span>
								</Button>
							))}
						</div>
					</div>
					<div className="space-y-4 pt-2">
						<div className="flex items-center justify-between px-1">
							<p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60">
								Roles Destinatarios
							</p>
							<span className="text-[9px] font-bold text-blue-400/60 italic">
								Si no marcas ninguno, será global
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{ROLE_LEVELS.map((role) => (
								<Button
									key={role.id}
									variant="ghost"
									size="sm"
									onClick={() => onToggleRole(role.id)}
									className={cn(
										"rounded-xl h-10 px-4 border border-border/20  gap-2",
										form.target_roles.includes(role.id)
											? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
											: "opacity-40 hover:opacity-100 hover:bg-white/5",
									)}
								>
									<div
										className={cn(
											"size-2 rounded-full",
											form.target_roles.includes(role.id)
												? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"
												: "bg-zinc-600",
										)}
									/>
									<span className="text-[9px] font-semibold tracking-widest">
										{role.label}
									</span>
								</Button>
							))}
							{form.target_roles.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onSetField("target_roles", [])}
									className="rounded-xl h-10 px-3 text-[9px] font-semibold tracking-widest text-muted-foreground hover:text-white"
								>
									Limpiar
								</Button>
							)}
						</div>
					</div>
					<RichTextEditor
						value={form.content}
						onChange={(val) => onSetField("content", val)}
						placeholder="Escribe aquí los detalles del anuncio…"
					/>
					<div className="flex gap-4">
						{editingId && (
							<Button
								variant="outline"
								className="h-16 px-8 text-base font-semibold rounded-2xl border-border/40 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 "
								onClick={onCancelEdit}
								disabled={sending}
							>
								Cancelar
							</Button>
						)}
						<Button
							className="flex-1 h-16 text-base font-semibold gap-3 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] "
							size="lg"
							disabled={sending}
							onClick={onSend}
						>
							{sending ? (
								<div className="flex items-center gap-3">
									<div className="size-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
									<span>{editingId ? "Actualizando…" : "Emitiendo Notificación…"}</span>
								</div>
							) : (
								<>
									<IconSend className="size-5" />
									{editingId ? "Actualizar Notificación" : "Emitir Notificación Global"}
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
			<div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-500/70 shadow-inner">
				<IconShieldCheck className="size-6 shrink-0" />
				<p className="text-[10px] font-bold tracking-widest leading-relaxed italic">
					Nota: Recuerda que las notificaciones son permanentes a menos que un
					administrador las elimine manualmente del historial.
				</p>
			</div>
		</div>
	);
}

export function SettingsNotificationsClient() {
	const prefersReducedMotion = usePrefersReducedMotion();

	const [sending, setSending] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [{ form, editingId }, dispatchForm] = useReducer(formReducer, {
		form: INITIAL_FORM,
		editingId: null,
	});
	const [{ activeTab, expandedIds, currentPage }, dispatchUi] = useReducer(
		uiReducer,
		{ activeTab: "send", expandedIds: new Set<string>(), currentPage: 1 },
	);
	const itemsPerPage = 5;

	const {
		data: notifications = [],
		mutate,
		isLoading,
	} = useSWR(
		"/api/notifications?all=true",
		async (url: string) => {
			// Only allow same-origin requests (SSRF guard)
			if (!url.startsWith("/")) throw new Error("Invalid request");
			const res = await fetch(url);
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data?.error || "Failed to fetch notifications");
			}
			const data = await res.json();
			return Array.isArray(data) ? data : [];
		},
		{ revalidateOnFocus: false },
	);

	const sortedNotifications: NotificationRecord[] = (
		notifications as NotificationRecord[]
	).toSorted(
		(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
	);
	const totalPages = Math.max(
		1,
		Math.ceil(sortedNotifications.length / itemsPerPage),
	);
	const safeCurrentPage = Math.min(currentPage, totalPages);
	const paginatedNotifications = sortedNotifications.slice(
		(safeCurrentPage - 1) * itemsPerPage,
		safeCurrentPage * itemsPerPage,
	);

	const handleSend = async () => {
		if (!form.title || !form.content) {
			toast.error("Faltan datos", {
				description: "El título y el contenido son obligatorios.",
			});
			return;
		}
		setSending(true);
		const result = await doSendNotification(form, editingId);
		if (result.success) {
			toast.success(
				editingId ? "Notificación actualizada" : "Notificación enviada",
				{
					description: editingId
						? "Los cambios se han aplicado correctamente."
						: "Todos los usuarios recibirán el aviso en su bandeja de entrada.",
				},
			);
			dispatchForm({ type: "RESET" });
			if (editingId) dispatchUi({ type: "SET_TAB", tab: "history" });
			void mutate();
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}
		setSending(false);
	};

	const handleEdit = (notification: NotificationRecord) => {
		dispatchForm({
			type: "START_EDIT",
			form: {
				title: notification.title,
				content: notification.content,
				type: (notification.type as NotificationForm["type"]) || "info",
				target_roles: notification.target_roles || [],
			},
			id: notification.id,
		});
		dispatchUi({ type: "SET_TAB", tab: "send" });
		window.scrollTo({
			top: 0,
			behavior: getScrollBehavior(prefersReducedMotion),
		});
	};

	const handleDelete = async (id: string) => {
		if (
			!confirm(
				"¿Estás seguro de que quieres eliminar esta notificación? Se borrará para todos los usuarios.",
			)
		)
			return;
		setDeletingId(id);
		const result = await doDeleteNotification(id);
		if (result.success) {
			toast.success("Eliminada", {
				description: "La notificación ha sido eliminada del sistema.",
			});
			void mutate();
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}
		setDeletingId(null);
	};

	const toggleRole = (role: string) => {
		const current = [...form.target_roles];
		const next = current.includes(role)
			? current.filter((r) => r !== role)
			: [...current, role];
		dispatchForm({ type: "SET_FIELD", field: "target_roles", value: next });
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full animate-in fade-in duration-500">
			<div className="flex items-center gap-6">
				<Link href="/zona-raider/configuracion">
					<Button
						variant="outline"
						size="icon"
						aria-label="Volver a configuración"
						className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
					>
						<IconArrowLeft className="size-6" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-semibold font-heading italic tracking-tight uppercase">
						NOTIFICACIONES
					</h1>
					<p className="text-sm font-medium text-white/40 mt-2 tracking-widest leading-relaxed">
						Gestiona los comunicados para el equipo de Artic Tempest.
					</p>
				</div>
			</div>
			<Tabs
				value={activeTab}
				onValueChange={(tab) => dispatchUi({ type: "SET_TAB", tab })}
				className="w-full"
			>
				<div className="flex justify-center mb-8">
					<TabsList className="grid w-full max-w-md grid-cols-2 h-14 rounded-2xl p-1.5 bg-muted/20 border border-border/20 shadow-2xl backdrop-blur-md">
						<TabsTrigger
							value="send"
							className="rounded-xl font-semibold text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
						>
							<IconSend className="size-3.5" /> {editingId ? "Editar" : "Enviar"}
						</TabsTrigger>
						<TabsTrigger
							value="history"
							className="rounded-xl font-semibold text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
						>
							<IconTimeline className="size-3.5" /> Historial
							{notifications.length > 0 && (
								<Badge
									variant="secondary"
									className="px-1.5 py-0 h-4 bg-muted/30 text-[9px] font-bold"
								>
									{notifications.length}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent
					value="send"
					className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none"
				>
					<NotificationsForm
						form={form}
						editingId={editingId}
						sending={sending}
						onSetField={(field, value) =>
							dispatchForm({ type: "SET_FIELD", field, value })
						}
						onToggleRole={toggleRole}
						onCancelEdit={() => dispatchForm({ type: "CANCEL_EDIT" })}
						onSend={() => void handleSend()}
					/>
				</TabsContent>
				<TabsContent
					value="history"
					className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none"
				>
					<div className="w-full space-y-6">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
							<h2 className="text-[10px] font-semibold tracking-[0.4em] text-muted-foreground/40 flex items-center gap-2">
								<IconTimeline className="size-4" />
								Historial de envíos registrados
							</h2>
							<div className="flex items-center gap-2 text-[10px] font-semibold tracking-widest text-muted-foreground/40">
								<span>5 por página</span>
								<span>·</span>
								<span>{notifications.length} total</span>
							</div>
						</div>
						{sortedNotifications.length > itemsPerPage && (
							<HistoryPager
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={(page) => dispatchUi({ type: "SET_PAGE", page })}
							/>
						)}
						{isLoading && notifications.length === 0 ? (
							<div className="space-y-4">
								{["a", "b", "c", "d"].map((k) => (
									<div
										key={k}
										className="h-32 w-full bg-muted/10 animate-pulse rounded-2xl border border-border/20"
									/>
								))}
							</div>
						) : paginatedNotifications.length === 0 ? (
							<Card className="bg-card/20 border-dashed border-border/40 py-24 flex flex-col items-center justify-center text-center rounded-3xl backdrop-blur-sm">
								<div className="size-20 rounded-3xl bg-muted/10 flex items-center justify-center mb-6 opacity-20">
									<IconBell className="size-10 text-muted-foreground" />
								</div>
								<h3 className="text-sm font-semibold tracking-[0.3em] text-muted-foreground/50">
									No hay notificaciones
								</h3>
							</Card>
						) : (
							<div className="grid gap-4">
								{paginatedNotifications.map((n) => (
									<NotificationCard
										key={n.id}
										notification={n}
										isExpanded={expandedIds.has(n.id)}
										deletingId={deletingId}
										onToggleExpand={(id) => dispatchUi({ type: "TOGGLE_EXPAND", id })}
										onEdit={handleEdit}
										onDelete={(id) => void handleDelete(id)}
									/>
								))}
							</div>
						)}
						{sortedNotifications.length > itemsPerPage && (
							<HistoryPager
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={(page) => dispatchUi({ type: "SET_PAGE", page })}
							/>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
