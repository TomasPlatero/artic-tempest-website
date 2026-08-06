"use client";

import { useState, useEffect, useRef } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
	IconBrandTwitch,
	IconTrash,
	IconPlus,
	IconLoader2,
	IconExternalLink,
	IconGripVertical,
} from "@/shared/ui/tabler-icons";
import { toast } from "sonner";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	addStreamer,
	removeStreamer,
	updateStreamersOrder,
	getEnrichedStreamers,
} from "@/domains/streamers/lib/server-actions";
import { AdminPageHeader } from "@/shared/components/admin-page-header";

async function saveStreamersOrder(orderedItems: any[]) {
	try {
		const updates = orderedItems.map((item, index) => ({
			id: item.id,
			sort_order: index,
		}));
		await updateStreamersOrder(updates);
	} catch (error) {
		console.error("Failed to save order", error);
		toast.error("Error guardando el nuevo orden.");
	}
}

async function doFetchStreamers(): Promise<{
	success: boolean;
	data?: any[];
	error?: string;
}> {
	try {
		const data = await getEnrichedStreamers();
		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error: "No se pudieron obtener los streamers." };
	}
}

async function doAddStreamer(
	name: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await addStreamer(name);
		return { success: true };
	} catch {
		return { success: false, error: "Error al añadir streamer." };
	}
}

async function doRemoveStreamer(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await removeStreamer(id);
		return { success: true };
	} catch {
		return { success: false, error: "Error al eliminar el streamer." };
	}
}

function SortableStreamerItem({
	streamer,
	onDelete,
}: {
	streamer: any;
	onDelete: (id: string, username: string) => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: streamer.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/20 border border-white/5 relative bg-card"
		>
			<div className="flex items-center gap-2">
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab hover:bg-white/10 p-1.5 rounded text-muted-foreground mr-1"
				>
					<IconGripVertical className="size-4" />
				</div>
				<div className="size-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
					<IconBrandTwitch className="size-4" />
				</div>
				<div>
					<p className="font-bold text-sm tracking-tight">
						{streamer.twitch_username}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button
					size="icon"
					variant="ghost"
					aria-label={`Ver canal de ${streamer.twitch_username} en Twitch`}
					className="size-8 text-muted-foreground hover:text-purple-400"
					asChild
				>
					<a
						href={`https://twitch.tv/${streamer.twitch_username}`}
						target="_blank"
						rel="noreferrer"
						aria-label={`Ver canal de ${streamer.twitch_username} en Twitch`}
					>
						<IconExternalLink className="size-4" />
					</a>
				</Button>
				<Button
					size="icon"
					variant="ghost"
					className="size-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
					onClick={() => onDelete(streamer.id, streamer.twitch_username)}
				>
					<IconTrash className="size-4" />
				</Button>
			</div>
		</div>
	);
}

export function StreamersSettings() {
	const [streamers, setStreamers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [newStreamer, setNewStreamer] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const fetchStreamers = async () => {
		const result = await doFetchStreamers();
		if (result.success && result.data) {
			setStreamers(result.data);
		} else {
			toast.error("Error al cargar", {
				description: result.error,
			});
		}
		setLoading(false);
	};

	const fetchStreamersRef = useRef(fetchStreamers);

	useEffect(() => {
		fetchStreamersRef.current = fetchStreamers;
	});

	const handleAddStreamer = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newStreamer.trim() || submitting) return;

		setSubmitting(true);
		const result = await doAddStreamer(newStreamer.trim());
		if (result.success) {
			toast.success("Streamer añadido correctamente.");
			setNewStreamer("");
			void fetchStreamers();
		} else {
			toast.error(result.error);
		}
		setSubmitting(false);
	};

	const handleDelete = async (id: string, username: string) => {
		if (!confirm(`¿Estás seguro de que quieres eliminar a ${username}?`))
			return;
		const result = await doRemoveStreamer(id);
		if (result.success) {
			toast.success(`${username} eliminado.`);
			void fetchStreamers();
		} else {
			toast.error(result.error);
		}
	};

	// react-doctor-disable-next-line
	useEffect(() => {
		void fetchStreamersRef.current();
	}, []);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setStreamers((items) => {
				const oldIndex = items.findIndex((i) => i.id === active.id);
				const newIndex = items.findIndex((i) => i.id === over.id);

				const newItems = arrayMove(items, oldIndex, newIndex);

				// Immediately save the new order
				void saveStreamersOrder(newItems);
				return newItems;
			});
		}
	};

	return (
		<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
			<AdminPageHeader
				title="AJUSTES DE STREAMERS"
				description="Gestiona la lista de creadores de contenido de tu hermandad y su orden en la web."
				backHref="/zona-raider/configuracion"
			/>

			<Card className="border-border/40 bg-card/40 backdrop-blur-sm">
				<CardHeader>
					<CardTitle>Añadir Streamer</CardTitle>
					<CardDescription>
						Introduce el nombre exacto de usuario de Twitch del creador (ej:
						zatoshi)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
						e.preventDefault();
						void handleAddStreamer(e);
					}}
						className="flex flex-col sm:flex-row gap-3"
					>
						<Input
							placeholder="Nombre de usuario de Twitch..."
							value={newStreamer}
							onChange={(e) => setNewStreamer(e.target.value)}
							className="flex-1 bg-zinc-950/20"
							required
						/>
						<Button
							type="submit"
							disabled={submitting || !newStreamer.trim()}
							className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
						>
							{submitting ? (
								<IconLoader2 className="mr-2 size-4 animate-spin" />
							) : (
								<IconPlus className="mr-2 size-4" />
							)}
							Añadir a la hermandad
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card className="border-border/40 bg-card/40 backdrop-blur-sm">
				<CardHeader>
					<CardTitle>Streamers Actuales</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center py-6 text-muted-foreground">
							<IconLoader2 className="size-6 animate-spin" />
						</div>
					) : streamers.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<IconBrandTwitch className="size-10 mx-auto opacity-20 mb-2" />
							<p>No hay streamers configurados.</p>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={(event) => void handleDragEnd(event)}
							>
								<SortableContext
									items={streamers.map((s) => s.id)}
									strategy={verticalListSortingStrategy}
								>
									{streamers.map((streamer) => (
										<SortableStreamerItem
											key={streamer.id}
											streamer={streamer}
											onDelete={(id, username) => void handleDelete(id, username)}
										/>
									))}
								</SortableContext>
							</DndContext>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
