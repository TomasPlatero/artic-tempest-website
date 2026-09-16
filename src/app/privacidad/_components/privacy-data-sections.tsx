"use client";

import Link from "next/link";
import { IconFileText, IconEye } from "@/shared/ui/tabler-icons";
import { PrivacidadSection } from "./privacy-section";

export function DataCollectionSection() {
	return (
		<PrivacidadSection
			id="data-title"
			title="2. Datos que recopilamos y su finalidad"
			icon={<IconFileText className="text-blue-400 size-6" aria-hidden="true" />}
			className="bg-white/5 md:p-12 rounded-[40px] border-white/10 backdrop-blur-xl"
		>
			<div className="grid gap-8">
				<DataItem
					title="Autenticación (Discord / Battle.net)"
					description="Al iniciar sesión mediante OAuth2 de Discord y/o Battle.net, recibimos de dichas plataformas tu ID de usuario, nombre de usuario, avatar, y en el caso de Discord, los roles que tienes en nuestro servidor. Esta información es necesaria para identificar a los miembros de la hermandad y asignar los permisos correspondientes dentro del panel Zona Raider."
					legalBasis="Ejecución de la relación comunitaria (art. 6.1.b RGPD) e interés legítimo del responsable en la gestión de la comunidad (art. 6.1.f RGPD)."
				/>
				<DataItem
					title="Formularios (Feedback, Reclutamiento, Contacto)"
					description="Los datos que nos proporcionas voluntariamente a través de nuestros formularios (nombre, correo electrónico, mensajes, personajes de WoW, archivos adjuntos) se recopilan exclusivamente para tramitar y dar respuesta a tu solicitud. Los campos obligatorios se identifican como tales en cada formulario."
					legalBasis="Consentimiento explícito del interesado (art. 6.1.a RGPD), que puedes retirar en cualquier momento sin que ello afecte a la licitud del tratamiento previo."
				/>
				<DataItem
					title="Personajes vinculados y actividad de raid"
					description="Cuando vinculas tus personajes de WoW a través de la Zona Raider, recopilamos los identificadores de personaje, logs de combate, progreso de raid y estadísticas agregadas. Esta información se utiliza para la coordinación interna del roster, la elaboración de rankings y la gestión del botín."
					legalBasis="Interés legítimo en la organización de la actividad de la hermandad (art. 6.1.f RGPD) y, cuando proceda, ejecución de la relación de miembro (art. 6.1.b RGPD)."
				/>
			</div>
		</PrivacidadSection>
	);
}

function DataItem({
	title,
	description,
	legalBasis,
}: {
	title: string;
	description: string;
	legalBasis: string;
}) {
	return (
		<div className="space-y-4">
			<h3 className="text-white font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
				<div className="size-2 rounded-full bg-blue-500" aria-hidden="true" />
				{title}
			</h3>
			<p className="text-zinc-300 text-sm leading-relaxed">{description}</p>
			<div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5">
				<p className="text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">
					Base legal:
				</p>
				<p className="text-xs text-zinc-400 leading-relaxed">{legalBasis}</p>
			</div>
		</div>
	);
}

function TransferItem({
	name,
	description,
}: {
	name: string;
	description: React.ReactNode;
}) {
	return (
		<div className="bg-zinc-950/40 p-5 rounded-xl border border-white/5">
			<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
				{name}
			</h3>
			<p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
		</div>
	);
}

