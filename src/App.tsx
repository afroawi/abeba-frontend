import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
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
  Download,
  Send,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ChevronLeft,
  Menu,
  X,
  AlertTriangle,
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
import {
  LocaleContext,
  localeNames,
  translations,
  useI18n,
  type Locale,
} from "./i18n";

const prompts: Record<Locale, string[]> = {
  en: [
    "How can I take care of my mental health?",
    "Help me understand my cycle",
    "What does a healthy relationship look like?",
  ],
  am: [
    "የአእምሮ ጤናዬን እንዴት ልንከባከብ?",
    "የወር አበባ ዑደቴን እንድረዳ እርዱኝ",
    "ጤናማ ግንኙነት ምን ይመስላል?",
  ],
};
const TELEGRAM_BOT_URL = "https://t.me/Abebachatbot";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.abeba.abebamobileapp";
const chatLanguages = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ" },
];
const languages = [
  ...chatLanguages,
  { value: "ti", label: "ትግርኛ · Tigrinya" },
  { value: "om", label: "Oromoo" },
  { value: "aa", label: "Afar" },
  { value: "sid", label: "Sidama" },
  { value: "so", label: "Soomaali" },
];
function ErrorNotice({ error }: { error: unknown }) {
  const { t } = useI18n();
  return error ? (
    <p className="notice error" role="alert">
      {error instanceof Error ? error.message : t.genericError}
    </p>
  ) : null;
}

