import { NextResponse } from "next/server";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { getGuildCredentials } from "@/shared/auth/credentials";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { RAIDER_RULES_VERSION } from "@/shared/constants/raider-rules";
import {
  discordMemberHasVerifiedRole,
  markRaiderRulesAcceptanceState,
} from "@/shared/lib/raider-rules.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCORD_MEMBER_FETCH_DELAY_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  const session = await ensureAppPermission("settings-accounts", "manage");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const creds = await getGuildCredentials();
  if (!creds.discord_bot_token || !creds.discord_guild_id) {
    return NextResponse.json(
      { error: "Falta la configuración de Discord" },
      { status: 500 },
    );
  }

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id, discord_user_id, discord_username, role_level")
    .in("role_level", ["trial", "raider"]);

  const targetProfiles = (profiles ?? []).filter(
    (profile) => profile.discord_user_id,
  );
  const targetIds = targetProfiles.map((profile) => profile.user_id);

  const { data: acceptances } = await supabaseAdmin
    .from("raider_rules_acceptances")
    .select(
      "user_id, accepted_at, accepted_version, discord_role_assigned_at, discord_role_status, discord_role_error, discord_role_last_attempt_at",
    )
    .in("user_id", targetIds);

  const acceptanceMap = new Map(
    (acceptances ?? []).map((row) => [row.user_id, row] as const),
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      const assignedMembers: Array<{ userId: string; username: string }> = [];
      const missingMembers: Array<{ userId: string; username: string }> = [];
      const errors: Array<{
        userId: string;
        username: string;
        error: string;
      }> = [];

      try {
        // Procesamos secuencialmente para respetar el rate limit de Discord
        // (GET /guilds/{id}/members/{userId} ≈ 1 petición/segundo). Emitimos
        // progreso por NDJSON para que el cliente muestre "Sincronizando X/Y".
        for (let index = 0; index < targetProfiles.length; index += 1) {
          const profile = targetProfiles[index];
          const username = profile.discord_username ?? profile.user_id;
          const now = new Date().toISOString();
          let result: "assigned" | "missing" | "error" = "error";
          let errorMessage = "";

          try {
            const hasRole = await discordMemberHasVerifiedRole({
              discordUserId: profile.discord_user_id,
              guildId: creds.discord_guild_id,
              botToken: creds.discord_bot_token,
            });

            const acceptance = acceptanceMap.get(profile.user_id);
            if (acceptance) {
              await markRaiderRulesAcceptanceState({
                userId: profile.user_id,
                acceptedAt: acceptance.accepted_at ?? now,
                acceptedVersion:
                  acceptance.accepted_version ?? RAIDER_RULES_VERSION,
                roleAssignedAt: hasRole
                  ? (acceptance.discord_role_assigned_at ?? now)
                  : (acceptance.discord_role_assigned_at ?? null),
                roleStatus: hasRole ? "assigned" : "missing",
                roleError: null,
                roleLastAttemptAt: now,
              });
            } else if (hasRole) {
              await markRaiderRulesAcceptanceState({
                userId: profile.user_id,
                acceptedAt: now,
                acceptedVersion: RAIDER_RULES_VERSION,
                roleAssignedAt: now,
                roleStatus: "assigned",
                roleError: null,
                roleLastAttemptAt: now,
              });
            }

            result = hasRole ? "assigned" : "missing";
          } catch (error) {
            errorMessage =
              error instanceof Error ? error.message : "Error desconocido";

            const acceptance = acceptanceMap.get(profile.user_id);
            if (acceptance) {
              await markRaiderRulesAcceptanceState({
                userId: profile.user_id,
                acceptedAt: acceptance.accepted_at ?? now,
                acceptedVersion:
                  acceptance.accepted_version ?? RAIDER_RULES_VERSION,
                roleAssignedAt: acceptance.discord_role_assigned_at ?? null,
                roleStatus: "error",
                roleError: errorMessage,
                roleLastAttemptAt: now,
              });
            }
            result = "error";
          }

          if (result === "assigned") {
            assignedMembers.push({ userId: profile.user_id, username });
          } else if (result === "missing") {
            missingMembers.push({ userId: profile.user_id, username });
          } else {
            errors.push({
              userId: profile.user_id,
              username,
              error: errorMessage,
            });
          }

          send({
            type: "progress",
            processed: index + 1,
            total: targetProfiles.length,
            username,
            result,
          });

          if (index < targetProfiles.length - 1) {
            await sleep(DISCORD_MEMBER_FETCH_DELAY_MS);
          }
        }

        send({
          type: "done",
          assignedCount: assignedMembers.length,
          missingCount: missingMembers.length,
          errorCount: errors.length,
          assignedMembers,
          missingMembers,
          errors,
        });
        controller.close();
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Error desconocido",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
