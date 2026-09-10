"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

import {
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronUp,
	IconPhoto,
	IconPlayerPlay,
} from "@/shared/ui/tabler-icons";
import { IconSpeakerphone } from "@tabler/icons-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import type {
	DiscordChannelMessage,
	DiscordPoll,
} from "@/shared/discord/channel-messages";
import {
	ZONA_RAIDER_SURFACE,
	ZONA_RAIDER_SURFACE_INSET,
} from "./zona-raider.utils";

type DiscordFeedCardProps = {
	messages: DiscordChannelMessage[];
	guildId: string | null;
	channelId: string;
};

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

// Discord treats a single newline as a line break. Markdown needs two trailing
// spaces for a hard break, so add them before parsing. Safe: inside code
// blocks it only appends invisible trailing whitespace to lines.
function toDiscordBreaks(content: string): string {
	return content.replace(/\r\n/g, "\n").replace(/\n/g, "  \n");
}

// Converts plain @mentions to pill-style markdown links.
// Role-colored mentions arrive via [[r|...]] and are handled separately.
function convertAtMentions(content: string): string {
	return content.replace(
		/@(everyone|here|Trial|Raider|Officer|GM|Invitado|Miembro|Artic\s+Raid[ea]rs?|trial|raider|officer|gm|invitado|miembro|artic\s+raid[ea]rs?)\b/gi,
		(_m, name: string) => `[@${name}](#mention:${name})`,
	);
}

// Converts [[r|color|name]] or [[r|name]] (no color) role markers to markdown links.
// The custom <a> component intercepts "role:" links and renders colored spans.
function convertRoleMentions(content: string): string {
	return content.replace(/\[\[r\|([^\]]*)\]\]/g, (_m, inner) => {
		const sep = inner.indexOf("|");
		const color = sep > 0 ? inner.slice(0, sep) : "";
		const name = sep > 0 ? inner.slice(sep + 1) : inner;
		return `[${name}](#role:${encodeURIComponent(color)})`;
	});
}

const DISCORD_MARKDOWN_COMPONENTS: Components = {
	p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
	a: ({ href, children, ...props }) => {
		if (typeof href === "string" && href.startsWith("#mention:")) {
			const name = href.slice(9);
			return (
				<span className="mr-0.5 inline-flex items-center rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[0.85em] font-semibold text-indigo-300">
					@{name}
				</span>
			);
		}
		if (typeof href === "string" && href.startsWith("#role:")) {
			const color = (() => {
				try {
					return decodeURIComponent(href.slice(6));
				} catch {
					return "";
				}
			})();
			return (
				<span
					className="mr-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.85em] font-semibold"
					style={color ? { backgroundColor: `${color}20`, color } : undefined}
				>
					@{children}
				</span>
			);
		}
		return (
			<a
				href={href}
				{...props}
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-300"
			>
				{children}
			</a>
		);
	},
	strong: ({ children }) => (
		<strong className="font-semibold text-white">{children}</strong>
	),
	em: ({ children }) => <em>{children}</em>,
	del: ({ children }) => <del className="text-muted-foreground">{children}</del>,
	code: ({ className, children }) =>
		className ? (
			<code className="font-mono text-[0.9em]">{children}</code>
		) : (
			<code className="rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono text-[0.85em] text-orange-300">
				{children}
			</code>
		),
	pre: ({ children }) => (
		<pre className="my-2 overflow-x-auto rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
			{children}
		</pre>
	),
	blockquote: ({ children }) => (
		<blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
			{children}
		</blockquote>
	),
	h1: ({ children }) => (
		<h1 className="my-2 text-base font-bold text-white">{children}</h1>
	),
	h2: ({ children }) => (
		<h2 className="my-2 text-sm font-bold text-white">{children}</h2>
	),
	h3: ({ children }) => (
		<h3 className="my-2 text-sm font-semibold text-white">{children}</h3>
	),
	ul: ({ children }) => (
		<ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>
	),
	ol: ({ children }) => (
		<ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>
	),
	li: ({ children }) => <li>{children}</li>,
	hr: () => <hr className="my-3 border-border/60" />,
	table: ({ children }) => (
		<div className="my-2 overflow-x-auto rounded-xl border border-border/60">
			<table className="w-full text-sm">{children}</table>
		</div>
	),
	thead: ({ children }) => (
		<thead className="border-b border-border/60">{children}</thead>
	),
	th: ({ children }) => (
		<th className="px-3 py-2 text-left font-semibold text-white">{children}</th>
	),
	td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
	input: ({ node: _node, ...props }) => (
		<input {...props} className="mr-1.5 size-3.5 accent-indigo-500" />
	),
	img: ({ alt, src }) => {
		const href = typeof src === "string" ? src : "";
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-300"
			>
				{alt || href}
			</a>
		);
	},
};

function DiscordMarkdown({ content }: { content: string }) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={DISCORD_MARKDOWN_COMPONENTS}
		>
			{content}
		</ReactMarkdown>
	);
}

