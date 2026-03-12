import { LandingNavigation } from "@/domains/landing/components/navigation"
import { LandingFooter } from "@/domains/landing/components/footer"
import { IconChevronLeft } from "@tabler/icons-react"
import Link from "next/link"
import { cn } from "@/shared/tailwind/tailwind-utils"

interface GuideLayoutProps {
    children: React.ReactNode
    title: string
    description: string
    category: string
    icon: React.ReactNode
    color: string
}

export function GuideLayout({ children, title, description, category, icon, color }: GuideLayoutProps) {
    return (
        <main className="min-h-screen bg-black flex flex-col dark overflow-x-hidden">
            <LandingNavigation />

            {/* Hero Section */}
            <div className="pt-40 pb-20 px-6 relative">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent opacity-50" />

                <div className="max-w-5xl mx-auto relative z-10 space-y-8">
                    <Link
                        href="/ayuda"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest group"
                    >
                        <IconChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                        Volver al Centro de Ayuda
                    </Link>

                    <div className="space-y-6">
                        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest italic", color)}>
                            {icon}
                            {category}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {title}
                        </h1>
                        <p className="text-xl text-white/40 font-medium max-w-2xl leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 pb-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-invert prose-zinc max-w-none">
                        {children}
                    </div>
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
