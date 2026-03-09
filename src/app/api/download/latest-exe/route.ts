import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        console.log("[DOWNLOAD] Fetching latest release from GitHub...");

        const response = await fetch("https://api.github.com/repos/TomasPlatero/artictempest-app/releases/latest", {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "ArticTempest-Guildboard"
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            console.error(`[DOWNLOAD] GitHub API Error: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: "Failed to fetch latest release metadata" }, { status: response.status });
        }

        const data = await response.json();
        const assets = data.assets || [];

        // Find the .exe asset
        const exeAsset = assets.find((asset: any) => asset.name.toLowerCase().endsWith(".exe"));

        if (!exeAsset) {
            console.error("[DOWNLOAD] No .exe asset found in latest release.");
            return NextResponse.json({ error: "No executable found for the latest release" }, { status: 404 });
        }

        console.log(`[DOWNLOAD] Redirecting to: ${exeAsset.browser_download_url}`);

        // Return 302 redirect to the download URL
        return NextResponse.redirect(exeAsset.browser_download_url);
    } catch (error: any) {
        console.error("[DOWNLOAD] Unexpected error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
