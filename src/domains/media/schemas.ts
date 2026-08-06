import { z } from "zod";

// --- Folders ---

export const CreateFolderSchema = z.object({
	display_name: z.string().min(1, "El nombre es obligatorio").max(100),
	description: z.string().max(500).default(""),
});

export const UpdateFolderSchema = z.object({
	display_name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	sort_order: z.number().int().min(0).optional(),
	is_system: z.boolean().optional(),
});

// --- Upload ---

export const SignedUploadSchema = z.object({
	fileName: z.string().min(1),
	mimeType: z.string().min(1),
	fileSize: z.number().int().positive(),
	bucket: z.string().min(1),
});

// --- Metadata ---

export const UpdateMetadataSchema = z.object({
	title: z.string().max(255).optional(),
	alt_text: z.string().max(500).optional(),
	caption: z.string().max(1000).optional(),
	description: z.string().max(2000).optional(),
});

// --- Rename ---

export const RenameFileSchema = z.object({
	newName: z.string().min(1).max(255),
});

// --- List query ---

export const ListMediaQuerySchema = z.object({
	bucket: z.string().min(1),
	type: z.enum(["image", "document", "all"]).default("all"),
	search: z.string().max(200).optional(),
	cursor: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	prefix: z.string().default(""),
});

// --- Bulk delete ---

export const BulkDeleteQuerySchema = z.object({
	ids: z.string().min(1), // comma-separated UUIDs, validated in handler
});

// --- Upload confirm ---

export const ConfirmUploadSchema = z.object({
	bucket: z.string().min(1, "Falta la carpeta"),
	storage_path: z.string().min(1, "Falta la ruta del archivo"),
	file_size: z.number().int().min(0).default(0),
	mime_type: z.string().default(""),
	title: z.string().max(255).optional(),
	alt_text: z.string().max(500).optional(),
	dimensions: z.string().optional(),
});
