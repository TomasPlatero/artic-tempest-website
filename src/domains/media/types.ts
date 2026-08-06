// --- Media Library Domain Types ---

export type MediaFolder = {
	id: string;
	bucket_name: string;
	display_name: string;
	description: string;
	sort_order: number;
	is_system: boolean;
	file_count: number;
	created_at: string;
	updated_at: string;
};

export type MediaSubfolder = {
	name: string;
	key: string; // full path prefix, e.g. "icons/" or "brand/welcome/"
};

export type MediaFile = {
	id: string;
	bucket: string;
	storage_path: string;
	title: string;
	alt_text: string;
	caption: string;
	description: string;
	file_size: number;
	mime_type: string;
	dimensions: string;
	url: string;
	uploaded_by: string | null;
	created_at: string;
	updated_at: string;
};

export type MediaPermissions = {
	canView: boolean;
	canEdit: boolean;
	canManage: boolean;
};

export type MediaPickerProps = {
	bucket: string;
	allowedTypes?: string[];
	onSelect: (file: MediaFile) => void;
	onClose: () => void;
	open: boolean;
	title?: string;
	showUpload?: boolean;
	multiSelect?: boolean;
};

export type MediaLibraryClientProps = {
	folders: MediaFolder[];
	folderCounts: Record<string, number>;
	permissions: MediaPermissions;
};

export type ListMediaResponse = {
	files: MediaFile[];
	subfolders: MediaSubfolder[];
	nextCursor: string | null;
	total?: number;
};
