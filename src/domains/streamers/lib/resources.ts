import path from 'node:path';
import { unstable_cache } from 'next/cache';
import sharp from 'sharp';

const STREAM_ASSETS_DIR = path.join(process.cwd(), 'public/assets/stream');

const STREAMER_RESOURCE_DEFINITIONS = [
  {
    fileName: 'artic-tempest-chat-banner.webp',
    title: 'Banner de chat',
    description:
      'Ideal para encabezados, overlays o escenas donde quieras dar contexto a tu directo.',
    accent: 'from-cyan-400/40 via-sky-500/20 to-blue-500/40',
  },
  {
    fileName: 'logo-fondo.webp',
    title: 'Logo con fondo',
    description:
      'Perfecto para fondos oscuros y piezas donde quieras una marca más sólida.',
    accent: 'from-amber-400/40 via-orange-500/20 to-red-500/40',
  },
  {
    fileName: 'logo-sin-fondo.webp',
    title: 'Logo sin fondo',
    description:
      'La opción más versátil para overlays, marcas de agua y composiciones limpias.',
    accent: 'from-fuchsia-400/40 via-violet-500/20 to-violet-500/40',
  },
  {
    fileName: 'logo-texto.webp',
    title: 'Logo con texto',
    description:
      'Una versión clara y reconocible para pantallas, paneles o banners de stream.',
    accent: 'from-emerald-400/40 via-teal-500/20 to-cyan-500/40',
  },
  {
    fileName: 'raider-artic-tempest.webp',
    title: 'Emblema Raider',
    description:
      'Un recurso más agresivo y distintivo, pensado para la zona raider y sus directos.',
    accent: 'from-rose-400/40 via-pink-500/20 to-purple-500/40',
  },
] as const;

type StreamerResource = {
  fileName: string;
  title: string;
  description: string;
  accent: string;
  src: string;
  width: number;
  height: number;
  resolution: string;
};

async function resolveResource(
  definition: (typeof STREAMER_RESOURCE_DEFINITIONS)[number],
) {
  try {
    const filePath = path.join(STREAM_ASSETS_DIR, definition.fileName);
    const metadata = await sharp(filePath).metadata();

    if (!metadata.width || !metadata.height) return null;

    return {
      ...definition,
      src: `/assets/stream/${definition.fileName}`,
      width: metadata.width,
      height: metadata.height,
      resolution: `${metadata.width} × ${metadata.height}`,
    } satisfies StreamerResource;
  } catch (error) {
    console.error(
      `[stream-resources] Failed to load ${definition.fileName}`,
      error,
    );
    return null;
  }
}

export const getStreamerResources = unstable_cache(
  async () => {
    const resources = await Promise.all(
      STREAMER_RESOURCE_DEFINITIONS.map(resolveResource),
    );

    return resources.filter(Boolean) as StreamerResource[];
  },
  ["streamer-resources-v1"],
  { revalidate: 3600 },
);
