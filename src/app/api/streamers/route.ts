import { NextResponse } from "next/server"
import { getEnrichedStreamers } from "@/infrastructure/streamers/server-actions"

export async function GET() {
    try {
        const streamers = await getEnrichedStreamers()
        return NextResponse.json(streamers)
    } catch (error) {
        console.error("[STREAMERS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
