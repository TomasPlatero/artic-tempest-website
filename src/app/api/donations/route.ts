// src/app/api/donations/route.ts
import { NextResponse } from 'next/server';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission, getAppPermission } from '@/shared/auth/permissions';
import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get('all') === 'true';

        // 1. Fetch active goal
        const { data: activeGoal } = await supabaseAdmin
            .from('guild_goals')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 2. Fetch donations (confirmed for public, all for settings)
        let query = supabaseAdmin
            .from('guild_donations')
            .select('*')
            .order('created_at', { ascending: false });

        if (!all) {
            query = query.eq('status', 'confirmed').limit(10);
        }

        const { data: donations, error } = await query;

        if (error) throw error;

        // 3. Calculate progress if there's a goal
        let current_amount = 0;
        if (activeGoal) {
            const { data: totalData } = await supabaseAdmin
                .from('guild_donations')
                .select('amount')
                .eq('status', 'confirmed');
            
            current_amount = totalData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
        }

        return NextResponse.json({ 
            success: true, 
            data: donations,
            goal: activeGoal ? {
                ...activeGoal,
                current_amount
            } : null
        });
    } catch (err) {
        console.error('Donation fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
    }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No session' }, { status: 401 });

    const body = await req.json();
    const { type = 'donation', ...data } = body;

    const roleLevel = session.user.roleLevel?.toLowerCase() ?? "invitado";
    const permission = await getAppPermission(roleLevel as any, 'donations');

    if (type === 'goal') {
      if (!permission.canManage) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      
      const { name, target_amount } = data;
      if (!name || !target_amount) {
        return NextResponse.json({ error: 'Faltan campos para la meta' }, { status: 400 });
      }

      const { data: goal, error } = await supabaseAdmin
        .from('guild_goals')
        .insert({
            name,
            target_amount: parseFloat(target_amount),
            is_active: false
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: goal });
    }

    // Default: Donation log/report
    const { character_name, amount, description, notes } = data;
    if (!character_name || !amount) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    // Concatenate meta and notes if notes exist
    const fullDescription = notes 
        ? `${description || 'General'} | Nota: ${notes}`
        : (description || null);

    // If manager -> confirmed, else -> pending
    const status = permission.canManage ? 'confirmed' : 'pending';

    const { data: donation, error } = await supabaseAdmin
      .from('guild_donations')
      .insert({
        character_name,
        amount: parseFloat(amount),
        description: fullDescription,
        created_by: session.user.id,
        status
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data: donation });
  } catch (err) {
    console.error('POST /api/donations error:', err);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        await ensureAppPermission('donations', 'manage');
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type') || 'donation';

        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

        const table = type === 'goal' ? 'guild_goals' : 'guild_donations';
        const { error } = await supabaseAdmin.from(table).delete().eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Delete error:', err);
        return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await ensureAppPermission('donations', 'manage');
        const body = await req.json();
        const { id, type, ...updates } = body;

        if (type === 'settings') {
            const { data: guild } = await supabaseAdmin
                .from('guilds_managed')
                .select('guild_id')
                .limit(1)
                .maybeSingle();

            if (!guild) return NextResponse.json({ error: 'No se encontró la configuración de la hermandad' }, { status: 404 });

            const { data, error } = await supabaseAdmin
                .from('guilds_managed')
                .update(updates)
                .eq('guild_id', guild.guild_id)
                .select()
                .single();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (!id || !type) return NextResponse.json({ error: 'ID y Tipo requeridos' }, { status: 400 });

        const table = type === 'goal' ? 'guild_goals' : 'guild_donations';
        
        // If activating a goal, deactivate others
        if (type === 'goal' && updates.is_active === true) {
            await supabaseAdmin.from('guild_goals').update({ is_active: false }).neq('id', id);
        }

        const { data, error } = await supabaseAdmin
            .from(table)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('Update error:', err);
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }
}
