export const EMPTY_CLASS_COLORS: Record<number, string> = {};

const DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	timeZone: "UTC",
});

export function fmtDate(d: Date): string {
	return DATE_FORMATTER.format(d);
}

export function fmtDateFromUnknown(value: string | number | Date): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "--/--/----";
	return fmtDate(date);
}

export function normalizeName(value: string) {
	return value.toLowerCase().trim();
}
