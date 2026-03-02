import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const bucket = formData.get('bucket') as string || 'guild_assets'
        const folder = formData.get('folder') as string || 'general'

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        const buffer = Buffer.from(await file.arrayBuffer())

        const { data, error } = await sb.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            })

        if (error) throw error

        const { data: { publicUrl } } = sb.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl, path: filePath })
    } catch (err: any) {
        console.error("Upload error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
