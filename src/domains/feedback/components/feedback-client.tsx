"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import {
	IconSend,
	IconAlertCircle,
	IconCheck,
	IconUser,
	IconMail,
	IconBug,
	IconBulb,
	IconCamera,
	IconX,
} from "@/shared/ui/tabler-icons";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { submitFeedback } from "@/shared/actions/feedback";
import {
	TurnstileWidget,
	type TurnstileWidgetRef,
} from "@/shared/components/turnstile-widget";

const CATEGORIES = [
	{ id: "bug", label: "Bug / Error", icon: IconBug, color: "text-rose-400" },
	{
		id: "sugerencia",
		label: "Sugerencia",
		icon: IconBulb,
		color: "text-amber-400",
	},
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];

type AttachmentFile = {
	file: File;
	previewUrl: string;
};

async function doSubmitFeedback(formData: FormData): Promise<{
	success: boolean;
	error?: string;
	attachmentErrors?: string[];
}> {
	try {
		const result = await submitFeedback(formData);
		if (result.error) {
			return { success: false, error: result.error };
		}
		return {
			success: true,
			attachmentErrors: result.attachmentErrors ?? [],
		};
	} catch (err) {
		console.error(err);
		return {
			success: false,
			error: "No se pudo enviar el feedback. Inténtalo de nuevo.",
		};
	}
}

export function FeedbackClient() {
	return useFeedbackClient();
}

