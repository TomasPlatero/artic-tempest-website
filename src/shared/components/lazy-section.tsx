"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

type LazySectionProps = {
	children: ReactNode;
	rootMargin?: string;
	placeholder?: ReactNode;
	className?: string;
	id?: string;
};

export function LazySection({
	children,
	rootMargin = "300px",
	placeholder,
	className,
	id,
}: LazySectionProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [rootMargin]);

	// Always render the same wrapper div — never swap tree roots.
	// The observer ref and id stay stable, preventing a full mount/unmount
	// cycle that can trigger browser navigation (Edge desktop pull-to-refresh).
	return (
		<div ref={ref} id={id} className={className}>
			{visible
				? children
				: (placeholder ?? (
						<div className="min-h-[300px] animate-pulse rounded-3xl bg-white/[0.03]" />
					))}
		</div>
	);
}
