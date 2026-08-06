/**
 * Content Security Policy builder — pure function, no Next.js server dependencies.
 * Importable from next.config.ts, middleware.ts, and anywhere else.
 */
export function buildCsp(options?: { dev?: boolean }): string {
	const isDev = options?.dev ?? false;

	const devToolbarConnectSrc = isDev
		? "http://localhost:* http://127.0.0.1:*"
		: "";
	const devSecuritySrc = isDev ? "'unsafe-eval'" : "";
	const devVercelScripts = isDev ? "va.vercel-scripts.com" : "";

	const vercelLiveSrc = "vercel.live *.vercel.live";
	const vercelStylesSrc = "vercel.live";
	const vercelImgSrc = "vercel.live vercel.com";
	const vercelFontSrc = "vercel.live assets.vercel.com";
	const vercelFrameSrc = "vercel.live";

	const googleAdsSourceHosts =
		"pagead2.googlesyndication.com *.googlesyndication.com *.google.com *.googleadservices.com *.doubleclick.net *.g.doubleclick.net googleads.g.doubleclick.net fundingchoicesmessages.google.com *.fundingchoicesmessages.google.com ep1.adtrafficquality.google ep2.adtrafficquality.google *.adtrafficquality.google";

	return [
		"default-src 'self'",
		[
			"script-src 'self'",
			devSecuritySrc,
			vercelLiveSrc,
			"consent.cookiebot.com",
			"consentcdn.cookiebot.com",
			"*.cookiebot.com",
			"wow.zamimg.com",
			"*.wowhead.com",
			"*.googletagmanager.com",
			"*.google-analytics.com",
			googleAdsSourceHosts,
			"www.instant-gaming.com",
			devVercelScripts,
		]
			.filter(Boolean)
			.join(" "),
		[
			"style-src 'self'",
			"fonts.googleapis.com",
			"wow.zamimg.com",
			vercelStylesSrc,
			"www.instant-gaming.com",
		]
			.filter(Boolean)
			.join(" "),
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		[
			"img-src 'self' blob: data:",
			"authjs.dev *.authjs.dev",
			"cdn.discordapp.com",
			"render.worldofwarcraft.com",
			"wow.zamimg.com",
			"*.supabase.co",
			"*.google.com *.google.es",
			googleAdsSourceHosts,
			"*.akamaihd.net",
			"*.raider.io https://cdnassets.raider.io cdnassets.raider.io",
			"*.warcraftlogs.com",
			"bnetcmsus-a.akamaihd.net",
			"static-cdn.jtvnw.net",
			"*.googletagmanager.com",
			"*.google-analytics.com",
			"community.restedxp.com",
			"shop.restedxp.com",
			"media.restedxp.com",
			"artictempest.es",
			vercelImgSrc,
			"www.instant-gaming.com",
			"vpncdn.protonweb.com",
			"consent.cookiebot.com consentcdn.cookiebot.com *.cookiebot.com",
		]
			.filter(Boolean)
			.join(" "),
		[
			"font-src 'self' data:",
			"fonts.gstatic.com",
			vercelFontSrc,
			"www.instant-gaming.com",
		]
			.filter(Boolean)
			.join(" "),
		[
			"connect-src 'self'",
			devToolbarConnectSrc,
			"*.supabase.co wss://*.supabase.co",
			"discord.com *.discordapp.com",
			"vitals.vercel-insights.com",
			vercelLiveSrc,
			"wss://ws-us3.pusher.com",
			"consent.cookiebot.com consentcdn.cookiebot.com *.cookiebot.com",
			"stats.g.doubleclick.net",
			"raider.io *.raider.io",
			"warcraftlogs.com *.warcraftlogs.com",
			"*.supabase.in wss://*.supabase.in",
			"wow.zamimg.com *.wowhead.com",
			"*.google-analytics.com *.analytics.google.com *.googletagmanager.com",
			googleAdsSourceHosts,
			"fundingchoicesmessages.google.com *.fundingchoicesmessages.google.com",
			"*.ingest.de.sentry.io https://*.ingest.de.sentry.io wss://*.ingest.de.sentry.io",
			"api.websitecarbon.com",
		]
			.filter(Boolean)
			.join(" "),
		[
			"frame-src 'self'",
			"player.twitch.tv",
			vercelFrameSrc,
			"www.youtube-nocookie.com www.youtube.com youtube.com m.youtube.com",
			"consent.cookiebot.com consentcdn.cookiebot.com *.cookiebot.com",
			googleAdsSourceHosts,
		]
			.filter(Boolean)
			.join(" "),
		"frame-ancestors 'none'",
		"worker-src 'self'",
		"upgrade-insecure-requests",
	]
		.filter(Boolean)
		.join("; ");
}
