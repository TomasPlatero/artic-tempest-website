import { NextResponse } from 'next/server';
import { sb } from "@/infrastructure/auth/auth-options";
import sharp from 'sharp';

export const runtime = 'nodejs'; // Sharp requires Node.js runtime

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sizeParam = searchParams.get('size') || '192';
    const size = parseInt(sizeParam, 10);

    if (size !== 192 && size !== 512) {
        return new NextResponse("Invalid size", { status: 400 });
    }

    try {
        const { data: guild } = await sb
            .from("guilds_managed")
            .select("icon_url")
            .limit(1)
            .single();

        let imageBuffer: Buffer;

        if (guild?.icon_url) {
            const response = await fetch(guild.icon_url);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
            } else {
                throw new Error("Failed to fetch guild icon");
            }
        } else {
            // Fallback to local default icon
            const fallbackUrl = new URL(`/icon-${size}x${size}.png`, request.url);
            const response = await fetch(fallbackUrl);
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        }

        // Use sharp to resize and convert to PNG
        const optimizedImageBuffer = await sharp(imageBuffer)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png()
            .toBuffer();

        return new NextResponse(new Uint8Array(optimizedImageBuffer), {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=31536000',
            },
        });
    } catch (error) {
        console.error("Error generating app icon:", error);
        return new NextResponse("Error generating icon", { status: 500 });
    }
}
