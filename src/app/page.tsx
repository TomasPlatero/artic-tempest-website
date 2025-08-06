'use client';

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex grow flex-col items-center justify-center bg-slate-900 text-white text-center py-24 px-6">
        <h1 className="text-5xl font-bold">GuildBoard</h1>
        <p className="mt-4 text-lg max-w-xl">
          Gestiona la progresión de tu guild en World of Warcraft y mantente siempre al día.
        </p>
        <Button className="mt-8" variant="default">Comenzar</Button>
        <Button className="mt-4" variant="ghost" onClick={() => window.location.href="/login"}>
          Iniciar sesión
        </Button>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-semibold text-center">Por qué GuildBoard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Actualización automáticas</h3>
              <p>Importa progreso de raids y runs Mythic+ en tiempo real.</p>
            </Card>
            <Card className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Visual Dashboard</h3>
              <p>Gráficos limpios con accesibilidad y diseño moderno.</p>
            </Card>
            <Card className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Control de roles</h3>
              <p>Define roles, permisos y visualiza participation por miembro.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-center py-8 bg-slate-100">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} GuildBoard – <a href="/login" className="underline">Iniciar sesión</a>
        </p>
      </footer>
    </main>
  )
}
