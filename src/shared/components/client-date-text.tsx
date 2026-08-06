"use client";

import * as React from "react";

type Props = {
	value: string | number | Date;
	options?: Intl.DateTimeFormatOptions;
	locale?: string;
};

export function ClientDateText({ value, options, locale = "es-ES" }: Props) {
	const text = new Date(value).toLocaleString(locale, {
		...options,
		timeZone: "UTC",
	});

	return <span suppressHydrationWarning>{text}</span>;
}
