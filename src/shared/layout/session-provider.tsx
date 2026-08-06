"use client";

import dynamic from "next/dynamic";
import { Session } from "next-auth";

const NextAuthSessionProvider = dynamic(
	() => import("next-auth/react").then((m) => m.SessionProvider),
	{ ssr: false },
);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={0}
      refetchWhenOffline={false}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
