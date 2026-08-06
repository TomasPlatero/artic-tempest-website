"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import {
	IconPlus,
	IconTrash,
	IconEdit,
	IconHelp,
	IconLock,
	IconLockOpen,
	IconDeviceFloppy,
	IconForms,
	IconAsterisk,
} from "@/shared/ui/tabler-icons";
import { toast } from "sonner";

async function doRemoveQuestion(
	id: string,
): Promise<{ success: boolean; error?: string; data?: any }> {
	try {
		const res = await fetch("/api/recruitment/settings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "question_delete",
				data: { id },
			}),
		});

		if (!res.ok) {
			const result = await res.json();
			return { success: false, error: result.error || "Error al eliminar" };
		}

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "Error al eliminar" };
	}
}

async function doSaveQuestion(
	question: any,
): Promise<{ success: boolean; error?: string; data?: any }> {
	try {
		const res = await fetch("/api/recruitment/settings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "question_save",
				data: question,
			}),
		});

		if (!res.ok) {
			const result = await res.json();
			return { success: false, error: result.error || "Error al guardar" };
		}

		const result = await res.json();
		return { success: true, data: result };
	} catch (error: any) {
		return { success: false, error: error.message || "Error desconocido" };
	}
}

function getTypeLabel(type: string) {
	const types: Record<string, string> = {
		text: "Texto corto",
		textarea: "Párrafo",
		number: "Número",
		select: "Selección única",
		multiselect: "Múltiple",
		boolean: "Checkbox",
	};
	return types[type] || type;
}

