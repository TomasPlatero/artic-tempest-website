"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
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
  bnet_characters: { name: string; class_id: number };
};

interface Props {
  characters: any[];
  guildId?: string;
  uploads: any[];
  activeCharacterId?: string;
}

export function WeeklyVaultUploader({ characters = [], guildId, uploads: initialUploads = [], activeCharacterId }: Props) {
  const sortedCharacters = React.useMemo(() => {
    if (!activeCharacterId || !characters) return characters;
    return [...characters].sort((a, b) => {
      if (a.id === activeCharacterId) return -1;
      if (b.id === activeCharacterId) return 1;
      return 0;
    });
  }, [characters, activeCharacterId]);

  const [selectedCharacter, setSelectedCharacter] = useState<string>(sortedCharacters[0]?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>(initialUploads as Upload[]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
            Sube la imagen completa de lo que te ha salido en la Gran Cámara para el personaje seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="character">Personaje</Label>
              <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
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
              <Label>Imagen de la Gran Cámara</Label>
              <div
                className="flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10"
                style={{ backgroundImage: previewUrl ? `url(${previewUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                <div className={`text-center ${previewUrl ? 'bg-black/60 p-4 rounded-md' : ''}`}>
                  {!previewUrl && <ImageIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />}
                  <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                    >
                      <span>{previewUrl ? 'Cambiar imagen' : 'Sube un archivo'}</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  {!previewUrl && <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF hasta 5MB</p>}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isUploading || !file} className="w-full">
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
          <p className="text-sm text-muted-foreground">No has subido ninguna captura todavía.</p>
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
                      Semana del {format(parseISO(upload.week_start), "d 'de' MMMM", { locale: es })}
                    </p>
                    <p className={`text-sm ${getWowColorClass(upload.bnet_characters.class_id)} truncate font-medium`}>
                      {upload.bnet_characters.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Subido el {format(new Date(upload.created_at), "dd/MM/yyyy HH:mm")}
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
