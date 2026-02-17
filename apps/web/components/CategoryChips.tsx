"use client";

import { useRef, useState, useEffect } from "react";
import type { CategoryMeta, CountryMeta } from "@/types";

const REGIONS: { label: string; codes: string[] }[] = [
  { label: "South Asia", codes: ["NP", "IN", "PK", "BD", "LK"] },
  { label: "East Asia", codes: ["CN", "JP", "KR", "TW", "HK"] },
  { label: "Southeast Asia", codes: ["SG", "TH", "MY", "ID", "PH", "VN"] },
  { label: "Middle East", codes: ["AE", "SA", "IL", "TR", "QA"] },
  { label: "Americas", codes: ["US", "CA", "MX", "BR", "AR", "CO", "CL"] },
  { label: "Europe", codes: ["GB", "DE", "FR", "IT", "ES", "NL", "SE", "NO", "PL", "CH", "IE", "PT", "BE"] },
  { label: "Oceania", codes: ["AU", "NZ"] },
  { label: "Africa", codes: ["ZA", "NG", "KE", "EG", "GH"] },
];

interface Props {
  categories: CategoryMeta[];
  selected: string;
  onSelect: (id: string) => void;
  mode: "trending" | "latest";
  onModeChange: (mode: "trending" | "latest") => void;
  countries: CountryMeta[];
  selectedCountry: string;
  onCountryChange: (code: string) => void;
}

export default function CategoryChips({
  categories,
  selected,
  onSelect,
  mode,
  onModeChange,
  countries,
  selectedCountry,
  onCountryChange,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [countryOpen, setCountryOpen] = useState(false);

  const countryMap = Object.fromEntries(countries.map((c) => [c.code, c.name]));
  const selectedCountryName = selectedCountry ? (countryMap[selectedCountry] || selectedCountry) : "Global";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setCountryOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="border-b border-[var(--color-border)]">
      <div className="max-w-[1280px] mx-auto px-5">
        <div className="flex items-center gap-0">
          {/* Mode toggle */}
          <div className="flex items-center border-r border-[var(--color-border)] mr-2">
            {(["trending", "latest"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`section-nav-item text-[12px] ${mode === m ? "active" : ""}`}
              >
                {m === "trending" ? "Trending" : "Latest"}
              </button>
            ))}
          </div>

          {/* Scrollable section nav */}
          <div
            ref={scrollRef}
            className="flex-1 flex items-center gap-0 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`section-nav-item ${selected === cat.id ? "active" : ""}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Country/Region selector */}
          <div ref={dropdownRef} className="relative ml-2 border-l border-[var(--color-border)] pl-2">
            <button
              onClick={() => setCountryOpen(!countryOpen)}
              className="flex items-center gap-1.5 section-nav-item text-[12px] whitespace-nowrap"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M1.5 8h13M8 1.5c-2 2.5-2 10.5 0 13M8 1.5c2 2.5 2 10.5 0 13" />
              </svg>
              {selectedCountryName}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${countryOpen ? "rotate-180" : ""}`}>
                <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {countryOpen && (
              <div className="absolute right-0 top-full mt-1 w-[220px] bg-white border border-[var(--color-border)] shadow-lg z-50 max-h-[400px] overflow-y-auto">
                {/* Global option */}
                <button
                  onClick={() => { onCountryChange(""); setCountryOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[12px] border-b border-[var(--color-border)] transition-colors ${
                    !selectedCountry
                      ? "bg-[var(--color-bg-inverse)] text-white font-medium"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  }`}
                >
                  Global (All Countries)
                </button>

                {/* Region-grouped countries */}
                {REGIONS.map((region) => {
                  const regionCountries = region.codes
                    .map((code) => countries.find((c) => c.code === code))
                    .filter(Boolean) as CountryMeta[];
                  if (regionCountries.length === 0) return null;
                  return (
                    <div key={region.label}>
                      <div className="px-3 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          {region.label}
                        </span>
                      </div>
                      {regionCountries.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => { onCountryChange(c.code); setCountryOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-[12px] border-b border-[var(--color-border)] transition-colors ${
                            c.code === selectedCountry
                              ? "bg-[var(--color-bg-inverse)] text-white font-medium"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
