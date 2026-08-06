export type PermissionState = {
	canView: boolean;
	canEdit: boolean;
	canManage: boolean;
};

export type GuildInfo = {
	name: string;
	realm: string;
	region: string;
	iconUrl?: string | null;
	mobileIconUrl?: string | null;
	publicLogoUrl?: string | null;
	version: string;
};

export type CredentialsData = {
	discord_client_id: string;
	discord_client_secret: string;
	discord_guild_id: string;
	bnet_client_id: string;
	bnet_client_secret: string;
	wcl_client_id: string;
	wcl_client_secret: string;
	sources?: {
		discord: "db" | "env";
		bnet: "db" | "env";
		api: "db" | "env";
	};
};

export type SettingsGeneralState = {
	uploading: boolean;
	uploadingMobile: boolean;
	uploadingPublic: boolean;
	activePicker: "main" | "mobile" | "public" | null;
	version: string;
	savingVersion: boolean;
	tourEnabled: boolean;
	savingTour: boolean;
	guildInfo: {
		name: string;
		realm: string;
		region: string;
	};
	savingGuild: boolean;
};
