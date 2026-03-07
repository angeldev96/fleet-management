export type PublicEnvKey =
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_ANON_KEY"
  | "VITE_MAPBOX_ACCESS_TOKEN_PUBLIC";

const buildConfig: Record<PublicEnvKey, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_MAPBOX_ACCESS_TOKEN_PUBLIC: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN_PUBLIC,
};

function getRuntimeConfig(): Partial<Record<PublicEnvKey, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  return window.__APP_CONFIG__ || {};
}

export function getPublicEnv(key: PublicEnvKey): string {
  return getRuntimeConfig()[key] || buildConfig[key] || "";
}