import { supabase } from "@/lib/supabaseClient";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "user";
  approved: boolean;
};

export async function ensureProfile(): Promise<Profile | null> {
  const { data: sess, error: sErr } = await supabase.auth.getSession();
  if (sErr || !sess.session?.user) return null;

  const user = sess.session.user;
  const email = user.email ?? "";

  // Try read profile
  const { data: existing, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!pErr && existing) return existing as Profile;

  // Insert pending profile
  const { data: ins, error: iErr } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email,
      role: "user",
      approved: false
    })
    .select("*")
    .single();

  if (iErr) {
    // Could be RLS or race; retry read
    const { data: retry } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return (retry as Profile) ?? null;
  }

  return ins as Profile;
}

export async function getProfile(): Promise<Profile | null> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  return (data as Profile) ?? null;
}
