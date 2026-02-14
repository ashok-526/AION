"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedItem, CountryMeta, CategoryMeta, UserPreferences } from "@/types";
import { getFeed, getCountries, getCategories, translateTexts } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/utils";
import Header, { LANGUAGES } from "@/components/Header";
import CategoryChips from "@/components/CategoryChips";
import FeedList from "@/components/FeedList";
import StoryPanel from "@/components/StoryPanel";
import AuthModal from "@/components/AuthModal";
import PreferencesModal from "@/components/PreferencesModal";
import NotificationBell from "@/components/NotificationBell";
import CountrySidebar from "@/components/CountrySidebar";
import WeatherWidget from "@/components/WeatherWidget";

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
  { id: "general", label: "General" },
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
  { id: "environment", label: "Environment" },
  { id: "crime", label: "Crime" },
  { id: "legal", label: "Legal" },
  { id: "religion", label: "Religion" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Entertainment" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "food", label: "Food" },
  { id: "travel", label: "Travel" },
  { id: "fashion", label: "Fashion" },
  { id: "art", label: "Art" },
  { id: "automotive", label: "Automotive" },
  { id: "energy", label: "Energy" },
  { id: "real-estate", label: "Real Estate" },
  { id: "defense", label: "Defense" },
  { id: "agriculture", label: "Agriculture" },
  { id: "aviation", label: "Aviation" },
  { id: "media", label: "Media" },
  { id: "opinion", label: "Opinion" },
  { id: "weather", label: "Weather" },
];

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
  const [feedTranslating, setFeedTranslating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
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

  const { connected } = useSSE({
    country,
    category,
    mode,
    onUpdate: useCallback(() => {
      loadFeed(country, category, mode, true);
    }, [country, category, mode]),
  });

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const loadFeed = useCallback(
    async (c: string, cat: string, m: "trending" | "latest", silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await getFeed(c, cat, m);
        setItems(data.items);
        setLastUpdated(data.updated_at);
        setError(null);
      } catch {
        if (!silent) {
          setError("Unable to connect to NewsPulse API");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadFeed(country, category, mode);
  }, [country, category, mode, loadFeed]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadFeed(country, category, mode, true);
    }, 120_000);
    return () => clearInterval(interval);
  }, [country, category, mode, loadFeed]);

  // Translate feed items when language changes — progressive (visible first, then rest)
  useEffect(() => {
    if (language === "en" || items.length === 0) {
      setDisplayItems(items);
      setFeedTranslating(false);
      return;
    }

    const requestId = ++translateRef.current;
    const langName = LANGUAGES.find((l) => l.code === language)?.name || language;

    // Split: first 6 items (visible above fold) vs rest
    const VISIBLE_COUNT = 6;
    const visibleItems = items.slice(0, VISIBLE_COUNT);
    const restItems = items.slice(VISIBLE_COUNT);

    const buildTexts = (batch: FeedItem[]) => {
      const texts: string[] = [];
      for (const item of batch) {
        texts.push(item.title);
        texts.push(item.ai_summary || "");
      }
      return texts;
    };

    const applyTranslation = (batch: FeedItem[], translations: string[]) =>
      batch.map((item, i) => ({
        ...item,
        title: translations[i * 2] || item.title,
        ai_summary: translations[i * 2 + 1] || item.ai_summary,
      }));

    setFeedTranslating(true);
    // Show originals immediately while translating
    setDisplayItems(items);

    // Phase 1: Translate visible items first (fast — only 6 items)
    translateTexts(buildTexts(visibleItems), langName)
      .then((resp) => {
        if (translateRef.current !== requestId) return;
        const translatedVisible = applyTranslation(visibleItems, resp.translations);
        // Show translated visible + original rest
        setDisplayItems([...translatedVisible, ...restItems]);

        // Phase 2: Translate remaining items in background
        if (restItems.length > 0) {
          translateTexts(buildTexts(restItems), langName)
            .then((resp2) => {
              if (translateRef.current !== requestId) return;
              const translatedRest = applyTranslation(restItems, resp2.translations);
              setDisplayItems([...translatedVisible, ...translatedRest]);
            })
            .catch(() => {})
            .finally(() => {
              if (translateRef.current === requestId) setFeedTranslating(false);
            });
        } else {
          setFeedTranslating(false);
        }
      })
      .catch(() => {
        if (translateRef.current !== requestId) return;
        setDisplayItems(items);
        setFeedTranslating(false);
      });
  }, [language, items]);

  const langName = LANGUAGES.find((l) => l.code === language)?.name || "";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* NYT-style Header with masthead */}
      <Header
        connected={connected}
        lastUpdate={lastUpdated ? timeAgo(lastUpdated) : null}
        countries={countries}
        selectedCountry={country}
        onCountryChange={setCountry}
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

      {/* Section navigation bar */}
      <CategoryChips
        categories={categories}
        selected={category}
        onSelect={setCategory}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Error banner */}
      {error && (
        <div className="max-w-[1280px] mx-auto px-5 mt-3">
          <div className="px-4 py-2 border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-[13px] text-center">
            {error}
            {items.length > 0 && " \u2014 Showing cached data"}
          </div>
        </div>
      )}

      {/* Translation indicator for feed */}
      {feedTranslating && (
        <div className="max-w-[1280px] mx-auto px-5 mt-2">
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#eef2ff] border border-[#c7d2fe] text-[12px] text-[#4338ca]">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30 12" />
            </svg>
            Translating feed to {langName}...
          </div>
        </div>
      )}

      {/* Main content area — feed, story, country sidebar */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Feed list */}
        <div className="flex-1 min-w-0 overflow-y-auto border-r border-[var(--color-border)]">
          <div className="max-w-[960px] mx-auto px-5 py-5">
            <FeedList
              items={displayItems}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading && items.length === 0}
            />
          </div>
        </div>

        {/* Middle: Story detail panel */}
        <div className="hidden lg:block lg:w-[520px] xl:w-[600px] 2xl:w-[680px] overflow-y-auto bg-white">
          <StoryPanel
            articleId={selectedId}
            onClose={() => setSelectedId(null)}
            language={language}
          />
        </div>

        {/* Right: Weather + Country sidebar */}
        <div className="hidden md:block w-[140px] shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <WeatherWidget />
          <CountrySidebar
            countries={countries}
            selectedCountry={country}
            onCountryChange={setCountry}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="max-w-[1280px] mx-auto px-5 py-3 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
          <span>NewsPulse &middot; AI-Powered Global News</span>
          <span>NewsAPI &middot; Guardian &middot; GDELT{lastUpdated && ` \u00B7 ${timeAgo(lastUpdated)}`}</span>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={login}
        onRegister={register}
      />

      {/* Preferences Modal */}
      <PreferencesModal
        open={showPrefsModal}
        onClose={() => setShowPrefsModal(false)}
        categories={categories}
        countries={countries}
        onSaved={(prefs: UserPreferences) => setNotifInterval(prefs.notification_interval)}
      />
    </div>
  );
}
