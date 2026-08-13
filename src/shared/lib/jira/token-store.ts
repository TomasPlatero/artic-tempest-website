import "server-only";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";

const TABLE = "jira_oauth_tokens";
const ROW_ID = 1;

export type StoredTokens = {
	access_token: string | null;
	refresh_token: string;
	token_type: string;
	expires_at: string | null;
	cloud_id: string | null;
};

export async function getStoredTokens(): Promise<StoredTokens | null> {
	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.select("access_token, refresh_token, token_type, expires_at, cloud_id")
		.eq("id", ROW_ID)
		.maybeSingle();

	if (error) throw error;
	return (data as StoredTokens) ?? null;
}

export async function saveTokens(input: {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	expiresAt: Date;
	cloudId: string;
}): Promise<void> {
	const { error } = await supabaseAdmin.from(TABLE).upsert(
		{
			id: ROW_ID,
			access_token: input.accessToken,
			refresh_token: input.refreshToken,
			token_type: input.tokenType,
			expires_at: input.expiresAt.toISOString(),
			cloud_id: input.cloudId,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "id" },
	);

	if (error) throw error;
}
