import type React from "react";
import { IconFolderOpen } from "@/shared/ui/tabler-icons";

type EmptyStateProps = {
	message?: string;
	hint?: string;
	children?: React.ReactNode;
};

export function EmptyState({
	message = "Esta carpeta está vacía.",
	hint = "Arrastra archivos aquí para subirlos o usa el botón de subir.",
	children,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center gap-4">
			<div className="size-20 rounded-2xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
				<IconFolderOpen className="size-10 text-white/30" />
			</div>
			<p className="text-lg font-semibold text-white/70">{message}</p>
			<p className="text-sm text-white/40 max-w-md">{hint}</p>
			{children}
		</div>
	);
}
