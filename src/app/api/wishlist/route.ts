// src/app/api/wishlist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";
import { WishlistService } from "@/domains/bis/lib/wishlist-service";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("member_id");

        if (!memberId) {
            return NextResponse.json({ error: "Falta el member_id" }, { status: 400 });
        }

        const wishlist = await WishlistService.getWishlist(memberId);
        return NextResponse.json(wishlist || { items: [] });
    } catch (e: any) {
        console.error("Wishlist GET error:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 });

        const { member_id, raidbots_url } = await req.json();

        if (!member_id || !raidbots_url) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        // The WishlistService handles ownership validation implicitly via member lookup 
        // (but ideally we'd check if the member belongs to the user here too, 
        // similar to what's in /api/bis/route.ts)

        const result = await WishlistService.importFromRaidbots(member_id, raidbots_url);

        return NextResponse.json(result);
    } catch (e: any) {
        console.error("Wishlist POST error:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
