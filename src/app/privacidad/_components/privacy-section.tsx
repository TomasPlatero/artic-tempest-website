"use client";

interface SectionProps {
	id: string;
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

export function PrivacidadSection({
	id,
	title,
	icon,
	children,
	className = "",
}: SectionProps) {
	return (
		<section
			className={`bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8 ${className}`}
			aria-labelledby={id}
		>
			<div className="flex items-center gap-4 border-b border-white/5 pb-6">
				<div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
					{icon}
				</div>
				<h2
					id={id}
					className="text-2xl font-semibold text-white uppercase tracking-tight m-0"
				>
					{title}
				</h2>
			</div>
			{children}
		</section>
	);
}
