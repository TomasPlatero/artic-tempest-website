import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { getDiscordLinkedRolesVerificationUrl } from '@/shared/discord/linked-roles';

const pageTitle = 'Roles vinculados | Artic Tempest';
const pageDescription =
  'Verificación de roles vinculados de Discord en Artic Tempest.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://artictempest.es/discord/roles-vinculados' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: 'website',
    url: 'https://artictempest.es/discord/roles-vinculados',
    siteName: 'Artic Tempest',
    images: ['/assets/images/artic-tempest-og.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: ['/assets/images/artic-tempest-og.webp'],
  },
};

export default async function DiscordLinkedRolesPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth();
  const params = (await searchParams) ?? {};
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'artictempest.es';
  const verificationUrl = getDiscordLinkedRolesVerificationUrl(
    new Request(`${proto}://${host}/discord/roles-vinculados`),
  );

  return (
    <main className="min-h-dvh bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Discord Linked Roles</p>
        <h1 className="mt-4 text-3xl font-semibold">Verificación de roles vinculados</h1>
        <p className="mt-3 text-sm text-white/60">
          Usa esta URL como <strong>role connections verification URL</strong> en Discord.
          Así tus roles vinculados podrán comprobar si tu cuenta tiene acceso a Zona Raider.
        </p>

        {params.success === '1' ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Verificación completada correctamente.
          </div>
        ) : null}
        {params.error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            No se pudo completar la verificación: {params.error}
          </div>
        ) : null}

        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">URL de verificación</p>
          <code className="block break-all rounded-xl bg-black/30 p-3 text-sm text-cyan-200">
            {verificationUrl}
          </code>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/api/discord/roles-vinculados/start"
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white/90"
            >
              {session ? 'Conectar con Discord' : 'Iniciar sesión para conectar'}
            </Link>
            <Link
              href="/zona-raider"
              className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Volver a Zona Raider
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/40">
          Requisito mínimo: usuario autenticado con Discord. Los metadatos se actualizan con el estado de la cuenta en Artic Tempest.
        </p>
      </div>
    </main>
  );
}
