import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, fetchCharacterMedia } from "@/shared/integrations/bnet/bnet-client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const realm = searchParams.get("realm");
    const region = searchParams.get("region") || "eu";

    if (!name || !realm) {
        return NextResponse.json({ error: "Missing name or realm" }, { status: 400 });
    }

    try {
        const token = await getAccessToken();
        const avatarUrl = await fetchCharacterMedia(realm, name.toLowerCase(), region, token);

        if (!avatarUrl) {
            return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
        }

        // Cache for 24 hours
        return NextResponse.json({ url: avatarUrl }, { 
            headers: {
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200"
            }
        });
    } catch (error) {
        console.error("Error fetching blizzard avatar:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
