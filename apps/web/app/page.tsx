"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedItem, CountryMeta, CategoryMeta, UserPreferences } from "@/types";
import { getFeed, getCountries, getCategories, translateTexts } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import Header, { LANGUAGES } from "@/components/Header";
import CategoryChips from "@/components/CategoryChips";
import FeedList from "@/components/FeedList";
import StoryOverlay from "@/components/StoryOverlay";
import AuthModal from "@/components/AuthModal";
import PreferencesModal from "@/components/PreferencesModal";
import NotificationBell from "@/components/NotificationBell";
import LatestWorldMarquee from "@/components/LatestWorldMarquee";
import ChatWidget from "@/components/ChatWidget";

const DEFAULT_COUNTRIES: CountryMeta[] = [
  { code: "NP", name: "Nepal" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "HK", name: "Hong Kong" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IL", name: "Israel" },
  { code: "TR", name: "Turkey" },
  { code: "QA", name: "Qatar" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "CH", name: "Switzerland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "BE", name: "Belgium" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "EG", name: "Egypt" },
  { code: "GH", name: "Ghana" },
];

const DEFAULT_CATEGORIES: CategoryMeta[] = [
  { id: "general", label: "Top Stories" },
  { id: "world", label: "World" },
  { id: "politics", label: "Politics" },
  { id: "economy", label: "Economy" },
  { id: "business", label: "Business" },
  { id: "finance", label: "Finance" },
  { id: "technology", label: "Technology" },
  { id: "science", label: "Science" },
  { id: "space", label: "Space" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "startups", label: "Startups" },
  { id: "crypto", label: "Crypto" },
  { id: "gaming", label: "Gaming" },
  { id: "ai", label: "AI" },
  { id: "health", label: "Health" },
  { id: "education", label: "Education" },
  { id: "environment", label: "Climate" },
  { id: "crime", label: "Crime" },
  { id: "legal", label: "Legal" },
  { id: "religion", label: "Religion" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Arts" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "food", label: "Food" },
  { id: "travel", label: "Travel" },
  { id: "fashion", label: "Style" },
  { id: "art", label: "Art" },
  { id: "automotive", label: "Autos" },
  { id: "energy", label: "Energy" },
  { id: "real-estate", label: "Real Estate" },
  { id: "defense", label: "Defense" },
  { id: "agriculture", label: "Agriculture" },
  { id: "aviation", label: "Aviation" },
  { id: "media", label: "Media" },
  { id: "opinion", label: "Opinion" },
  { id: "weather", label: "Weather" },
];

// Country code → native language code mapping
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  NP: "ne", IN: "hi", PK: "ur", BD: "bn", LK: "si",
  CN: "zh", JP: "ja", KR: "ko", TW: "zh", HK: "zh",
  SG: "en", TH: "th", MY: "ms", ID: "id", PH: "tl", VN: "vi",
  AE: "ar", SA: "ar", IL: "he", TR: "tr", QA: "ar",
  US: "en", CA: "en", MX: "es", BR: "pt", AR: "es", CO: "es", CL: "es",
  GB: "en", DE: "de", FR: "fr", IT: "it", ES: "es", NL: "nl", SE: "sv",
  NO: "no", PL: "pl", CH: "de", IE: "en", PT: "pt", BE: "nl",
  AU: "en", NZ: "en",
  ZA: "en", NG: "en", KE: "sw", EG: "ar", GH: "en",
};

export default function Home() {
  return (
    <AuthProvider>
      <HomeInner />
    </AuthProvider>
  );
}

function HomeInner() {
  const { user, login, register, logout } = useAuth();
  const [countries, setCountries] = useState<CountryMeta[]>(DEFAULT_COUNTRIES);
  const [categories, setCategories] = useState<CategoryMeta[]>(DEFAULT_CATEGORIES);
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("general");
  const [mode, setMode] = useState<"trending" | "latest">("trending");
  const [language, setLanguage] = useState("en");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [displayItems, setDisplayItems] = useState<FeedItem[]>([]);
  const [worldTickerItems, setWorldTickerItems] = useState<FeedItem[]>([]);
  const [worldTickerLoading, setWorldTickerLoading] = useState(true);
  const [feedTranslating, setFeedTranslating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const translateRef = useRef(0);

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [notifInterval, setNotifInterval] = useState(15);

  // Notifications
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    enabled: !!user,
    intervalMinutes: notifInterval,
  });

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = useCallback(
    async (c: string, cat: string, m: "trending" | "latest", silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await getFeed(c, cat, m, 0, 50);
        setItems(data.items);
        setHasMore(data.cursor !== null);
        setError(null);
      } catch {
        if (!silent) {
          setError("Unable to connect to Aion API");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await getFeed(country, category, mode, items.length, 30);
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.cursor !== null);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [country, category, mode, items.length, loadingMore, hasMore]);

  const { connected } = useSSE({
    country,
    category,
    mode,
    onUpdate: useCallback(() => {
      loadFeed(country, category, mode, true);
    }, [country, category, mode, loadFeed]),
  });

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadFeed(country, category, mode);
  }, [country, category, mode, loadFeed]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadFeed(country, category, mode, true);
    }, 120_000);
    return () => clearInterval(interval);
  }, [country, category, mode, loadFeed]);

  const loadWorldTicker = useCallback(async (silent = false) => {
    if (!silent) setWorldTickerLoading(true);
    try {
      const data = await getFeed("", "world", "latest", 0, 20);
      setWorldTickerItems(data.items);
    } catch {
      // Keep current
    } finally {
      if (!silent) setWorldTickerLoading(false);
    }
  }, []);

  useEffect(() => { loadWorldTicker(); }, [loadWorldTicker]);

  useEffect(() => {
    const interval = setInterval(() => loadWorldTicker(true), 120_000);
    return () => clearInterval(interval);
  }, [loadWorldTicker]);

  // Translate feed items
  useEffect(() => {
    if (language === "en" || items.length === 0) {
      setDisplayItems(items);
      setFeedTranslating(false);
      return;
    }

    const requestId = ++translateRef.current;
    const langName = LANGUAGES.find((l) => l.code === language)?.name || language;
    const VISIBLE_COUNT = 8;
    const visibleItems = items.slice(0, VISIBLE_COUNT);
    const restItems = items.slice(VISIBLE_COUNT);

    const buildTexts = (batch: FeedItem[]) => batch.map((item) => item.title);
    const applyTranslation = (batch: FeedItem[], translations: string[]) =>
      batch.map((item, i) => ({ ...item, title: translations[i] || item.title }));

    setFeedTranslating(true);
    setDisplayItems(items);

    const visiblePromise = translateTexts(buildTexts(visibleItems), langName);
    const restPromise = restItems.length > 0 ? translateTexts(buildTexts(restItems), langName) : null;

    let translatedVisible: FeedItem[] | null = null;
    let translatedRest: FeedItem[] | null = null;

    visiblePromise
      .then((resp) => {
        if (translateRef.current !== requestId) return;
        translatedVisible = applyTranslation(visibleItems, resp.translations);
        setDisplayItems([...translatedVisible, ...(translatedRest || restItems)]);
      })
      .catch(() => { if (translateRef.current === requestId) translatedVisible = visibleItems; });

    if (restPromise) {
      restPromise
        .then((resp) => {
          if (translateRef.current !== requestId) return;
          translatedRest = applyTranslation(restItems, resp.translations);
          setDisplayItems([...(translatedVisible || visibleItems), ...translatedRest]);
        })
        .catch(() => { if (translateRef.current === requestId) translatedRest = restItems; });
    }

    Promise.allSettled(restPromise ? [visiblePromise, restPromise] : [visiblePromise])
      .then(() => { if (translateRef.current === requestId) setFeedTranslating(false); });
  }, [language, items]);

  const langName = LANGUAGES.find((l) => l.code === language)?.name || "";

  // Handle country change — auto-set native language
  const handleCountryChange = useCallback((code: string) => {
    setCountry(code);
    if (code && COUNTRY_LANGUAGE_MAP[code]) {
      setLanguage(COUNTRY_LANGUAGE_MAP[code]);
    } else if (!code) {
      // Global — reset to English
      setLanguage("en");
    }
  }, []);

  // Close story overlay with Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedId) setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── NYT HEADER ────────────────────────────────────────── */}
      <Header
        connected={connected}
        countries={countries}
        selectedCountry={country}
        onCountryChange={handleCountryChange}
        selectedLanguage={language}
        onLanguageChange={setLanguage}
        user={user}
        onSignInClick={() => setShowAuthModal(true)}
        onSignOutClick={logout}
        onPreferencesClick={() => setShowPrefsModal(true)}
        notificationBell={
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onClickNotification={(notif) => {
              if (notif.article_id) setSelectedId(notif.article_id);
            }}
          />
        }
        onSearchSelect={setSelectedId}
      />

      {/* ── WORLD TICKER ──────────────────────────────────────── */}
      <LatestWorldMarquee
        items={worldTickerItems}
        loading={worldTickerLoading}
        onSelectStory={setSelectedId}
      />

      {/* ── SECTION NAV ───────────────────────────────────────── */}
      <CategoryChips
        categories={categories}
        selected={category}
        onSelect={setCategory}
        mode={mode}
        onModeChange={setMode}
        countries={countries}
        selectedCountry={country}
        onCountryChange={handleCountryChange}
      />

      {/* ── ERROR BANNER ──────────────────────────────────────── */}
      {error && (
        <div className="max-w-[1200px] mx-auto px-5 mt-3">
          <div className="px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-[13px] text-center">
            {error}
            {items.length > 0 && " \u2014 Showing cached data"}
          </div>
        </div>
      )}

      {/* ── TRANSLATION INDICATOR ─────────────────────────────── */}
      {feedTranslating && (
        <div className="max-w-[1200px] mx-auto px-5 mt-2">
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#eef2ff] border border-[#c7d2fe] text-[12px] text-[#4338ca]">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30 12" />
            </svg>
            Translating feed to {langName}...
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT — NYT FULL-WIDTH EDITORIAL GRID ──────── */}
      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-5 py-5">
          <FeedList
            items={displayItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading && items.length === 0}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </div>
      </main>

      {/* ── NYT-STYLE FOOTER ──────────────────────────────────── */}
      <footer className="border-t-2 border-[var(--color-text-primary)] bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Logo row */}
          <div className="py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <img src="/aion.png" alt="Aion" className="h-[36px] w-auto" />
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#1a8d1a] animate-pulse-live" : "bg-[var(--color-text-tertiary)]"}`} />
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wider">
                {connected ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 py-6">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3">News</h4>
              <div className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("world"); window.scrollTo(0, 0); }}>World</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("politics"); window.scrollTo(0, 0); }}>Politics</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("business"); window.scrollTo(0, 0); }}>Business</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("technology"); window.scrollTo(0, 0); }}>Technology</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("science"); window.scrollTo(0, 0); }}>Science</div>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3">Arts</h4>
              <div className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("entertainment"); window.scrollTo(0, 0); }}>Entertainment</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("art"); window.scrollTo(0, 0); }}>Art & Design</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("fashion"); window.scrollTo(0, 0); }}>Style</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("food"); window.scrollTo(0, 0); }}>Food</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("travel"); window.scrollTo(0, 0); }}>Travel</div>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3">More</h4>
              <div className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("sports"); window.scrollTo(0, 0); }}>Sports</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("health"); window.scrollTo(0, 0); }}>Health</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("environment"); window.scrollTo(0, 0); }}>Climate</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("real-estate"); window.scrollTo(0, 0); }}>Real Estate</div>
                <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => { setCategory("opinion"); window.scrollTo(0, 0); }}>Opinion</div>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3">AI Features</h4>
              <div className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                <div>AI Summaries</div>
                <div>Deep Analysis</div>
                <div>Ask AI</div>
                <div>Multi-Source</div>
                <div>60+ Languages</div>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3">Account</h4>
              <div className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                {user ? (
                  <>
                    <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => setShowPrefsModal(true)}>Preferences</div>
                    <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={logout}>Sign Out</div>
                  </>
                ) : (
                  <div className="cursor-pointer hover:text-[var(--color-text-primary)]" onClick={() => setShowAuthModal(true)}>Sign In</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3">About</h4>
              <div className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>Contact</div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="py-4 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] text-center">
            &copy; {new Date().getFullYear()} Aion. AI-Powered Global News Intelligence.
          </div>
        </div>
      </footer>

      {/* ── STORY OVERLAY (full-screen, like NYT article page) ── */}
      {selectedId && (
        <StoryOverlay
          articleId={selectedId}
          onClose={() => setSelectedId(null)}
          language={language}
          onSelectArticle={setSelectedId}
        />
      )}

      {/* ── MODALS ────────────────────────────────────────────── */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={login}
        onRegister={register}
      />
      <PreferencesModal
        open={showPrefsModal}
        onClose={() => setShowPrefsModal(false)}
        categories={categories}
        countries={countries}
        onSaved={(prefs: UserPreferences) => setNotifInterval(prefs.notification_interval)}
      />

      {/* ── FLOATING AI CHAT ──────────────────────────────────── */}
      <ChatWidget />
    </div>
  );
}
