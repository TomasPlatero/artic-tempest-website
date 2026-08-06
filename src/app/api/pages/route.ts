import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";

export type AppPage = {
	id: string;
	name: string;
	description: string | null;
	path: string;
	icon_name: string | null;
	is_admin: boolean;
	is_active: boolean;
	group_id: string | null;
	priority: number;
};

export async function GET() {
	const { data, error } = await supabaseAdmin
		.from("app_pages")
		.select("*")
		.order("priority", { ascending: true });

	if (error) {
		console.error("[pages] GET error", error);
		return NextResponse.json(
			{ error: "No se pudieron cargar las páginas" },
			{ status: 500 },
		);
	}

	return NextResponse.json(data ?? []);
}

/** Agrupa páginas por group_id */
export function groupPages(pages: AppPage[]) {
	const groups: Record<string, AppPage[]> = {};
	for (const page of pages) {
		const g = page.group_id ?? "other";
		if (!groups[g]) groups[g] = [];
		groups[g].push(page);
	}
	return groups;
}

/** Separa páginas admin del resto */
export function splitAdminPages(pages: AppPage[]) {
	const admin: AppPage[] = [];
	const raider: AppPage[] = [];
	for (const page of pages) {
		if (page.is_admin) admin.push(page);
		else raider.push(page);
	}
	return { admin, raider };
}
