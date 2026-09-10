// Extracted from navigation.tsx (ATW-20): keeps each component in its own file.

import { IconFileSearch, IconMessageCircle } from "@/shared/ui/tabler-icons";
import { isActiveRecruitmentStatus } from "@/domains/recruitment/lib/application-status";
import { resolveRoleColorFromMe } from "@/shared/lib/role-color-styles";

export const NAV_LINKS = [
	{ href: "/", label: "Inicio", title: "Inicio de Artic Tempest" },
	{
		href: "/",
		label: "Noticias",
		title: "Consulta las últimas novedades de la hermandad",
		sectionId: "noticias",
	},
	{
		href: "/",
		label: "Reclutamiento",
		title: "Mira las clases que necesitamos en Artic Tempest",
		sectionId: "reclutamiento",
	},
	{
		href: "/",
		label: "Progreso",
		title: "Consulta nuestro progreso en Midnight",
		sectionId: "progreso",
	},
	{
		href: "/",
		label: "Streamers",
		title: "Sigue en directo a nuestros creadores de contenido",
		sectionId: "streamers",
	},
	{
		href: "/",
		label: "Historia y Cultura",
		title: "Conoce la trayectoria de nuestra hermandad",
		sectionId: "historia",
	},
];

import { useSession } from "next-auth/react";

export type SessionData = ReturnType<typeof useSession>["data"];

export type ApplyStatusInput = {
	showApplyReminder: boolean;
	applyStatus: string | null;
	session: SessionData | null;
};

/** Resolves the "apply" call-to-action shown in the navigation. */
export function resolveApplyCta({
	showApplyReminder,
	applyStatus,
	session,
}: ApplyStatusInput) {
	if (
		!showApplyReminder ||
		!session ||
		!isActiveRecruitmentStatus(applyStatus)
	) {
		return null;
	}

	const isInterview = applyStatus === "interview";
	const theme =
		applyStatus === "pending"
			? {
					accent: "from-blue-500/20 to-blue-600/10 border-blue-400/25",
					chip: "bg-blue-400/10 text-blue-100 border-blue-300/20",
					label: "text-blue-300",
				}
			: applyStatus === "reviewing"
				? {
						accent:
							"from-purple-500/22 to-purple-600/10 border-purple-400/25",
						chip: "bg-purple-400/10 text-purple-100 border-purple-300/20",
						label: "text-purple-300",
					}
				: applyStatus === "interview"
					? {
							accent:
								"from-orange-500/22 to-orange-600/10 border-orange-400/25",
							chip: "bg-orange-400/10 text-orange-100 border-orange-300/20",
							label: "text-orange-300",
						}
					: {
							accent: "from-cyan-500/20 to-blue-500/10 border-cyan-400/25",
							chip: "bg-cyan-400/10 text-cyan-100 border-cyan-300/20",
							label: "text-cyan-300",
						};
	const statusLabel =
		applyStatus === "reviewing"
			? "En Revisión"
			: applyStatus === "interview"
				? "Entrevista"
				: applyStatus === "simulated"
					? "Simulado"
					: applyStatus === "pending"
						? "Nuevo"
						: "Activo";

	return {
		href: isInterview
			? "/reclutamiento/apply-en-curso/chat"
			: "/reclutamiento/apply-en-curso",
		mainHref: "/reclutamiento/apply-en-curso",
		title: isInterview ? "Chatear ahora" : "Revisar mi Apply",
		label: isInterview ? "Chatear ahora" : "Revisar mi Apply",
		subtitle: statusLabel,
		icon: isInterview ? IconMessageCircle : IconFileSearch,
		actionLabel: isInterview ? "Chatear ahora" : null,
		actionHref: isInterview ? "/reclutamiento/apply-en-curso/chat" : null,
		accent: theme.accent,
		badge: theme.chip,
		labelClass: theme.label,
	};
}

export type ApplyCta = ReturnType<typeof resolveApplyCta>;

export type RoleRingStyle = ReturnType<typeof resolveRoleRingStyle>;

/** Ring style for the avatar, derived from the role colour. */
export function resolveRoleRingStyle(roleColor: ReturnType<typeof resolveRoleColorFromMe>) {
	return roleColor
		? { backgroundColor: roleColor, boxShadow: `0 0 10px ${roleColor}66` }
		: undefined;
}
