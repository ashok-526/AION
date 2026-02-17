"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryIntelligence, ExplainResponse } from "@/types";
import { getStory, getExplanation, getSummary, translateTexts } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { LANGUAGES } from "./Header";
import ChatSection from "./ChatSection";

interface Props {
  articleId: number;
  onClose: () => void;
  language: string;
  onSelectArticle: (id: number) => void;
}

type AITab = "summary" | "analysis" | "chat" | "deep-explain";

interface TranslatedContent {
  title: string;
  summary: string;
  keyPoints: string[];
  whyTrending: string;
  explanation: string;
  explainKeyPoints: string[];
  sourceHeadlines: string[];
  sourceAngles: string[];
  timelineEvents: string[];
  explainTimelineEvents: string[];
  relatedTitles: string[];
  tags: string[];
  entityValues: string[];
}

export default function StoryOverlay({ articleId, onClose, language, onSelectArticle }: Props) {
  const [story, setStory] = useState<StoryIntelligence | null>(null);
  const [explain, setExplain] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [explainLoading, setExplainLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [onDemandSummary, setOnDemandSummary] = useState<{
    summary: string;
    key_points: string[];
    entities: Record<string, string[]>;
    why_trending: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<AITab>("summary");
  const [showAllAngles, setShowAllAngles] = useState(false);
  const [translated, setTranslated] = useState<TranslatedContent | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translatedLang, setTranslatedLang] = useState("en");

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    setLoading(true);
    setStory(null);
    setExplain(null);
    setOnDemandSummary(null);
    setTranslated(null);
    setShowAllAngles(false);
    setActiveTab("summary");
    getStory(articleId)
      .then(setStory)
      .catch(() => setStory(null))
      .finally(() => setLoading(false));
  }, [articleId]);

  // Auto-trigger on-demand AI summary when story has no AI data
  useEffect(() => {
    if (story && !story.ai_summary && !onDemandSummary && !summaryLoading) {
      setSummaryLoading(true);
      getSummary(story.article.id)
        .then(setOnDemandSummary)
        .catch(() => {})
        .finally(() => setSummaryLoading(false));
    }
  }, [story?.article?.id]);

  // Auto-trigger Deep Explain
  useEffect(() => {
    if (story && !explain && !explainLoading) {
      setExplainLoading(true);
      const p = story.cluster?.cluster_id
        ? getExplanation(story.cluster.cluster_id)
        : getExplanation(undefined, story.article.id);
      p.then(setExplain).catch(() => {}).finally(() => setExplainLoading(false));
    }
  }, [story?.article?.id]);

  // Translate ALL content when language changes
  useEffect(() => {
    if (!story || language === "en") {
      setTranslated(null);
      setTranslatedLang("en");
      return;
    }
    if (translatedLang === language && translated) return;

    const langName = LANGUAGES.find((l) => l.code === language)?.name || language;
    const batch: string[] = [];
    const idx = { i: 0 };
    const push = (s: string) => { batch.push(s); return idx.i++; };

    const titleIdx = push(story.article.title);
    const summaryIdx = push(effectiveSummary || "");
    const kpStart = idx.i;
    effectiveKeyPoints.forEach((p) => push(p));
    const kpEnd = idx.i;
    const whyTrendingIdx = push(effectiveWhyTrending || "");

    const anglesHStart = idx.i;
    story.source_angles.forEach((a) => push(a.headline));
    const anglesHEnd = idx.i;
    const anglesAStart = idx.i;
    story.source_angles.forEach((a) => push(a.angle || ""));
    const anglesAEnd = idx.i;

    const tlStart = idx.i;
    (story.timeline || []).forEach((e) => push(e.event));
    const tlEnd = idx.i;

    const relStart = idx.i;
    story.related_articles.slice(0, 5).forEach((r) => push(r.title));
    const relEnd = idx.i;

    const tagsStart = idx.i;
    (story.cluster?.tags_json || []).forEach((t) => push(t));
    const tagsEnd = idx.i;

    const entStart = idx.i;
    if (effectiveEntities) {
      Object.values(effectiveEntities).forEach((vals) => {
        (vals as string[]).forEach((v) => push(v));
      });
    }
    const entEnd = idx.i;

    const explainIdx = push(explain?.explanation || "");
    const ekpStart = idx.i;
    (explain?.key_points || []).forEach((p) => push(p));
    const ekpEnd = idx.i;
    const etlStart = idx.i;
    (explain?.timeline || []).forEach((e) => push(e.event));
    const etlEnd = idx.i;

    setTranslating(true);
    translateTexts(batch, langName)
      .then((resp) => {
        const r = resp.translations;
        setTranslated({
          title: r[titleIdx] || story.article.title,
          summary: r[summaryIdx] || story.ai_summary || "",
          keyPoints: r.slice(kpStart, kpEnd),
          whyTrending: r[whyTrendingIdx] || "",
          sourceHeadlines: r.slice(anglesHStart, anglesHEnd),
          sourceAngles: r.slice(anglesAStart, anglesAEnd),
          timelineEvents: r.slice(tlStart, tlEnd),
          relatedTitles: r.slice(relStart, relEnd),
          tags: r.slice(tagsStart, tagsEnd),
          entityValues: r.slice(entStart, entEnd),
          explanation: r[explainIdx] || "",
          explainKeyPoints: r.slice(ekpStart, ekpEnd),
          explainTimelineEvents: r.slice(etlStart, etlEnd),
        });
        setTranslatedLang(language);
      })
      .catch(() => {})
      .finally(() => setTranslating(false));
  }, [language, story, explain, onDemandSummary]);

  // Merge on-demand summary data with story data
  const effectiveSummary = story?.ai_summary || onDemandSummary?.summary || "";
  const effectiveKeyPoints = (story?.key_points?.length ? story.key_points : null) || onDemandSummary?.key_points || [];
  const effectiveEntities = story?.entities || onDemandSummary?.entities || null;
  const effectiveWhyTrending = story?.why_trending || onDemandSummary?.why_trending || "";

  const useTranslatedText = language !== "en" && translated;
  const t = {
    title: (useTranslatedText && translated.title) || story?.article.title || "",
    summary: (useTranslatedText && translated.summary) || effectiveSummary,
    keyPoints: (useTranslatedText && translated.keyPoints?.length) ? translated.keyPoints : effectiveKeyPoints,
    whyTrending: (useTranslatedText && translated.whyTrending) || effectiveWhyTrending,
    explanation: (useTranslatedText && translated.explanation) || explain?.explanation || "",
    explainKeyPoints: (useTranslatedText && translated.explainKeyPoints?.length) ? translated.explainKeyPoints : (explain?.key_points || []),
    sourceHeadlines: (useTranslatedText && translated.sourceHeadlines?.length) ? translated.sourceHeadlines : (story?.source_angles.map((a) => a.headline) || []),
    sourceAngles: (useTranslatedText && translated.sourceAngles?.length) ? translated.sourceAngles : (story?.source_angles.map((a) => a.angle) || []),
    timelineEvents: (useTranslatedText && translated.timelineEvents?.length) ? translated.timelineEvents : (story?.timeline?.map((e) => e.event) || []),
    explainTimelineEvents: (useTranslatedText && translated.explainTimelineEvents?.length) ? translated.explainTimelineEvents : (explain?.timeline?.map((e) => e.event) || []),
    relatedTitles: (useTranslatedText && translated.relatedTitles?.length) ? translated.relatedTitles : (story?.related_articles.slice(0, 5).map((r) => r.title) || []),
    tags: (useTranslatedText && translated.tags?.length) ? translated.tags : (story?.cluster?.tags_json || []),
    entityValues: (useTranslatedText && translated.entityValues) || null,
  };

  const isTranslated = language !== "en" && translated && !translating;
  const langName = LANGUAGES.find((l) => l.code === language)?.name || "";

  return (
    <div className="story-overlay">
      {/* ── STICKY TOP BAR ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[var(--color-border)]">
        <div className="max-w-[760px] mx-auto px-5 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Feed
          </button>
          {story && (
            <a
              href={story.article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--color-text-secondary)] underline underline-offset-2 hover:text-[var(--color-text-primary)]"
            >
              Read original &rarr;
            </a>
          )}
        </div>
      </div>

      {/* ── LOADING ─────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-6 h-6 border-2 border-[var(--color-text-primary)] border-t-transparent rounded-full mx-auto mb-3"
            />
            <span className="text-[13px] text-[var(--color-text-tertiary)]">Loading story...</span>
          </div>
        </div>
      )}

      {/* ── ERROR ───────────────────────────────────────────────── */}
      {!loading && !story && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-3">
            Failed to load story details.
          </p>
          <button onClick={onClose} className="underline underline-offset-2 text-[var(--color-text-primary)] text-sm">
            Go back
          </button>
        </div>
      )}

      {/* ── ARTICLE CONTENT ─────────────────────────────────────── */}
      {story && (
        <article className="max-w-[760px] mx-auto px-5">
          {/* Hero image — full width */}
          {story.article.image_url && (
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-[var(--color-bg-tertiary)] mt-6">
              <img
                src={story.article.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Translation indicator */}
          {translating && (
            <div className="flex items-center gap-2 py-2 mt-4 px-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-3 h-3 border-[1.5px] border-[var(--color-text-primary)] border-t-transparent rounded-full"
              />
              <span className="text-[11px] text-[var(--color-text-secondary)]">Translating to {langName}...</span>
            </div>
          )}
          {isTranslated && (
            <div className="flex items-center gap-2 py-1.5 mt-4 px-4 bg-[#eef2ff] border border-[#c7d2fe]">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M1.5 8h13M8 1.5c-2 2.5-2 10.5 0 13M8 1.5c2 2.5 2 10.5 0 13" />
              </svg>
              <span className="text-[11px] text-[#4338ca] font-medium">Translated to {langName}</span>
            </div>
          )}

          {/* ── ARTICLE HEADER ──────────────────────────────────── */}
          <header className="mt-6 mb-6">
            <div className="kicker mb-3">
              {story.article.category.charAt(0).toUpperCase() + story.article.category.slice(1).replace("-", " ")}
            </div>
            <h1
              className="font-bold mb-4 leading-[1.1]"
              style={{
                fontFamily: "var(--font-headline)",
                fontSize: "clamp(28px, 4vw, 44px)",
                letterSpacing: "-0.02em",
              }}
            >
              {t.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
              <span className="font-semibold">{story.article.source}</span>
              {story.article.published_at && (
                <>
                  <span>&middot;</span>
                  <span>{timeAgo(story.article.published_at)}</span>
                </>
              )}
              {story.cluster && (
                <>
                  <span>&middot;</span>
                  <span>{story.cluster.article_count} articles from {story.cluster.sources.length} sources</span>
                </>
              )}
            </div>

            {/* Tags */}
            {t.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {t.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2.5 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <hr className="rule-strong mb-0" />

          {/* ── AI INTELLIGENCE TABS ───────────────────────────── */}
          <div className="ai-tabs">
            {([
              { key: "summary" as AITab, label: "Summary", dot: "claude" },
              { key: "analysis" as AITab, label: "Analysis", dot: "openai" },
              { key: "chat" as AITab, label: "Ask AI", dot: "claude" },
              { key: "deep-explain" as AITab, label: "Deep Explain", dot: "perplexity" },
            ]).map((tab) => (
              <button
                key={tab.key}
                className={`ai-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className={`provider-dot ${tab.dot}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT ────────────────────────────────────── */}
          <div className="py-8">
            <AnimatePresence mode="wait">
              {/* ── SUMMARY (Claude) ── */}
              {activeTab === "summary" && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <span className="provider-badge claude">Claude</span>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">AI-generated summary</span>
                  </div>

                  {summaryLoading ? (
                    <div className="flex items-center gap-3 py-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-[var(--color-text-primary)] border-t-transparent rounded-full"
                      />
                      <span className="text-[14px] text-[var(--color-text-secondary)]">Generating AI summary...</span>
                    </div>
                  ) : t.summary ? (
                    <p className="body-serif mb-6 text-[17px] leading-[1.8]">{t.summary}</p>
                  ) : (
                    <p className="text-[14px] text-[var(--color-text-tertiary)] italic">
                      Summary not yet available for this article.
                    </p>
                  )}

                  {t.keyPoints.length > 0 && (
                    <div className="mt-6 p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                      <h4 className="kicker mb-4">Key Points</h4>
                      <div className="space-y-3">
                        {t.keyPoints.map((point, i) => (
                          <div key={i} className="flex gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-bg-inverse)] text-white text-[11px] font-bold rounded-full shrink-0">
                              {i + 1}
                            </span>
                            <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed pt-0.5">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {effectiveEntities && Object.keys(effectiveEntities).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                      <h4 className="kicker mb-4">Entities Mentioned</h4>
                      <div className="space-y-4">
                        {(() => {
                          let globalIdx = 0;
                          return Object.entries(effectiveEntities!).map(([type, items]) => (
                            <div key={type}>
                              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold">{type}</span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {(items as string[]).map((item, i) => {
                                  const displayVal = t.entityValues ? (t.entityValues[globalIdx] || item) : item;
                                  globalIdx++;
                                  return (
                                    <span key={`${type}-${i}`} className="text-[12px] px-2.5 py-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]">
                                      {displayVal}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── ANALYSIS (OpenAI) ── */}
              {activeTab === "analysis" && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <span className="provider-badge openai">GPT-4o</span>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">Trending analysis</span>
                  </div>

                  {summaryLoading ? (
                    <div className="flex items-center gap-3 py-4 mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-[var(--color-text-primary)] border-t-transparent rounded-full"
                      />
                      <span className="text-[14px] text-[var(--color-text-secondary)]">Generating analysis...</span>
                    </div>
                  ) : t.whyTrending ? (
                    <div className="mb-6 p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                      <h4 className="kicker mb-3">Why This Is Trending</h4>
                      <p className="text-[16px] text-[var(--color-text-primary)] italic leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                        &ldquo;{t.whyTrending}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <p className="text-[14px] text-[var(--color-text-tertiary)] italic mb-6">Trending analysis not yet available.</p>
                  )}

                  {story.source_angles.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="kicker">{story.source_angles.length} Source Perspectives</h4>
                        {story.source_angles.length > 3 && (
                          <button
                            onClick={() => setShowAllAngles(!showAllAngles)}
                            className="text-[11px] text-[var(--color-text-secondary)] underline underline-offset-2 hover:text-[var(--color-text-primary)]"
                          >
                            {showAllAngles ? "Show less" : "Show all"}
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {(showAllAngles ? story.source_angles : story.source_angles.slice(0, 3)).map((angle, i) => (
                          <div key={i} className="pl-4 border-l-3 border-[var(--color-text-primary)]">
                            <div className="kicker mb-1">{angle.source}</div>
                            <div className="headline-sm text-[15px]">{t.sourceHeadlines[i] || angle.headline}</div>
                            {(t.sourceAngles[i] || angle.angle) && (
                              <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">{t.sourceAngles[i] || angle.angle}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {story.cluster && (
                    <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-0.5">Story Score</div>
                          <div className="text-[28px] font-bold" style={{ fontFamily: "var(--font-headline)" }}>{story.cluster.score.toFixed(1)}</div>
                        </div>
                        <div className="flex-1 h-2 bg-[var(--color-bg-tertiary)] overflow-hidden">
                          <motion.div
                            className="h-full bg-[var(--color-bg-inverse)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(story.cluster.score * 10, 100)}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── CHAT (Claude) ── */}
              {activeTab === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChatSection articleId={articleId} storyTitle={story.article.title} language={language} />
                </motion.div>
              )}

              {/* ── DEEP EXPLAIN (Perplexity) ── */}
              {activeTab === "deep-explain" && (
                <motion.div
                  key="deep-explain"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <span className="provider-badge perplexity">Perplexity</span>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">Deep research & analysis</span>
                  </div>

                  {explainLoading && (
                    <div className="flex items-center gap-3 py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[var(--color-text-primary)] border-t-transparent rounded-full"
                      />
                      <span className="text-[14px] text-[var(--color-text-secondary)]">Researching this story in depth...</span>
                    </div>
                  )}

                  {!explainLoading && !explain && (
                    <p className="text-[14px] text-[var(--color-text-tertiary)] italic">Could not load deep analysis. Try refreshing.</p>
                  )}

                  {explain && (
                    <div className="space-y-6">
                      <div className="body-serif whitespace-pre-line text-[16px] leading-[1.8]">{t.explanation}</div>

                      {t.explainKeyPoints.length > 0 && (
                        <div className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                          <h4 className="kicker mb-3">Key Takeaways</h4>
                          <ul className="space-y-2.5">
                            {t.explainKeyPoints.map((point, i) => (
                              <li key={i} className="flex gap-2.5 text-[14px] text-[var(--color-text-secondary)]">
                                <span className="w-5 h-5 flex items-center justify-center bg-[var(--color-bg-inverse)] text-white text-[10px] font-bold rounded-full shrink-0 mt-0.5">{i + 1}</span>
                                <span className="leading-relaxed">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {explain.timeline.length > 0 && (
                        <div>
                          <h4 className="kicker mb-4">Timeline</h4>
                          <div className="space-y-0">
                            {explain.timeline.map((event, i) => (
                              <div key={i} className="flex gap-3 relative pb-6 last:pb-0">
                                {i < explain.timeline.length - 1 && <div className="timeline-line" />}
                                <div className="timeline-dot" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                <div className="pt-0">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{event.time}</div>
                                  <div className="text-[14px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{t.explainTimelineEvents[i] || event.event}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {explain.sources.length > 0 && (
                        <div className="pt-5 border-t border-[var(--color-border)]">
                          <h4 className="kicker mb-3">Sources</h4>
                          <div className="space-y-1.5">
                            {explain.sources.map((src, i) => (
                              <a
                                key={i}
                                href={src.startsWith("http") ? src : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                              >
                                <span className="text-[var(--color-text-tertiary)] text-[10px]">[{i + 1}]</span>
                                <span className="underline underline-offset-2 truncate">{src}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RELATED ARTICLES ──────────────────────────────── */}
          {story.related_articles.length > 0 && (
            <div className="border-t-3 border-[var(--color-text-primary)] pt-4 pb-6">
              <h4 className="text-[13px] font-bold uppercase tracking-wider mb-4">More on This Story</h4>
              <div className="space-y-0">
                {story.related_articles.slice(0, 5).map((rel, i) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle(rel.id)}
                    className="py-3 border-b border-[var(--color-border)] last:border-b-0 cursor-pointer group nyt-hover"
                  >
                    <div className="headline-sm nyt-headline text-[14px]">{t.relatedTitles[i] || rel.title}</div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                      {rel.source} &middot; {timeAgo(rel.published_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI FOOTER ──────────────────────────────────────── */}
          <div className="py-6 border-t border-[var(--color-border)] mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Powered by</span>
              <span className="provider-badge claude">Claude</span>
              <span className="provider-badge openai">GPT-4o</span>
              <span className="provider-badge perplexity">Perplexity</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              AI-generated content may contain inaccuracies. Always verify important information.
            </p>
          </div>
        </article>
      )}
    </div>
  );
}
