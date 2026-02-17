"use client";

import type { FeedItem } from "@/types";
import FeedCard from "./FeedCard";

interface Props {
  items: FeedItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function FeedList({
  items,
  selectedId,
  onSelect,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
}: Props) {
  if (loading) {
    return (
      <div>
        {/* Hero skeleton */}
        <div className="nyt-hero-grid border-b border-[var(--color-border)] pb-6 mb-0">
          <div className="pr-6 border-r border-[var(--color-border)] animate-pulse">
            <div className="w-full aspect-[16/9] bg-[var(--color-bg-tertiary)] mb-4" />
            <div className="h-3 bg-[var(--color-bg-tertiary)] w-20 mb-3" />
            <div className="h-10 bg-[var(--color-bg-tertiary)] w-[90%] mb-2" />
            <div className="h-4 bg-[var(--color-bg-tertiary)] w-full mb-1" />
            <div className="h-4 bg-[var(--color-bg-tertiary)] w-2/3" />
          </div>
          <div className="pl-6 space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pb-4 border-b border-[var(--color-border)] last:border-b-0">
                <div className="h-2.5 bg-[var(--color-bg-tertiary)] w-16 mb-2" />
                <div className="h-5 bg-[var(--color-bg-tertiary)] w-full mb-1" />
                <div className="h-4 bg-[var(--color-bg-tertiary)] w-3/4" />
              </div>
            ))}
          </div>
        </div>
        {/* Three-col skeleton */}
        <div className="nyt-three-col mt-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="nyt-story-col animate-pulse">
              <div className="w-full aspect-[4/3] bg-[var(--color-bg-tertiary)] mb-3" />
              <div className="h-2.5 bg-[var(--color-bg-tertiary)] w-16 mb-2" />
              <div className="h-5 bg-[var(--color-bg-tertiary)] w-full mb-1" />
              <div className="h-4 bg-[var(--color-bg-tertiary)] w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="headline-lg mb-2">No Stories Yet</h3>
        <p className="text-[14px] text-[var(--color-text-secondary)]" style={{ fontFamily: "var(--font-body)" }}>
          Try a different edition or section.
        </p>
      </div>
    );
  }

  // Distribute items into NYT-style sections
  const hero = items[0];
  const heroSide = items.slice(1, 5); // 4 compact headlines beside hero
  const sectionA = items.slice(5, 8); // 3-column section
  const sectionB = items.slice(8, 12); // 2+2 section
  const remaining = items.slice(12);

  return (
    <div>
      {/* ════════════════════════════════════════════════════════════
          SECTION 1: HERO GRID — Big lead left, compact right
          ════════════════════════════════════════════════════════════ */}
      <div className="nyt-hero-grid pb-5 border-b border-[var(--color-border)]">
        {/* Lead story — large */}
        <div className="pr-6 border-r border-[var(--color-border)]">
          <FeedCard item={hero} onClick={() => onSelect(hero.id)} variant="hero" />
        </div>

        {/* Right column — compact headlines */}
        {heroSide.length > 0 && (
          <div className="pl-6">
            {heroSide.map((item, i) => (
              <FeedCard
                key={item.id}
                item={item}
                onClick={() => onSelect(item.id)}
                variant="compact"
                isLast={i === heroSide.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2: THREE-COLUMN with images
          ════════════════════════════════════════════════════════════ */}
      {sectionA.length > 0 && (
        <>
          <div className="nyt-section-header mt-4">
            <h2>More Top Stories</h2>
          </div>
          <div className="nyt-three-col border-b border-[var(--color-border)]">
            {sectionA.map((item, i) => (
              <div
                key={item.id}
                className={`nyt-story-col ${i === 0 ? "pl-0" : ""} ${i === sectionA.length - 1 ? "pr-0" : ""}`}
              >
                <FeedCard item={item} onClick={() => onSelect(item.id)} variant="column" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          SECTION 3: TWO-COLUMN section
          ════════════════════════════════════════════════════════════ */}
      {sectionB.length > 0 && (
        <>
          <div className="nyt-section-header mt-4">
            <h2>Also in the News</h2>
          </div>
          <div className="nyt-two-col border-b border-[var(--color-border)]">
            {sectionB.map((item, i) => (
              <div
                key={item.id}
                className={`nyt-story-col ${i === 0 || i === 2 ? "pl-0" : ""} ${i === 1 || i === 3 ? "pr-0" : ""}`}
              >
                <FeedCard item={item} onClick={() => onSelect(item.id)} variant="standard" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          SECTION 4: REMAINING STORIES — list format
          ════════════════════════════════════════════════════════════ */}
      {remaining.length > 0 && (
        <>
          <div className="nyt-section-header mt-4">
            <h2>Latest</h2>
          </div>
          <div className="nyt-three-col">
            {remaining.map((item, i) => (
              <div
                key={item.id}
                className={`nyt-story-col ${i % 3 === 0 ? "pl-0" : ""} ${i % 3 === 2 ? "pr-0" : ""}`}
              >
                <FeedCard item={item} onClick={() => onSelect(item.id)} variant="list" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="mt-8 text-center border-t border-[var(--color-border)] pt-6">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-10 py-3 border border-[var(--color-text-primary)] text-[13px] font-semibold tracking-wider uppercase hover:bg-[var(--color-bg-inverse)] hover:text-white transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30 12" />
                </svg>
                Loading...
              </span>
            ) : (
              "Show More"
            )}
          </button>
        </div>
      )}

      {/* Story count footer */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-[11px] text-center text-[var(--color-text-tertiary)]">
        {items.length} stories{hasMore ? " \u2014 more available" : ""}
      </div>
    </div>
  );
}
