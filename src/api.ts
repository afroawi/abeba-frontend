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

async function csrfToken(): Promise<string> {
  if (!csrf) {
    const token = await api<{ csrf_token: string }>("channels/csrf/");
    csrf = token.csrf_token;
  }
  return csrf;
}

async function responseError(res: Response): Promise<ApiError> {
  const data = await res.json().catch(() => undefined);
  if (res.status === 403) csrf = "";
  return new ApiError(
    res.status,
    data?.error?.message ||
      data?.detail ||
      "Unable to reach Abeba. Please try again.",
  );
}

export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const token = method !== "GET" ? await csrfToken() : "";
  const res = await fetch(`/api/v1/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(method !== "GET" ? { "X-CSRFToken": token } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data =
    res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    if (res.status === 403) csrf = "";
    throw new ApiError(res.status, data?.error?.message || data?.detail || "Unable to reach Abeba. Please try again.");
  }
  return data as T;
}

export type Transcription = {
  text: string;
  confidence: number;
  language: string;
  duration_seconds: number | null;
};

export async function transcribeAudio(
  audio: Blob,
  language: string,
  durationSeconds: number,
): Promise<Transcription> {
  const form = new FormData();
  const extension = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
  form.append("audio", audio, `voice.${extension}`);
  form.append("language", language === "am" ? "am" : "en");
  form.append("duration_seconds", durationSeconds.toFixed(2));
  const res = await fetch("/api/v1/channels/chat/transcriptions/", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "X-CSRFToken": await csrfToken() },
    body: form,
  });
  if (!res.ok) throw await responseError(res);
  return (await res.json()) as Transcription;
}

export type MessageAudio = {
  blob: Blob;
  part: number;
  parts: number;
};

export async function getMessageAudio(
  messageId: number,
  part = 1,
  signal?: AbortSignal,
): Promise<MessageAudio> {
  const res = await fetch("/api/v1/channels/chat/audio/", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    signal,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": await csrfToken(),
    },
    body: JSON.stringify({ message_id: messageId, part }),
  });
  if (!res.ok) throw await responseError(res);
  if (!res.headers.get("Content-Type")?.startsWith("audio/")) {
    throw new ApiError(502, "Abeba returned an invalid audio response.");
  }
  return {
    blob: await res.blob(),
    part: Number(res.headers.get("X-Abeba-Audio-Part") || part),
    parts: Number(res.headers.get("X-Abeba-Audio-Parts") || 1),
  };
}
export function safeHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
