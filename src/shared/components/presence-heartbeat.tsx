"use client";

import { useEffect } from "react";

type Props = {
  userId?: string;
  intervalMs?: number;
};

export function PresenceHeartbeat({ userId, intervalMs = 120000 }: Props) {
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = () => {
      if (document.hidden) return;
      try {
        navigator.sendBeacon("/api/me/presence");
      } catch (error) {
        console.error("[PresenceHeartbeat] ping failed", error);
      }
    };

    ping();
    timer = setInterval(ping, intervalMs);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [userId, intervalMs]);

  return null;
}
