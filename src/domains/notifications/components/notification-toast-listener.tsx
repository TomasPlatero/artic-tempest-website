"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useApiQuery } from "@/shared/hooks/use-api-query";

async function doFetchNotificationSummary(): Promise<{
	success: boolean;
	data?: {
		notifications?: Array<{ isRead?: boolean; title?: string }>;
		recruitmentCount?: number;
	};
}> {
	try {
		const summaryRes = await fetch("/api/notifications/summary");
		if (!summaryRes.ok) {
			return { success: false };
		}
		const summary = await summaryRes.json();
		return { success: true, data: summary };
	} catch (err) {
		console.error("Failed to check notifications for toast:", err);
		return { success: false };
	}
}

export function NotificationToastListener() {
	const { status } = useSession();
	const router = useRouter();
	const lastNotifiedCountRef = React.useRef<number | null>(null);
	const inFlightRef = React.useRef<Promise<void> | null>(null);
	const lastFetchAtRef = React.useRef<number>(0);
	const guildInfoRef = React.useRef<{
		name: string;
		icon_url: string | null;
	} | null>(null);

	const { data: guildInfo } = useApiQuery<{
		name: string;
		icon_url: string | null;
	}>(status === "authenticated" ? "/api/guild/info" : null, {
		revalidateIfStale: false,
		refreshInterval: 5 * 60 * 1000,
	});

	React.useEffect(() => {
		guildInfoRef.current = guildInfo ?? null;
	}, [guildInfo]);

	const sendNativeNotification = (
		title: string,
		body: string,
		icon?: string | null,
	) => {
		if ("Notification" in window && Notification.permission === "granted") {
			new Notification(title, {
				body,
				icon: icon || "/favicon.ico",
			});
		}
	};

	const checkNotifications = async (isInitial = false) => {
		const now = Date.now();
		const minInterval =
			process.env.NODE_ENV === "development" ? 5 * 60 * 1000 : 120_000;
		if (inFlightRef.current) return inFlightRef.current;
		if (!isInitial && now - lastFetchAtRef.current < minInterval) return;

		const run = (async () => {
			lastFetchAtRef.current = now;
			const result = await doFetchNotificationSummary();
			inFlightRef.current = null;

			if (!result.success || !result.data) return;

			const summary = result.data;
			const data = summary.notifications || [];
			const appCount = summary.recruitmentCount || 0;

			if (Array.isArray(data)) {
				const unread = data.filter((n: any) => !n.isRead).length;
				const latest = data.find((n: any) => !n.isRead);
				const lastCount = lastNotifiedCountRef.current;

				// Update native App Icon Badge using the badging API
				const totalBadgeCount = unread + appCount;
				if ("setAppBadge" in navigator) {
					if (totalBadgeCount > 0) {
						(navigator as any)
							.setAppBadge(totalBadgeCount)
							.catch(console.error);
					} else {
						(navigator as any).clearAppBadge().catch(console.error);
					}
				}

				// On initial check (login), if there are unread notifications
				if (isInitial || lastCount === null) {
					if (unread > 0) {
						toast("Notificaciones pendientes", {
							id: "pending-notifications",
							description: `Tienes ${unread} mensaje${unread > 1 ? "s" : ""} nuevo${unread > 1 ? "s" : ""} en tu bandeja.`,
							action: {
								label: "Ver bandeja",
								onClick: () => router.push("/notificaciones"),
							},
						});
					}
					lastNotifiedCountRef.current = unread;
				}
				// On subsequent checks, if new notifications arrived
				else if (unread > lastCount) {
					const title = latest?.title || "Nueva notificación";
					const message =
						"Acabas de recibir un mensaje oficial, revisa tus notificaciones.";

					toast(title, {
						description: message,
						action: {
							label: "Ver ahora",
							onClick: () => router.push("/notificaciones"),
						},
					});

					sendNativeNotification(
						`${guildInfoRef.current?.name || "Artic Tempest"}: ${title}`,
						message,
						guildInfoRef.current?.icon_url,
					);

					lastNotifiedCountRef.current = unread;
				} else {
					lastNotifiedCountRef.current = unread;
				}
			}
		})();

		inFlightRef.current = run;
		return run;
	};

	const checkNotificationsRef = React.useRef(checkNotifications);

	React.useEffect(() => {
		checkNotificationsRef.current = checkNotifications;
	});

	React.useEffect(() => {
		if (status !== "authenticated") return;

		void checkNotificationsRef.current(true);

		const shouldPoll = process.env.NODE_ENV === "production";
		let pollTimer: ReturnType<typeof setInterval> | undefined;

		if (shouldPoll) {
			pollTimer = setInterval(() => {
				void checkNotificationsRef.current();
			}, 30_000);
		}

		const refreshOnFocus = () => {
			void checkNotificationsRef.current();
		};

		const refreshOnVisible = () => {
			if (document.visibilityState === "visible") {
				void checkNotificationsRef.current();
			}
		};

		window.addEventListener("focus", refreshOnFocus);
		document.addEventListener("visibilitychange", refreshOnVisible);

		return () => {
			if (pollTimer !== undefined) clearInterval(pollTimer);
			window.removeEventListener("focus", refreshOnFocus);
			document.removeEventListener("visibilitychange", refreshOnVisible);
		};
	}, [status]);

	return null;
}
