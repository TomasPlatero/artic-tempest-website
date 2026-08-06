import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acceso en mantenimiento | Artic Tempest',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenanceLoginPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-zinc-950 px-6">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Zona Raider</p>
        <h1 className="mt-4 text-3xl font-semibold">Acceso temporalmente limitado</h1>
        <p className="mt-3 text-sm text-white/60">
          Estamos aplicando mantenimiento. Si necesitas entrar, vuelve a intentarlo más tarde.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Volver al inicio
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white/90"
          >
            Intentar iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
