"use server";

import { verifyTurnstileToken } from "@/shared/api/verify-turnstile";
import { createJiraIssue, type IssueCategory } from "@/shared/lib/jira/client";

const CATEGORY_IDS: IssueCategory[] = ["bug", "sugerencia"];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
]);

function getStringField(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === "string" ? value : "";
}

export async function submitFeedback(formData: FormData) {
	const name = getStringField(formData, "name");
	const email = getStringField(formData, "email");
	const category = getStringField(formData, "category");
	const message = getStringField(formData, "message");
	const turnstileToken =
		getStringField(formData, "turnstileToken") || undefined;

	if (
		process.env.NODE_ENV === "production" &&
		process.env.TURNSTILE_SECRET_KEY
	) {
		const turnstileResult = await verifyTurnstileToken(turnstileToken || "");
		if (!turnstileResult.success) {
			return { error: "Verificación de seguridad fallida. Recarga la página." };
		}
	}

	if (!name || name.trim().length < 2) {
		return { error: "Por favor, introduce tu nombre" };
	}

	if (!email || !email.includes("@")) {
		return { error: "Por favor, introduce un email válido" };
	}

	if (!message || message.trim().length < 10) {
		return { error: "Por favor, cuéntanos algo más (mínimo 10 caracteres)" };
	}

	if (!CATEGORY_IDS.includes(category as IssueCategory)) {
		return { error: "Categoría no válida" };
	}

	const files = formData
		.getAll("images")
		.filter((entry): entry is File => entry instanceof File);

	if (files.length > MAX_FILES) {
		return { error: `Máximo ${MAX_FILES} imágenes` };
	}

	for (const file of files) {
		if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
			return { error: `Formato no soportado: ${file.name}` };
		}
		if (file.size > MAX_FILE_SIZE) {
			return {
				error: `Imagen demasiado grande (máx. 2 MB): ${file.name}`,
			};
		}
	}

	try {
		const issue = await createJiraIssue({
			category: category as IssueCategory,
			name: name.trim(),
			email: email.trim(),
			message: message.trim(),
			files,
		});
		return {
			success: true,
			key: issue.key,
			attachmentErrors: issue.attachmentErrors,
		};
	} catch (error) {
		console.error("Jira issue creation error:", error);
		return {
			error: (error as Error).message || "Error al enviar el feedback",
		};
	}
}
