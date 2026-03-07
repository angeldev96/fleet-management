import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "lib/env";

let supabaseUrl: string = getPublicEnv("VITE_SUPABASE_URL");
const supabaseAnonKey: string = getPublicEnv("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) {
  supabaseUrl = `https://${supabaseUrl}`;
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
