"use client";
import { useEffect, useReducer } from "react";

type State = {
	status: string;
	desktopUrl: string | null;
	countdown: number | null;
};

type Action =
	| { type: "set_status"; status: string }
	| { type: "set_url"; desktopUrl: string | null }
	| { type: "set_countdown"; countdown: number | null }
	| { type: "tick" }
	| { type: "reset" };

const initialState: State = {
	status: "Verificando autenticación...",
	desktopUrl: null,
	countdown: null,
};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "set_status":
			return { ...state, status: action.status };
		case "set_url":
			return { ...state, desktopUrl: action.desktopUrl };
		case "set_countdown":
			return { ...state, countdown: action.countdown };
		case "tick":
			return {
				...state,
				countdown: state.countdown === null ? null : state.countdown - 1,
			};
		case "reset":
			return initialState;
		default:
			return state;
	}
}

export default function DesktopAuthBridge() {
	const [state, dispatch] = useReducer(reducer, initialState);
	const { status, desktopUrl, countdown } = state;

	const handleRedirect = (url: string) => {
		// Only allow the custom desktop app protocol
		if (!url.startsWith("artictempest://")) return;
		dispatch({
			type: "set_status",
			status: "Intentando abrir Artic Tempest...",
		});
		dispatch({ type: "set_countdown", countdown: 5 });
		window.location.href = url;
	};

	useEffect(() => {
		if (countdown === 0) {
			// Modern hack to close windows not opened by script:
			// Open a new blank window in current tab and close it
			const win = window.open("", "_self");
			if (win) win.close();

			// Standard fallback
			window.close();

			// UI Fallback for mobile or strict browsers
			dispatch({
				type: "set_status",
				status: "Ya puedes cerrar esta pestaña.",
			});
		}
		if (countdown === null || countdown === 0) return;

		const timer = setTimeout(() => {
			dispatch({ type: "tick" });
		}, 1000);

		return () => clearTimeout(timer);
	}, [countdown]);

	useEffect(() => {
		const hash = window.location.hash;

		if (hash && hash.includes("access_token")) {
			const url = `artictempest://login-callback${hash}`;
			dispatch({ type: "set_url", desktopUrl: url });
			dispatch({
				type: "set_status",
				status: "Token listo. Pulsa “Abrir aplicación” para continuar.",
			});
		} else {
			dispatch({
				type: "set_status",
				status:
					"No se ha encontrado el token. Vuelve a la app e inténtalo de nuevo.",
			});
		}
	}, []);

	return (
		<div className="flex flex-col items-center justify-center min-h-dvh bg-[#0a0a0b] text-white p-6 font-sans">
			<div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
				{/* Decorative background glow */}
				<div className="absolute -top-24 -left-24 size-48 bg-primary/20 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl"></div>

				<div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
					<svg
						className="size-10 text-primary animate-pulse"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 18a10.003 10.003 0 01-8.628-5.18l-.054-.09m10.852-5.462A10.124 10.124 0 0112 11m0 0c.492 0 .973.04 1.44.115m6.23 1.442A10.124 10.124 0 0118 11.5c0-1.104-.31-2.136-.848-3.012M12 11c.338 0 .67.017 1 .05m4.412 8.535l-.054.09A10.003 10.003 0 0112 21"
						/>
					</svg>
				</div>

				<h1 className="text-3xl font-semibold italic mb-2 tracking-tight">
					ARTIC TEMPEST
				</h1>
				<p className="text-white/60 text-sm font-medium mb-8 uppercase tracking-widest">
					Bridging Connection
				</p>

				<div className="space-y-6 text-center">
					<p className="text-lg font-semibold text-white/90">{status}</p>

					{desktopUrl && (
						<div className="space-y-4 pt-4">
							<button
								type="button"
								onClick={() => handleRedirect(desktopUrl)}
								className="w-full py-4 px-6 bg-primary text-black font-extrabold rounded-xl hover:bg-primary/90  transform active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
							>
								<span>ABRIR APLICACIÓN</span>
								<svg
									className="size-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</button>

							<div className="pt-8">
								{countdown !== null ? (
									<div className="space-y-4">
										<p className="text-white/40 text-[10px] uppercase font-semibold tracking-widest animate-pulse">
											La ventana se cerrará en {countdown} segundos…
										</p>
										<button
											type="button"
											onClick={() => {
												const win = window.open("", "_self");
												if (win) win.close();
												window.close();
											}}
											className="text-[9px] text-white/20 hover:text-white/50 uppercase font-bold tracking-[0.2em] transition-colors"
										>
											Cerrar ahora
										</button>
									</div>
								) : (
									<p className="text-white/40 text-[10px] leading-relaxed px-4">
										Si la aplicación no se abre, asegúrate de tenerla instalada.
									</p>
								)}
							</div>
						</div>
					)}

					{!desktopUrl && (
						<div className="flex justify-center gap-2 pt-4">
							<span className="size-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></span>
							<span className="size-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></span>
							<span className="size-2 bg-primary rounded-full animate-pulse"></span>
						</div>
					)}
				</div>
			</div>

			<p className="mt-8 text-white/10 text-[10px] tracking-[0.4em] font-semibold uppercase">
				Artic Tempest Hub
			</p>
		</div>
	);
}
