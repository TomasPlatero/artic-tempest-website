"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Loader2, UploadCloud, ImageIcon } from "lucide-react";

export function getWowColorClass(classId: number): string {
  const classColors: Record<number, string> = {
    1: "text-[#C79C6E]", // Warrior
    2: "text-[#F58CBA]", // Paladin
    3: "text-[#ABD473]", // Hunter
    4: "text-[#FFF569]", // Rogue
    5: "text-[#FFFFFF]", // Priest
    6: "text-[#C41E3A]", // Death Knight
    7: "text-[#0070DE]", // Shaman
    8: "text-[#69CCF0]", // Mage
    9: "text-[#9482C9]", // Warlock
    10: "text-[#00FF96]", // Monk
    11: "text-[#FF7D0A]", // Druid
    12: "text-[#A330C9]", // Demon Hunter
    13: "text-[#33937F]", // Evoker
  };
  return classColors[classId] || "text-foreground";
}

type Character = {
  id: string;
  name: string;
  realm_slug: string;
  char_class: number;
};

type Upload = {
  id: string;
  created_at: string;
  week_start: string;
  image_url: string;
  notes: string | null;
  bnet_characters: { name: string; class_id: number };
};

interface Props {
  characters: any[];
  guildId?: string;
  uploads: any[];
  activeCharacterId?: string;
}

export function WeeklyVaultUploader({
  characters = [],
  guildId,
  uploads: initialUploads = [],
  activeCharacterId,
}: Props) {
  const sortedCharacters = React.useMemo(() => {
    if (!activeCharacterId || !characters) return characters;
    return [...characters].sort((a, b) => {
      if (a.id === activeCharacterId) return -1;
      if (b.id === activeCharacterId) return 1;
      return 0;
    });
  }, [characters, activeCharacterId]);

  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    sortedCharacters[0]?.id || "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>(initialUploads as Upload[]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
        setPreviewUrl(URL.createObjectURL(droppedFile));
      } else {
        toast.error("Por favor, sube solo archivos de imagen.");
      }
    }
  };

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guildId) {
      toast.error("No se ha encontrado a qué hermandad perteneces.");
      return;
    }
    if (!selectedCharacter) {
      toast.error("Selecciona un personaje.");
      return;
    }
    if (!file) {
      toast.error("Selecciona una captura de pantalla.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("guild_id", guildId);
      formData.append("character_id", selectedCharacter);
      formData.append("notes", notes);

      const res = await fetch("/api/weekly-vault", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload image.");
      }

      const newUpload = await res.json();
      setUploads((prev) => [newUpload, ...prev]);

      toast.success("¡Captura subida con éxito!");
      setFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      toast.error(error.message || "Hubo un error al subir la captura.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Subir Captura</CardTitle>
          <CardDescription>
            Sube la imagen completa de lo que te ha salido en la Gran Cámara
            para el personaje seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="character">Personaje</Label>
              <Select
                value={selectedCharacter}
                onValueChange={setSelectedCharacter}
              >
                <SelectTrigger id="character">
                  <SelectValue placeholder="Selecciona un personaje" />
                </SelectTrigger>
                <SelectContent>
                  {sortedCharacters.map((char: Character) => (
                    <SelectItem key={char.id} value={char.id}>
                      <span className={getWowColorClass(char.char_class)}>
                        {char.name}
                      </span>{" "}
                      - {char.realm_slug}
                      {activeCharacterId === char.id && " (Roster)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: 'Llevo 3 semanas seguidas con este loot...'"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <Label>Imagen de la Gran Cámara</Label>
              <div
                onClick={handleContainerClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group px-6 py-10 overflow-hidden",
                  isDragging 
                    ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                    : "border-border/40 hover:border-blue-500/40 hover:bg-white/[0.02]",
                  previewUrl ? "border-solid" : "border-dashed"
                )}
                style={{
                  backgroundImage: previewUrl ? `url(${previewUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Overlay for preview mode */}
                {previewUrl && (
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                )}

                <div className="relative z-10 text-center flex flex-col items-center">
                  {!previewUrl && (
                    <div className={cn(
                      "mb-4 p-4 rounded-full bg-white/[0.03] border border-white/5 transition-colors group-hover:bg-blue-500/10 group-hover:border-blue-500/20",
                      isDragging && "bg-blue-500/20 border-blue-500/30"
                    )}>
                      <ImageIcon
                        className={cn(
                          "h-10 w-10 text-zinc-500 transition-colors group-hover:text-blue-400",
                          isDragging && "text-blue-400"
                        )}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1 items-center">
                    <span className={cn(
                      "text-sm font-bold transition-colors group-hover:text-white",
                      previewUrl ? "text-white" : "text-zinc-400"
                    )}>
                      {previewUrl ? "Cambiar imagen" : (isDragging ? "¡Suéltala aquí!" : "Sube un archivo")}
                    </span>
                    
                    {!previewUrl && !isDragging && (
                      <p className="text-xs text-zinc-500 font-medium">
                        Click o arrastra: PNG, JPG, GIF hasta 5MB
                      </p>
                    )}
                    
                    {isDragging && (
                      <p className="text-xs text-blue-400 font-bold animate-pulse">
                        Listo para subir
                      </p>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUploading || !file}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Enviar Captura
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tus subidas recientes</h3>
        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No has subido ninguna captura todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {uploads.map((upload) => (
              <Card key={upload.id}>
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="h-16 w-16 rounded overflow-hidden shrink-0 border bg-muted">
                    <img
                      src={upload.image_url}
                      alt="Vault"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Semana del{" "}
                      {format(parseISO(upload.week_start), "d 'de' MMMM", {
                        locale: es,
                      })}
                    </p>
                    <p
                      className={`text-sm ${getWowColorClass(upload.bnet_characters.class_id)} truncate font-medium`}
                    >
                      {upload.bnet_characters.name}
                    </p>
                    {upload.notes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {upload.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Subido el{" "}
                      {format(new Date(upload.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={upload.image_url} target="_blank" rel="noreferrer">
                      Ver grande
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
