import {
	RECRUITMENT_STATUS_COLORS,
	RECRUITMENT_STATUS_LABELS,
} from "@/domains/recruitment/lib/application-status";

export const statusConfig: Record<string, { label: string; color: string }> =
	Object.fromEntries(
		Object.entries(RECRUITMENT_STATUS_LABELS).map(([key, label]) => [
			key,
			{ label, color: RECRUITMENT_STATUS_COLORS[key] },
		]),
	);

export const DATE_FORMATTER_UTC = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	timeZone: "UTC",
});

export const statusChangeOptions = Object.entries(statusConfig).filter(
	([key]) => key !== "simulated",
);

export function resolveSpecLabel(application: any, rioData: any) {
	return application.character_spec === "Unknown"
		? rioData?.active_spec_name || "Unknown"
		: application.character_spec;
}

export function resolveGuildRealm(rioData: any, application: any) {
	return rioData.guild.realm || application.character_realm;
}
