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
  LogOut,
  ArrowRight,
  Brain,
  Flower2,
  HeartHandshake,
  ShieldCheck,
  Sprout,
  Ribbon,
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

// Viewports trim transparent export padding while keeping the supplied artwork intact.
function BrandFlower({ className = "" }: { className?: string }) {
  return (
    <svg className={`brand-flower ${className}`} viewBox="0 32 110 110" aria-hidden="true">
      <image href="/brand/abeba-logo-white.png" width="420" height="178" />
    </svg>
  );
}

function LeafMotif({ className = "" }: { className?: string }) {
  return (
    <svg className={`leaf-motif ${className}`} viewBox="0 0 140 180" fill="currentColor" aria-hidden="true">
      <path d="M66 166c-8-19-3-32-16-36-12-4-22 11-34 4-14-9-8-25 5-28 13-3 27 10 30-2 4-13-26-11-31-25-6-17 9-26 20-17 10 9 12 22 19 17 10-7-15-23-10-39 4-14 21-14 25-2 5 14-9 30 3 33 11 2 7-26 18-32 14-8 28 6 18 19-10 12-31 16-26 28 5 11 19-9 31-6 16 4 15 23 0 28-13 5-24-8-31-1-10 10 16 13 20 26 5 17-16 23-23 10-9-16-14-10-13 3 1 12 4 17-5 25z" />
    </svg>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand ${compact ? "brand-compact" : ""}`} to="/home" aria-label="Abeba home">
      <svg className="brand-logo" viewBox="0 32 388 109" aria-hidden="true">
        <image href="/brand/abeba-logo-white.png" width="420" height="178" />
      </svg>
    </Link>
  );
}

export default function App() {
  const location = useLocation();
  const mini = location.pathname.startsWith("/telegram");
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
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
  const chatLayout = location.pathname === "/chat" || mini;
  return (
    <div className={`app ${mini ? "mini" : ""} ${chatLayout ? "chat-layout" : ""}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            <NavLink to="/home" className={({ isActive }) => isActive || location.pathname === "/" ? "active" : ""}>Home</NavLink>
            <NavLink to="/learn">Explore & learn</NavLink>
            <NavLink to={mini ? "/telegram/chat" : "/chat"}><MessageCircle size={17} />Ask Abeba</NavLink>
          </nav>
          <div className="header-actions">
            {mini && <span className="mini-label">Your Telegram chat</span>}
            <button aria-label={dark ? "Use light theme" : "Use dark theme"} className="icon-button theme-toggle" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <NavLink className="profile-link" to="/settings" aria-label="Settings"><Settings size={19} /></NavLink>
          </div>
        </div>
      </header>
      <div className="workspace">
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/chat" element={<ChatPage session={activeSession} sessionError={query.error} mini={false} />} />
            <Route path="/telegram/chat" element={<ChatPage session={activeSession} sessionError={query.error} mini />} />
            <Route path="/settings" element={<SettingsPage session={activeSession} />} />
            <Route path="*" element={<div className="page not-found"><BrandFlower /><h1>A little off the path.</h1><p>Let’s find your way back to your space.</p><Link className="button" to="/home">Go home <ArrowRight size={18} /></Link></div>} />
          </Routes>
        </main>
        {!chatLayout && <footer className="site-footer"><div className="footer-inner"><div><Brand /><p>A little knowledge.<br />A lot of room to grow.</p></div><nav aria-label="Footer navigation"><Link to="/learn">Explore & learn <ArrowUpRight size={16} /></Link><Link to="/chat">Ask Abeba <ArrowUpRight size={16} /></Link><Link to="/settings">Your preferences <ArrowUpRight size={16} /></Link></nav><div className="footer-signoff"><BrandFlower /><span>Rooted in care.<br />Made for you.</span></div></div><div className="footer-bottom"><span>Abeba · Learn. Ask. Grow.</span><span>Educational information, with a little kindness.</span></div></footer>}
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <NavLink to="/home" className={({ isActive }) => isActive || location.pathname === "/" ? "active" : ""}><Home size={21} /><span>Home</span></NavLink>
          <NavLink to="/learn"><BookOpen size={21} /><span>Learn</span></NavLink>
          <NavLink to={mini ? "/telegram/chat" : "/chat"}><MessageCircle size={21} /><span>Ask Abeba</span></NavLink>
          <NavLink to="/settings"><Settings size={21} /><span>Settings</span></NavLink>
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
    <div className="page home-page">
      <section className="home-hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow"><BrandFlower className="tiny-flower" /> YOUR SPACE TO ASK. LEARN. GROW.</p>
          <h1 id="hero-heading">A little knowledge.<br />A lot of <em>confidence.</em></h1>
          <p className="hero-description">Big feelings, changing bodies, everyday questions. Find information and a little support for the things that matter to you.</p>
          <div className="hero-actions"><Link className="button" to="/chat">Let’s talk <ArrowUpRight size={20} /></Link><Link className="hero-secondary" to="/learn">Explore topics <ArrowRight size={18} /></Link></div>
          <div className="hero-reassurance"><Heart size={16} /><span>Your questions. Your pace. Without judgment.</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit" />
          <LeafMotif className="hero-leaf" />
          <BrandFlower className="hero-flower" />
          <div className="hello-note"><span>Hi, I’m Abeba!</span><svg viewBox="0 0 60 35" fill="none" aria-hidden="true"><path d="M5 4c8 25 29 32 48 12m-14 1 16-5-3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
          <img className="hero-mascot" src="/brand/abeba-waving.webp" alt="Abeba smiles and waves hello" fetchPriority="high" />
          <span className="hero-stamp"><BrandFlower />A little kindness<br />goes a long way.</span>
        </div>
      </section>
      <section className="care-principles" aria-label="Your space with Abeba">
        <div><span className="principle-icon"><MessageCircle size={23} /></span><p><strong>A space to ask</strong><span>Start wherever you are.</span></p></div>
        <div><span className="principle-icon"><BookOpen size={23} /></span><p><strong>Knowledge that helps</strong><span>Understand a little more.</span></p></div>
        <div><span className="principle-icon"><Sprout size={24} /></span><p><strong>Room to grow</strong><span>One small step at a time.</span></p></div>
      </section>
      <section className="learning-section" aria-labelledby="discovery-heading">
        <div className="section-title"><div><p className="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</p><h2 id="discovery-heading">Make room for discovery.</h2></div><Link className="section-link" to="/learn">Explore all topics <ArrowUpRight size={18} /></Link></div>
        <ErrorNotice error={topics.error} />
        {topics.isLoading && <div className="topic-grid" role="status" aria-label="Loading topics">{[0, 1, 2].map(i => <div className="topic-skeleton" key={i}><div /><span /><span /></div>)}</div>}
        <div className="topic-grid">{topics.data?.results.slice(0, 3).map((t) => <TopicCard key={t.slug} topic={t} />)}</div>
        {topics.data?.results.length === 0 && <p className="notice">New learning topics will appear here as they’re published.</p>}
      </section>
      <section className="question-banner" aria-labelledby="question-heading">
        <div><p className="eyebrow">THERE’S NO PERFECT WAY TO ASK</p><h2 id="question-heading">Whatever’s on your mind,<br />let’s start there.</h2><p>Sometimes, a simple question opens a new door.</p><Link className="button yellow" to="/chat">Ask Abeba <ArrowUpRight size={19} /></Link></div>
        <div className="question-links">{prompts.map((prompt, i) => <Link key={prompt} to={`/chat?question=${encodeURIComponent(prompt)}`}><span className="question-number">0{i + 1}</span><span>{prompt}</span><ArrowUpRight size={19} /></Link>)}</div>
        <LeafMotif />
      </section>
      {news.length > 0 && <section className="announcements"><div className="section-title"><div><p className="eyebrow">STAY A LITTLE CONNECTED</p><h2>From the Abeba community</h2></div></div><div className="announcement-grid">{news.slice(0, 3).map((n, i) => <article key={i}><span className="eyebrow">COMMUNITY NOTES</span><h3>{n.title}</h3><p>{n.body}</p></article>)}</div></section>}
      <ErrorNotice error={announcements.error} />
    </div>
  );
}

