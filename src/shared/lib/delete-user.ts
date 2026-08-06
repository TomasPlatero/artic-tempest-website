import { supabaseAdmin } from "@/shared/lib/supabase-admin";

type DeleteByIdsConfig = {
	table: string;
	column: string;
	values: string[];
};

type DeleteByValueConfig = {
	table: string;
	column: string;
	value: string;
};

async function deleteByIds({ table, column, values }: DeleteByIdsConfig) {
	if (!values.length) return;
	const { error } = await supabaseAdmin.from(table).delete().in(column, values);
	if (error) {
		throw new Error(`[${table}] ${error.message}`);
	}
}

async function deleteByValue({ table, column, value }: DeleteByValueConfig) {
	const { error } = await supabaseAdmin.from(table).delete().eq(column, value);
	if (error) {
		throw new Error(`[${table}] ${error.message}`);
	}
}

export async function deleteUserAndRelatedData(userId: string) {
	// ── User's chat messages and sessions ──
	await deleteByValue({
		table: "zona_raider_chat_messages",
		column: "user_id",
		value: userId,
	});
	await deleteByValue({
		table: "zona_raider_chat_sessions",
		column: "user_id",
		value: userId,
	});

	// ── Season roster entries (must be before bnet_characters due to FK) ──
	await deleteByValue({
		table: "season_rosters",
		column: "user_id",
		value: userId,
	});

	await deleteByValue({
		table: "guild_members",
		column: "profile_id",
		value: userId,
	});

	// Recruitment applications and their children
	const { data: recruitmentRows, error: recruitmentError } = await supabaseAdmin
		.from("recruitment_applications")
		.select("id")
		.eq("user_id", userId);

	if (recruitmentError) {
		throw new Error(`[recruitment_applications] ${recruitmentError.message}`);
	}

	const applicationIds = (recruitmentRows || []).flatMap((row) =>
		row.id ? [row.id] : [],
	);

	if (applicationIds.length > 0) {
		const applicationLinkedTables: DeleteByIdsConfig[] = [
			{
				table: "application_answers",
				column: "application_id",
				values: applicationIds,
			},
			{
				table: "application_messages",
				column: "application_id",
				values: applicationIds,
			},
			{
				table: "recruitment_application_events",
				column: "application_id",
				values: applicationIds,
			},
		];

		await Promise.all(
			applicationLinkedTables.map((config) => deleteByIds(config)),
		);
	}

	await deleteByValue({
		table: "recruitment_applications",
		column: "user_id",
		value: userId,
	});

	// Messages authored by this user on OTHER people's applications
	await deleteByValue({
		table: "application_messages",
		column: "author_id",
		value: userId,
	});

	// ── Raider rules acceptance ──
	await deleteByValue({
		table: "raider_rules_acceptances",
		column: "user_id",
		value: userId,
	});

	// ── Media ──
	await deleteByValue({
		table: "media_metadata",
		column: "uploaded_by",
		value: userId,
	});
	// media_folders.created_by is nullable, just nullify is safer than deleting shared folders
	await supabaseAdmin
		.from("media_folders")
		.update({ created_by: null })
		.eq("created_by", userId);

	// ── API tokens ──
	await supabaseAdmin
		.from("public_api_tokens")
		.update({ revoked_by: null })
		.eq("revoked_by", userId);
	await deleteByValue({
		table: "public_api_tokens",
		column: "created_by",
		value: userId,
	});

	const singleValueTables: DeleteByValueConfig[] = [
		{ table: "bnet_characters", column: "user_id", value: userId },
		{ table: "feedback", column: "user_id", value: userId },
		{ table: "user_notifications_read", column: "user_id", value: userId },
		{ table: "verification_logs", column: "user_id", value: userId },
		{ table: "weekly_vault_screenshots", column: "profile_id", value: userId },
	];

	await Promise.all(singleValueTables.map((config) => deleteByValue(config)));

	// Nullify banned_by references on other profiles (NO ACTION FK)
	await supabaseAdmin
		.from("profiles")
		.update({ banned_by: null })
		.eq("banned_by", userId);

	// Finally, delete the profile itself
	await deleteByValue({ table: "profiles", column: "user_id", value: userId });
}
