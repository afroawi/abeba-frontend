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
import { api, ApiError, type Session } from "./api";
vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  api: vi.fn(),
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
afterEach(cleanup);
describe("chat permissions and retries", () => {
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
