"use client";

import Link from "next/link";
import {
	IconShieldCheck,
	IconLock,
	IconEye,
	IconTrash,
	IconFileText,
	IconScale,
	IconAlertTriangle,
} from "@/shared/ui/tabler-icons";

interface SectionProps {
	id: string;
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

function PrivacidadSection({
	id,
	title,
	icon,
	children,
	className = "",
}: SectionProps) {
	return (
		<section
			className={`bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8 ${className}`}
			aria-labelledby={id}
		>
			<div className="flex items-center gap-4 border-b border-white/5 pb-6">
				<div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
					{icon}
				</div>
				<h2
					id={id}
					className="text-2xl font-semibold text-white uppercase tracking-tight m-0"
				>
					{title}
				</h2>
			</div>
			{children}
		</section>
	);
}

export function PrivacidadContentSections() {
	return (
		<div className="prose prose-invert max-w-none space-y-16">
			<PrivacidadSection
				id="data-title"
				title="2. Datos que recopilamos y su finalidad"
				icon={
					<IconFileText className="text-blue-400 size-6" aria-hidden="true" />
				}
				className="bg-white/5 md:p-12 rounded-[40px] border-white/10 backdrop-blur-xl"
			>
				<div className="grid gap-8">
					<div className="space-y-4">
						<h3 className="text-white font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
							<div
								className="size-2 rounded-full bg-blue-500"
								aria-hidden="true"
							/>
							Autenticación (Discord / Battle.net)
						</h3>
						<p className="text-zinc-300 text-sm leading-relaxed">
							Al iniciar sesión mediante OAuth2 de Discord y/o Battle.net,
							recibimos de dichas plataformas tu ID de usuario, nombre de
							usuario, avatar, y en el caso de Discord, los roles que tienes en
							nuestro servidor. Esta información es necesaria para identificar a
							los miembros de la hermandad y asignar los permisos
							correspondientes dentro del panel Zona Raider.
						</p>
						<div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5">
							<p className="text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">
								Base legal:
							</p>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Ejecución de la relación comunitaria (art. 6.1.b RGPD) e interés
								legítimo del responsable en la gestión de la comunidad (art.
								6.1.f RGPD).
							</p>
						</div>
					</div>
					<div className="space-y-4">
						<h3 className="text-white font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
							<div
								className="size-2 rounded-full bg-blue-500"
								aria-hidden="true"
							/>
							Formularios (Feedback, Reclutamiento, Contacto)
						</h3>
						<p className="text-zinc-300 text-sm leading-relaxed">
							Los datos que nos proporcionas voluntariamente a través de
							nuestros formularios (nombre, correo electrónico, mensajes,
							personajes de WoW, archivos adjuntos) se recopilan exclusivamente
							para tramitar y dar respuesta a tu solicitud. Los campos
							obligatorios se identifican como tales en cada formulario.
						</p>
						<div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5">
							<p className="text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">
								Base legal:
							</p>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Consentimiento explícito del interesado (art. 6.1.a RGPD), que
								puedes retirar en cualquier momento sin que ello afecte a la
								licitud del tratamiento previo.
							</p>
						</div>
					</div>
					<div className="space-y-4">
						<h3 className="text-white font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
							<div
								className="size-2 rounded-full bg-blue-500"
								aria-hidden="true"
							/>
							Personajes vinculados y actividad de raid
						</h3>
						<p className="text-zinc-300 text-sm leading-relaxed">
							Cuando vinculas tus personajes de WoW a través de la Zona Raider,
							recopilamos los identificadores de personaje, logs de combate,
							progreso de raid y estadísticas agregadas. Esta información se
							utiliza para la coordinación interna del roster, la elaboración de
							rankings y la gestión del botín.
						</p>
						<div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5">
							<p className="text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">
								Base legal:
							</p>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Interés legítimo en la organización de la actividad de la
								hermandad (art. 6.1.f RGPD) y, cuando proceda, ejecución de la
								relación de miembro (art. 6.1.b RGPD).
							</p>
						</div>
					</div>
				</div>
			</PrivacidadSection>

			<PrivacidadSection
				id="transfer-title"
				title="4. Destinatarios y Transferencias Internacionales"
				icon={<IconEye className="text-blue-400 size-6" aria-hidden="true" />}
			>
				<div className="space-y-4">
					<p className="text-zinc-300 leading-relaxed text-sm">
						No vendemos, alquilamos ni cedemos tus datos personales a terceros
						con fines comerciales. Los datos pueden ser compartidos con los
						siguientes encargados de tratamiento:
					</p>
					<div className="space-y-4">
						<div className="bg-zinc-950/40 p-5 rounded-xl border border-white/5">
							<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
								Supabase Inc.
							</h3>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Proveedor de base de datos PostgreSQL. Los datos se almacenan en
								servidores dentro del Espacio Económico Europeo (eu-west-1).
								Supabase cumple con el RGPD como encargado del tratamiento, con
								medidas de cifrado en reposo y en tránsito.
							</p>
						</div>
						<div className="bg-zinc-950/40 p-5 rounded-xl border border-white/5">
							<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
								Vercel Inc.
							</h3>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Plataforma de alojamiento y despliegue del sitio web. Los datos
								de navegación pueden procesarse en servidores ubicados en
								Estados Unidos. Vercel cumple con el RGPD mediante cláusulas
								contractuales tipo (SCC) y medidas técnicas y organizativas
								apropiadas.
							</p>
						</div>
						<div className="bg-zinc-950/40 p-5 rounded-xl border border-white/5">
							<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
								Cybot A/S — Cookiebot CMP
							</h3>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Plataforma de gestión de consentimiento de cookies (CMP).
								Cookiebot escanea y clasifica automáticamente las cookies del
								sitio, muestra el banner de consentimiento y almacena las
								preferencias del usuario. Los datos se procesan en servidores
								dentro del Espacio Económico Europeo (Microsoft Azure, región
								UE). Cybot A/S cumple con el RGPD como encargado del
								tratamiento. Para más detalles, consulta la{" "}
								<a
									href="https://www.cookiebot.com/es/privacy-policy/"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de privacidad de Cookiebot
								</a>
								.
							</p>
						</div>
						<div className="bg-zinc-950/40 p-5 rounded-xl border border-white/5">
							<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
								Cloudflare Inc. — Seguridad y Protección Anti-bots
							</h3>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Proveedor de servicios de seguridad y red de distribución de
								contenido (CDN). Cloudflare procesa las direcciones IP de los
								visitantes y gestiona el servicio Turnstile para la verificación
								anti-bots en nuestros formularios públicos (feedback y
								reclutamiento), con el fin de proteger el sitio contra envíos
								automatizados maliciosos. Cloudflare está certificado bajo el
								Marco de Privacidad de Datos UE-EE. UU. (Data Privacy
								Framework). Para más detalles, consulta la{" "}
								<a
									href="https://www.cloudflare.com/privacypolicy/"
									target="_blank"
									rel="noreferrer"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									política de privacidad de Cloudflare
								</a>
								.
							</p>
						</div>
						<div className="bg-zinc-950/40 p-5 rounded-xl border border-white/5">
							<h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">
								Google LLC — Analytics y AdSense
							</h3>
							<p className="text-xs text-zinc-400 leading-relaxed">
								Cuando aceptas las cookies de analítica o publicidad, los datos
								se envían a servidores de Google en Estados Unidos. Google está
								certificado bajo el Marco de Privacidad de Datos UE-EE. UU.
								(Data Privacy Framework), garantizando un nivel adecuado de
								protección. Para más detalles, consulta{" "}
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
							</p>
						</div>
					</div>
				</div>
			</PrivacidadSection>

			<PrivacidadSection
				id="security-title"
				title="5. Medidas de Seguridad"
				icon={<IconLock className="text-blue-400 size-6" aria-hidden="true" />}
			>
				<p className="text-zinc-300 leading-relaxed text-sm">
					Aplicamos las medidas técnicas y organizativas necesarias para
					garantizar la seguridad de los datos personales, de acuerdo con el
					artículo 32 del RGPD. Entre ellas se incluyen:
				</p>
				<ul className="text-zinc-300 space-y-2 text-sm list-disc list-inside">
					<li>
						Cifrado en tránsito mediante TLS 1.3 en todas las comunicaciones.
					</li>
					<li>Cifrado en reposo de la base de datos PostgreSQL (Supabase).</li>
					<li>
						Autenticación mediante OAuth2 estándar con proveedores verificados
						(Discord, Battle.net), sin almacenamiento de contraseñas en nuestros
						sistemas.
					</li>
					<li>
						Acceso restringido a datos personales exclusivamente a
						administradores y officers de la hermandad, mediante control de
						roles en la base de datos.
					</li>
					<li>
						Política de seguridad de contenido (CSP) estricta para mitigar
						ataques XSS y de inyección.
					</li>
					<li>
						Protección anti-bots mediante Cloudflare Turnstile en formularios
						públicos, verificando solicitudes sin recopilar datos personales
						adicionales.
					</li>
					<li>
						Monitorización continua de la infraestructura y actualización
						periódica de dependencias.
					</li>
				</ul>
				<p className="text-zinc-300 leading-relaxed text-sm">
					En caso de violación de la seguridad de los datos personales,
					notificaremos a la Agencia Española de Protección de Datos (AEPD) en
					un plazo máximo de 72 horas, así como a los interesados cuando sea
					probable que dicha violación entrañe un alto riesgo para sus derechos
					y libertades.
				</p>
			</PrivacidadSection>

			<PrivacidadSection
				id="rights-title"
				title="8. Tus Derechos"
				icon={<IconTrash className="text-blue-400 size-6" aria-hidden="true" />}
				className="bg-blue-500/5 rounded-[40px] border-blue-500/10"
			>
				<p className="text-zinc-300 leading-relaxed text-sm">
					De acuerdo con los artículos 15 a 22 del RGPD y los artículos 11 a 18
					de la LOPD-GDD, puedes ejercer los siguientes derechos:
				</p>
				<ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
					{[
						{
							title: "Acceso",
							desc: "Saber qué datos tuyos tratamos y obtener copia.",
						},
						{
							title: "Rectificación",
							desc: "Corregir datos inexactos o incompletos.",
						},
						{
							title: "Supresión",
							desc: "Solicitar el borrado de tus datos (derecho al olvido).",
						},
						{
							title: "Limitación",
							desc: "Restringir el tratamiento en determinados casos.",
						},
						{
							title: "Portabilidad",
							desc: "Recibir tus datos en un formato estructurado.",
						},
						{
							title: "Oposición",
							desc: "Oponerte al tratamiento basado en interés legítimo.",
						},
						{
							title: "Retirada del consentimiento",
							desc: "Revocar el consentimiento otorgado en cualquier momento.",
						},
						{
							title: "Reclamación ante la AEPD",
							desc: "Presentar una queja ante la autoridad de control.",
						},
					].map((item) => (
						<li
							key={item.title}
							className="flex items-start gap-3 text-sm text-white/85 font-semibold"
						>
							<IconShieldCheck
								className="size-5 text-blue-500 shrink-0 mt-0.5"
								aria-hidden="true"
							/>
							<div>
								<span className="text-white">{item.title}</span>
								<span className="block text-xs text-zinc-400 font-normal mt-1">
									{item.desc}
								</span>
							</div>
						</li>
					))}
				</ul>
				<div className="mt-8 pt-8 border-t border-blue-500/20 space-y-3">
					<p className="text-sm text-blue-100/90 font-semibold leading-relaxed">
						Para ejercer cualquiera de estos derechos, envíanos un correo a{" "}
						<strong className="text-white">admin@artictempest.es</strong>{" "}
						indicando el derecho que deseas ejercer y adjuntando una copia de tu
						documento de identidad. Responderemos en el plazo máximo de un mes,
						ampliable a dos meses en casos de especial complejidad.
					</p>
					<p className="text-sm text-blue-100/90 font-semibold leading-relaxed">
						Si consideras que no hemos atendido correctamente tu solicitud,
						puedes presentar una reclamación ante la{" "}
						<strong className="text-white">
							Agencia Española de Protección de Datos (AEPD)
						</strong>{" "}
						a través de su sede electrónica en{" "}
						<a
							href="https://www.aepd.es"
							target="_blank"
							rel="noreferrer"
							className="text-white hover:text-blue-300 underline"
						>
							www.aepd.es
						</a>
						.
					</p>
				</div>
			</PrivacidadSection>

			<PrivacidadSection
				id="cookies-title"
				title="6. Cookies y Tecnologías de Seguimiento"
				icon={<IconEye className="text-purple-400 size-6" aria-hidden="true" />}
				className="bg-white/5 md:p-12 rounded-[40px] border-white/10 backdrop-blur-xl"
			>
				<div className="space-y-6">
					<p className="text-zinc-300 text-sm leading-relaxed">
						Utilizamos cookies técnicas necesarias para el funcionamiento del
						sitio y, con tu consentimiento, cookies analíticas (Google Analytics
						4) y publicitarias (Google AdSense) cuando estos servicios están
						activos en la configuración del sitio. La cookie{" "}
						<code>CookieConsent</code> de Cookiebot CMP y{" "}
						<code>cf_clearance</code> de Cloudflare Turnstile son estrictamente
						necesarias y no requieren consentimiento. La base legal para las
						cookies necesarias es el interés legítimo (art. 6.1.f RGPD); para
						las analíticas y publicitarias, tu consentimiento explícito (art.
						6.1.a RGPD), gestionado a través de Cookiebot CMP.
					</p>
					<p className="text-zinc-300 text-sm leading-relaxed">
						Puedes modificar o retirar tu consentimiento en cualquier momento
						desde el enlace de configuración de cookies que aparece en el banner
						de consentimiento. Para información detallada sobre cada cookie, su
						duración y finalidad, consulta nuestra{" "}
						<Link
							href="/cookies"
							className="text-blue-400 hover:text-blue-300 underline"
						>
							política de cookies
						</Link>
						.
					</p>
				</div>
			</PrivacidadSection>

			<PrivacidadSection
				id="ads-title"
				title="7. Publicidad de Google AdSense"
				icon={
					<IconAlertTriangle
						className="text-amber-400 size-6"
						aria-hidden="true"
					/>
				}
			>
				<div className="space-y-4">
					<p className="text-zinc-300 text-sm leading-relaxed">
						Cuando la monetización está activa en la configuración del sitio,
						Google AdSense puede mostrar anuncios en las páginas públicas. Este
						servicio utiliza cookies para medición y atribución publicitaria. La
						personalización de anuncios requiere tu consentimiento explícito,
						gestionado a través del banner de cookies.
					</p>
					<div className="bg-zinc-950/40 p-5 rounded-xl border border-white/5">
						<p className="text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">
							Cookies utilizadas:
						</p>
						<p className="text-xs text-zinc-400 leading-relaxed">
							<code>_gcl_au</code>, <code>_gcl_aw</code> — cookies de medición
							de conversiones y atribución. Duración aproximada de 90 días.
						</p>
					</div>
					<p className="text-xs text-zinc-400 leading-relaxed">
						Google LLC puede acceder a datos derivados de la entrega de anuncios
						y su medición. Consulta la{" "}
						<a
							href="https://policies.google.com/technologies/partner-sites"
							target="_blank"
							rel="noreferrer"
							className="text-blue-400 hover:text-blue-300 underline"
						>
							política de Google sobre el uso de datos en sitios asociados
						</a>
						.
					</p>
				</div>
			</PrivacidadSection>

			<PrivacidadSection
				id="automated-title"
				title="9. Decisiones Automatizadas y Elaboración de Perfiles"
				icon={<IconScale className="text-blue-400 size-6" aria-hidden="true" />}
			>
				<p className="text-zinc-300 leading-relaxed text-sm">
					No utilizamos procesos de toma de decisiones automatizadas —incluida
					la elaboración de perfiles— que produzcan efectos jurídicos sobre los
					interesados o les afecten significativamente de modo similar, según lo
					previsto en el artículo 22 del RGPD.
				</p>
			</PrivacidadSection>
		</div>
	);
}
