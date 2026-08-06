import { Metadata } from "next";
import { LoginPageClient } from "@/domains/auth/components/login-page-client";
import { sanitizeInternalCallbackUrl } from "@/shared/auth/callback-url";
import { getGuildBranding } from "@/shared/guild/guild-branding";

export const metadata: Metadata = {
	title: "Iniciar Sesión | Artic Tempest",
	description:
		"Accede a Zona Raider mediante Discord para gestionar tus personajes y ver el progreso.",
};

export default async function LoginPage(props: {
	searchParams: Promise<{
		redirectPath?: string | string[];
		error?: string | string[];
	}>;
}) {
	const [searchParams, guild] = await Promise.all([
		props.searchParams,
		getGuildBranding(),
	]);

	return (
		<LoginPageClient
			redirectPath={sanitizeInternalCallbackUrl(searchParams.redirectPath)}
			error={
				Array.isArray(searchParams.error)
					? searchParams.error[0]
					: (searchParams.error ?? null)
			}
			publicLogoUrl={guild?.public_logo_url ?? null}
		/>
	);
}