function useFeedbackClient() {
	const { data: session } = useSession();
	const turnstileRef = useRef<TurnstileWidgetRef>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [captchaLoading, setCaptchaLoading] = useState(true);
	const [captchaError, setCaptchaError] = useState(false);
	const [announcement, setAnnouncement] = useState("");
	const [files, setFiles] = useState<AttachmentFile[]>([]);

	const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const incoming = Array.from(e.target.files ?? []);
		const valid = incoming.filter(
			(f) => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE,
		);
		if (valid.length < incoming.length) {
			toast.error("Solo imágenes PNG/JPG/WebP/GIF de hasta 2 MB");
		}

		const remaining = Math.max(0, MAX_FILES - files.length);
		if (valid.length > remaining) {
			toast.error(`Máximo ${MAX_FILES} imágenes`);
		}
		const toAdd = valid.slice(0, remaining).map((file) => ({
			file,
			previewUrl: URL.createObjectURL(file),
		}));

		setFiles((prev) => [...prev, ...toAdd]);
		e.target.value = "";
	};

	const removeFile = (index: number) => {
		const removed = files[index];
		if (removed) {
			URL.revokeObjectURL(removed.previewUrl);
		}
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const filesRef = useRef<AttachmentFile[]>([]);

	useEffect(() => {
		filesRef.current = files;
	}, [files]);

	useEffect(() => {
		return () => {
			filesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
		};
	}, []);

	const hasTurnstile =
		process.env.NODE_ENV === "production" &&
		!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
	const [formState, setFormState] = useState({
		loading: false,
		success: false,
		category: "sugerencia",
		acceptedRGPD: false,
	});
	const { loading, success, category, acceptedRGPD } = formState;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setAnnouncement("");

		if (!acceptedRGPD) {
			toast.error("Debes aceptar la política de privacidad");
			setAnnouncement("Debes aceptar la política de privacidad.");
			return;
		}

		setFormState((prev) => ({ ...prev, loading: true }));
		setAnnouncement("Enviando feedback...");

		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const message = formData.get("message") as string;

		if (hasTurnstile && !turnstileToken) {
			toast.error("Por favor, completa la verificación de seguridad");
			setAnnouncement("Por favor, completa la verificación de seguridad.");
			setFormState((prev) => ({ ...prev, loading: false }));
			return;
		}

		if (!name || name.trim().length < 2) {
			toast.error("Por favor, introduce tu nombre");
			setAnnouncement("Por favor, introduce tu nombre.");
			setFormState((prev) => ({ ...prev, loading: false }));
			return;
		}

		if (!email || !email.includes("@")) {
			toast.error("Por favor, introduce un email válido");
			setAnnouncement("Por favor, introduce un email válido.");
			setFormState((prev) => ({ ...prev, loading: false }));
			return;
		}

		if (!message || message.trim().length < 10) {
			toast.error("Por favor, cuéntanos algo más (mínimo 10 caracteres)");
			setAnnouncement("Por favor, cuéntanos algo más. Mínimo 10 caracteres.");
			setFormState((prev) => ({ ...prev, loading: false }));
			return;
		}

		formData.set("category", category);
		if (turnstileToken) {
			formData.set("turnstileToken", turnstileToken);
		}
		files.forEach(({ file }) => formData.append("images", file, file.name));

		const result = await doSubmitFeedback(formData);

		setFormState((prev) => ({ ...prev, loading: false }));

		if (result.success) {
			turnstileRef.current?.reset();
			setTurnstileToken(null);
			setCaptchaLoading(true);
			files.forEach((item) => URL.revokeObjectURL(item.previewUrl));
			setFiles([]);
			setFormState((prev) => ({ ...prev, success: true }));
			setAnnouncement("Feedback enviado correctamente.");
			if (result.attachmentErrors && result.attachmentErrors.length > 0) {
				toast.warning(
					"Tu mensaje se creó en Jira, pero algunas capturas no se pudieron adjuntar.",
				);
			} else {
				toast.success("Feedback enviado correctamente. ¡Gracias!");
			}
		} else {
			setAnnouncement(result.error!);
			toast.error(result.error!);
		}
	};

	if (success) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
				<div className="size-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-6">
					<IconCheck className="size-10 text-green-500" />
				</div>
				<h2 className="text-3xl font-semibold text-white mb-4 uppercase tracking-tight">
					¡Mensaje Recibido!
				</h2>
				<p className="text-white/60 max-w-sm mb-8">
					Tu feedback ha sido enviado correctamente. Revisamos todos los
					mensajes para mejorar la plataforma. ¡Gracias por ayudarnos!
				</p>
				<Button
					variant="landingTinted"
					size="public"
					onClick={() => (window.location.href = "/")}
				>
					Volver al Inicio
				</Button>
			</div>
		);
	}

	return (
		<form
			onSubmit={(e) => void handleSubmit(e)}
			className="space-y-8 animate-in fade-in duration-700"
		>
			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{announcement}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Nombre */}
				<div className="space-y-2">
					<Label
						htmlFor="name"
						className="text-xs uppercase tracking-widest text-white/40 font-semibold"
					>
						Tu Nombre
					</Label>
					<div className="relative">
						<IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
						<Input
							id="name"
							name="name"
							placeholder="Nombre / Discord Tag"
							defaultValue={session?.user?.username || ""}
							className="pl-10 h-12 bg-white/5 border-white/10 focus:border-blue-500/50  rounded-xl"
							required
							aria-required="true"
						/>
					</div>
				</div>

				{/* Email */}
				<div className="space-y-2">
					<Label
						htmlFor="email"
						className="text-xs uppercase tracking-widest text-white/40 font-semibold"
					>
						Tu Email
					</Label>
					<div className="relative">
						<IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="email@ejemplo.com"
							className="pl-10 h-12 bg-white/5 border-white/10 focus:border-blue-500/50  rounded-xl"
							required
							aria-required="true"
						/>
					</div>
				</div>
			</div>

			{/* Categoría */}
			<fieldset className="space-y-3">
				<legend className="text-xs uppercase tracking-widest text-white/40 font-semibold">
					¿De qué trata tu feedback?
				</legend>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{CATEGORIES.map((cat) => (
						<label
							key={cat.id}
							className={cn(
								"flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-bold  focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950",
								category === cat.id
									? "border-blue-500/40 bg-blue-500/10 text-white"
									: "border-white/10 bg-white/5 text-white/40 hover:bg-white/10",
							)}
						>
							<input
								type="radio"
								name="category"
								value={cat.id}
								checked={category === cat.id}
								onChange={() =>
									setFormState((prev) => ({ ...prev, category: cat.id }))
								}
								className="sr-only peer"
							/>
							<cat.icon
								className={cn(
									"size-5",
									category === cat.id ? cat.color : "text-white/20",
								)}
							/>
							{cat.label}
						</label>
					))}
				</div>
			</fieldset>

			{/* Mensaje */}
			<div className="space-y-2">
				<Label
					htmlFor="message"
					className="text-xs uppercase tracking-widest text-white/40 font-semibold"
				>
					Tu Mensaje
				</Label>
				<Textarea
					id="message"
					name="message"
					placeholder="Cuéntanos qué tienes en mente, informa de un error o propón una idea..."
					className="min-h-[150px] bg-white/5 border-white/10 focus:border-blue-500/50  rounded-2xl p-4 text-base resize-none"
					required
				/>
			</div>

			{/* Adjuntos */}
			<div className="space-y-3">
				<span className="block text-xs uppercase tracking-widest text-white/40 font-semibold">
					Capturas de pantalla (opcional)
				</span>
				<label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center transition-colors hover:border-blue-500/40 hover:bg-white/10">
					<IconCamera className="size-6 text-white/30" />
					<span className="text-sm font-semibold text-white/60">
						Añadir capturas (máx. {MAX_FILES})
					</span>
					<span className="text-xs text-white/30">
						PNG, JPG, WebP o GIF · máx. 2 MB cada una
					</span>
					<input
						type="file"
						accept="image/png,image/jpeg,image/webp,image/gif"
						multiple
						onChange={handleFilesChange}
						className="sr-only"
					/>
				</label>
				{files.length > 0 && (
					<ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{files.map((item, i) => (
							<li
								key={item.previewUrl}
								className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/5"
							>
								{/* oxlint-disable-next-line next/no-img-element -- blob local */}
								<img
									src={item.previewUrl}
									alt={item.file.name}
									className="w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() => removeFile(i)}
									aria-label={`Quitar ${item.file.name}`}
									className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white/80 transition-colors hover:bg-rose-600 hover:text-white"
								>
									<IconX className="size-3.5" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* RGPD */}
			<div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group relative overflow-hidden">
				<div className="shrink-0 pt-0.5">
					<input
						type="checkbox"
						id="rgpd"
						aria-label="Aceptar política de privacidad"
						checked={acceptedRGPD}
						onChange={(e) =>
							setFormState((prev) => ({
								...prev,
								acceptedRGPD: e.target.checked,
							}))
						}
						className="size-4 rounded border-white/20 bg-zinc-950 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
						required
					/>
				</div>
				<Label
					htmlFor="rgpd"
					className="text-xs text-white/50 leading-relaxed cursor-pointer group-hover:text-white/70 transition-colors flex-1 select-none block"
				>
					He leído y acepto la{" "}
					<Link
						href="/privacidad"
						className="text-blue-400 hover:underline font-bold"
					>
						política de privacidad
					</Link>{" "}
					y el consentimiento para el tratamiento de mis datos personales para
					gestionar este feedback.
				</Label>
			</div>

			{hasTurnstile && (
				<div className="space-y-2">
					{captchaError ? (
						<div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
							<IconAlertCircle className="size-4 text-rose-400 shrink-0" />
							<p className="text-sm text-rose-200/80">
								No se pudo cargar la verificación de seguridad. Recarga la
								página o inténtalo de nuevo en unos minutos.
							</p>
						</div>
					) : (
						captchaLoading &&
						!turnstileToken && (
							<div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
								<div className="size-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
								<p className="text-sm text-amber-200/80">
									Verificación de seguridad en curso...
								</p>
							</div>
						)
					)}
					<TurnstileWidget
						ref={turnstileRef}
						onVerify={(token) => {
							setTurnstileToken(token);
							setCaptchaLoading(false);
							setCaptchaError(false);
						}}
						onExpire={() => {
							setTurnstileToken(null);
							setCaptchaLoading(true);
							setCaptchaError(false);
						}}
						onError={() => {
							setTurnstileToken(null);
							setCaptchaLoading(false);
							setCaptchaError(true);
						}}
					/>
				</div>
			)}

			<div className="pt-4">
				<Button
					type="submit"
					size="publicLg"
					variant="landingPrimary"
					disabled={
						loading || !acceptedRGPD || (hasTurnstile && !turnstileToken)
					}
					className="flex w-full items-center gap-3 rounded-2xl disabled:grayscale disabled:opacity-50"
				>
					{loading ? (
						<>
							<div className="size-4 border-2 border-white/30 border-t-white rounded-full motion-safe:animate-spin" />
							Enviando…
						</>
					) : (
						<>
							<IconSend className="size-5" />
							Enviar
						</>
					)}
				</Button>
				<p className="text-[10px] text-white/20 mt-4 text-center font-medium uppercase tracking-widest italic">
					<IconAlertCircle className="size-3 inline mr-1 -mt-0.5" />
					Tus sugerencias nos ayudan a crecer. ¡Gracias!
				</p>
			</div>
		</form>
	);
}
