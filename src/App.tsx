import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Home,
  MessageCircle,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Heart,
  ChevronRight,
  LogOut,
} from "lucide-react";
import {
  api,
  ApiError,
  safeHttps,
  type Session,
  type Topic,
  type Conversation,
  type Reply,
  type Message,
} from "./api";
import { loadTelegram } from "./telegram";
import Markdown from "react-markdown";

const prompts = [
  "How can I take care of my mental health?",
  "Help me understand my cycle",
  "What does a healthy relationship look like?",
];
const languages = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ" },
];
function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <p className="notice error" role="alert">
      {error instanceof Error ? error.message : "Something went wrong."}
    </p>
  ) : null;
}

export default function App() {
  const location = useLocation();
  const mini = location.pathname.startsWith("/telegram");
  const query = useQuery({
    queryKey: ["session"],
    queryFn: () => api<Session>("channels/session/"),
    retry: false,
  });
  const [dark, setDark] = useState(
    () => localStorage.getItem("abeba-theme") === "dark",
  );
  const activeSession =
    query.error instanceof ApiError && query.error.status === 401
      ? undefined
      : query.data;
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("abeba-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    if (!mini) return;
    let clean: (() => void) | undefined;
    void loadTelegram()
      .then((app) => {
        if (!app) return;
        app.ready();
        app.expand();
        const theme = () => setDark(app.colorScheme === "dark");
        theme();
        app.onEvent("themeChanged", theme);
        const back = () => app.close();
        app.BackButton.show();
        app.BackButton.onClick(back);
        clean = () => {
          app.offEvent("themeChanged", theme);
          app.BackButton.offClick(back);
          app.BackButton.hide();
        };
      })
      .catch(() => {});
    return () => clean?.();
  }, [mini]);
  return (
    <div className={`app ${mini ? "mini" : ""}`}>
      <aside className="sidebar">
        <Link className="brand" to="/home">
          <span>abeba</span>
          <span className="brand-flower">✿</span>
        </Link>
        <p className="brand-caption">Your space to grow</p>
        <nav aria-label="Main navigation">
          <NavLink to="/home">
            <Home size={20} />
            Home
          </NavLink>
          <NavLink to="/learn">
            <BookOpen size={20} />
            Learn
          </NavLink>
          <NavLink to={mini ? "/telegram/chat" : "/chat"}>
            <MessageCircle size={20} />
            Ask Abeba
          </NavLink>
          <NavLink to="/settings">
            <Settings size={20} />
            Settings
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <Heart size={20} />
          <strong>A little care goes a long way.</strong>
          <p>Learn at your pace. Ask without judgment.</p>
        </div>
        <small>Abeba · Web preview</small>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link to="/home" className="mobile-brand">
            abeba<span>✿</span>
          </Link>
          <span className="breadcrumb">
            {mini
              ? "Abeba inside Telegram"
              : "A little knowledge. A lot of confidence."}
          </span>
          <div className="header-actions">
            <button
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              className="icon-button"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <span className="avatar">
              {query.data?.user.username.slice(0, 1) || "A"}
            </span>
          </div>
        </header>
        <main id="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route
              path="/chat"
              element={
                <ChatPage
                  session={activeSession}
                  sessionError={query.error}
                  mini={false}
                />
              }
            />
            <Route
              path="/telegram/chat"
              element={
                <ChatPage
                  session={activeSession}
                  sessionError={query.error}
                  mini
                />
              }
            />
            <Route
              path="/settings"
              element={<SettingsPage session={activeSession} />}
            />
            <Route
              path="*"
              element={
                <div className="page">
                  <h1>Page not found</h1>
                  <Link to="/home">Go home</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <NavLink to="/home">
            <Home size={20} />
            Home
          </NavLink>
          <NavLink to="/learn">
            <BookOpen size={20} />
            Learn
          </NavLink>
          <NavLink to={mini ? "/telegram/chat" : "/chat"}>
            <MessageCircle size={20} />
            Chat
          </NavLink>
          <NavLink to="/settings">
            <Settings size={20} />
            Settings
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

function HomePage() {
  const topics = useQuery({
    queryKey: ["topics", "en", ""],
    queryFn: () => api<{ results: Topic[] }>("learn/topics/?language=en"),
  });
  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () =>
      api<
        | { title: string; body: string }[]
        | { results: { title: string; body: string }[] }
      >("announcements/"),
  });
  const news = Array.isArray(announcements.data)
    ? announcements.data
    : announcements.data?.results || [];
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WELCOME TO YOUR SPACE</p>
          <h1>Small steps. Brighter days.</h1>
          <p>Understand yourself, find support, and grow with confidence.</p>
        </div>
        <span className="pill">
          <span className="status-dot" />
          Here for you
        </span>
      </div>
      <section className="hero">
        <div>
          <span className="hero-tag">
            <Sparkles size={16} />A safe space for your questions
          </span>
          <h2>
            Big questions?
            <br />
            Let’s talk about them.
          </h2>
          <p>
            From your wellbeing to your relationships, Abeba is here to help you
            learn.
          </p>
          <Link className="button yellow" to="/chat">
            Ask Abeba <ArrowUpRight size={19} />
          </Link>
        </div>
        <img src="/brand/abeba-mascot.png" alt="Abeba's friendly mascot" />
      </section>
      <div className="section-title">
        <h2>Make space for yourself</h2>
        <span>A good place to start</span>
      </div>
      <div className="action-grid">
        <Link className="action-card" to="/learn">
          <span className="tile-icon">
            <BookOpen />
          </span>
          <h3>Learn something new</h3>
          <p>Clear information, at your own pace.</p>
          <ChevronRight />
        </Link>
        <Link className="action-card peach" to="/chat">
          <span className="tile-icon">
            <MessageCircle />
          </span>
          <h3>Talk it through</h3>
          <p>A question is always a good beginning.</p>
          <ChevronRight />
        </Link>
      </div>
      <div className="section-title">
        <h2>Explore & understand</h2>
        <Link to="/learn">
          View all <ArrowUpRight size={16} />
        </Link>
      </div>
      <ErrorNotice error={topics.error} />
      {topics.isLoading && <p role="status">Loading topics…</p>}
      <div className="topic-grid">
        {topics.data?.results.slice(0, 3).map((t) => (
          <TopicCard key={t.slug} topic={t} />
        ))}
      </div>
      {news.length > 0 && (
        <section className="announcements">
          <h2>From the Abeba community</h2>
          {news.slice(0, 3).map((n, i) => (
            <article key={i}>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
            </article>
          ))}
        </section>
      )}
      <ErrorNotice error={announcements.error} />
    </div>
  );
}
function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      className="topic-card"
      to={`/learn?topic=${encodeURIComponent(topic.slug)}`}
    >
      <div className="topic-art">
        <BookOpen size={34} />
      </div>
      <div>
        <span className="eyebrow">HEALTH & WELLBEING</span>
        <h3>{topic.title}</h3>
        <p>
          {topic.summary ||
            topic.description ||
            "Take a moment to understand more."}
        </p>
        <span className="read-link">
          Read & learn <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
function LearnPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("en");
  const [page, setPage] = useState(1);
  const slug = params.get("topic");
  const topics = useQuery({
    queryKey: ["topics", language, search, page],
    queryFn: () =>
      api<{ results: Topic[]; next: string | null; previous: string | null }>(
        `learn/topics/?language=${language}&search=${encodeURIComponent(search)}&page=${page}`,
      ),
  });
  const detail = useQuery({
    queryKey: ["topic", slug, language],
    enabled: !!slug,
    queryFn: () =>
      api<Topic>(
        `learn/topics/${encodeURIComponent(slug!)}/?language=${language}`,
      ),
  });
  return (
    <div className="page">
      <p className="eyebrow">A LITTLE KNOWLEDGE GOES A LONG WAY</p>
      <h1>Your learning space</h1>
      <p>Trusted topics to help you understand your health and wellbeing.</p>
      <div className="filters">
        <label>
          Search topics
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="What would you like to learn?"
          />
        </label>
        <label>
          Content language
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {slug ? (
        <article className="reading-card">
          <button className="text-button" onClick={() => setParams({})}>
            ← All topics
          </button>
          <ErrorNotice error={detail.error} />
          {detail.isLoading && <p role="status">Loading article…</p>}
          {detail.data && (
            <>
              <h2>{detail.data.title}</h2>
              <Markdown>
                {detail.data.content_markdown ||
                  detail.data.body ||
                  detail.data.markdown ||
                  detail.data.description ||
                  detail.data.summary}
              </Markdown>
              {detail.data.sections?.map((s, i) => (
                <section key={i}>
                  <h3>{s.title || s.heading}</h3>
                  <p className="body-text">{s.body || s.content}</p>
                  {s.bullets?.map((b, j) => (
                    <p key={j}>• {b}</p>
                  ))}
                </section>
              ))}
              <Link
                className="button"
                to={`/chat?question=${encodeURIComponent(`Help me understand ${detail.data.title}`)}`}
              >
                Ask Abeba about this
              </Link>
            </>
          )}
        </article>
      ) : (
        <>
          <ErrorNotice error={topics.error} />
          {topics.isLoading && <p role="status">Loading topics…</p>}
          <div className="topic-grid">
            {topics.data?.results.map((t) => (
              <TopicCard key={t.slug} topic={t} />
            ))}
          </div>
          {topics.data?.results.length === 0 && (
            <p>No matching topics. Try another search.</p>
          )}
          <div className="pagination">
            <button
              disabled={!topics.data?.previous}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={!topics.data?.next}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ChatPage({
  session: incomingSession,
  sessionError,
  mini,
}: {
  session?: Session;
  sessionError: unknown;
  mini: boolean;
}) {
  const [verifiedSession, setVerifiedSession] = useState<Session>();
  const session = mini
    ? verifiedSession && incomingSession?.user.id === verifiedSession.user.id
      ? incomingSession
      : verifiedSession
    : incomingSession;
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState(params.get("question") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const retryRequest = useRef<{
    request_key: string;
    message: string;
    session_id?: number;
  } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const history = useQuery({
    queryKey: ["history", session?.user.id],
    enabled: !!session,
    queryFn: () =>
      api<{ results: { id: number; preview: string }[] }>(
        "channels/chat/history/",
      ),
  });
  const context = useQuery({
    queryKey: ["context", session?.user.id],
    enabled: !!session,
    refetchInterval: busy ? false : 5000,
    queryFn: () => api<Conversation>("channels/chat/context/"),
  });
  useEffect(() => {
    if (context.error instanceof ApiError && context.error.status === 401) {
      if (mini) setVerifiedSession(undefined);
      void qc.invalidateQueries({ queryKey: ["session"] });
    }
  }, [context.error, mini, qc]);
  useEffect(() => {
    if (context.data && !busy) {
      setMessages(context.data.messages);
      setChatId(context.data.session_id);
    }
  }, [context.data, busy]);
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [messages]);
  const handoff = useRef(false);
  useEffect(() => {
    const selected = params.get("session");
    if (!session || !selected || handoff.current) return;
    handoff.current = true;
    if (!/^\d+$/.test(selected)) {
      setError(new Error("Invalid conversation link."));
      return;
    }
    void api<Conversation>("channels/chat/context/", "PATCH", {
      session_id: Number(selected),
    })
      .then((data) => {
        qc.setQueryData(["context", session.user.id], data);
      })
      .catch(setError);
  }, [session, params, qc]);
  async function connect() {
    setBusy(true);
    setError(undefined);
    try {
      let next: Session;
      if (mini) {
        const app = await loadTelegram();
        if (!app?.initData)
          throw new Error("Open this chat from the Abeba bot in Telegram.");
        next = await api("channels/auth/telegram/", "POST", {
          init_data: app.initData,
        });
      } else next = await api("channels/auth/web/", "POST", {});
      qc.clear();
      qc.setQueryData(["session"], next);
      if (mini) setVerifiedSession(next);
      setMessages([]);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const verifiedLaunch = useRef(false);
  useEffect(() => {
    if (mini && !verifiedLaunch.current) {
      verifiedLaunch.current = true;
      void connect();
    }
  }, [mini]);
  async function consent() {
    setBusy(true);
    setError(undefined);
    try {
      const next = await api<Session>("channels/preferences/", "PATCH", {
        ai_consent: true,
        consent_version: session?.consent_version,
      });
      qc.setQueryData(["session"], next);
      if (mini) setVerifiedSession(next);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function send(retry = false) {
    if ((!draft.trim() && !retry) || busy || !session || (uncertain && !retry))
      return;
    const body =
      retry && retryRequest.current
        ? retryRequest.current
        : {
            message: draft.trim(),
            request_key: crypto.randomUUID(),
            ...(chatId ? { session_id: chatId } : {}),
          };
    retryRequest.current = body;
    setBusy(true);
    setError(undefined);
    try {
      await api<Reply>("channels/chat/messages/", "POST", body);
      setDraft("");
      setUncertain(false);
      retryRequest.current = null;
      await qc.invalidateQueries({ queryKey: ["context"] });
      await qc.invalidateQueries({ queryKey: ["history"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
    } catch (e) {
      setError(e);
      setUncertain(
        !(e instanceof ApiError) || e.status >= 500 || e.status === 409,
      );
      await qc.invalidateQueries({ queryKey: ["session"] });
      if (mini) {
        try {
          setVerifiedSession(await api<Session>("channels/session/"));
        } catch {
          setVerifiedSession(undefined);
        }
      }
    } finally {
      setBusy(false);
    }
  }
  async function selectChat(id?: number) {
    setBusy(true);
    setError(undefined);
    try {
      const data = await api<Conversation>(
        "channels/chat/context/",
        id ? "PATCH" : "POST",
        id ? { session_id: id } : {},
      );
      setMessages(data.messages);
      setChatId(data.session_id);
      setUncertain(false);
      retryRequest.current = null;
      qc.setQueryData(["context", session?.user.id], data);
      await qc.invalidateQueries({ queryKey: ["history"] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const unavailable =
    sessionError &&
    !(sessionError instanceof ApiError && sessionError.status === 401);
  return (
    <div className="chat-page">
      <div className="chat-heading">
        <div className="chat-title">
          <img src="/brand/home-chat-avatar.png" alt="" />
          <div>
            <h1>Ask Abeba</h1>
            <span>
              <span className="status-dot" />A space to ask, learn & grow
            </span>
          </div>
        </div>
        <button
          className="outline-button"
          disabled={!session || busy}
          onClick={() => selectChat()}
        >
          <Plus size={18} />
          New chat
        </button>
      </div>
      {session && (
        <div className="conversation-tools">
          <label className="sr-only" htmlFor="history">
            Conversation
          </label>
          <select
            id="history"
            disabled={busy}
            value={chatId || ""}
            onChange={(e) => selectChat(Number(e.target.value))}
          >
            <option value="" disabled>
              Choose a conversation
            </option>
            {history.data?.results.map((h) => (
              <option key={h.id} value={h.id}>
                {h.preview}
              </option>
            ))}
          </select>
          <span>
            {session.language === "am" ? "አማርኛ" : "English"} · shared chat
            allowance
          </span>
        </div>
      )}
      <ErrorNotice
        error={
          error ||
          (unavailable ? sessionError : undefined) ||
          context.error ||
          history.error
        }
      />
      {!session ? (
        <div className="chat-welcome">
          <img src="/brand/abeba-mascot.png" alt="Abeba mascot" />
          <h2>Your questions belong here.</h2>
          <p>
            {mini
              ? "Connect securely with your Telegram account to continue your conversation."
              : "Start a private browser session. Your account is tied to this browser until account linking is available."}
          </p>
          <button className="button" disabled={busy} onClick={connect}>
            {busy
              ? "Connecting…"
              : mini
                ? "Connect with Telegram"
                : "Start chatting"}
          </button>
        </div>
      ) : !session.ai_consent ? (
        <div className="consent-card">
          <Sparkles />
          <h2>Before we chat</h2>
          <p>
            Your messages and recent conversation context will be processed by
            Abeba’s configured AI provider to prepare an answer. Please avoid
            sharing identifying details. You can withdraw consent in Settings.
          </p>
          <p>
            Abeba offers educational information. For personal health decisions,
            consult a qualified professional.
          </p>
          <button className="button" disabled={busy} onClick={consent}>
            I agree — continue
          </button>
        </div>
      ) : (
        <>
          <div className="message-area" aria-label="Conversation">
            <p className="chat-date">A little kindness, a little clarity.</p>
            {messages.length === 0 && (
              <div className="empty-chat">
                <Sparkles size={30} />
                <h2>What’s on your mind?</h2>
                <p>There’s no perfect way to ask. Start wherever you are.</p>
                <div className="suggestions">
                  {prompts.map((p) => (
                    <button key={p} onClick={() => setDraft(p)}>
                      {p}
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <article className={`message ${m.role}`} key={m.id}>
                <span className="message-name">
                  {m.role === "assistant" ? "✿ Abeba" : "You"}
                </span>
                <Markdown>{m.text}</Markdown>
                {m.structured?.examples?.map((e, i) => (
                  <blockquote key={i}>{e}</blockquote>
                ))}
                {m.structured?.links
                  ?.filter((l) => safeHttps(l.url))
                  .map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {l.title} ↗
                    </a>
                  ))}
                {m.structured?.suggested_followups?.map((f, i) => (
                  <button
                    className="followup"
                    key={i}
                    onClick={() => setDraft(f)}
                  >
                    {f}
                  </button>
                ))}
              </article>
            ))}
            {busy && (
              <p className="thinking" role="status">
                Abeba is working on your request…
              </p>
            )}
            <div ref={end} />
          </div>
          {uncertain && (
            <div className="notice">
              The request may still be processing. Refresh history or retry the
              same request before sending again.
              <button
                onClick={() =>
                  void qc.invalidateQueries({ queryKey: ["context"] })
                }
              >
                Refresh history
              </button>
              <button disabled={busy} onClick={() => send(true)}>
                Retry same request
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setUncertain(false);
                  retryRequest.current = null;
                }}
              >
                Dismiss
              </button>
            </div>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="message">
              Your message
            </label>
            <textarea
              id="message"
              placeholder="Ask whatever’s on your mind…"
              value={draft}
              maxLength={6000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              aria-label="Send message"
              disabled={busy || uncertain || !draft.trim()}
            >
              <ArrowUp size={22} />
            </button>
          </form>
          <p className="chat-footnote">
            AI can make mistakes. Abeba is here to help you learn, not to
            diagnose.
            <br />
            Showing the latest 100 messages. Voice and account linking are
            coming next.
          </p>
        </>
      )}
    </div>
  );
}

function SettingsPage({ session }: { session?: Session }) {
  const qc = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function update(body: unknown) {
    setBusy(true);
    setError(undefined);
    try {
      const next = await api<Session>("channels/preferences/", "PATCH", body);
      qc.setQueryData(["session"], next);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError(undefined);
    try {
      await api("channels/session/", "DELETE");
      qc.clear();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <p className="eyebrow">MAKE THIS SPACE YOURS</p>
      <h1>Settings</h1>
      <ErrorNotice error={error} />
      {session ? (
        <div className="settings-card">
          <h2>{session.user.username}</h2>
          <label>
            Chat response language
            <select
              disabled={busy}
              value={session.language}
              onChange={(e) => update({ language: e.target.value })}
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <p>AI consent: {session.ai_consent ? "accepted" : "not accepted"}</p>
          {session.ai_consent && (
            <button
              className="outline-button"
              disabled={busy}
              onClick={() => update({ ai_consent: false })}
            >
              Withdraw AI consent
            </button>
          )}
          <p>
            Remaining allowance:{" "}
            {session.quota.tokens_remaining.toLocaleString()} tokens
          </p>
          <button className="outline-button" disabled={busy} onClick={logout}>
            <LogOut size={18} />
            End this session
          </button>
          <p className="muted">
            Ending an unlinked browser session removes your access to that
            account. Telegram users can reconnect through the bot. Account
            linking, deletion and notification preferences are planned next.
          </p>
        </div>
      ) : (
        <div className="settings-card">
          <p>Start a chat session to manage your preferences.</p>
          <Link className="button" to="/chat">
            Open chat
          </Link>
        </div>
      )}
    </div>
  );
}
