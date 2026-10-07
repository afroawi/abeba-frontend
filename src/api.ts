export type Session = {
  user: { id: number; username: string };
  session_id: number | null;
  ai_consent: boolean;
  consent_version: string;
  language: string;
  quota: { tokens_remaining: number };
  bot_enabled: boolean;
};
export type Structured = {
  description?: string;
  examples?: string[];
  links?: { title: string; url: string }[];
  suggested_followups?: string[];
};
export type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  structured?: Structured;
};
export type Conversation = { session_id: number | null; messages: Message[] };
export type Reply = {
  session_id: number;
  reply: string;
  message_id: number;
  structured: Structured;
  safety_notice: string;
};
export type Topic = {
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  body?: string;
  content_markdown?: string;
  markdown?: string;
  image_url?: string;
  thumbnail_url?: string;
  language?: string;
  source_url?: string;
  audios?: { id: number; title: string; audio_url: string | null }[];
  sections?: {
    title?: string;
    heading?: string;
    body?: string;
    content?: string;
    bullets?: string[];
  }[];
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
let csrf = "";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (method !== "GET" && !csrf) {
    const token = await api<{ csrf_token: string }>("channels/csrf/");
    csrf = token.csrf_token;
  }
  const res = await fetch(`/api/v1/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(method !== "GET" ? { "X-CSRFToken": csrf } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data =
    res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    if (res.status === 403) csrf = "";
    throw new ApiError(
      res.status,
      data?.error?.message ||
        data?.detail ||
        "Unable to reach Abeba. Please try again.",
    );
  }
  return data as T;
}
export function safeHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
