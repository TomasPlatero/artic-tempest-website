"use client";

import React from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
	IconCopy,
	IconEdit,
	IconEye,
	IconEyeOff,
	IconFolderPlus,
	IconGripVertical,
	IconLinkPlus,
	IconTrash,
	IconChevronDown,
	IconChevronRight,
} from "@/shared/ui/tabler-icons";
import { getIconByName } from "@/shared/lib/icon-utils";

const DEPTH_COLORS = [
	"border-l-transparent",
	"border-l-blue-500/30",
	"border-l-amber-500/30",
];
const DEPTH_BG = ["", "bg-blue-500/[0.02]", "bg-amber-500/[0.02]"];

type ArboristNode = {
	id: string;
	name: string;
	url?: string | null;
	icon_name?: string;
	order_index?: number;
	parent_id?: string | null;
	app_id?: string | null;
	css_class?: string | null;
	element_id?: string | null;
	visibility?: string | null;
	description?: string | null;
	roles?: string[];
	is_active?: boolean;
	children?: ArboristNode[];
};

export function ArboristNodeRenderer({
	node,
	style,
	dragHandle,
	depth,
	onEdit,
	onDelete,
	onDuplicate,
	onToggleActive,
	onAddChild,
	onAddCategory,
}: {
	node: any;
	style: React.CSSProperties;
	dragHandle: any;
	depth?: number;
	onEdit: (item: any) => void;
	onDelete: (id: string) => void;
	onDuplicate: (item: any) => void;
	onToggleActive: (item: any) => void;
	onAddChild: (parentId: string) => void;
	onAddCategory: (parentId: string) => void;
}) {
	const item = node.data as ArboristNode;
	const isCategory = !item.url;
	const isExpanded = node.isOpen;
	const hasChildren = node.children && node.children.length > 0;
	const itemDepth = depth ?? node.level ?? 0;
	const isActive = item.is_active !== false;
	const Icon = getIconByName(item.icon_name);

	return (
		<div
			style={style}
			ref={dragHandle}
			className={cn(
				"flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors group border-l-2",
				DEPTH_COLORS[Math.min(itemDepth, 2)],
				DEPTH_BG[Math.min(itemDepth, 2)],
			)}
		>
			<div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 text-white/20 hover:text-white/50 transition-colors shrink-0">
				<IconGripVertical className="size-4" />
			</div>

			{itemDepth > 0 && <div className="w-2 shrink-0" />}

			{isCategory && (
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						if (isExpanded) {
							node.close();
						} else {
							node.open();
						}
					}}
					aria-label={isExpanded ? "Contraer" : "Expandir"}
					className="p-1 rounded hover:bg-white/10 text-white/30 transition-colors shrink-0"
				>
					{isExpanded ? (
						<IconChevronDown className="size-4" />
					) : (
						<IconChevronRight className="size-4" />
					)}
				</button>
			)}
			{!isCategory && <div className="w-6 shrink-0" />}

			<div
				className={cn(
					"p-1.5 rounded-md shrink-0",
					itemDepth === 0
						? isCategory
							? "bg-blue-500/10"
							: "bg-white/5"
						: itemDepth === 1
							? "bg-blue-500/10"
							: "bg-amber-500/10",
				)}
			>
				{Icon &&
					React.createElement(Icon, {
						className: cn(
							"size-4",
							itemDepth === 0
								? isCategory
									? "text-blue-400"
									: "text-white/50"
								: itemDepth === 1
									? "text-blue-400"
									: "text-amber-400",
						),
					})}
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"text-sm font-medium truncate",
							!isActive && "text-white/30 line-through",
						)}
					>
						{item.name}
					</span>
					{itemDepth === 0 && isCategory && (
						<Badge
							variant="outline"
							className="text-[9px] px-1.5 h-4 text-white/40"
						>
							L1
						</Badge>
					)}
					{itemDepth === 1 && (
						<Badge
							variant="outline"
							className="text-[9px] px-1.5 h-4 border-blue-500/30 text-blue-400"
						>
							L2
						</Badge>
					)}
					{itemDepth >= 2 && (
						<Badge
							variant="outline"
							className="text-[9px] px-1.5 h-4 border-amber-500/30 text-amber-400"
						>
							L3
						</Badge>
					)}
					{isCategory && hasChildren && (
						<Badge
							variant="outline"
							className="text-[9px] px-1.5 h-4 text-white/40"
						>
							{node.children?.length || 0}
						</Badge>
					)}
				</div>
				{item.url && (
					<p className="text-xs text-white/30 truncate font-mono">{item.url}</p>
				)}
			</div>

			<button
				type="button"
				onClick={() => onToggleActive(item)}
				className="p-1.5 rounded-md hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
				title={isActive ? "Desactivar" : "Activar"}
			>
				{isActive ? (
					<IconEye className="size-4" />
				) : (
					<IconEyeOff className="size-4" />
				)}
			</button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Abrir menú de opciones"
						className="size-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<IconEdit className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[200px]">
					<DropdownMenuItem onClick={() => onEdit(item)}>
						<IconEdit className="size-4 mr-2" /> Editar
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onDuplicate(item)}>
						<IconCopy className="size-4 mr-2" /> Duplicar
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => onAddChild(item.id)}>
						<IconLinkPlus className="size-4 mr-2 text-emerald-500" /> Añadir
						enlace hijo
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onAddCategory(item.id)}>
						<IconFolderPlus className="size-4 mr-2 text-blue-500" /> Añadir
						subcategoría
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => onDelete(item.id)}
						className="text-red-500 focus:text-red-500"
					>
						<IconTrash className="size-4 mr-2" /> Eliminar
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
