import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconBrandDiscord,
  IconCheck,
  IconPackage,
  IconShieldCheck,
} from "@/shared/ui/tabler-icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

function formatBrandText(text: string) {
  const parts: Array<string | ReactNode> = [];
  const brandPattern = /Artic Tempest|Team Pantalones/g;
  let lastIndex = 0;

  for (const match of text.matchAll(brandPattern)) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(<strong key={`${parts.length}-${match[0]}`}>{match[0]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

const boostStats = [
  { label: "Horario", value: "Todos los viernes" },
  { label: "Invites", value: "17:15" },
  { label: "Puntualidad", value: "Imprescindible" },
  { label: "Comunidad", value: "Team Pantalones" },
];

const discordLinks = {
  applyGuildTeam:
    "https://discord.com/channels/958709885313351680/1396972591260110858",
  articTempestRaids:
    "https://discord.com/channels/958709885313351680/1491870265024450741",
  brooxar: "https://discord.com/users/296014209307770892",
  darknomi: "https://discord.com/users/279403463887290380",
};

const realmStatusUrl =
  "https://worldofwarcraft.blizzard.com/es-es/game/status/eu";

const accessSteps: Array<
  | string
  | {
      kind: "link";
      label: string;
      href: string;
      text: string;
    }
  | {
      kind: "dm-mentions";
    }
> = [
  {
    kind: "link",
    label: "Accede al Discord de Team Pantalones:",
    href: "https://discord.gg/fhgrpDVUUK",
    text: "https://discord.gg/fhgrpDVUUK",
  },
  "Entra en #apply y publica la URL de tu Raider.io del personaje principal.",
  { kind: "dm-mentions" },
  "Ve a #aplicar-guild-team, pulsa en abrir selector de guilds/team y selecciona tu personaje y Artic Tempest.",
  "Una vez aceptado, tendrás acceso a los canales de boost de Artic Tempest y de Team Pantalones.",
  "Aplica en #artictempest-raids con el personaje, luego haz click de nuevo y elige la spec de tu pj.",
];

const requirements = [
  "Todo booster tiene que venir full enchant y engemado (con meta) con al RANGO MÁXIMO.",
  "Todo booster trae sus consumibles: Frasco, comidas y aceites de Rango Máximo | Prepotis de Rango 1 como mínimo | Runas no obligatorias.",
  "Todo booster se compromete a venir los viernes a los bosteos a los que se apunta.",
];

const reminders = [
  "Si no cumples estas obligaciones, se te puede sancionar tanto monetariamente (te pagarán menos) o durante un mes se te llevará de boosteo.",
];

function BoostsHero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-blue-500/10 via-white/[0.03] to-transparent p-6 shadow-2xl shadow-black/20 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%)]" />
      <div className="relative space-y-5">
        <div className="max-w-4xl space-y-3">
          <h1 className="text-3xl font-semibold uppercase tracking-tighter text-white md:text-5xl">
            Guía de Boosters
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/65 md:text-base">
            {formatBrandText(
              "Artic Tempest + Team Pantalones. Esta guía explica el proceso de acceso, configuración y normas para todos los miembros que participen en boosts dentro de la comunidad Team Pantalones.",
            )}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {boostStats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-zinc-950/20 px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {item.label === "Comunidad" ? (
                  <Link
                    href="https://discord.gg/fhgrpDVUUK"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                  >
                    {formatBrandText(item.value)}
                  </Link>
                ) : (
                  formatBrandText(item.value)
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-100">
          {formatBrandText(
            "Guía informativa para los boosts de Artic Tempest y Team Pantalones.",
          )}
        </div>
      </div>
    </section>
  );
}

function AccessStepCard() {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3 text-white">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
            <IconBrandDiscord className="size-5" />
          </div>
          <CardTitle className="text-xl uppercase tracking-tight">
            Paso 1 - Como añadir tu pj para boostear
          </CardTitle>
        </div>
        <p className="text-sm text-white/55">
          Acceso a la comunidad y pasos para quedar correctamente configurado dentro de {formatBrandText("Team Pantalones")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 rounded-2xl border border-white/8 bg-zinc-950/20 p-4">
          {accessSteps.map((step) => {
            if (typeof step !== "string" && step.kind === "link") {
              return (
                <div key={step.href} className="flex gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-sky-400" />
                  <span>
                    {formatBrandText(step.label)}{" "}
                    <Link
                      href={step.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                    >
                      {step.text}
                    </Link>
                  </span>
                </div>
              );
            }

            if (typeof step !== "string" && step.kind === "dm-mentions") {
              return (
                <div key="dm-mentions" className="flex gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-sky-400" />
                  <span>
                    Notifica a{" "}
                    <Link
                      href={discordLinks.brooxar}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                    >
                      @Brooxär
                    </Link>{" "}
                    o{" "}
                    <Link
                      href={discordLinks.darknomi}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                    >
                      @Darknomi
                    </Link>{" "}
                    para que te acepten el apply.
                  </span>
                </div>
              );
            }

            if (typeof step === "string" && step.startsWith("Ve a #aplicar-guild-team")) {
              return (
                <div key={step} className="flex gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-sky-400" />
                  <span>
                    Ve a{" "}
                    <Link
                      href={discordLinks.applyGuildTeam}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                    >
                      #aplicar-guild-team
                    </Link>{" "}
                    , pulsa en abrir selector de guilds/team y selecciona tu personaje y {formatBrandText("Artic Tempest")}
                  </span>
                </div>
              );
            }

            if (typeof step === "string" && step.startsWith("Aplica en #artictempest-raids")) {
              return (
                <div key={step} className="flex gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-sky-400" />
                  <span>
                    Aplica en{" "}
                    <Link
                      href={discordLinks.articTempestRaids}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                    >
                      #artictempest-raids
                    </Link>{" "}
                    {formatBrandText(
                      "con el personaje, luego haz click de nuevo y elige la spec de tu pj.",
                    )}
                  </span>
                </div>
              );
            }

            return (
              <div key={step} className="flex gap-3 text-sm leading-relaxed text-white/75">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-sky-400" />
                <span>{formatBrandText(step)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentSetupCard() {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3 text-white">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
            <IconPackage className="size-5" />
          </div>
          <CardTitle className="text-xl uppercase tracking-tight">
            Paso 2 - Configurar personaje para cobrar
          </CardTitle>
        </div>
        <p className="text-sm text-white/55">
          Configura el personaje que recibirá los pagos desde Zona Raider de {formatBrandText("Team Pantalones")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <Link
              href="https://teampantalones.es/zona-raider"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-blue-400/40 hover:bg-blue-500/10"
            >
              <IconPackage className="size-4 text-blue-300" />
              {formatBrandText("https://teampantalones.es/zona-raider")}
            </Link>

            <div className="space-y-4 rounded-2xl border border-white/8 bg-zinc-950/20 p-4">
              <div className="space-y-2 text-sm leading-relaxed text-white/75">
                <p className="font-semibold text-white">Pasos para añadir tu personaje de pago</p>
                <p>1️⃣ Entra en la web con Discord (Botón Naranja 🟧)</p>
                <p>2️⃣ Una vez dentro de Zona Raider, arriba a la derecha → Personajes</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/8 bg-zinc-950/20 p-4">
                <div className="flex items-start gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span className="space-y-2">
                    <span className="block font-semibold text-white">
                      Si tu personaje es Horda de Macroserver Sanguino:
                    </span>
                    <span className="block">
                      En tu personaje debería tener un icono de un billete 💵 esto lo configurará para que ese mismo personaje sea el que reciba los pagos.
                    </span>
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span className="space-y-2">
                    <span className="block font-semibold text-white">
                      Si tu personaje es Alianza o Horda de otro reino
                    </span>
                    <span className="block">
                      Debes tener un personaje con estas características para recibir los pagos:
                    </span>
                    <span className="block flex items-center gap-2 font-semibold text-white">
                      Facción:
                      <span className="inline-flex items-center gap-1">
                        <Image
                          src="/assets/images/icons/horde.webp"
                          alt="Horda"
                          width={18}
                          height={18}
                          className="size-4"
                        />
                        Horda
                      </span>
                    </span>
                    <span className="block">
                      Reino español: {" "}
                      <Link
                        href={realmStatusUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                      >
                        Zul&apos;jin
                      </Link>
                      , {" "}
                      <Link
                        href={realmStatusUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                      >
                        Sanguino
                      </Link>
                      , {" "}
                      <Link
                        href={realmStatusUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                      >
                        Shen&apos;dalar
                      </Link>
                      {" "}
                      o {" "}
                      <Link
                        href={realmStatusUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline decoration-white/30 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
                      >
                        Uldum
                      </Link>
                      (Macroserver)
                    </span>
                    <span className="block">Mínimo nivel 10.</span>
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span>
                    Puedes crearte un personaje en Sanguino Raza aliada o subirte un personaje a nivel 10.
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm leading-relaxed text-white/75">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span>
                    Añádelo manualmente o búscalo automáticamente pero no se te olvide marcar el check de &quot;Usar como personaje de pago&quot;.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/8 bg-zinc-950/20">
            <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3 text-sm font-semibold text-white">
              <IconShieldCheck className="size-4 text-blue-300" />
              Ejemplo de personaje de pago
            </div>
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/assets/images/bosteos/personaje-de-pago.webp"
                alt="Ejemplo de personaje de pago"
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-contain p-4"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RulesCard() {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3 text-white">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
            <IconShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-xl uppercase tracking-tight">
            Obligaciones de todos los raiders en el boost
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {requirements.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/8 bg-zinc-950/20 p-4 text-sm leading-relaxed text-white/75"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-2xl border border-white/8 bg-zinc-950/20 p-4">
          <p className="text-sm font-semibold text-white">Obligaciones importantes</p>
          <ul className="space-y-2">
            {[
              "Todo booster tiene que venir preparado para rendir desde el primer invite.",
              "Si no cumples, puede haber sanción monetaria o retirada temporal de boosteo.",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm text-white/70">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <span>{formatBrandText(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ConsequencesCard() {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3 text-white">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
            <IconAlertTriangle className="size-5" />
          </div>
          <CardTitle className="text-xl uppercase tracking-tight">
            Incumplir tiene consecuencias
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-white/8 bg-zinc-950/20 p-4">
          {reminders.map((item) => (
            <div key={item} className="flex gap-3 text-sm leading-relaxed text-white/75">
              <IconCheck className="mt-0.5 size-4 shrink-0 text-rose-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BoostsContent() {
  return (
    <div className="space-y-6 pb-6">
      <BoostsHero />
      <div className="space-y-6">
        <AccessStepCard />
        <PaymentSetupCard />
        <RulesCard />
        <ConsequencesCard />
      </div>
    </div>
  );
}
