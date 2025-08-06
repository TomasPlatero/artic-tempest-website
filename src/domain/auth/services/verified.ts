import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/domain/auth/clients/supabase-server";

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const token_hash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  if (!token_hash || !type) {
    return redirect("/login?error=invalid_link");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    return redirect("/login?error=verification_failed");
  }

  return redirect("/verified");
}
