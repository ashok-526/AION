"use client";

import type { FeedItem } from "@/types";
import { timeAgo, truncate } from "@/lib/utils";

interface Props {
  item: FeedItem;
  onClick: () => void;
  variant?: "hero" | "compact" | "column" | "standard" | "list";
  isLast?: boolean;
}

function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ");
}

export default function FeedCard({ item, onClick, variant = "standard", isLast }: Props) {
  /* ── HERO: Large lead story with big image + headline ───────── */
  if (variant === "hero") {
    return (
      <article onClick={onClick} className="cursor-pointer group nyt-hover">
        {item.image_url && (
          <div className="w-full aspect-[16/9] overflow-hidden bg-[var(--color-bg-tertiary)] mb-4">
            <img
              src={item.image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="kicker mb-2">{formatCategory(item.category)}</div>
        <h2 className="headline-hero nyt-headline mb-3">
          {truncate(item.title, 180)}
        </h2>
        {item.ai_summary && (
          <p className="body-serif line-clamp-3 mb-3">
            {item.ai_summary}
          </p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
          <span className="font-semibold text-[var(--color-text-secondary)]">{item.source}</span>
          <span>&middot;</span>
          <span>{timeAgo(item.published_at)}</span>
          {item.cluster_size > 1 && (
            <>
              <span>&middot;</span>
              <span>{item.cluster_size} sources</span>
            </>
          )}
        </div>
      </article>
    );
  }

  /* ── COMPACT: Headline-only, used in hero sidebar ──────────── */
  if (variant === "compact") {
    return (
      <article
        onClick={onClick}
        className={`cursor-pointer group nyt-hover py-4 ${!isLast ? "border-b border-[var(--color-border)]" : ""}`}
      >
        <div className="kicker mb-1.5">{formatCategory(item.category)}</div>
        <h3 className="headline-md nyt-headline mb-1.5">
          {truncate(item.title, 110)}
        </h3>
        {item.ai_summary && (
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2" style={{ fontFamily: "var(--font-body)" }}>
            {truncate(item.ai_summary, 100)}
          </p>
        )}
        <div className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
          {item.source} &middot; {timeAgo(item.published_at)}
        </div>
      </article>
    );
  }

  /* ── COLUMN: Image + headline for 3-column sections ─────── */
  if (variant === "column") {
    return (
      <article onClick={onClick} className="cursor-pointer group nyt-hover">
        {item.image_url && (
          <div className="w-full aspect-[4/3] overflow-hidden bg-[var(--color-bg-tertiary)] mb-3">
            <img
              src={item.image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="kicker mb-1.5">{formatCategory(item.category)}</div>
        <h3 className="headline-lg nyt-headline mb-2">
          {truncate(item.title, 120)}
        </h3>
        {item.ai_summary && (
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-3" style={{ fontFamily: "var(--font-body)" }}>
            {truncate(item.ai_summary, 150)}
          </p>
        )}
        <div className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
          {item.source} &middot; {timeAgo(item.published_at)}
          {item.cluster_size > 1 && <> &middot; {item.cluster_size} sources</>}
        </div>
      </article>
    );
  }

  /* ── LIST: Compact with thumbnail for "Latest" grid ────────── */
  if (variant === "list") {
    return (
      <article onClick={onClick} className="cursor-pointer group nyt-hover border-b border-[var(--color-border)] pb-4 mb-0">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="kicker mb-1">{formatCategory(item.category)}</div>
            <h3 className="headline-sm nyt-headline mb-1">
              {truncate(item.title, 100)}
            </h3>
            <div className="text-[11px] text-[var(--color-text-tertiary)]">
              {item.source} &middot; {timeAgo(item.published_at)}
            </div>
          </div>
          {item.image_url && (
            <div className="w-[80px] h-[80px] shrink-0 overflow-hidden bg-[var(--color-bg-tertiary)]">
              <img
                src={item.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>
      </article>
    );
  }

  /* ── STANDARD: Horizontal card with thumbnail (for 2-col sections) ── */
  return (
    <article onClick={onClick} className="cursor-pointer group nyt-hover">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="kicker mb-1.5">{formatCategory(item.category)}</div>
          <h3 className="headline-md nyt-headline mb-1.5">
            {truncate(item.title, 120)}
          </h3>
          {item.ai_summary && (
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2" style={{ fontFamily: "var(--font-body)" }}>
              {item.ai_summary}
            </p>
          )}
          <div className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            {item.source} &middot; {timeAgo(item.published_at)}
          </div>
        </div>
        {item.image_url && (
          <div className="w-[140px] h-[100px] shrink-0 overflow-hidden bg-[var(--color-bg-tertiary)]">
            <img
              src={item.image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
