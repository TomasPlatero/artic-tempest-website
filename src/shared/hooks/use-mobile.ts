import * as React from "react";

const MOBILE_BREAKPOINT = 1440;

function getIsMobile() {
	if (typeof window === "undefined") return false;
	return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile(): boolean {
	return React.useSyncExternalStore(
		(onStoreChange) => {
			if (typeof window === "undefined") return () => {};
			const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
			mql.addEventListener("change", onStoreChange);
			return () => mql.removeEventListener("change", onStoreChange);
		},
		getIsMobile,
		() => false,
	);
}
