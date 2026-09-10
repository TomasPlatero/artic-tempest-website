import Link from "next/link";
import { IconArrowLeft } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/tailwind/tailwind-utils";

type AdminSectionHeaderProps = {
	title: string;
	description: string;
	backHref: string;
	backLabel?: string;
	/** Layout overrides, so pages that already had their own variant keep it. */
	className?: string;
	titleClassName?: string;
};

const ROW_CLASSES = "flex items-center gap-6";
const TITLE_CLASSES =
	"text-3xl font-semibold font-heading italic tracking-tight";
const DESCRIPTION_CLASSES =
	"text-sm font-medium text-white/40 mt-2 tracking-widest leading-relaxed";
const BACK_BUTTON_CLASSES =
	"size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 shadow-xl";

export function AdminSectionHeader({
	title,
	description,
	backHref,
	backLabel = "Volver",
	className,
	titleClassName,
}: AdminSectionHeaderProps) {
	return (
		<div className={cn(ROW_CLASSES, className)}>
			<Link href={backHref}>
				<Button
					variant="outline"
					size="icon"
					aria-label={backLabel}
					className={BACK_BUTTON_CLASSES}
				>
					<IconArrowLeft className="size-6" />
				</Button>
			</Link>
			<div>
				<h1 className={cn(TITLE_CLASSES, titleClassName)}>{title}</h1>
				<p className={DESCRIPTION_CLASSES}>{description}</p>
			</div>
		</div>
	);
}
