import { NextResponse } from "next/server"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { getServerSession } from "next-auth"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, title, content } = body

        const { data: maxBlock } = await supabaseAdmin
            .from('dashboard_blocks')
            .select('order_index')
            .order('order_index', { ascending: false })
            .limit(1)
            .single()

        const nextOrder = (maxBlock?.order_index ?? 0) + 10

        const { data, error } = await supabaseAdmin
            .from('dashboard_blocks')
            .insert({
                type,
                title,
                content: content || {},
                order_index: nextOrder,
                is_active: true,
                role_levels: body.role_levels || [],
                app_id: body.app_id || null
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("[DASHBOARD_BLOCKS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, ...updates } = body

        const { data, error } = await supabaseAdmin
            .from('dashboard_blocks')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        console.error("[DASHBOARD_BLOCKS_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return new NextResponse("ID Required", { status: 400 })

        const { error } = await supabaseAdmin
            .from('dashboard_blocks')
            .delete()
            .eq('id', id)

        if (error) throw error
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[DASHBOARD_BLOCKS_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