export function TransferSection() {
	return (
		<PrivacidadSection
			id="transfer-title"
			title="4. Destinatarios y Transferencias Internacionales"
			icon={<IconEye className="text-blue-400 size-6" aria-hidden="true" />}
		>
			<div className="space-y-4">
				<p className="text-zinc-300 leading-relaxed text-sm">
					No vendemos, alquilamos ni cedemos tus datos personales a terceros con
					fines comerciales. Los datos pueden ser compartidos con los siguientes
					encargados de tratamiento:
				</p>
				<div className="space-y-4">
					<TransferItem
						name="Supabase Inc."
						description="Proveedor de base de datos PostgreSQL. Los datos se almacenan en servidores dentro del Espacio Económico Europeo (eu-west-1). Supabase cumple con el RGPD como encargado del tratamiento, con medidas de cifrado en reposo y en tránsito."
					/>
					<TransferItem
						name="Vercel Inc."
						description="Plataforma de alojamiento y despliegue del sitio web. Los datos de navegación pueden procesarse en servidores ubicados en Estados Unidos. Vercel cumple con el RGPD mediante cláusulas contractuales tipo (SCC) y medidas técnicas y organizativas apropiadas."
					/>
					<TransferItem
						name="CookieYes Limited — CookieYes CMP"
						description={
							<>
								Plataforma de gestión del consentimiento de cookies (CMP). CookieYes
								escanea y clasifica automáticamente las cookies del sitio, muestra el
								banner de consentimiento y registra las preferencias del usuario.
								CookieYes Limited (Reino Unido), operada por Mozilor Technologies Pvt.
								Ltd., cumple con el RGPD como encargado del tratamiento. El Reino Unido
								cuenta con decisión de adecuación de la Comisión Europea y, para el
								resto de transferencias internacionales, su contrato de encargo
								incorpora las cláusulas contractuales tipo (SCC). Para más detalles,
								consulta la{" "}
								<a
									href="https://www.cookieyes.com/privacy-policy/"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de privacidad de CookieYes
								</a>
								.
							</>
						}
					/>
					<TransferItem
						name="Cloudflare Inc. — Seguridad y Protección Anti-bots"
						description={
							<>
								Proveedor de servicios de seguridad y red de distribución de contenido
								(CDN). Cloudflare procesa las direcciones IP de los visitantes y
								gestiona el servicio Turnstile para la verificación anti-bots en
								nuestros formularios públicos (feedback y reclutamiento), con el fin de
								proteger el sitio contra envíos automatizados maliciosos. Cloudflare
								está certificado bajo el Marco de Privacidad de Datos UE-EE. UU. (Data
								Privacy Framework). Para más detalles, consulta la{" "}
								<a
									href="https://www.cloudflare.com/privacypolicy/"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de privacidad de Cloudflare
								</a>
								.
							</>
						}
					/>
					<TransferItem
						name="Google LLC — Analytics y AdSense"
						description={
							<>
								Cuando aceptas las cookies de analítica o publicidad, los datos se
								envían a servidores de Google en Estados Unidos. Google está certificado
								bajo el Marco de Privacidad de Datos UE-EE. UU. (Data Privacy
								Framework), garantizando un nivel adecuado de protección. Para más
								detalles, consulta{" "}
								<a
									href="https://policies.google.com/privacy"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									la política de privacidad de Google
								</a>{" "}
								y nuestra{" "}
								<Link
									href="/cookies"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de cookies
								</Link>
								.
							</>
						}
					/>
				</div>
				<p className="text-zinc-300 leading-relaxed text-sm">
					Además participamos en programas de afiliación. Si aceptas las cookies de
					publicidad o pulsas uno de sus enlaces, el comercio correspondiente recibe
					tu dirección IP y la dirección de la página desde la que llegas (referrer)
					para atribuir la visita o la compra. Actúan como responsables
					independientes del tratamiento, con sus propias políticas de privacidad y
					de cookies, y sin tu consentimiento no se carga ningún banner, script ni
					creatividad de estos programas.
				</p>
				<div className="space-y-4">
					<TransferItem
						name="Aliasing DMCC — Instant Gaming"
						description={
							<>
								Programa de afiliación de venta de claves de videojuegos. Con tu
								consentimiento de publicidad se carga su banner y se comunican tu
								dirección IP y la URL de origen para atribuir la visita o la compra. Lo
								opera Aliasing DMCC (Jumeirah Lakes Towers, Dubái, Emiratos Árabes
								Unidos), que actúa como responsable independiente. Los Emiratos Árabes
								Unidos no cuentan con decisión de adecuación de la Comisión Europea, por
								lo que la comunicación se ampara en tu consentimiento explícito (art.
								49.1.a RGPD) y se limita a esos datos técnicos. Más información en su{" "}
								<a
									href="https://www.instant-gaming.com/en/privacy-policy/"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de privacidad
								</a>
								.
							</>
						}
					/>
					<TransferItem
						name="Proton AG — Proton VPN"
						description={
							<>
								Programa de afiliación de Proton VPN. Con tu consentimiento de
								publicidad se carga su creatividad desde el CDN de Proton y, al pulsar
								su enlace, se comunican tu dirección IP y la URL de origen. Proton AG
								(Route de la Galaise 32, 1228 Plan-les-Ouates, Ginebra, Suiza) actúa
								como responsable independiente; Suiza cuenta con decisión de adecuación
								de la Comisión Europea. Más información en su{" "}
								<a
									href="https://protonvpn.com/privacy-policy"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de privacidad
								</a>
								.
							</>
						}
					/>
					<TransferItem
						name="RestedXP"
						description={
							<>
								Tienda de guías de subida de nivel. Con tu consentimiento de publicidad
								se carga su creatividad desde su propio dominio y, al pulsar su enlace
								de afiliado, se comunican tu dirección IP y la URL de origen para
								atribuir la visita. Actúa como responsable independiente y aplica su
								propia{" "}
								<a
									href="https://shop.restedxp.com/privacy-policy/"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de privacidad
								</a>
								.
							</>
						}
					/>
				</div>
			</div>
		</PrivacidadSection>
	);
}
