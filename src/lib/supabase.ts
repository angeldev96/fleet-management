import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) {
  supabaseUrl = `https://${supabaseUrl}`;
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
