import { RecruitmentPageClient } from "@/domains/landing/components/recruitment-page-client"
import { Metadata } from "next"
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session"
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getSeoSettings } from "@/shared/seo/seo-settings"
import { ACTIVE_RECRUITMENT_STATUSES } from "@/domains/recruitment/lib/application-status";

export const metadata: Metadata = {
    title: 'Reclutamiento | Artic Tempest',
    description: 'Únete al roster de Artic Tempest. Buscamos jugadores excepcionales para nuestros grupos de raideo y contenido competitivo en World of Warcraft.',
    alternates: {
        canonical: '/reclutamiento',
    },
    openGraph: {
        title: 'Reclutamiento | Artic Tempest',
        description: 'Únete a las filas de Artic Tempest. Vacantes de reclutamiento abiertas.',
        type: 'website',
    }
}

export default async function RecruitmentPage() {
    const [session, seoSettings] = await Promise.all([
        getCachedServerSession(),
        getSeoSettings(),
    ])
    let initialHasApplied = false

    if (session?.user?.id) {
        const { data } = await supabaseAdmin
            .from("recruitment_applications")
            .select("id")
            .eq("user_id", session.user.id)
            .in("status", [...ACTIVE_RECRUITMENT_STATUSES])
            .limit(1)

        initialHasApplied = Boolean(data?.length)
    }

    return <RecruitmentPageClient initialHasApplied={initialHasApplied} adsenseClientId={seoSettings.monetization.googleAdsenseClientId || undefined} adsenseSlot={seoSettings.monetization.googleAdsenseSlots.recruitmentInline1 || undefined} />
}
