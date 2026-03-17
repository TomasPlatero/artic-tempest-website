import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        const { data, error } = await supabaseAdmin
            .from('guild_members')
            .select('id, character_name, class_id, role, rank')
            .ilike('character_name', `%${query}%`)
            .order('character_name', { ascending: true })
            .limit(10);

        if (error) {
            console.error('Member search error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('Member search fatal error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
