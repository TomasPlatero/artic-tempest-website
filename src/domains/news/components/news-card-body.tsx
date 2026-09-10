import { CharacterAvatar } from "@/shared/components/character-avatar";
import { IconArrowRight } from "@/shared/ui/tabler-icons";

interface NewsCardBodyProps {
	category: string;
	formattedDate: string;
	title: string;
	author: string;
}

export function NewsCardBody({
	category,
	formattedDate,
	title,
	author,
}: NewsCardBodyProps) {
	return (
		<div className="p-6 flex flex-col flex-1">
			<div className="flex items-center justify-between mb-4">
				<span className="text-blue-300 text-[9px] font-semibold uppercase tracking-[0.2em]">
					{category}
				</span>
				<span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
					{formattedDate}
				</span>
			</div>
			<h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors motion-reduce:transition-none line-clamp-2 leading-relaxed">
				{title}
			</h3>
			<div className="mt-auto pt-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<CharacterAvatar
						name={author}
						size={24}
						className="border-border/50 shadow-inner"
					/>
					<span className="text-[10px] font-bold text-zinc-300">
						{author}
					</span>
				</div>
				<IconArrowRight className="size-4 text-zinc-700 group-hover:text-blue-400 group-hover:translate-x-1  motion-reduce:transition-none" />
			</div>
		</div>
	);
}
