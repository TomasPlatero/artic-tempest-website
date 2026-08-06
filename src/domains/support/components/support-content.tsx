"use client";

import { FeedbackClient } from "@/domains/feedback/components/feedback-client";
import {
  IconMessageCircle,
  IconLifebuoy,
} from "@/shared/ui/tabler-icons";
import { DotPattern } from "@/shared/ui/dot-pattern";
import { cn } from "@/shared/lib/utils";

export function SupportContent() {
  return (
    <div className="flex-1 flex flex-col pt-12 pb-20 w-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]",
            "opacity-40",
          )}
        />

        {/* Glows */}
        <div className="absolute top-[-10%] left-[-10%] size-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] size-[40%] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section */}
      <div className="pt-8 pb-20 relative px-4">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-widest animate-in fade-in zoom-in duration-500">
            <IconLifebuoy className="size-4" />
            Support Hub
          </div>
          <h1 className="text-5xl md:text-8xl font-semibold text-white uppercase tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
            ¿Cómo podemos <br />
            <span className="text-blue-300">
              ayudarte?
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
            Envíanos tus sugerencias para seguir mejorando.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 pb-32 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-12 xl:col-span-5 space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-widest">
                  <IconMessageCircle className="size-4" />
                  Buzón de Sugerencias
                </div>
                <h2 className="text-3xl font-semibold text-white uppercase tracking-tight">
                  Tu opinión cuenta
                </h2>
                <p className="text-white/60 leading-relaxed font-medium">
                  ¿Has encontrado un error? ¿Tienes una idea brillante?
                  Cuéntanoslo. Revisamos todos los mensajes que recibimos a
                  través de este formulario.
                </p>
              </div>
            </div>
            <div className="lg:col-span-12 xl:col-span-7 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl">
              <FeedbackClient />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
