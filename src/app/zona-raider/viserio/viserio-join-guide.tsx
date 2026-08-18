"use client";

import Image from "next/image";
import { useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/ui/accordion";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { IconEye } from "@/shared/ui/tabler-icons";
import type {
	ViserioGuideImage,
	ViserioGuideStep,
} from "./viserio-join-guide-data";

function GuideImage({
	image,
	onOpen,
}: {
	image: ViserioGuideImage;
	onOpen: (image: ViserioGuideImage) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onOpen(image)}
			className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950/40 text-left transition-colors hover:border-blue-500/40 focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:outline-none"
			aria-label={`Ampliar captura: ${image.alt}`}
		>
			<Image
				src={image.src}
				alt={image.alt}
				width={640}
				height={360}
				className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
			/>
			<span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-lg bg-zinc-950/70 px-2 py-1 text-[10px] font-semibold text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
				<IconEye className="size-3" />
				Ampliar
			</span>
		</button>
	);
}

export function ViserioJoinGuide({ steps }: { steps: ViserioGuideStep[] }) {
	const [activeImage, setActiveImage] = useState<ViserioGuideImage | null>(
		null,
	);

	return (
		<>
			<Accordion
				type="single"
				collapsible
				className="rounded-[1.5rem] border border-white/10 bg-zinc-950/20 px-5"
			>
				{steps.map((step) => (
					<AccordionItem
						key={step.id}
						value={step.id}
						className="border-white/10"
					>
						<AccordionTrigger className="hover:no-underline py-3 text-white text-[12px] md:text-sm font-semibold uppercase tracking-tight leading-relaxed">
							{step.title}
						</AccordionTrigger>
						<AccordionContent className="pt-0 pb-4 text-sm leading-relaxed text-white/60">
							<div className="space-y-3">
								<p>{step.description}</p>
								{step.images && step.images.length > 0 && (
									<div className="grid gap-3 sm:grid-cols-2">
										{step.images.map((image) => (
											<GuideImage
												key={image.src}
												image={image}
												onOpen={setActiveImage}
											/>
										))}
									</div>
								)}
							</div>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>

			<Dialog
				open={activeImage !== null}
				onOpenChange={(open) => {
					if (!open) setActiveImage(null);
				}}
			>
				<DialogContent className="max-w-4xl bg-zinc-950 p-2 sm:p-4">
					{activeImage && (
						<>
							<DialogHeader className="px-2 pt-2">
								<DialogTitle className="text-white">
									{activeImage.alt}
								</DialogTitle>
								<DialogDescription className="text-white/50">
									Haz clic fuera o pulsa X para cerrar.
								</DialogDescription>
							</DialogHeader>
							<Image
								src={activeImage.src}
								alt={activeImage.alt}
								width={1600}
								height={900}
								className="h-auto w-full rounded-xl"
							/>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