function topicStyle(slug: string) {
  if (/mental|wellbeing/.test(slug)) return { icon: Brain, label: "MIND & WELLBEING", tone: "mint" };
  if (/menstru|cycle|maternal/.test(slug)) return { icon: Flower2, label: "YOUR BODY & YOU", tone: "rose" };
  if (/gender|violence|safety/.test(slug)) return { icon: ShieldCheck, label: "SAFETY & SUPPORT", tone: "mint" };
  if (/hiv|aids/.test(slug)) return { icon: Ribbon, label: "HEALTH & AWARENESS", tone: "yellow" };
  if (/family|relationship|pregnan/.test(slug)) return { icon: HeartHandshake, label: "HEALTH & RELATIONSHIPS", tone: "yellow" };
  return { icon: Sprout, label: "HEALTH & WELLBEING", tone: "mint" };
}
function TopicCard({ topic }: { topic: Topic }) {
  const { icon: Icon, label, tone } = topicStyle(topic.slug);
  return (
    <Link className={`topic-card topic-${tone}`} to={`/learn?topic=${encodeURIComponent(topic.slug)}`}>
      <div className="topic-art"><LeafMotif /><span className="topic-icon"><Icon size={52} strokeWidth={1.35} /></span><span className="topic-art-caption">A LITTLE MORE UNDERSTANDING</span></div>
      <div className="topic-copy"><span className="eyebrow">{label}</span><h3>{topic.title}</h3><p>{topic.summary || topic.description || "Take a moment to understand more."}</p><span className="read-link">Take a closer look <ArrowUpRight size={17} /></span></div>
    </Link>
  );
}

function LearnPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("en");
  const [page, setPage] = useState(1);
  const slug = params.get("topic");
  const article = useRef<HTMLElement>(null);
  useEffect(() => {
    if (slug) article.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [slug]);
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
    <div className="page learn-page">
      <section className="learn-heading"><div><p className="eyebrow">A LITTLE KNOWLEDGE GOES A LONG WAY</p><h1>Curiosity looks good on you.</h1><p>Your learning space for health, wellbeing, and everything in between.</p></div><LeafMotif /><BrandFlower /></section>
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
        <article className="reading-card" ref={article}>
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
    if (!messages.length) return;
    end.current?.scrollIntoView({
      block: "nearest",
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
      if (!data.messages.length) window.scrollTo({ top: 0, behavior: "auto" });
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
          <img src="/brand/abeba-welcome.png" alt="Abeba smiles and welcomes you" width="694" height="994" />
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
    <div className="page settings-page">
      <div className="settings-heading"><span className="settings-symbol"><Settings size={26} /></span><div><p className="eyebrow">MAKE THIS SPACE YOURS</p><h1>A little more you.</h1><p>Settings for a space that feels right.</p></div></div>
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
