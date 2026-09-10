import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/shared/layout/theme-provider";
import { SessionProvider } from "@/shared/layout/session-provider";
import { SkipLink } from "@/shared/components/skip-link";
import { getSynchronousNonce } from "@/shared/security/csp-nonce";
import { SECURITY_HEADER_VALUES } from "@/shared/security/response-headers";
import { JsonLdHead } from "@/shared/seo/json-ld-head";
import { LayoutH1 } from "@/shared/seo/layout-h1";
import {
	buildRobotsMetadata,
	buildVerificationMetadata,
	getSeoSettings,
} from "@/shared/seo/seo-settings";
import { getGuildBranding } from "@/shared/guild/guild-branding";
import { AsyncLayoutContent } from "@/shared/layout/async-layout-content";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
	preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";

const darkReaderHydrationGuard = `
(function(){const nodes=document.querySelectorAll('[data-darkreader-saved]');for(var i=0;i<nodes.length;i++){var node=nodes[i];node.replaceWith(...node.childNodes);}
const deadline=Date.now()+2e3;function clean(nodes){for(var i=0;i<nodes.length;i++){var el=nodes[i];el.hasAttribute&&el.hasAttribute('data-darkreader-saved')&&(el.replaceWith(...el.childNodes),el.childNodes.length&&clean(el.childNodes));if(Date.now()>=deadline)return}}
const all=document.querySelectorAll('*');for(var i=0;i<all.length;i++){var el=all[i];el.hasAttribute&&el.hasAttribute('data-darkreader-saved')&&(el.replaceWith(...el.childNodes));if(Date.now()>=deadline)break}
function sweep(){const nodes=document.querySelectorAll('[data-darkreader-saved]');for(var i=0;i<nodes.length;i++)clean(nodes[i]);if(Date.now()<deadline)requestAnimationFrame(sweep)}
requestAnimationFrame(sweep)})();
`;

const CANONICAL_SITE_URL = "https://artictempest.es";

/**
 * metadataBase must be a valid absolute URL. The canonical host is used when the
 * configured site URL is empty or malformed.
 */
