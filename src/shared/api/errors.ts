import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type infer as zInfer } from "zod";

class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public code: string = "API_ERROR",
		public details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

const badRequest = (message: string, code = "BAD_REQUEST", details?: unknown) =>
	new ApiError(400, message, code, details);
export const unauthorized = (
	message = "Unauthorized",
	code = "UNAUTHORIZED",
	details?: unknown,
) => new ApiError(401, message, code, details);
export const forbidden = (
	message = "Forbidden",
	code = "FORBIDDEN",
	details?: unknown,
) => new ApiError(403, message, code, details);
export function apiErrorResponse(
	error: unknown,
	fallbackMessage = "Internal server error",
) {
	if (error instanceof ApiError) {
		return NextResponse.json(
			{
				error: error.message,
				code: error.code,
				...(error.details !== undefined ? { details: error.details } : {}),
			},
			{ status: error.status },
		);
	}

	if (error instanceof ZodError) {
		return NextResponse.json(
			{
				error: "Validation failed",
				code: "VALIDATION_ERROR",
				issues: error.flatten(),
			},
			{ status: 400 },
		);
	}

	const message = error instanceof Error ? error.message : fallbackMessage;
	console.error("[API] Unhandled error", error);

	return NextResponse.json(
		{
			error: process.env.NODE_ENV === "production" ? fallbackMessage : message,
			code: "INTERNAL_SERVER_ERROR",
		},
		{ status: 500 },
	);
}

export async function parseJsonBody<TSchema extends ZodTypeAny>(
	request: Request,
	schema: TSchema,
): Promise<zInfer<TSchema>> {
	const raw = await request.json().catch(() => undefined);

	if (raw === undefined) {
		throw badRequest("JSON body inválido", "INVALID_JSON_BODY");
	}

	return schema.parse(raw);
}

export function noStoreHeaders() {
	return { "Cache-Control": "no-store, max-age=0, must-revalidate" };
}

/**
 * Unified error handler for API routes.
 * Handles ZodError (400), ApiError (preserves status),
 * and plain Error objects with a `status` property.
 * Falls back to 500 for unhandled errors.
 */
export function handleRouteError(
	error: unknown,
	fallbackMessage = "Error interno del servidor",
): ReturnType<typeof NextResponse.json> {
	if (error instanceof ZodError) {
		return NextResponse.json(
			{ error: "Datos inválidos", details: error.flatten() },
			{ status: 400 },
		);
	}

	if (error instanceof ApiError) {
		return NextResponse.json(
			{
				error: error.message,
				code: error.code,
				...(error.details !== undefined ? { details: error.details } : {}),
			},
			{ status: error.status },
		);
	}

	// Preserve status from plain Error objects (common in test mocks)
	if (
		error instanceof Error &&
		"status" in error &&
		typeof (error as { status: unknown }).status === "number"
	) {
		const status = (error as { status: number }).status;
		if (status >= 400 && status < 500) {
			return NextResponse.json({ error: error.message }, { status });
		}
	}

	console.error("[API] Unhandled error", error);
	const message = error instanceof Error ? error.message : fallbackMessage;
	return NextResponse.json(
		{ error: message, code: "INTERNAL_SERVER_ERROR" },
		{ status: 500 },
	);
}
