"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { AccountCharactersPanel } from "./account-characters-panel";
import { AccountDeleteAccountDialog } from "./account-delete-account-dialog";
import { AccountLinkedAccountsPanel } from "./account-linked-accounts-panel";
import type { Character } from "./account-types";

type AccountClientProps = {
	battletag: string | null;
	isBnetLinked: boolean;
	characters: Character[];
	mainCharacterId: string | null;
	returnTo: "/mis-personajes" | "/zona-raider/cuenta";
};

async function doSetMainCharacter(
	characterId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/account/main-character", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ characterId }),
		});

		if (!res.ok) {
			const data = await res.json();
			return {
				success: false,
				error: data.error || "No pudimos actualizar tu personaje principal.",
			};
		}

		return { success: true };
	} catch {
		return {
			success: false,
			error: "Problema de conexión con el servidor.",
		};
	}
}

async function doUnlinkAccount(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const res = await fetch("/api/bnet/unlink", { method: "DELETE" });
		if (!res.ok) {
			const data = await res.json();
			return {
				success: false,
				error: data.error || "No se pudo desvincular.",
			};
		}
		return { success: true };
	} catch {
		return {
			success: false,
			error: "Problema de conexión con el servidor.",
		};
	}
}

async function doDeleteAccount(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const res = await fetch("/api/account/delete", { method: "DELETE" });
		if (!res.ok) {
			const data = await res.json();
			return {
				success: false,
				error: data.error || "No se pudo borrar la cuenta.",
			};
		}
		return { success: true };
	} catch {
		return {
			success: false,
			error: "Problema de conexión con el servidor.",
		};
	}
}

export function AccountClient({
	battletag,
	isBnetLinked,
	characters,
	mainCharacterId,
	returnTo,
}: AccountClientProps) {
	const router = useRouter();
	const [accountState, setAccountState] = useState({
		refreshing: false,
		unlinking: false,
		deleting: false,
		currentPage: 1,
		showDeleteDialog: false,
		selectedMainCharacterIdDraft: null as string | null,
		savingMainCharacterId: null as string | null,
	});

	const {
		refreshing,
		unlinking,
		deleting,
		currentPage,
		showDeleteDialog,
		selectedMainCharacterIdDraft,
		savingMainCharacterId,
	} = accountState;

	const itemsPerPage = 10;
	const selectedMainCharacterId =
		selectedMainCharacterIdDraft ?? mainCharacterId;

	const sortedCharacters = (() => {
		if (!selectedMainCharacterId) return characters;
		const mainChar = characters.find((c) => c.id === selectedMainCharacterId);
		if (!mainChar) return characters;
		return [
			mainChar,
			...characters.filter((c) => c.id !== selectedMainCharacterId),
		];
	})();

	const totalPages = Math.max(1, Math.ceil(characters.length / itemsPerPage));
	const currentMainCharacter = characters.find(
		(character) => character.id === selectedMainCharacterId,
	);

	const beginBnetAuth = async (
		returnToPath: string,
		markRefreshing?: boolean,
	) => {
		if (markRefreshing) {
			setAccountState((prev) => ({ ...prev, refreshing: true }));
		}
		const res = await fetch("/api/bnet/auth", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ returnTo: returnToPath }),
		});
		if (!res.ok) {
			const data = await res.json();
			toast.error(data.error || "Error al iniciar autenticación");
			return;
		}
		const data = await res.json();
		if (data.redirect) {
			// Validate redirect is to Battle.net OAuth (expected flow)
			try {
				const url = new URL(data.redirect);
				if (url.origin === "https://oauth.battle.net") {
					window.location.assign(url.toString());
				}
			} catch { /* invalid URL — ignore */ }
		}
	};

	const handleLinkAccount = () => {
		void beginBnetAuth(returnTo);
	};

	const handleRefresh = () => {
		void beginBnetAuth(returnTo, true);
	};

	const handleSetMainCharacter = async (characterId: string) => {
		if (characterId === selectedMainCharacterId) return;

		setAccountState((prev) => ({
			...prev,
			savingMainCharacterId: characterId,
		}));

		const result = await doSetMainCharacter(characterId);

		if (result.success) {
			setAccountState((prev) => ({
				...prev,
				selectedMainCharacterIdDraft: characterId,
			}));
			router.refresh();
			toast.success("Personaje principal actualizado", {
				description: "Ya se usará por defecto en el inicio y otras secciones.",
			});
		} else {
			if (result.error === "Problema de conexión con el servidor.") {
				toast.error("Error", {
					description: result.error,
				});
			} else {
				toast.error("No se pudo guardar", {
					description: result.error,
				});
			}
		}

		setAccountState((prev) => ({ ...prev, savingMainCharacterId: null }));
	};

	const handleUnlink = async () => {
		if (
			!confirm(
				"¿Estás seguro de desvincular tu cuenta de Battle.net? Esto borrará tus personajes importados del sitio.",
			)
		)
			return;

		setAccountState((prev) => ({ ...prev, unlinking: true }));

		const result = await doUnlinkAccount();

		if (result.success) {
			toast.success("Cuenta desvinculada", {
				description: "Tus personajes han sido eliminados del sistema.",
			});
			window.location.href = window.location.pathname + "?success=unlinked";
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}

		setAccountState((prev) => ({ ...prev, unlinking: false }));
	};

	const handleDeleteAccount = async () => {
		setAccountState((prev) => ({ ...prev, deleting: true }));

		const result = await doDeleteAccount();

		if (result.success) {
			toast.success("Cuenta eliminada", {
				description: "Se han borrado todos tus datos. Redirigiendo...",
			});
			setAccountState((prev) => ({ ...prev, showDeleteDialog: false }));
			setTimeout(() => {
			void signOut({ callbackUrl: "/" });
		}, 2000);
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}

		setAccountState((prev) => ({ ...prev, deleting: false }));
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
			<AccountLinkedAccountsPanel
				battletag={battletag}
				isBnetLinked={isBnetLinked}
				unlinking={unlinking}
				deleting={deleting}
				onLinkAccount={handleLinkAccount}
				onUnlink={() => void handleUnlink()}
				onOpenDeleteDialog={() =>
					setAccountState((prev) => ({ ...prev, showDeleteDialog: true }))
				}
			/>

			<AccountCharactersPanel
				battletag={battletag}
				characters={sortedCharacters}
				currentPage={currentPage}
				totalPages={totalPages}
				selectedMainCharacterId={selectedMainCharacterId}
				currentMainCharacter={currentMainCharacter}
				refreshing={refreshing}
				savingMainCharacterId={savingMainCharacterId}
				onRefresh={handleRefresh}
				onSetMainCharacter={(id) => void handleSetMainCharacter(id)}
				onPreviousPage={() =>
					setAccountState((prev) => ({
						...prev,
						currentPage: Math.max(1, prev.currentPage - 1),
					}))
				}
				onNextPage={() =>
					setAccountState((prev) => ({
						...prev,
						currentPage: Math.min(totalPages, prev.currentPage + 1),
					}))
				}
			/>

			<AccountDeleteAccountDialog
				open={showDeleteDialog}
				deleting={deleting}
				onOpenChange={(open) =>
					!deleting &&
					setAccountState((prev) => ({ ...prev, showDeleteDialog: open }))
				}
				onConfirmDelete={() => void handleDeleteAccount()}
			/>
		</div>
	);
}