function resolveMetadataBase(siteUrl: string): URL {
	const candidate = URL.canParse(siteUrl) ? siteUrl : CANONICAL_SITE_URL;

	try {
		return new URL(candidate);
	} catch (error) {
		// Unreachable: `candidate` is always parseable, but the call is guard-wrapped
		// so a bad value can never take the render down.
		throw new Error(`Invalid metadataBase "${candidate}": ${String(error)}`);
	}
}
export async function generateMetadata(): Promise<Metadata> {
	const [guild, seoSettings] = await Promise.all([
		getGuildBranding(),
		getSeoSettings(),
	]);
	// Root layout metadata is always for public pages.
	// Individual route segments override with their own generateMetadata.
	const isPublicPage = true;
	const publicSiteUrl = seoSettings.site.url || siteUrl;

	const title = guild
		? `${guild.name} – Hermandad WoW | Progreso Mítico en Dun Modr`
		: `${seoSettings.site.name} – Hermandad WoW | Progreso Mítico en Dun Modr`;
	const desc = seoSettings.site.description;
	const icon = guild?.icon_url || "/favicon.ico";

	return {
		title,
		description: desc,
		referrer: SECURITY_HEADER_VALUES["Referrer-Policy"],
		keywords: [
			"World of Warcraft",
			"WoW",
			"Guild",
			"Hermandad",
			"Roster",
			"Raideo",
			"Midnight",
			"PvE",
			"Mítico",
			"Reclutamiento WoW",
			"Artic Tempest",
			"Dun Modr",
			"Cutting Edge",
			"Progreso raid",
		],
		authors: [{ name: "Artic Tempest" }],
		creator: "Artic Tempest",
		publisher: "Artic Tempest",
		formatDetection: {
			email: false,
			address: false,
			telephone: false,
		},
		metadataBase: resolveMetadataBase(publicSiteUrl),
		alternates: {
			canonical: "/",
		},
		verification: isPublicPage
			? (() => {
					const other = {
						...(process.env.NEXT_PUBLIC_BING_VERIFICATION &&
						!seoSettings.verification.bing
							? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION }
							: undefined),
						...buildVerificationMetadata(seoSettings).other,
					};

					return {
						google:
							seoSettings.verification.google ||
							process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
							undefined,
						yandex:
							seoSettings.verification.yandex ||
							process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ||
							undefined,
						...(Object.keys(other).length ? { other } : {}),
					};
				})()
			: undefined,
		icons: {
			icon: [
				{ url: "/assets/images/favicon.svg", type: "image/svg+xml" },
				{ url: icon, href: icon, sizes: "32x32", type: "image/png" },
				{ url: icon, href: icon, sizes: "16x16", type: "image/png" },
			],
			apple: "/apple-icon.png",
		},
		twitter: {
			card: "summary_large_image",
			site: seoSettings.social.twitterSite || undefined,
			...(seoSettings.social.twitterCreator && {
				creator: seoSettings.social.twitterCreator,
			}),
		},
		openGraph: {
			title: guild
				? `${guild.name} – Hermandad WoW | Progreso Mítico`
				: `${seoSettings.site.name} – Hermandad WoW | Progreso Mítico`,
			description: desc,
			url: publicSiteUrl,
			siteName: seoSettings.site.name,
			locale: "es_ES",
			type: "website",
			images: [
				{
					url: seoSettings.site.ogImage,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
			...(seoSettings.social.facebookAppId && {
				appId: seoSettings.social.facebookAppId,
			}),
		},
		other: {
			...buildVerificationMetadata(seoSettings).other,
		},
		robots: buildRobotsMetadata(seoSettings, isPublicPage),
	};
}

export const viewport: Viewport = {
	colorScheme: "dark",
	themeColor: "#000000",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const nonce = getSynchronousNonce();

	return (
		<html lang="es" className="dark" suppressHydrationWarning>
			<head>
				{/* 1. Consent default — se marca ignore para que Cookiebot no lo bloquee */}
				<Script
					id="gtag-consent-default"
					strategy="beforeInteractive"
					data-cfasync="false"
					data-cookieconsent="ignore"
				>
					{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_personalization:'denied',ad_storage:'denied',ad_user_data:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',false);`}
				</Script>
				{/* 2. Cookiebot CMP — afterInteractive porque Consent Mode v2 ya bloquea todo por defecto */}
				{process.env.NEXT_PUBLIC_COOKIEBOT_ID ? (
					<Script
						id="Cookiebot"
						src="https://consent.cookiebot.com/uc.js"
						data-cbid={process.env.NEXT_PUBLIC_COOKIEBOT_ID}
						data-blockingmode="auto"
						data-cfasync="false"
						strategy="afterInteractive"
					/>
				) : null}
				{/* 3. Darkreader — necesario antes del render, ignorado por Cookiebot */}
				<Script
					id="darkreader-hydration-guard"
					strategy="beforeInteractive"
					data-cfasync="false"
					data-cookieconsent="ignore"
				>
					{darkReaderHydrationGuard}
				</Script>
				<link
					rel="alternate"
					type="application/rss+xml"
					title="Noticias – Artic Tempest"
					href={`${siteUrl.replace(/\/$/, "")}/noticias/rss`}
				/>
				{/* JSON-LD structured data — rendered in head for crawlers */}
				<JsonLdHead />
			</head>
			<body
				className={`${geistSans.variable} antialiased`}
				suppressHydrationWarning
			>
				{/* H1 for crawlers — before RSC streaming boundary */}
				<LayoutH1 />
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					forcedTheme="dark"
					enableSystem={false}
					disableTransitionOnChange
				>
					<SessionProvider>
						<SkipLink />
						{/* Children render as static HTML — no async boundary */}
						{children}
						{/* Deferred dynamic providers (session, analytics, adsense) */}
						<Suspense fallback={null}>
							<AsyncLayoutContent nonce={nonce} />
						</Suspense>
					</SessionProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
