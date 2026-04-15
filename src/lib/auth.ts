import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "venue_owner" | "event_owner";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isAbortError = (error: unknown) => {
  if (error instanceof DOMException) return error.name === "AbortError";
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return error.name === "AbortError" || message.includes("signal is aborted") || message.includes("aborted without reason");
  }
  return false;
};

async function retryIfAborted<T>(action: () => Promise<T>, retries = 2, delayMs = 150): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isAbortError(error) || attempt === retries) throw error;
      await wait(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}

export const getDashboardPath = (role: AppRole | null | undefined, fallback = "/") => {
  switch (role) {
    case "admin":
      return "/admin";
    case "venue_owner":
      return "/venue";
    case "event_owner":
      return "/event";
    default:
      return fallback;
  }
};

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await retryIfAborted(async () =>
    await supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle()
  );

  if (error) throw error;
  return (data?.role as AppRole | undefined) ?? null;
}

export async function getUserDisplayName(userId: string, fallbackEmail?: string | null): Promise<string> {
  const { data, error } = await retryIfAborted(async () =>
    await supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle()
  );

  if (error) throw error;
  return data?.full_name || fallbackEmail?.split("@")[0] || "משתמש";
}
