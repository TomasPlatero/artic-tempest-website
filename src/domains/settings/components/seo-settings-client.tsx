"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/shared/ui/tabs";
import type { SeoSettings } from "@/shared/seo/seo-types";
import { SeoSettingsHeader } from "./seo-settings-header";
import { SeoSettingsTabsNav } from "./seo-settings-tabs-nav";
import { SeoSiteTab, SeoAnalyticsTab } from "./seo-settings-tabs";

type SeoSettingsClientProps = {
	initialSettings: SeoSettings;
	canEdit: boolean;
};

async function doSaveSeoSettings(
	settings: SeoSettings,
): Promise<{ success: boolean; error?: string; data?: SeoSettings }> {
	try {
		const res = await fetch("/api/guild/settings/seo", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(settings),
		});

		if (!res.ok) {
			const payload = await res.json().catch(() => null);
			return {
				success: false,
				error: payload?.error || "No se pudo guardar la configuracion SEO",
			};
		}

		const payload = (await res.json()) as { settings?: SeoSettings };
		return { success: true, data: payload.settings };
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Revisa los campos e intentalo de nuevo.",
		};
	}
}

function normalizeSettings(settings: SeoSettings): SeoSettings {
	return {
		...settings,
		verification: {
			...settings.verification,
			custom: settings.verification.custom.map((entry) => ({
				...entry,
				id: entry.id || crypto.randomUUID(),
			})),
		},
	};
}

export function SeoSettingsClient({
	initialSettings,
	canEdit,
}: SeoSettingsClientProps) {
	const [settings, setSettings] = useState<SeoSettings>(() =>
		normalizeSettings(initialSettings),
	);
	const [saving, setSaving] = useState(false);

	const saveSettings = async () => {
		if (!canEdit) return;
		setSaving(true);
		const result = await doSaveSeoSettings(settings);

		if (result.success) {
			if (result.data) setSettings(normalizeSettings(result.data));
			toast.success("SEO guardado", {
				description: "La configuracion SEO se actualizo correctamente.",
			});
		} else {
			toast.error("Error al guardar", {
				description: result.error,
			});
		}

		setSaving(false);
	};

	const updateSettings = (updater: (prev: SeoSettings) => SeoSettings) =>
		setSettings(updater);

	return (
		<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
			<SeoSettingsHeader
				canEdit={canEdit}
				saving={saving}
				onSave={() => void saveSettings()}
			/>

			<Tabs defaultValue="site" className="w-full">
				<SeoSettingsTabsNav />

				<TabsContent value="site" className="mt-6">
					<SeoSiteTab
						settings={settings}
						onChange={updateSettings}
						canEdit={canEdit}
					/>
				</TabsContent>
				<TabsContent value="analytics" className="mt-6">
					<SeoAnalyticsTab
						settings={settings}
						onChange={updateSettings}
						canEdit={canEdit}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
