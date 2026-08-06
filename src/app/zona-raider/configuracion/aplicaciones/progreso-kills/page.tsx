import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowLeft, IconPhoto } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Forbidden } from "@/shared/components/forbidden";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { RAID_BOSS_SEQUENCE, getRaidTimeline } from "@/domains/landing/lib/progression";
import { KillImagesSettingsClient } from "./components/kill-images-settings-client";

const BUCKET = "image_boses_kills";
const CATEGORY = "wow_raid_kill_images";

function prettifySlug(slug: string) {
  return slug
    .split("-")
    .reduce<string[]>((acc, part) => {
      if (part) acc.push(part.charAt(0).toUpperCase() + part.slice(1));
      return acc;
    }, [])
    .join(" ");
}

function resolveStoredPath(row: any) {
  if (row?.metadata?.path) return row.metadata.path as string;

  if (typeof row?.value === "string") {
    try {
      const url = new URL(row.value);
      const maybePath = url.pathname.split("/").filter(Boolean).pop();
      if (maybePath) return maybePath;
    } catch {
      return row.value as string;
    }
  }

  return "";
}

export default async function ProgresoKillsSettingsPage() {
  const session = await getCachedServerSession();
  if (!session) {
    redirect("/");
  }

  const authz = await getAuthzSnapshot(session);
  const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "member";
  const { canEdit } = await getAppPermission(roleLevel, "settings");

  if (!canEdit) {
    return <Forbidden />;
  }

  const [timeline, mappingsResult, filesResult] = await Promise.all([
    getRaidTimeline(),
    supabaseAdmin
      .from("game_constants")
      .select("key, value, metadata")
      .eq("category", CATEGORY),
    supabaseAdmin.storage.from(BUCKET).list("", { limit: 1000 }),
  ]);

  const imageFiles = (filesResult.data || []).reduce<Array<{ path: string; name: string; url: string }>>((acc, file) => {
    if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(file.name);
      acc.push({
        path: file.name,
        name: file.name,
        url: data.publicUrl,
      });
    }
    return acc;
  }, []);

  const currentMappings = Object.fromEntries(
    (mappingsResult.data || []).map((row: any) => {
      const path = resolveStoredPath(row) || imageFiles.find((image) => image.url === row.value)?.path || row.value;
      return [row.key, path] as const;
    }),
  );

  const bosses = timeline?.bosses?.length
    ? timeline.bosses.map((boss) => ({
        slug: boss.slug,
        name: boss.name,
        ordinal: boss.ordinal,
        imageUrl: boss.killImageUrl,
      }))
    : RAID_BOSS_SEQUENCE.map((slug, index) => ({
        slug,
        name: prettifySlug(slug),
        ordinal: index + 1,
        imageUrl: currentMappings[slug] || null,
      }));

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <div className="flex items-start md:items-center gap-3 md:gap-4">
        <Link href="/zona-raider/configuracion/aplicaciones">
          <Button
            variant="outline"
            size="icon"
            className="size-10 md:size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl shrink-0"
          >
            <IconArrowLeft className="size-5 md:size-6" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold font-heading italic tracking-tight flex items-center gap-2 md:gap-3 flex-wrap">
            <IconPhoto className="size-5 md:size-7 text-fuchsia-400 shrink-0" />
            <span>IMÁGENES DE KILLS</span>
          </h1>
          <p className="text-xs font-medium text-white/40 mt-1 md:mt-2 tracking-widest leading-relaxed">
            Asigna capturas del bucket image_boses_kills a cada boss derrotado.
          </p>
        </div>
      </div>

      <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:p-4 text-xs md:text-sm text-white/60">
        Las imágenes se guardan en <span className="font-semibold text-white">game_constants</span> y se muestran automáticamente en <span className="font-semibold text-white">/progreso</span>.
      </div>

      <KillImagesSettingsClient
        bosses={bosses}
        images={imageFiles}
        initialMappings={currentMappings}
      />
    </div>
  );
}