// Renders Discord content with markdown styling. Role mentions are converted
// to inline markdown links intercepted by the custom <a> component.
function DiscordContent({ content }: { content: string }) {
	const withBreaks = toDiscordBreaks(content);
	const withAtMentions = convertAtMentions(withBreaks);
	const withRoles = convertRoleMentions(withAtMentions);
	return <DiscordMarkdownContent content={withRoles} />;
}

// Renders markdown content with spoiler handling (||spoiler|| -> blur).
function DiscordMarkdownContent({ content }: { content: string }) {
	const withBreaks = toDiscordBreaks(content);
	const segments = withBreaks.split(/(\|\|.*?\|\|)/g).filter(Boolean);

	if (segments.length <= 1) {
		return <DiscordMarkdown content={withBreaks} />;
	}

	return (
		<>
			{segments.map((segment) => {
				if (segment.startsWith("||") && segment.endsWith("||")) {
					return (
						<span
							key={segment}
							title="Spoiler"
							className="cursor-pointer select-none rounded bg-foreground/20 blur-[3px] transition hover:blur-none"
						>
							<DiscordMarkdown content={segment.slice(2, -2)} />
						</span>
					);
				}
				return <DiscordMarkdown key={segment} content={segment} />;
			})}
		</>
	);
}

// ===========================================================================
// DiscordPollCard — renders a Discord poll inline.
// ===========================================================================
function DiscordPollCard({ poll }: { poll: DiscordPoll }) {
	const maxVotes = Math.max(...poll.answers.map((a) => a.voteCount), 1);

	return (
		<div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
			{/* Question */}
			<p className="text-sm font-semibold text-white">{poll.question}</p>

			{/* Answers */}
			<div className="mt-3 flex flex-col gap-2">
				{poll.answers.map((answer) => {
					const pct =
						poll.totalVotes > 0
							? Math.round((answer.voteCount / poll.totalVotes) * 100)
							: 0;
					return (
						<div
							key={answer.answerId}
							className="relative overflow-hidden rounded-lg border border-border/60 bg-background/40"
						>
							{/* Progress bar background */}
							<div
								className="absolute inset-0 bg-indigo-500/15 transition-all duration-500"
								style={{ width: `${(answer.voteCount / maxVotes) * 100}%` }}
							/>
							{/* Content */}
							<div className="relative flex items-center justify-between px-3 py-2.5">
								<span className="text-sm text-white/90">{answer.text}</span>
								<span className="ml-2 shrink-0 text-xs font-semibold tabular-nums text-white/60">
									{answer.voteCount}
									<span className="ml-0.5 text-white/40">({pct}%)</span>
								</span>
							</div>
						</div>
					);
				})}
			</div>

			{/* Footer */}
			<p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
				{poll.totalVotes} {poll.totalVotes === 1 ? "voto" : "votos"} totales
				{poll.isFinalized && (
					<span className="ml-2 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-400">
						Finalizada
					</span>
				)}
				{poll.allowMultiselect && (
					<span className="ml-2 text-white/30">· Multiple choice</span>
				)}
			</p>
		</div>
	);
}

// ===========================================================================
// DiscordMessageRow — one message, expandable to reveal the full content.
// ===========================================================================
function isImageAttachment(att: DiscordChannelMessage["attachments"][number]) {
	return (
		Boolean(att.contentType?.startsWith("image/")) ||
		/[.](png|jpe?g|gif|webp)([?]|$)/i.test(att.url)
	);
}

function resolveMessageMedia(
	message: DiscordChannelMessage,
	isOverflowing: boolean,
	expanded: boolean,
) {
	const imageAttachments = message.attachments.filter(isImageAttachment);
	const hasMedia = message.youtubeId !== null || imageAttachments.length > 0;
	return {
		imageAttachments,
		showToggle: isOverflowing || hasMedia,
		showCollapsedChip: !expanded && hasMedia,
		showExpandedMedia: expanded && hasMedia,
	};
}

function resolveContentClassName(expanded: boolean) {
	return `mt-1 break-words text-sm text-white ${expanded ? "" : "line-clamp-1"}`;
}

function ExpandToggleLabel({ expanded }: { expanded: boolean }) {
	if (expanded) {
		return (
			<>
				<IconChevronUp className="size-3.5" />
				Ver menos
			</>
		);
	}
	return (
		<>
			<IconChevronDown className="size-3.5" />
			Ver más
		</>
	);
}

