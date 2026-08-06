import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import {
  WOWAUDIT_RANK_IMAGE_BUCKET,
  type WowauditRankRow,
} from "@/shared/integrations/wowaudit/wowaudit-ranks";

export type WowauditRankImage = {
  path: string;
  name: string;
  url: string;
  folder: string | null;
};

async function listRankImages(prefix = ""): Promise<WowauditRankImage[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(WOWAUDIT_RANK_IMAGE_BUCKET)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (error) {
    throw error;
  }

  const items = data ?? [];
  const images: WowauditRankImage[] = [];
  const subfolderPromises: Promise<WowauditRankImage[]>[] = [];

  for (const item of items) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    const isImage = /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(item.name);

    if (isImage) {
      const { data: publicUrl } = supabaseAdmin.storage
        .from(WOWAUDIT_RANK_IMAGE_BUCKET)
        .getPublicUrl(path);

      images.push({
        path,
        name: item.name,
        url: publicUrl.publicUrl,
        folder: prefix || null,
      });
      continue;
    }

    if (!item.name.includes(".")) {
      subfolderPromises.push(listRankImages(path));
    }
  }

  const subfolderResults = await Promise.all(subfolderPromises);
  for (const result of subfolderResults) {
    images.push(...result);
  }

  return images;
}

export async function fetchWowauditRanks() {
  const { data, error } = await supabaseAdmin
    .from("app_wowaudit_ranks")
    .select("rank, name, color, image_url, roster_section")
    .order("rank", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: WowauditRankRow) => ({
    ...row,
    image_url: normalizeWowauditRankImageUrl(row.image_url),
  })) as WowauditRankRow[];
}

export async function fetchWowauditRankImages() {
  return listRankImages();
}

export function normalizeWowauditRankImageUrl(value: string | null | undefined) {
  if (!value) return null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;

  const { data } = supabaseAdmin.storage
    .from(WOWAUDIT_RANK_IMAGE_BUCKET)
    .getPublicUrl(value);

  return data.publicUrl;
}
