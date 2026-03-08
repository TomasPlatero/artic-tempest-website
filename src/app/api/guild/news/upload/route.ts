import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // Auth check
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileExtension = file.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExtension}`
        const filePath = `articles/${fileName}`

        const { data, error } = await supabaseAdmin.storage
            .from("news-images")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from("news-images")
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })
    } catch (error: any) {
        console.error("[NEWS_UPLOAD]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