function DiscordMessageRow({ message }: { message: DiscordChannelMessage }) {
	const [expanded, setExpanded] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const contentRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (expanded) return;
		const el = contentRef.current;
		setIsOverflowing(Boolean(el && el.scrollHeight > el.clientHeight + 1));
	}, [message.content, expanded]);

	const { imageAttachments, showToggle, showCollapsedChip, showExpandedMedia } =
		resolveMessageMedia(message, isOverflowing, expanded);

	return (
		<div className={`${ZONA_RAIDER_SURFACE_INSET} p-4`}>
			<div className="flex items-start gap-3">
				{/* Avatar */}
				{message.author.avatarUrl ? (
					<Image
						src={message.author.avatarUrl}
						alt={message.author.displayName}
						width={40}
						height={40}
						className="rounded-full object-cover"
					/>
				) : (
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
						{message.author.displayName.charAt(0)}
					</div>
				)}

				<div className="min-w-0 flex-1">
					{/* Author + time */}
					<div className="flex items-center justify-between gap-2">
						<p
							className="truncate text-sm font-semibold text-white"
							style={{ color: message.author.roleColor ?? undefined }}
						>
							{message.author.displayName}
						</p>
						<span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
							{message.formattedTime}
						</span>
					</div>

					{/* Content */}
					{message.content && (
						<div ref={contentRef} className={resolveContentClassName(expanded)}>
							<DiscordContent content={message.content} />
						</div>
					)}

					{/* Poll */}
					{message.poll && <DiscordPollCard poll={message.poll} />}

					{/* Media preview: label chip while collapsed */}
					{showCollapsedChip && (
						<div className="mt-2 flex flex-wrap items-center gap-1.5">
							{imageAttachments.length > 0 && (
								<span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
									<IconPhoto className="size-3.5" aria-hidden="true" />
									Imagen
								</span>
							)}
							{message.youtubeId && (
								<span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
									<IconPlayerPlay className="size-3.5" aria-hidden="true" />
									Vídeo
								</span>
							)}
						</div>
					)}

					{/* Expand toggle */}
					{showToggle && (
						<button
							type="button"
							onClick={() => setExpanded((prev) => !prev)}
							className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-white"
						>
							<ExpandToggleLabel expanded={expanded} />
						</button>
					)}

					{/* Media: shown inside "Ver más" */}
					{showExpandedMedia && (
						<div className="mt-3 flex flex-wrap items-start gap-2">
							{message.youtubeId && (
								<div className="overflow-hidden rounded-lg border border-border/60 bg-black">
									<iframe
										src={`https://www.youtube-nocookie.com/embed/${message.youtubeId}`}
										title="Vídeo de YouTube adjunto"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
										allowFullScreen
										className="aspect-video w-56 sm:w-64"
									/>
								</div>
							)}
							{imageAttachments.map((att) => (
								<a
									key={att.id}
									href={att.url}
									target="_blank"
									rel="noopener noreferrer"
									title="Ver imagen completa"
									className="overflow-hidden rounded-lg border border-border/60 bg-background/40 transition-opacity hover:opacity-80"
								>
									<Image
										src={att.url}
										alt="Imagen adjunta al anuncio"
										width={96}
										height={96}
										className="size-20 object-cover"
										unoptimized={
											att.contentType === "image/gif" || /[.]gif([?]|$)/i.test(att.url)
										}
									/>
								</a>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ===========================================================================
// DiscordFeedCard — announcements card for Zona Raider.
// ===========================================================================
export function DiscordFeedCard({
	messages,
	guildId: _guildId,
	channelId: _channelId,
}: DiscordFeedCardProps) {
	const [page, setPage] = useState(0);
	const pageSize = 5;
	const totalPages = Math.max(1, Math.ceil(messages.length / pageSize));
	const safePage = Math.min(page, totalPages - 1);
	const pageMessages = messages.slice(
		safePage * pageSize,
		safePage * pageSize + pageSize,
	);

	return (
		<Card className={`${ZONA_RAIDER_SURFACE} p-5`}>
			<div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-60" />
			<div className="relative flex h-full flex-col gap-4">
				{/* Header */}
				<div className="flex items-center gap-3 py-4">
					<IconSpeakerphone className="size-7 text-indigo-400" />
					<h1 className="text-2xl font-bold italic uppercase tracking-tighter text-white sm:text-3xl">
						Anuncios de la hermandad
					</h1>
				</div>

				{/* Body */}
				{messages.length === 0 ? (
					<div className="rounded-2xl border border-border/60 bg-background/40 p-4">
						<p className="text-sm font-bold text-white/80">
							No hay anuncios recientes.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{pageMessages.map((msg) => (
							<DiscordMessageRow key={msg.id} message={msg} />
						))}
					</div>
				)}

				{/* Pagination */}
				{messages.length > pageSize && (
					<div className="flex items-center justify-between gap-4 px-1 pb-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setPage((p) => Math.max(0, p - 1))}
							disabled={safePage === 0}
							className="gap-1"
						>
							<IconChevronLeft className="size-4" />
							Anteriores
						</Button>
						<span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
							{safePage * pageSize + 1}–
							{Math.min((safePage + 1) * pageSize, messages.length)} de{" "}
							{messages.length}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
							disabled={safePage >= totalPages - 1}
							className="gap-1"
						>
							Siguientes
							<IconChevronRight className="size-4" />
						</Button>
					</div>
				)}
			</div>
		</Card>
	);
}
