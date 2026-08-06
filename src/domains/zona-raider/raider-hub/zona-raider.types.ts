import type { DiscordChannelMessage } from "@/shared/discord/channel-messages";

export type ZonaRaiderCharacter = {
  id: string;
  name: string;
  realm: string;
  realm_slug: string | null;
  class_id: number;
  level: number;
  spec: string | null;
  item_level: number | null;
  thumbnail_url: string | null;
};

export type ZonaRaiderEvent = {
  id: string;
  title: string;
  destination: string | null;
  description: string | null;
  event_date: string;
  end_date: string | null;
  event_type: string | null;
  difficulty: string | null;
  status: string | null;
  background_url: string | null;
};

export type ZonaRaiderData = {
  guildName: string;
  userName: string;
  roleLevel: string;
  recentLogs: ZonaRaiderLog[];
  myCharacters: ZonaRaiderCharacter[];
  mainCharacter: ZonaRaiderCharacter | null;
  activeCharacter: ZonaRaiderCharacter | null;
  activeCharacterScore: number | null;
  activeCharacterSpec: string | null;
  activeCharacterRaidProgress: string | null;
  activeCharacterRioUrl: string | null;
  isBnetLinked: boolean;
  rosterCount: number;
  raidProgress: string;
  canReviewRecruitment: boolean;
  recruitmentPendingCount: number;
  lastBnetSync: string | null;
  discordMessages: DiscordChannelMessage[];
  discordGuildId: string | null;
  discordChannelId: string;
};

export type ZonaRaiderLog = {
  code: string;
  title: string;
  startTime: number;
  zone: {
    name: string;
  } | null;
};
