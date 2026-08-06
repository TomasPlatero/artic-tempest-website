import * as Tabler from "@/shared/ui/tabler-icons";

// ── Mapa de componentes reales (barrel acotado: ~182 iconos) ──
// Solo los iconos que la app usa en código. icon-utils.ts se apoya
// en esto para resolver iconos de menús/configuración sin hacer
// dynamic import.
const isIcon = (val: any) =>
	val && (typeof val === "function" || typeof val === "object");

const barrelIcons = Object.keys(Tabler).filter(
	(key) => key.startsWith("Icon") && isIcon((Tabler as any)[key]),
);

export const ALL_ICONS_MAP: Record<string, any> = Object.fromEntries(
	barrelIcons.map((key) => [key, (Tabler as any)[key]]),
);