// Viewports trim transparent export padding while keeping the supplied artwork intact.
function BrandFlower({ className = "" }: { className?: string }) {
  return <img className={`brand-flower ${className}`} src="/others/abeba-icon.png" alt="" aria-hidden="true" />;
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
      <img className="brand-logo" src="/others/abeba-logo.png" alt="" />
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
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("abeba-locale");
    if (saved === "en" || saved === "am") return saved;
    return navigator.language.toLowerCase().startsWith("am") ? "am" : "en";
  });
  const t = translations[locale];
  useEffect(() => {
    const preferred = activeSession?.language;
    if ((preferred === "en" || preferred === "am") && !localStorage.getItem("abeba-locale")) {
      setLocale(preferred);
    }
  }, [activeSession?.language]);
  useEffect(() => {
    localStorage.setItem("abeba-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
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
    <LocaleContext.Provider value={{ locale, setLocale }}>
    <div className={`app ${mini ? "mini" : ""} ${chatLayout ? "chat-layout" : ""}`}>
      <a className="skip-link" href="#main">{t.skip}</a>
      {!chatLayout && <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            <NavLink to="/home" className={({ isActive }) => isActive || location.pathname === "/" ? "active" : ""}>{t.home}</NavLink>
            <NavLink to="/learn">{t.learn}</NavLink>
            <NavLink to={mini ? "/telegram/chat" : "/chat"}><MessageCircle size={17} />{t.ask}</NavLink>
            <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer"><Send size={16} />{t.telegram}</a>
          </nav>
          <div className="header-actions">
            {mini && <span className="mini-label">{t.telegramChat}</span>}
            {!mini && <a className="header-download" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer"><Download size={15} />{t.getApp}</a>}
            <label className="locale-picker">
              <span className="sr-only">{t.interfaceLanguage}</span>
              <select aria-label={t.interfaceLanguage} value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
                {(Object.keys(localeNames) as Locale[]).map((code) => <option key={code} value={code}>{localeNames[code]}</option>)}
              </select>
            </label>
            <button aria-label={dark ? t.lightTheme : t.darkTheme} className="icon-button theme-toggle" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <NavLink className="profile-link" to="/settings" aria-label={t.settings}><Settings size={19} /></NavLink>
          </div>
        </div>
      </header>}
      <div className="workspace">
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:slug" element={<TopicPage />} />
            <Route path="/chat" element={<ChatPage session={activeSession} sessionError={query.error} mini={false} />} />
            <Route path="/telegram/chat" element={<ChatPage session={activeSession} sessionError={query.error} mini />} />
            <Route path="/settings" element={<SettingsPage session={activeSession} />} />
            <Route path="*" element={<div className="page not-found"><BrandFlower /><h1>{t.notFoundTitle}</h1><p>{t.notFoundBody}</p><Link className="button" to="/home">{t.goHome} <ArrowRight size={18} /></Link></div>} />
          </Routes>
        </main>
        {!chatLayout && <footer className="site-footer"><div className="footer-inner"><div><Brand /><p>{t.footerKnowledge}</p></div><nav aria-label="Footer navigation"><Link to="/learn">{t.learn} <ArrowUpRight size={16} /></Link><Link to="/chat">{t.ask} <ArrowUpRight size={16} /></Link><a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">{t.openTelegram} <ArrowUpRight size={16} /></a><a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">{t.googlePlay} <ArrowUpRight size={16} /></a><Link to="/settings">{t.footerPreferences} <ArrowUpRight size={16} /></Link></nav><div className="footer-signoff"><img src="/others/abeba-mascot.png" alt="" loading="lazy" /><span>{t.footerRooted}</span></div></div><div className="footer-bottom"><span>{t.footerTagline}</span><span>{t.footerNote}</span></div></footer>}
        {!chatLayout && <nav className="bottom-nav" aria-label="Mobile navigation">
          <NavLink to="/home" className={({ isActive }) => isActive || location.pathname === "/" ? "active" : ""}><Home size={21} /><span>{t.home}</span></NavLink>
          <NavLink to="/learn"><BookOpen size={21} /><span>{t.learn}</span></NavLink>
          <NavLink to={mini ? "/telegram/chat" : "/chat"}><MessageCircle size={21} /><span>{t.ask}</span></NavLink>
          <NavLink to="/settings"><Settings size={21} /><span>{t.settings}</span></NavLink>
        </nav>}
      </div>
    </div>
    </LocaleContext.Provider>
  );
}

function HomePage() {
  const { locale, t } = useI18n();
  const topics = useQuery({
    queryKey: ["topics", locale, ""],
    queryFn: () => api<{ results: Topic[] }>(`learn/topics/?language=${locale}`),
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
          <p className="eyebrow"><BrandFlower className="tiny-flower" /> {t.homeEyebrow}</p>
          <h1 id="hero-heading">{t.homeTitle}</h1>
          <p className="hero-description">{t.homeDescription}</p>
          <div className="hero-actions"><Link className="button" to="/chat">{t.letsTalk} <ArrowUpRight size={20} /></Link><Link className="hero-secondary" to="/learn">{t.exploreTopics} <ArrowRight size={18} /></Link></div>
          <div className="hero-reassurance"><Heart size={16} /><span>{t.reassurance}</span></div>
        </div>
        <div className="hero-visual">
          <span className="hero-glow" aria-hidden="true" />
          <img className="hero-mascot" src="/others/abeba-landing-hero.png" alt="Abeba smiles and holds up the Abeba app" fetchPriority="high" />
          <div className="hero-float hero-float-top"><BrandFlower /><span>{t.meetAbeba}</span></div>
          <div className="hero-float hero-float-bottom"><ShieldCheck size={19} /><span>{t.privateByDesign}</span></div>
        </div>
      </section>
      <section className="care-principles" aria-label="Your space with Abeba">
        <div><span className="principle-icon"><MessageCircle size={23} /></span><p><strong>{t.spaceAsk}</strong><span>{t.startWhere}</span></p></div>
        <div><span className="principle-icon"><BookOpen size={23} /></span><p><strong>{t.knowledgeHelps}</strong><span>{t.understandMore}</span></p></div>
        <div><span className="principle-icon"><Sprout size={24} /></span><p><strong>{t.roomGrow}</strong><span>{t.oneStep}</span></p></div>
      </section>
      <section className="ways-section" aria-labelledby="ways-heading">
        <div className="section-title ways-title"><div><p className="eyebrow">{t.waysEyebrow}</p><h2 id="ways-heading">{t.waysTitle}</h2><p>{t.waysIntro}</p></div></div>
        <div className="feature-bento">
          <Link className="feature-card feature-chat" to="/chat">
            <div><span className="feature-number">01</span><h3>{t.askCardTitle}</h3><p>{t.askCardBody}</p><span className="read-link">{t.letsTalk} <ArrowUpRight size={17} /></span></div>
            <img src="/others/home-chat-avatar.png" alt="Abeba welcomes your question" />
          </Link>
          <Link className="feature-card feature-learn" to="/learn">
            <div><span className="feature-number">02</span><h3>{t.learnCardTitle}</h3><p>{t.learnCardBody}</p><span className="read-link">{t.exploreTopics} <ArrowUpRight size={17} /></span></div>
            <img src="/others/home-discover-mascot.png" alt="Abeba points toward learning topics" loading="lazy" />
          </Link>
          <Link className="feature-card feature-quiz" to="/learn">
            <div><span className="feature-number">03</span><h3>{t.quizCardTitle}</h3><p>{t.quizCardBody}</p><span className="read-link">{t.exploreTopics} <ArrowUpRight size={17} /></span></div>
            <img src="/others/home-quiz-avatar.png" alt="Abeba invites you to test your knowledge" loading="lazy" />
          </Link>
        </div>
      </section>
      <section className="learning-section" aria-labelledby="discovery-heading">
        <div className="section-title"><div><p className="eyebrow">{t.curiosity}</p><h2 id="discovery-heading">{t.discoveryTitle}</h2></div><Link className="section-link" to="/learn">{t.exploreAll} <ArrowUpRight size={18} /></Link></div>
        <ErrorNotice error={topics.error} />
        {topics.isLoading && <div className="topic-grid" role="status" aria-label="Loading topics">{[0, 1, 2].map(i => <div className="topic-skeleton" key={i}><div /><span /><span /></div>)}</div>}
        <div className="topic-grid">{topics.data?.results.slice(0, 3).map((topic) => <TopicCard key={topic.slug} topic={topic} language={locale} />)}</div>
        {topics.data?.results.length === 0 && <p className="notice">{t.noPublished}</p>}
      </section>
      <section className="question-banner" aria-labelledby="question-heading">
        <div><p className="eyebrow">{t.noPerfectEyebrow}</p><h2 id="question-heading">{t.whateverMind}</h2><p>{t.simpleQuestion}</p><Link className="button yellow" to="/chat">{t.ask} <ArrowUpRight size={19} /></Link></div>
        <div className="question-panel"><div className="question-panel-heading"><img src="/others/home-chat-avatar.png" alt="" /><span><strong>{t.ask}</strong><small>{t.chatStatus}</small></span><i aria-hidden="true" /></div><div className="question-links">{prompts[locale].map((prompt, i) => <Link key={prompt} to={`/chat?question=${encodeURIComponent(prompt)}`}><span className="question-number">0{i + 1}</span><span>{prompt}</span><ArrowUpRight size={19} /></Link>)}</div></div>
        <LeafMotif />
      </section>
      <section className="companion-section" aria-labelledby="companion-heading">
        <div className="companion-copy">
          <p className="eyebrow">{t.companionEyebrow}</p>
          <h2 id="companion-heading">{t.companionTitle}</h2>
          <p>{t.companionBody}</p>
          <div className="companion-points">
            <span><Sparkles size={18} />{t.languageFirst}</span>
            <span><BookOpen size={18} />{t.topicFirst}</span>
            <span><Heart size={18} />{t.alwaysHere}</span>
          </div>
          <Link className="button" to="/learn">{t.exploreAll} <ArrowUpRight size={18} /></Link>
        </div>
        <div className="companion-gallery" aria-label="Abeba app experience">
          <figure className="gallery-language"><img src="/others/onboarding-language.png" alt="Abeba language welcome artwork" loading="lazy" /><figcaption>{t.languageFirst}</figcaption></figure>
          <figure className="gallery-topics"><img src="/others/onboarding-topics.png" alt="Abeba surrounded by health and wellbeing topics" loading="lazy" /><figcaption>{t.topicFirst}</figcaption></figure>
          <div className="gallery-welcome" aria-hidden="true"><img src="/others/onboarding-welcome.png" alt="" loading="lazy" /><img src="/others/onboarding-welcome-2.png" alt="" loading="lazy" /></div>
          <figure className="gallery-wave"><img src="/others/abeba-waving.gif" alt="Abeba waves hello" loading="lazy" /><figcaption>{t.alwaysHere}</figcaption></figure>
        </div>
      </section>
      <section className="download-section" aria-labelledby="download-heading">
        <div className="download-visual"><span className="download-orbit" aria-hidden="true" /><img src="/others/abeba-waving-2.gif" alt="Abeba welcomes you to the app and Telegram bot" loading="lazy" /><BrandFlower /></div>
        <div className="download-copy"><p className="eyebrow">{t.downloadEyebrow}</p><h2 id="download-heading">{t.downloadTitle}</h2><p>{t.downloadBody}</p><div className="download-actions"><a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer"><span className="download-icon"><Smartphone size={22} /></span><span><small>{t.androidLabel}</small><strong>{t.googlePlay}</strong><em>{t.androidDetail}</em></span><ArrowUpRight size={19} /></a><a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer"><span className="download-icon telegram-icon"><Send size={21} /></span><span><small>{t.telegramLabel}</small><strong>{t.openTelegram}</strong><em>{t.telegramDetail}</em></span><ArrowUpRight size={19} /></a></div></div>
      </section>
      {news.length > 0 && <section className="announcements"><div className="section-title"><div><p className="eyebrow">{t.communityEyebrow}</p><h2>{t.communityTitle}</h2></div></div><div className="announcement-grid">{news.slice(0, 3).map((n, i) => <article key={i}><span className="eyebrow">{t.communityNotes}</span><h3>{n.title}</h3><p>{n.body}</p></article>)}</div></section>}
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
function TopicCard({ topic, language }: { topic: Topic; language: string }) {
  const { locale, t } = useI18n();
  const { icon: Icon, label, tone } = topicStyle(topic.slug);
  return (
    <Link className={`topic-card topic-${tone}`} to={`/learn/${encodeURIComponent(topic.slug)}?language=${encodeURIComponent(language)}`}>
      <div className="topic-art"><LeafMotif /><span className="topic-icon"><Icon size={52} strokeWidth={1.35} /></span><span className="topic-art-caption">{t.understanding}</span></div>
      <div className="topic-copy"><span className="eyebrow">{locale === "en" ? label : t.understanding}</span><h3>{topic.title}</h3><p>{topic.summary || topic.description || t.learnIntro}</p><span className="read-link">{t.closerLook} <ArrowUpRight size={17} /></span></div>
    </Link>
  );
}

function LearnPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const language = languages.some((item) => item.value === params.get("language"))
    ? params.get("language")!
    : locale;
  useEffect(() => {
    const legacySlug = params.get("topic");
    if (legacySlug) {
      navigate(`/learn/${encodeURIComponent(legacySlug)}?language=${encodeURIComponent(language)}`, { replace: true });
    }
  }, [language, navigate, params]);
  const topics = useQuery({
    queryKey: ["topics", language, search, page],
    queryFn: () =>
      api<{ results: Topic[]; next: string | null; previous: string | null }>(
        `learn/topics/?language=${language}&search=${encodeURIComponent(search)}&page=${page}`,
      ),
  });
  function changeLanguage(nextLanguage: string) {
    setParams(nextLanguage === locale ? {} : { language: nextLanguage });
    setPage(1);
  }
  return (
    <div className="page learn-page">
      <section className="learn-heading"><div><p className="eyebrow">{t.learnEyebrow}</p><h1>{t.learnTitle}</h1><p>{t.learnIntro}</p></div><img className="learn-heading-mascot" src="/others/home-discover-mascot.png" alt="Abeba points toward learning topics" /><LeafMotif /><BrandFlower /></section>
      <div className="filters">
        <label>
          {t.searchTopics}
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t.searchPlaceholder}
          />
        </label>
        <label>
          {t.contentLanguage}
          <select
            value={language}
            onChange={(event) => changeLanguage(event.target.value)}
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ErrorNotice error={topics.error} />
      {topics.isLoading && <div className="topic-grid" role="status" aria-label={t.loadingTopics}>{[0, 1, 2].map((item) => <div className="topic-skeleton" key={item}><div /><span /><span /></div>)}</div>}
      <div className="topic-grid">
        {topics.data?.results.map((topic) => (
          <TopicCard key={topic.slug} topic={topic} language={language} />
        ))}
      </div>
      {topics.data?.results.length === 0 && <p className="notice">{t.noTopics}</p>}
      <div className="pagination">
        <button disabled={!topics.data?.previous} onClick={() => setPage(page - 1)}>{t.previous}</button>
        <span>{t.page} {page}</span>
        <button disabled={!topics.data?.next} onClick={() => setPage(page + 1)}>{t.next}</button>
      </div>
    </div>
  );
}

function TopicPage() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { locale, t } = useI18n();
  const requestedLanguage = params.get("language");
  const language = languages.some((item) => item.value === requestedLanguage)
    ? requestedLanguage!
    : locale;
  const detail = useQuery({
    queryKey: ["topic", slug, language],
    enabled: Boolean(slug),
    queryFn: () => api<Topic>(`learn/topics/${encodeURIComponent(slug)}/?language=${encodeURIComponent(language)}`),
  });
  const topic = detail.data;
  const markdown = topic?.content_markdown || topic?.body || topic?.markdown || topic?.description || topic?.summary || "";
  return (
    <div className="page topic-page">
      <div className="topic-toolbar">
        <Link className="text-button" to={`/learn?language=${encodeURIComponent(language)}`}>← {t.allTopics}</Link>
        <label>
          <span>{t.contentLanguage}</span>
          <select value={language} onChange={(event) => setParams({ language: event.target.value })}>
            {languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <ErrorNotice error={detail.error} />
      {detail.isLoading && <article className="reading-card article-loading" role="status"><div className="loading-line wide" /><div className="loading-line" /><div className="loading-line" /></article>}
      {topic && (
        <article className="reading-card">
          {safeHttps(topic.image_url || "") && <img className="topic-hero-image" src={topic.image_url} alt="" />}
          <p className="eyebrow">{languages.find((item) => item.value === (topic.language || language))?.label || topic.language}</p>
          <h1>{topic.title}</h1>
          {topic.summary && topic.summary !== markdown && <p className="topic-summary">{topic.summary}</p>}
          {markdown ? <Markdown>{markdown}</Markdown> : !topic.sections?.length ? <p>{t.topicUnavailable}</p> : null}
          {topic.sections?.map((section, index) => (
            <section key={`${section.title || section.heading || "section"}-${index}`}>
              {(section.title || section.heading) && <h2>{section.title || section.heading}</h2>}
              {(section.body || section.content) && <Markdown>{section.body || section.content}</Markdown>}
              {section.bullets?.length ? <ul>{section.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul> : null}
            </section>
          ))}
          {topic.audios?.some((audio) => audio.audio_url && safeHttps(audio.audio_url)) && <section className="topic-resources"><h2>{t.listen}</h2>{topic.audios?.filter((audio) => audio.audio_url && safeHttps(audio.audio_url)).map((audio) => <a key={audio.id} href={audio.audio_url!} target="_blank" rel="noopener noreferrer">{audio.title || t.listen} <ArrowUpRight size={16} /></a>)}</section>}
          <div className="topic-actions">
            <Link className="button" to={`/chat?question=${encodeURIComponent(`${t.askAbout}: ${topic.title}`)}`}>{t.askAbout} <MessageCircle size={17} /></Link>
            {topic.source_url && safeHttps(topic.source_url) && <a className="outline-button" href={topic.source_url} target="_blank" rel="noopener noreferrer">{t.source} <ArrowUpRight size={16} /></a>}
          </div>
        </article>
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
  const { locale, t } = useI18n();
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
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const retryRequest = useRef<{
    request_key: string;
    message: string;
    session_id?: number;
  } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const composerInput = useRef<HTMLTextAreaElement>(null);
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
  }, [messages, pendingMessage]);
  useEffect(() => {
    const input = composerInput.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }, [draft]);
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
    setPendingMessage(body.message);
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
      setPendingMessage(null);
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
  const filteredHistory = (history.data?.results || []).filter((item) =>
    item.preview.toLocaleLowerCase().includes(historySearch.trim().toLocaleLowerCase()),
  );
  return (
    <div className={`chat-page ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {mobileSidebarOpen && <button className="sidebar-scrim" aria-label={t.closeSidebar} onClick={() => setMobileSidebarOpen(false)} />}
      <aside id="chat-sidebar" className={`chat-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`} aria-label={t.chatHistory}>
        <div className="sidebar-topbar">
          <Link className="sidebar-back" to="/home" title={t.backHome}><ChevronLeft size={20} /><span>{t.backHome}</span></Link>
          <button className="sidebar-collapse" aria-label={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar} aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((value) => !value)}>{sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button>
          <button className="sidebar-mobile-close" aria-label={t.closeSidebar} onClick={() => setMobileSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="sidebar-brand"><BrandFlower /><span><strong>Abeba</strong><small>{t.chatStatus}</small></span></div>
        <button className="sidebar-new-chat" disabled={!session || busy} onClick={() => { setMobileSidebarOpen(false); void selectChat(); }} title={t.newChat}><Plus size={19} /><span>{t.newChat}</span></button>
        {session && <div className="sidebar-history">
          <label className="history-search"><Search size={16} /><span className="sr-only">{t.searchChats}</span><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder={t.searchChats} /></label>
          <p className="sidebar-section-label">{t.chatHistory}</p>
          <div className="history-list">
            {filteredHistory.map((item) => <button className={chatId === item.id ? "active" : ""} key={item.id} disabled={busy} onClick={() => { setMobileSidebarOpen(false); void selectChat(item.id); }} title={item.preview}><MessageCircle size={16} /><span>{item.preview}</span></button>)}
            {!history.isLoading && filteredHistory.length === 0 && <p className="history-empty">{historySearch ? t.noMatchingChats : t.noChats}</p>}
          </div>
        </div>}
        <div className="sidebar-safety" title={t.aiNote}><AlertTriangle size={18} /><div><p>{t.aiNote}</p><span>{t.historyNote}</span></div></div>
      </aside>

      <section className="chat-main">
        <div className="chat-heading">
          <button className="sidebar-mobile-trigger" aria-label={t.openSidebar} aria-controls="chat-sidebar" aria-expanded={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(true)}><Menu size={21} /></button>
          <div className="chat-title">
            <img src="/others/home-chat-avatar.png" alt="" />
            <div><h1>{t.ask}</h1><span><span className="status-dot" />{t.chatStatus}</span></div>
          </div>
          {session && <span className="chat-language-badge">{session.language === "am" ? "አማርኛ" : "English"}</span>}
        </div>
        <div className="chat-error"><ErrorNotice error={error || (unavailable ? sessionError : undefined) || context.error || history.error} /></div>
        {!session ? (
          <div className="chat-stage"><div className="chat-welcome"><img src="/others/abeba-paused.jpg" alt="Abeba smiles and welcomes you" width="360" height="280" /><h2>{t.questionsBelong}</h2><p>{mini ? t.telegramConnect : t.browserConnect}</p><button className="button" disabled={busy} onClick={connect}>{busy ? t.connecting : mini ? t.connectTelegram : t.startChatting}</button></div></div>
        ) : !session.ai_consent ? (
          <div className="chat-stage"><div className="consent-card"><Sparkles /><h2>{t.beforeChat}</h2><p>{t.consentOne}</p><p>{t.consentTwo}</p><button className="button" disabled={busy} onClick={consent}>{t.agree}</button></div></div>
        ) : (
          <>
            <div className="message-area" aria-label={t.conversation}>
              <div className="message-stream">
                <p className="chat-date">{t.kindness}</p>
                {messages.length === 0 && <div className="empty-chat"><img className="empty-chat-mascot" src="/others/abeba-waving-2.gif" alt="Abeba waves hello" /><h2>{t.whatsOnMind}</h2><p>{t.noPerfectWay}</p><div className="suggestions">{prompts[locale].map((prompt) => <button key={prompt} onClick={() => { setDraft(prompt); requestAnimationFrame(() => composerInput.current?.focus()); }}>{prompt}<ArrowUpRight size={16} /></button>)}</div></div>}
                {messages.map((message) => <article className={`message ${message.role}`} key={message.id}><span className="message-name">{message.role === "assistant" ? "✿ Abeba" : t.you}</span><Markdown>{message.text}</Markdown>{message.structured?.examples?.map((example, index) => <blockquote key={index}>{example}</blockquote>)}{message.structured?.links?.filter((link) => safeHttps(link.url)).map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.title} ↗</a>)}{message.structured?.suggested_followups?.map((followup, index) => <button className="followup" key={index} onClick={() => { setDraft(followup); requestAnimationFrame(() => composerInput.current?.focus()); }}>{followup}</button>)}</article>)}
                {pendingMessage && <article className="message user pending-message"><span className="message-name">{t.you}</span><p>{pendingMessage}</p></article>}
                {pendingMessage && <div className="thinking" role="status" aria-live="polite"><img src="/others/abeba-talking.gif" alt="" /><div><strong>{t.thinking}</strong><span>{t.thinkingDetail}</span><span className="typing-dots" aria-hidden="true"><i /><i /><i /></span></div></div>}
                <div ref={end} />
              </div>
            </div>
            {uncertain && <div className="notice chat-retry-notice">{t.requestUncertain}<button onClick={() => void qc.invalidateQueries({ queryKey: ["context"] })}>{t.refreshHistory}</button><button disabled={busy} onClick={() => send(true)}>{t.retry}</button><button disabled={busy} onClick={() => { setUncertain(false); retryRequest.current = null; }}>{t.dismiss}</button></div>}
            <div className="composer-shell"><form className="composer" onSubmit={(event) => { event.preventDefault(); void send(); }}><label className="sr-only" htmlFor="message">{t.yourMessage}</label><textarea id="message" ref={composerInput} placeholder={t.messagePlaceholder} value={draft} maxLength={6000} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} /><button aria-label={t.send} disabled={busy || uncertain || !draft.trim()}><ArrowUp size={22} /></button></form><span className={`character-count ${draft.length > 5400 ? "near-limit" : ""}`}>{draft.length ? `${draft.length.toLocaleString()} / 6,000` : ""}</span></div>
          </>
        )}
      </section>
    </div>
  );
}

function SettingsPage({ session }: { session?: Session }) {
  const { t, setLocale } = useI18n();
  const qc = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function update(body: unknown) {
    setBusy(true);
    setError(undefined);
    try {
      const next = await api<Session>("channels/preferences/", "PATCH", body);
      qc.setQueryData(["session"], next);
      if (next.language === "en" || next.language === "am") setLocale(next.language);
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
      <div className="settings-heading"><span className="settings-symbol"><Settings size={26} /></span><div><p className="eyebrow">{t.makeYours}</p><h1>{t.settingsTitle}</h1><p>{t.settingsIntro}</p></div></div>
      <ErrorNotice error={error} />
      {session ? (
        <div className="settings-card">
          <h2>{session.user.username}</h2>
          <label>
            {t.chatLanguage}
            <select
              disabled={busy}
              value={session.language}
              onChange={(e) => update({ language: e.target.value })}
            >
              {chatLanguages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <p>{t.consentStatus}: {session.ai_consent ? t.accepted : t.notAccepted}</p>
          {session.ai_consent && (
            <button
              className="outline-button"
              disabled={busy}
              onClick={() => update({ ai_consent: false })}
            >
              {t.withdraw}
            </button>
          )}
          <p>
            {t.remaining}:{" "}
            {session.quota.tokens_remaining.toLocaleString()} tokens
          </p>
          <button className="outline-button" disabled={busy} onClick={logout}>
            <LogOut size={18} />
            {t.endSession}
          </button>
          <p className="muted">
            Ending an unlinked browser session removes your access to that
            account. Telegram users can reconnect through the bot. Account
            linking, deletion and notification preferences are planned next.
          </p>
        </div>
      ) : (
        <div className="settings-card">
          <p>{t.startManage}</p>
          <Link className="button" to="/chat">
            {t.openChat}
          </Link>
        </div>
      )}
    </div>
  );
}
