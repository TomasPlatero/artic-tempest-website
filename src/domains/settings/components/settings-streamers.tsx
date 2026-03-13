"use client";

import { useState, useEffect } from "react";
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
  IconRefresh,
  IconArrowLeft,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
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
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
  addStreamer,
  removeStreamer,
  updateStreamersOrder,
  getStreamerConfig,
  updateStreamerConfig,
  getDiscordChannels,
  getEnrichedStreamers,
} from "@/domains/streamers/lib/server-actions";
import { AdminPageHeader } from "@/shared/components/admin-page-header";

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
      className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 relative bg-card"
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
          className="h-8 w-8 text-muted-foreground hover:text-purple-400"
          asChild
        >
          <a
            href={`https://twitch.tv/${streamer.twitch_username}`}
            target="_blank"
            rel="noreferrer"
          >
            <IconExternalLink className="size-4" />
          </a>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
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

  useEffect(() => {
    fetchStreamers();
  }, []);

  const fetchStreamers = async () => {
    try {
      const data = await getEnrichedStreamers();
      setStreamers(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar", {
        description: "No se pudieron obtener los streamers.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStreamer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamer.trim() || submitting) return;

    setSubmitting(true);
    try {
      await addStreamer(newStreamer.trim());
      toast.success("Streamer añadido correctamente.");
      setNewStreamer("");
      fetchStreamers();
    } catch (error) {
      toast.error("Error al añadir streamer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${username}?`))
      return;
    try {
      await removeStreamer(id);
      toast.success(`${username} eliminado.`);
      fetchStreamers();
    } catch (error) {
      toast.error("Error al eliminar el streamer.");
    }
  };

  const saveOrder = async (orderedItems: any[]) => {
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
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStreamers((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Immediately save the new order
        saveOrder(newItems);
        return newItems;
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full">
      <AdminPageHeader
        title="AJUSTES DE STREAMERS"
        description="Gestiona la lista de creadores de contenido de tu hermandad y su orden en la web."
        backHref="/dashboard/configuracion"
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
            onSubmit={handleAddStreamer}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              placeholder="Nombre de usuario de Twitch..."
              value={newStreamer}
              onChange={(e) => setNewStreamer(e.target.value)}
              className="flex-1 bg-black/20"
              required
            />
            <Button
              type="submit"
              disabled={submitting || !newStreamer.trim()}
              className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {submitting ? (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IconPlus className="mr-2 h-4 w-4" />
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
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={streamers.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {streamers.map((streamer) => (
                    <SortableStreamerItem
                      key={streamer.id}
                      streamer={streamer}
                      onDelete={handleDelete}
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
