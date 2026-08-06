"use client";

import nextDynamic from "next/dynamic";
import type { PageProps } from "./season-roster.types";

const SeasonRosterClientInner = nextDynamic(
	() => import("./season-roster-client").then((m) => m.SeasonRosterClient),
	{ ssr: false },
);

export function SeasonRosterClient(props: PageProps) {
	return <SeasonRosterClientInner {...props} />;
}
