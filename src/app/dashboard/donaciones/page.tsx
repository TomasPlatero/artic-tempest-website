// src/app/dashboard/donaciones/page.tsx
import React from "react"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { DonationSection } from "@/domains/dashboard/components/donation-section"
import { IconHeart } from "@tabler/icons-react"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function DashboardDonacionesPage() {
    const session = await getServerSession(authOptions)
    const roleLevel = session?.user?.roleLevel?.toLowerCase() ?? "invitado"

    // Fetch Recent Donations
    const { data: donations } = await supabaseAdmin
        .from("guild_donations")
        .select("character_name, amount, description, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

    // Fetch Active Donation Goal
    let donationGoal = null;
    const { data: activeGoal } = await supabaseAdmin
        .from("guild_goals")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (activeGoal) {
        const { data: goalDonations } = await supabaseAdmin
            .from("guild_donations")
            .select("amount")
            .gte("created_at", activeGoal.created_at);
        
        const currentAmount = goalDonations?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
        donationGoal = { ...activeGoal, current_amount: currentAmount };
    }

    return (
        <div className="flex flex-col items-center justify-center p-0 md:p-6 w-full">
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                        <IconHeart className="size-7 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-white mb-2 drop-shadow-2xl">
                        Colaboraciones
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] max-w-md leading-relaxed opacity-60">
                        Ayúdanos a mantener los servicios activos
                    </p>
                </div>

                <div className="w-full">
                    <DonationSection 
                        roleLevel={roleLevel} 
                        recentDonations={donations || []} 
                        donationGoal={donationGoal}
                    />
                </div>
            </div>
        </div>
    )
}
