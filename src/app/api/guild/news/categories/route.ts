import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { createAdminClient } from "@/infrastructure/supabase/server"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['gm', 'officer'].includes(session.user.roleLevel)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, slug, description } = await req.json()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('news_categories')
        .insert([{ name, slug, description }])
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['gm', 'officer'].includes(session.user.roleLevel)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, name, slug, description } = await req.json()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('news_categories')
        .update({ name, slug, description })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['gm', 'officer'].includes(session.user.roleLevel)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('news_categories')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
}
