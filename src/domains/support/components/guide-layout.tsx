import { IconChevronLeft } from "@/shared/ui/tabler-icons";
import Link from "next/link";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { Button } from "@/shared/ui/button";

interface GuideLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  category?: string;
  icon: React.ReactNode;
  color: string;
  backHref?: string;
  backLabel?: string;
  showBackLink?: boolean;
}

export function GuideLayout({
  children,
  title,
  description,
  category,
  icon,
  color,
  backHref = "/ayuda",
  backLabel = "Volver al Centro de Ayuda",
  showBackLink = true,
}: GuideLayoutProps) {
  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="pt-12 pb-20 px-6 relative overflow-hidden rounded-[3rem] bg-zinc-900/40 border border-white/5 mb-12 w-full">
        <div className="absolute inset-0 z-0 bg-linear-to-b from-blue-600/10 via-transparent to-transparent opacity-50" />

        <div className="max-w-none w-full relative z-10 space-y-8 text-left">
          {showBackLink ? (
            <Button asChild variant="publicGhost" size="publicSm">
              <Link href={backHref} className="group">
                <IconChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                {backLabel}
              </Link>
            </Button>
          ) : null}

          <div className="space-y-6">
            {category ? (
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-widest italic",
                  color,
                )}
              >
                {icon}
                {category}
              </div>
            ) : null}
            <h1 className="text-5xl md:text-7xl font-semibold text-white uppercase tracking-tighter leading-relaxed">
              {title}
            </h1>
            <p className="text-xl text-white/40 font-medium max-w-4xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 pb-32 px-6">
        <div className="max-w-[auto] mx-auto w-auto">
          <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-white/60 prose-strong:text-white prose-li:text-white/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
