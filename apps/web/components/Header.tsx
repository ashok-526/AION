"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import type { CountryMeta, User } from "@/types";
import SearchBar from "@/components/SearchBar";

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ne", name: "Nepali" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "si", name: "Sinhala" },
  { code: "ur", name: "Urdu" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "tl", name: "Filipino" },
  { code: "my", name: "Burmese" },
  { code: "km", name: "Khmer" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "el", name: "Greek" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "uk", name: "Ukrainian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sk", name: "Slovak" },
  { code: "sr", name: "Serbian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "et", name: "Estonian" },
  { code: "ca", name: "Catalan" },
  { code: "ar", name: "Arabic" },
  { code: "he", name: "Hebrew" },
  { code: "fa", name: "Persian" },
  { code: "tr", name: "Turkish" },
  { code: "sw", name: "Swahili" },
  { code: "am", name: "Amharic" },
  { code: "ru", name: "Russian" },
  { code: "kk", name: "Kazakh" },
  { code: "uz", name: "Uzbek" },
  { code: "ht", name: "Haitian Creole" },
];

interface HeaderProps {
  connected: boolean;
  countries: CountryMeta[];
  selectedCountry: string;
  onCountryChange: (code: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  user: User | null;
  onSignInClick: () => void;
  onSignOutClick: () => void;
  onPreferencesClick: () => void;
  notificationBell: ReactNode;
  onSearchSelect: (articleId: number) => void;
}

export default function Header({
  connected,
  selectedLanguage,
  onLanguageChange,
  user,
  onSignInClick,
  onSignOutClick,
  onPreferencesClick,
  notificationBell,
  onSearchSelect,
}: HeaderProps) {
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const selectedLangName = LANGUAGES.find((l) => l.code === selectedLanguage)?.name || "English";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header>
      {/* ── Top utility bar ─────────────────────────────────────── */}
      <div className="border-b border-[var(--color-border)]">
        <div className="max-w-[1200px] mx-auto px-5 py-1.5 flex items-center justify-between">
          {/* Left: Date + Today's Paper */}
          <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-tertiary)]">
            <span>{dateStr}</span>
            <span className="hidden sm:inline text-[var(--color-border)]">|</span>
            <span className="hidden sm:inline cursor-pointer hover:text-[var(--color-text-primary)] transition-colors">Today&apos;s Paper</span>
          </div>

          {/* Right: Language, Bell, Search, Live, Auth */}
          <div className="flex items-center gap-3">
            {/* Language selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M1.5 8h13M8 1.5c-2 2.5-2 10.5 0 13M8 1.5c2 2.5 2 10.5 0 13" />
                </svg>
                <span className="font-medium">{selectedLangName}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${langOpen ? "rotate-180" : ""}`}>
                  <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-[200px] bg-white border border-[var(--color-border)] shadow-lg z-50 max-h-[360px] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Read News In</span>
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { onLanguageChange(lang.code); setLangOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[12px] border-b border-[var(--color-border)] transition-colors ${
                        lang.code === selectedLanguage
                          ? "bg-[var(--color-bg-inverse)] text-white font-medium"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                      }`}
                    >
                      {lang.name}
                      {lang.code === "en" && <span className="ml-1.5 text-[10px] opacity-60">(Original)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[var(--color-border)]">|</span>

            {/* Notification Bell */}
            {user && notificationBell}

            {/* Search */}
            <SearchBar onSelectArticle={onSearchSelect} />

            <span className="text-[var(--color-border)]">|</span>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#1a8d1a] animate-pulse-live" : "bg-[var(--color-text-tertiary)]"}`} />
              <span className="text-[var(--color-text-tertiary)] font-medium">{connected ? "LIVE" : "..."}</span>
            </div>

            <span className="text-[var(--color-border)]">|</span>

            {/* Auth */}
            {!user ? (
              <button
                onClick={onSignInClick}
                className="text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5.5" r="3" />
                    <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
                  </svg>
                  <span className="font-medium max-w-[80px] truncate">{user.display_name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-[var(--color-border)] shadow-lg z-50">
                    <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <div className="text-[11px] font-medium text-[var(--color-text-primary)] truncate">{user.display_name}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">{user.email}</div>
                    </div>
                    <button
                      onClick={() => { onPreferencesClick(); setUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors border-b border-[var(--color-border)]"
                    >
                      Preferences
                    </button>
                    <button
                      onClick={() => { onSignOutClick(); setUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Masthead ─────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="py-4 flex items-center justify-center">
          <img src="/aion.png" alt="Aion" className="h-[70px] md:h-[90px] w-auto" />
        </div>
      </div>

      {/* ── Bottom double rule ───────────────────────────────────── */}
      <hr className="rule-double" />
    </header>
  );
}
