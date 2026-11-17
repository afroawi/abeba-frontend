// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import {
  api,
  ApiError,
  getMessageAudio,
  transcribeAudio,
  type Session,
} from "./api";
vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  api: vi.fn(),
  getMessageAudio: vi.fn(),
  transcribeAudio: vi.fn(),
}));
const session: Session = {
  user: { id: 7, username: "Test" },
  session_id: null,
  ai_consent: false,
  consent_version: "ai-v1",
  language: "en",
  quota: { tokens_remaining: 1000 },
  bot_enabled: false,
};
function mount(path = "/chat") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
  vi.clearAllMocks();
});

describe("localization and learn pages", () => {
  it("links to the verified Android app and Telegram bot", async () => {
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "channels/session/") throw new ApiError(401, "Not connected");
      if (path === "learn/topics/?language=en") return { results: [] } as never;
      if (path === "announcements/") return { results: [] } as never;
      throw new Error(`Unexpected ${path}`);
    });
    mount("/home");
    await screen.findByRole("heading", { name: "A little knowledge. A lot of confidence." });
    expect(screen.getAllByRole("link", { name: /Download for Android/ }).some((link) => link.getAttribute("href") === "https://play.google.com/store/apps/details?id=com.abeba.abebamobileapp")).toBe(true);
    expect(screen.getAllByRole("link", { name: /Open Telegram bot/ }).some((link) => link.getAttribute("href") === "https://t.me/Abebachatbot")).toBe(true);
  });

  it("persists the interface locale while requesting the selected content language", async () => {
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "channels/session/") throw new ApiError(401, "Not connected");
      if (path.startsWith("learn/topics/?language=am")) return { results: [], next: null, previous: null } as never;
      throw new Error(`Unexpected ${path}`);
    });
    mount("/learn?language=am");
    fireEvent.change(await screen.findByLabelText("Interface language"), {
      target: { value: "am" },
    });
    expect(await screen.findByText("የማወቅ ጉጉት ያምርብዎታል።")).toBeInTheDocument();
    expect(localStorage.getItem("abeba-locale")).toBe("am");
    expect(api).toHaveBeenCalledWith(expect.stringContaining("learn/topics/?language=am"));
  });

  it("renders a topic at its dedicated shareable route", async () => {
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "channels/session/") throw new ApiError(401, "Not connected");
      if (path === "learn/topics/mental-health/?language=en") {
        return { slug: "mental-health", title: "Mental health", content_markdown: "## Take care\nSmall steps help." } as never;
      }
      throw new Error(`Unexpected ${path}`);
    });
    mount("/learn/mental-health?language=en");
    expect(await screen.findByRole("heading", { name: "Mental health" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Take care" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ask Abeba about this/ })).toHaveAttribute("href", expect.stringContaining("/chat?question="));
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("chat permissions and retries", () => {
  it("transcribes a recording into the composer and can prepare spoken replies", async () => {
    class FakeMediaRecorder {
      static isTypeSupported = () => true;
      state: RecordingState = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;
      start() { this.state = "recording"; }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["voice"], { type: this.mimeType }) });
        this.onstop?.();
      }
    }
    const tracks = [{ stop: vi.fn() }];
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => ({ getTracks: () => tracks })) },
    });
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("Audio", class {
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      paused = true;
      constructor(public src: string) {}
      async play() { this.paused = false; }
      pause() { this.paused = true; }
    });
    URL.createObjectURL = vi.fn(() => "blob:answer");
    URL.revokeObjectURL = vi.fn();
    vi.mocked(transcribeAudio).mockResolvedValue({
      text: "How can I sleep better?",
      confidence: .9,
      language: "en",
      duration_seconds: 1,
    });
    vi.mocked(getMessageAudio).mockResolvedValue({
      blob: new Blob(["ID3"]),
      part: 1,
      parts: 1,
    });
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "channels/session/") return { ...session, ai_consent: true } as never;
      if (path === "channels/chat/context/")
        return {
          session_id: 3,
          messages: [{ id: 21, role: "assistant", text: "A calm routine can help." }],
        } as never;
      if (path === "channels/chat/history/") return { results: [] } as never;
      throw new Error(`Unexpected ${path}`);
    });

    mount();
    expect(await screen.findByText("A calm routine can help.")).toBeInTheDocument();
    fireEvent.click(await screen.findByLabelText("Start voice recording"));
    fireEvent.click(await screen.findByLabelText("Stop recording"));
    await waitFor(() =>
      expect(screen.getByLabelText("Your message")).toHaveValue("How can I sleep better?"),
    );
    expect(screen.getByText(/Transcript added/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Listen to response" }));
    await waitFor(() => expect(getMessageAudio).toHaveBeenCalledWith(21, 1, expect.any(AbortSignal)));
    expect(await screen.findByRole("button", { name: "Pause audio" })).toBeInTheDocument();
  });

  it("shows searchable, collapsible history without the site navigation", async () => {
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "channels/session/")
        return { ...session, ai_consent: true } as never;
      if (path === "channels/chat/context/")
        return { session_id: 2, messages: [] } as never;
      if (path === "channels/chat/history/")
        return {
          results: [
            { id: 1, preview: "Understanding my cycle" },
            { id: 2, preview: "Healthy sleep habits" },
          ],
        } as never;
      throw new Error(`Unexpected ${path}`);
    });
    mount();
    expect(
      await screen.findByRole("complementary", { name: "Chat history" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "AI can make mistakes. Abeba is here to help you learn, not to diagnose.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Understanding my cycle")).toBeInTheDocument();
    expect(screen.getByText("Healthy sleep habits")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search conversations"), {
      target: { value: "cycle" },
    });
    expect(screen.getByText("Understanding my cycle")).toBeInTheDocument();
    expect(screen.queryByText("Healthy sleep habits")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Collapse history panel"));
    expect(screen.getByLabelText("Expand history panel")).toBeInTheDocument();
  });

  it("connects an anonymous browser before asking for consent", async () => {
    let connected = false;
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "channels/session/") {
        if (!connected) throw new ApiError(401, "Not connected");
        return session as never;
      }
      if (path === "channels/auth/web/") {
        connected = true;
        return session as never;
      }
      if (path === "channels/chat/context/")
        return { session_id: null, messages: [] } as never;
      if (path === "channels/chat/history/") return { results: [] } as never;
      throw new Error(`Unexpected ${path}`);
    });
    mount();
    fireEvent.click(await screen.findByText("Start chatting"));
    expect(await screen.findByText("Before we chat")).toBeInTheDocument();
    expect(screen.queryByLabelText("Your message")).not.toBeInTheDocument();
  });
  it("requires explicit consent before showing the composer", async () => {
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "channels/session/") return session as never;
      if (path === "channels/preferences/")
        return { ...session, ai_consent: true } as never;
      if (path === "channels/chat/context/")
        return { session_id: null, messages: [] } as never;
      if (path === "channels/chat/history/") return { results: [] } as never;
      throw new Error(`Unexpected ${path}`);
    });
    mount();
    expect(await screen.findByText("Before we chat")).toBeInTheDocument();
    expect(screen.queryByLabelText("Your message")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("I agree — continue"));
    expect(await screen.findByLabelText("Your message")).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith("channels/preferences/", "PATCH", {
      ai_consent: true,
      consent_version: "ai-v1",
    });
  });
  it("reuses the same key after uncertain network failure", async () => {
    const requests: unknown[] = [];
    let count = 0;
    vi.mocked(api).mockImplementation(async (path, _method, body) => {
      if (path === "channels/session/")
        return { ...session, ai_consent: true } as never;
      if (path === "channels/chat/context/")
        return { session_id: null, messages: [] } as never;
      if (path === "channels/chat/history/") return { results: [] } as never;
      if (path === "channels/chat/messages/") {
        requests.push(body);
        if (++count === 1) throw new ApiError(503, "Connection lost");
        return { reply: "Answer", session_id: 1 } as never;
      }
      throw new Error(`Unexpected ${path}`);
    });
    mount();
    fireEvent.change(await screen.findByLabelText("Your message"), {
      target: { value: "A question" },
    });
    fireEvent.click(screen.getByLabelText("Send message"));
    expect(await screen.findByText("Connection lost")).toBeInTheDocument();
    expect(screen.getByLabelText("Send message")).toBeDisabled();
    fireEvent.click(screen.getByText("Retry same request"));
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0]).toEqual(requests[1]);
  });
});
