const CLASS_COLORS: Record<number, string> = {
	1: "#C69B6D",
	2: "#F48CBA",
	3: "#AAD372",
	4: "#FFF468",
	5: "#FFFFFF",
	6: "#C41E3A",
	7: "#0070DD",
	8: "#3FC7EB",
	9: "#8788EE",
	10: "#00FF98",
	11: "#FF7C0A",
	12: "#A330C9",
	13: "#33937F",
};

export const ZONA_RAIDER_SURFACE =
	"relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 text-card-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/75 md: md:duration-300 md:ease-out md:will-change-transform md:hover:-translate-y-1 md:hover:scale-[1.01] md:hover:border-border/80 md:hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)] md:hover:bg-card/90";

export const ZONA_RAIDER_SURFACE_INSET =
	"rounded-2xl border border-border/60 bg-background/40 text-card-foreground shadow-none md: md:duration-300 md:ease-out md:will-change-transform md:hover:-translate-y-0.5 md:hover:scale-[1.01] md:hover:border-border/80 md:hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] md:hover:bg-background/60";

export function getClassColor(classId: number) {
	return CLASS_COLORS[classId] || "#A8A29E";
}