function QuestionRow({
	question,
	index,
	onEdit,
	onRemove,
}: {
	question: any;
	index: number;
	onEdit: (question: any) => void;
	onRemove: (id: string) => void;
}) {
	return (
		<div className="group flex items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04]  shadow-lg relative overflow-hidden">
			<div className="flex items-center gap-5 min-w-0">
				<div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-semibold font-mono text-white/30 border border-white/5">
					{index + 1}
				</div>
				<div className="flex flex-col gap-1.5 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-semibold uppercase tracking-wider text-white truncate">
							{question.label}
						</span>
						{question.is_required && (
							<IconAsterisk className="size-3 text-rose-500" />
						)}
					</div>
					<div className="flex flex-wrap gap-2">
						<Badge
							variant="secondary"
							className="bg-blue-500/10 text-blue-400 border-none text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5"
						>
							{getTypeLabel(question.type)}
						</Badge>
						{question.is_required && (
							<Badge
								variant="outline"
								className="text-rose-500/60 border-rose-500/10 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5"
							>
								Obligatorio
							</Badge>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					className="size-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/60 hover:text-white  shadow-xl active:scale-95"
					onClick={() => onEdit(question)}
				>
					<IconEdit className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="size-10 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/20 text-rose-500/60 hover:text-rose-500  shadow-xl active:scale-95"
					onClick={() => onRemove(question.id)}
				>
					<IconTrash className="size-4" />
				</Button>
			</div>
		</div>
	);
}

function QuestionsPanel({
	questions,
	onAdd,
	onEdit,
	onRemove,
}: {
	questions: any[];
	onAdd: () => void;
	onEdit: (question: any) => void;
	onRemove: (id: string) => void;
}) {
	return (
		<Card className="border-white/5 bg-zinc-950/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5">
			<CardHeader className="p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
				<div>
					<CardTitle className="text-2xl font-semibold uppercase tracking-widest text-primary flex items-center gap-3">
						<IconForms className="size-7" />
						Constructor de Formulario
					</CardTitle>
					<CardDescription className="text-sm font-medium text-white/40 mt-2">
						Diseña las preguntas que los aspirantes deben responder al aplicar.
					</CardDescription>
				</div>
				<Button
					onClick={onAdd}
					className="w-full sm:w-auto h-14 rounded-2xl bg-primary hover:bg-primary/90 text-zinc-950 font-semibold uppercase tracking-widest text-[10px] px-8 shadow-[0_10px_30px_rgba(var(--primary),0.2)]  active:scale-95 gap-3"
				>
					<IconPlus className="size-5" />
					Añadir Pregunta
				</Button>
			</CardHeader>
			<CardContent className="p-4 md:p-10 pt-0">
				<div className="space-y-4">
					{questions.length === 0 ? (
						<div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
							<IconForms className="size-12 text-white/10 mx-auto mb-4" />
							<p className="text-white/40 font-bold uppercase tracking-widest text-xs">
								No hay preguntas creadas
							</p>
							<Button
								variant="link"
								onClick={onAdd}
								className="text-primary mt-2"
							>
								Crear la primera pregunta
							</Button>
						</div>
					) : (
						questions.map((question, index) => (
							<QuestionRow
								key={question.id}
								question={question}
								index={index}
								onEdit={onEdit}
								onRemove={onRemove}
							/>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function QuestionModal({
	editingQuestion,
	isModalOpen,
	saving,
	onOpenChange,
	onSave,
	setEditingQuestion,
}: {
	editingQuestion: any;
	isModalOpen: boolean;
	saving: string | null;
	onOpenChange: (open: boolean) => void;
	onSave: () => void;
	setEditingQuestion: React.Dispatch<React.SetStateAction<any>>;
}) {
	return (
		<Dialog open={isModalOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl bg-zinc-950 border-white/10 text-white rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-0 overflow-hidden outline-none">
				<DialogHeader className="p-8 pb-4">
					<DialogTitle className="text-2xl font-semibold uppercase tracking-tight text-white flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<IconForms className="size-6 text-primary" />
						</div>
						{editingQuestion
							? editingQuestion.id.startsWith("temp-")
								? "Nueva Pregunta"
								: "Editar Pregunta"
							: "Gestión de Preguntas"}
					</DialogTitle>
					<DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
						Personaliza los detalles del campo del formulario
					</DialogDescription>
				</DialogHeader>

				{editingQuestion && (
					<>
						<div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar scrollbar-hide">
							<div className="space-y-3">
								<Label className="text-[10px] uppercase font-semibold text-white/30 ml-1 tracking-[0.22em]">
									Etiqueta / Enunciado
								</Label>
								<Input
									value={editingQuestion.label}
									onChange={(e) =>
										setEditingQuestion((prev: any) => ({
											...prev,
											label: e.target.value,
										}))
									}
									className="bg-white/5 border-white/10 h-14 text-sm font-semibold uppercase tracking-wider rounded-2xl px-6 focus:ring-primary/20 "
									placeholder="Ej: ¿Por qué quieres unirte?"
								/>
							</div>

							<div className="space-y-3">
								<Label className="text-[10px] uppercase font-semibold text-white/30 ml-1 tracking-[0.22em]">
									Tipo de Respuesta
								</Label>
								<Select
									value={editingQuestion.type}
									onValueChange={(val) =>
										setEditingQuestion((prev: any) => ({ ...prev, type: val }))
									}
								>
									<SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-[11px] font-semibold uppercase tracking-wider text-white">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-zinc-950 border-white/10">
										<SelectItem
											value="text"
											className="text-[11px] font-bold uppercase tracking-widest py-3"
										>
											Short Answer (Texto corto)
										</SelectItem>
										<SelectItem
											value="textarea"
											className="text-[11px] font-bold uppercase tracking-widest py-3"
										>
											Paragraph (Párrafo)
										</SelectItem>
										<SelectItem
											value="number"
											className="text-[11px] font-bold uppercase tracking-widest py-3"
										>
											Number (Número)
										</SelectItem>
										<SelectItem
											value="select"
											className="text-[11px] font-bold uppercase tracking-widest py-3"
										>
											Single Choice (Selección única)
										</SelectItem>
										<SelectItem
											value="multiselect"
											className="text-[11px] font-bold uppercase tracking-widest py-3"
										>
											Multiple Choice (Múltiple)
										</SelectItem>
										<SelectItem
											value="boolean"
											className="text-[11px] font-bold uppercase tracking-widest py-3"
										>
											Checkbox (Sencilla/Sí-No)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-3">
								<Label className="text-[10px] uppercase font-semibold text-white/30 ml-1 tracking-[0.22em]">
									Instrucciones / Ayuda (Opcional)
								</Label>
								<div className="relative">
									<Input
										value={editingQuestion.help_text || ""}
										onChange={(e) =>
											setEditingQuestion((prev: any) => ({
												...prev,
												help_text: e.target.value,
											}))
										}
										className="bg-white/5 border-white/10 h-14 text-sm font-bold rounded-2xl px-6 pl-12 focus:ring-primary/20 "
										placeholder="Detalla qué esperas en esta respuesta..."
									/>
									<IconHelp className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-white/20" />
								</div>
							</div>

							{["select", "multiselect"].includes(editingQuestion.type) && (
								<div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
									<Label className="text-[10px] uppercase font-semibold text-white/30 ml-1 tracking-[0.22em]">
										Opciones (Separadas por comas)
									</Label>
									<Input
										value={editingQuestion.options?.join(", ") || ""}
										onChange={(e) =>
											setEditingQuestion((prev: any) => ({
												...prev,
												options: e.target.value
													.split(",")
													.reduce<string[]>((acc, value) => {
														const trimmed = value.trim();
														if (trimmed) acc.push(trimmed);
														return acc;
													}, []),
											}))
										}
										className="bg-white/5 border-white/10 h-14 text-sm font-bold rounded-2xl px-6 focus:ring-primary/20 "
										placeholder="Mañana, Tarde, Noche"
									/>
								</div>
							)}

							<div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-center justify-between group transition-colors hover:bg-white/[0.05]">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-2">
										<Label className="text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer">
											Campo Obligatorio
										</Label>
										{editingQuestion.is_required ? (
											<IconLock className="size-4 text-emerald-500" />
										) : (
											<IconLockOpen className="size-4 text-white/20" />
										)}
									</div>
									<span className="text-[9px] text-white/30 font-medium uppercase tracking-tight">
										Los aspirantes DEBEN responder esto
									</span>
								</div>
								<Checkbox
									id="req-modal"
									checked={editingQuestion.is_required}
									onCheckedChange={(val) =>
										setEditingQuestion((prev: any) => ({
											...prev,
											is_required: !!val,
										}))
									}
									className="size-6 rounded-lg border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
								/>
							</div>
						</div>

						<DialogFooter className="p-8 pt-4 flex gap-4 sm:justify-between items-center sm:flex-row flex-col-reverse">
							<Button
								variant="outline"
								className="w-full sm:w-auto px-8 bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-14 rounded-2xl"
								onClick={() => onOpenChange(false)}
							>
								Cancelar
							</Button>
							<Button
								className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-zinc-950 font-semibold uppercase tracking-widest text-[10px] h-14 rounded-2xl shadow-[0_10px_30px_rgba(var(--primary),0.2)]  active:scale-95"
								onClick={onSave}
								disabled={!!saving}
							>
								{saving ? (
									"Guardando..."
								) : (
									<>
										<IconDeviceFloppy className="size-4 mr-2" />
										Guardar Pregunta
									</>
								)}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

export function FormBuilder({ initialQuestions }: any) {
	const [questions, setQuestions] = useState<any[]>(
		() => initialQuestions || [],
	);
	const [saving, setSaving] = useState<string | null>(null);

	// Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingQuestion, setEditingQuestion] = useState<any>(null);

	const openAddModal = () => {
		setEditingQuestion({
			id: `temp-${Date.now()}`,
			label: "",
			type: "text",
			is_required: true,
			order_index: questions.length,
			options: [],
			help_text: "",
		});
		setIsModalOpen(true);
	};

	const openEditModal = (q: any) => {
		setEditingQuestion({ ...q });
		setIsModalOpen(true);
	};

	const removeQuestion = async (id: string) => {
		if (id.startsWith("temp-")) {
			setQuestions((prev: any[]) => prev.filter((q: any) => q.id !== id));
			return;
		}

		const result = await doRemoveQuestion(id);

		if (result.success) {
			setQuestions((prev: any[]) => prev.filter((q: any) => q.id !== id));
			toast.success("Pregunta eliminada");
		} else {
			console.error("Error deleting question:", result.error);
			toast.error("Error al eliminar pregunta", {
				description: result.error,
			});
		}
	};

	const saveQuestionFromModal = async () => {
		if (!editingQuestion || !editingQuestion.label) {
			toast.error("La etiqueta de la pregunta es obligatoria");
			return;
		}

		setSaving(editingQuestion.id);
		const result = await doSaveQuestion(editingQuestion);

		if (result.success && result.data) {
			// If it was a new question, it might have a new DB ID now
			const isNew = editingQuestion.id.startsWith("temp-");
			if (isNew) {
				setQuestions((prev: any[]) => [
					...prev.filter((q: any) => q.id !== editingQuestion.id),
					result.data,
				]);
			} else {
				setQuestions((prev: any[]) =>
					prev.map((item: any) =>
						item.id === editingQuestion.id ? result.data : item,
					),
				);
			}

			toast.success("Pregunta guardada");
			setIsModalOpen(false);
		} else {
			console.error("Error saving question:", result.error);
			toast.error("Error al guardar", {
				description: result.error || "Error desconocido",
			});
		}

		setSaving(null);
	};

	return (
		<div className="space-y-8 w-full max-w-full pb-24">
			<QuestionsPanel
				questions={questions}
				onAdd={openAddModal}
				onEdit={openEditModal}
				onRemove={(id) => void removeQuestion(id)}
			/>

			<QuestionModal
				editingQuestion={editingQuestion}
				isModalOpen={isModalOpen}
				saving={saving}
				onOpenChange={setIsModalOpen}
				onSave={() => void saveQuestionFromModal()}
				setEditingQuestion={setEditingQuestion}
			/>
		</div>
	);
}
