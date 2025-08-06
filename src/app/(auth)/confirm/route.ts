import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/domain/auth/clients/supabase-server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || type !== "recovery") {
    return redirect("/login?error=invalid_link");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    return redirect("/login?error=verification_failed");
  }

  return redirect("/reset-password");
}
