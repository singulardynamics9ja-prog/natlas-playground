type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

const sessionKey = "natlas.supabase.session";

function configuration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

export function isSupabaseConfigured() {
  return configuration() !== null;
}

async function authRequest<T>(path: string, body: Record<string, string>) {
  const config = configuration();
  if (!config) {
    throw new Error("Supabase is not configured. Add its URL and anon key to your environment.");
  }

  const response = await fetch(`${config.url}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
    },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as T & { msg?: string; message?: string; error_description?: string };
  if (!response.ok) {
    throw new Error(
      result.msg ??
        result.message ??
        result.error_description ??
        `Supabase authentication failed (${response.status}).`,
    );
  }
  return result;
}

export async function getSupabaseAccessToken() {
  if (typeof window === "undefined") return null;
  const config = configuration();
  if (!config) return null;

  const stored = window.sessionStorage.getItem(sessionKey);
  if (stored) {
    let session: SupabaseSession;
    try {
      session = JSON.parse(stored) as SupabaseSession;
    } catch {
      window.sessionStorage.removeItem(sessionKey);
      throw new Error("The saved Supabase session is invalid. Refresh the page to reconnect.");
    }

    if (session.expires_at > Date.now() + 60_000) return session.access_token;
    if (session.refresh_token) {
      const refreshed = await authRequest<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }>("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
      const nextSession = {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: Date.now() + refreshed.expires_in * 1000,
      };
      window.sessionStorage.setItem(sessionKey, JSON.stringify(nextSession));
      return nextSession.access_token;
    }
    window.sessionStorage.removeItem(sessionKey);
  }

  const anonymousUser = await authRequest<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>("signup", {});
  const session = {
    access_token: anonymousUser.access_token,
    refresh_token: anonymousUser.refresh_token,
    expires_at: Date.now() + anonymousUser.expires_in * 1000,
  };
  window.sessionStorage.setItem(sessionKey, JSON.stringify(session));
  return session.access_token;
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
  suppliedToken?: string,
): Promise<T> {
  const config = configuration();
  if (!config) {
    throw new Error("Supabase is not configured. Add its URL and anon key to your environment.");
  }

  const accessToken = suppliedToken ?? (await getSupabaseAccessToken());
  if (!accessToken) throw new Error("Could not create a Supabase session.");

  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let detail = `Supabase request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string; details?: string };
      detail = body.message ?? body.details ?? detail;
    } catch {
      // Keep the HTTP status if the response is not JSON.
    }
    throw new Error(detail);
  }

  const responseBody = await response.text();
  if (!responseBody) return undefined as T;
  return JSON.parse(responseBody) as T;
}
