"use client";

import { useRef } from "react";
import useSWRInfinite from "swr/infinite";
import type { MediaFile, MediaSubfolder } from "@/domains/media/types";

export interface UseMediaFilesOptions {
	bucket: string;
	type?: "image" | "document" | "all";
	search?: string;
	limit?: number;
	prefix?: string;
}

export interface UseMediaFilesResult {
	files: MediaFile[];
	subfolders: MediaSubfolder[];
	isLoading: boolean;
	error: string | null;
	hasMore: boolean;
	total: number;
	loadMore: () => Promise<void>;
	refetch: () => void;
}

interface MediaApiResponse {
	files: MediaFile[];
	subfolders: MediaSubfolder[];
	nextCursor: string | null;
	total: number;
}

const fetcher = (url: string): Promise<MediaApiResponse> => {
	// Only allow same-origin relative API paths (SSRF prevention)
	if (!url.startsWith("/api/media")) {
		return Promise.reject(new Error("Invalid URL"));
	}
	// Reject URLs with fragments, credentials, or redirect attempts
	if (/[@#]|\/\//.test(url)) {
		return Promise.reject(new Error("Invalid URL"));
	}
	return fetch(url).then((res) => {
		if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
		return res.json();
	});
};

function buildUrl(
	bucket: string,
	type: string,
	search: string | undefined,
	limit: number,
	prefix: string,
	cursor?: string | null,
): string {
	const params = new URLSearchParams();
	params.set("bucket", bucket);
	if (type !== "all") params.set("type", type);
	if (search) params.set("search", search);
	params.set("limit", String(limit));
	if (prefix) params.set("prefix", prefix);
	if (cursor) params.set("cursor", cursor);
	return `/api/media?${params.toString()}`;
}

function resolveMediaPageKey({
	bucket,
	type,
	search,
	limit,
	prefix,
	pageIndex,
	previousPageData,
}: {
	bucket: string;
	type: string;
	search: string | undefined;
	limit: number;
	prefix: string;
	pageIndex: number;
	previousPageData: MediaApiResponse | null;
}): string | null {
	if (!bucket) return null;
	if (previousPageData && !previousPageData.nextCursor) return null;

	const cursor = pageIndex === 0 ? null : (previousPageData?.nextCursor ?? null);
	return buildUrl(bucket, type, search, limit, prefix, cursor);
}

function flattenMediaPages(pages: MediaApiResponse[] | undefined): {
	files: MediaFile[];
	subfolders: MediaSubfolder[];
	total: number;
	hasMore: boolean;
} {
	const files: MediaFile[] = [];
	const subfolders: MediaSubfolder[] = [];
	let total = 0;
	let hasMore = false;

	for (const page of pages ?? []) {
		if (page.files) files.push(...page.files);
		if (page.subfolders) subfolders.push(...page.subfolders);
		if (page.total) total = page.total;
		hasMore = page.nextCursor != null;
	}

	return { files, subfolders, total, hasMore };
}

function resolveMediaErrorMessage(error: unknown): string | null {
	if (!error) return null;
	return error instanceof Error ? error.message : "Error al cargar archivos";
}

/**
 * Hook to fetch media files and subfolders with cursor-based pagination via SWR.
 */
export function useMediaFiles(
	options: UseMediaFilesOptions,
): UseMediaFilesResult {
	const { bucket, type = "all", search, limit = 50, prefix = "" } = options;

	const getKey = (
		pageIndex: number,
		previousPageData: MediaApiResponse | null,
	) =>
		resolveMediaPageKey({
			bucket,
			type,
			search,
			limit,
			prefix,
			pageIndex,
			previousPageData,
		});

	const { data, error, size, setSize, isValidating, mutate } =
		useSWRInfinite<MediaApiResponse>(getKey, fetcher, {
			revalidateFirstPage: false,
			revalidateOnFocus: false,
			keepPreviousData: true,
		});

	const loadingRef = useRef(false);

	const {
		files,
		subfolders: subfoldersList,
		total,
		hasMore,
	} = flattenMediaPages(data);

	const isLoading = !data && !error;

	const loadMore = async () => {
		if (loadingRef.current || !hasMore || isValidating) return;
		loadingRef.current = true;
		await setSize(size + 1).finally(() => {
			loadingRef.current = false;
		});
	};

	const refetch = () => {
		void mutate();
	};

	return {
		files,
		subfolders: subfoldersList,
		isLoading,
		error: resolveMediaErrorMessage(error),
		hasMore,
		total,
		loadMore,
		refetch,
	};
}
