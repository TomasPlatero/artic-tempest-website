import { getSeoSettings } from "@/shared/seo/seo-settings";

export const revalidate = 0;

export async function GET() {
  const seoSettings = await getSeoSettings();
  const content = seoSettings.monetization.adsTxtContent.trim();

  if (!content) {
    return new Response("", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  return new Response(`${content}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
