const OFFICIAL_ROLE_ID = "1264627816234745888";

type DiscordProfile = {
  discord_username?: string | null;
  discord_avatar?: string | null;
  discord_user_id?: string | null;
};

type ApplicationAnswer = {
  answer_text: string;
  question?: {
    label?: string | null;
    type?: string | null;
    order_index?: number | null;
  } | Array<{
    label?: string | null;
    type?: string | null;
    order_index?: number | null;
  }> | null;
};

type BuildRecruitmentDiscordPayloadParams = {
  application: any;
  profile?: DiscordProfile | null;
  guildIconUrl: string;
  characterLevel: number;
  charClass: { name: string; color: number };
  iLvl: string;
  raidProgress: string;
  mplusScore: number;
  answers?: ApplicationAnswer[];
  includeRolePing?: boolean;
  statusLabel?: string;
  statusColor?: number;
  components?: any[];
  thumbnailUrl?: string | null;
};

const truncate = (value: string, maxLength = 240) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

const summarizeText = (value: string, maxLength = 120) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const cut = normalized.slice(0, maxLength).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : cut.length).trimEnd()}…`;
};

const getQuestionMeta = (question: ApplicationAnswer["question"]) => {
  if (Array.isArray(question)) return question[0] || null;
  return question || null;
};

const getDiscordDisplayName = (profile?: DiscordProfile | null) => {
  return (
    profile?.discord_username?.trim() ||
    profile?.discord_user_id?.trim() ||
    "Usuario de Discord"
  );
};

const formatAnswerSummary = (answer: ApplicationAnswer, index: number) => {
  const question = getQuestionMeta(answer.question);
  const label = question?.label?.trim() || `Pregunta ${index + 1}`;
  const text = String(answer.answer_text ?? "").trim() || "Sin respuesta";
  return `**${label}**\n${summarizeText(text, 120)}`;
};

const buildAnswerFields = (answers?: ApplicationAnswer[]) => {
  if (!answers?.length) return [];

  const sortedAnswers = answers.toSorted((a, b) => {
    const orderA = getQuestionMeta(a.question)?.order_index ?? Number.MAX_SAFE_INTEGER;
    const orderB = getQuestionMeta(b.question)?.order_index ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  const lines = sortedAnswers.map((answer, index) =>
    formatAnswerSummary(answer, index),
  );

  const fields: Array<{ name: string; value: string; inline: boolean }> = [];
  const maxValueLength = 1024;
  const maxAnswerFields = 18;
  const header = "Respuestas del formulario";

  let currentChunk: string[] = [];
  let currentLength = 0;

  const pushChunk = () => {
    if (!currentChunk.length) return;
    fields.push({
      name: fields.length === 0 ? header : `${header} (${fields.length + 1})`,
      value: currentChunk.join("\n\n"),
      inline: false,
    });
    currentChunk = [];
    currentLength = 0;
  };

  for (const line of lines) {
    const extraLength = currentChunk.length ? 1 : 0;
    if (currentLength + extraLength + line.length > maxValueLength) {
      pushChunk();
    }

    currentChunk.push(line);
    currentLength += line.length + (currentChunk.length > 1 ? 1 : 0);
  }

  pushChunk();

  if (fields.length > maxAnswerFields) {
    const overflowLines = fields
      .slice(maxAnswerFields - 1)
      .flatMap((field) =>
        field.value.split("\n").map((line) => truncate(line, 80)),
      );

    const compactFields = fields.slice(0, maxAnswerFields - 1);
    compactFields.push({
      name: `${header} (${maxAnswerFields})`,
      value: truncate(overflowLines.join("\n") || "Sin más respuestas", 1024),
      inline: false,
    });

    return compactFields;
  }

  return fields;
};

export function buildRecruitmentDiscordPayload({
  application,
  profile,
  guildIconUrl,
  characterLevel,
  charClass,
  iLvl,
  raidProgress,
  mplusScore,
  answers,
  includeRolePing = false,
  statusLabel,
  statusColor,
  components,
  thumbnailUrl,
}: BuildRecruitmentDiscordPayloadParams) {
  const discordDisplayName = getDiscordDisplayName(profile);
  const specialization =
    application.character_spec?.trim() && application.character_spec !== "Unknown"
      ? application.character_spec.trim()
      : "Pendiente";
  const staticFields = [
    { name: "Nivel", value: characterLevel.toString(), inline: true },
    { name: "Nivel de Objeto", value: iLvl, inline: true },
    { name: "Progreso Raid", value: raidProgress, inline: false },
    {
      name: "Mythic+ Rating",
      value: `${mplusScore.toFixed(0)} 🛡️`,
      inline: false,
    },
    {
      name: "Estado Apply",
      value: statusLabel || "🔵 Nuevo",
      inline: true,
    },
    {
      name: "Especialización",
      value: specialization,
      inline: true,
    },
    ...buildAnswerFields(answers),
    {
      name: "Enlaces",
      value: `[Rio](https://raider.io/characters/eu/${application.character_realm.toLowerCase().replace(/\s+/g, "-")}/${application.character_name.toLowerCase()}) • [WCL](https://www.warcraftlogs.com/character/eu/${application.character_realm.toLowerCase().replace(/\s+/g, "-")}/${application.character_name.toLowerCase()}) • [Armory](https://worldofwarcraft.blizzard.com/es-es/character/eu/${application.character_realm.toLowerCase().replace(/\s+/g, "-")}/${application.character_name.toLowerCase()}) • [WFest](https://www.wipefest.gg/character/${application.character_name.toLowerCase()}/${application.character_realm.toLowerCase().replace(/\s+/g, "-")}/EU?gameVersion=warcraft-live)`,
      inline: false,
    },
  ];

  return {
    ...(includeRolePing ? { content: `<@&${OFFICIAL_ROLE_ID}>` } : {}),
    embeds: [
      {
        description: `${discordDisplayName} ha solicitado unirse a Artic Tempest.`,
        color: statusColor ?? charClass.color,
        timestamp: application.created_at,
        thumbnail: {
          url:
            thumbnailUrl ||
            `https://render.worldofwarcraft.com/eu/icons/56/classicon_${charClass.name.toLowerCase().replace(/\s+/g, "")}.jpg`,
        },
        author: {
          name: `${application.character_name} - ${application.character_realm} (EU) ${charClass.name}`,
          url: `${process.env.NEXTAUTH_URL}/zona-raider/configuracion/reclutamiento/${application.id}`,
          icon_url: profile?.discord_avatar || null,
        },
        fields: staticFields,
        footer: {
          text: "Reclutamiento Artic Tempest",
          icon_url: guildIconUrl,
        },
      },
    ],
    allowed_mentions: includeRolePing
      ? {
          roles: [OFFICIAL_ROLE_ID],
        }
      : undefined,
    ...(components ? { components } : {}),
  };
}
