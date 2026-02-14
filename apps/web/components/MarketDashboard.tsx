"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { FXRatesResponse, SpendInsightsResponse, PaymentVolumeResponse } from "@/types";
import { getVisaFXRates, getVisaSpendInsights, getVisaPaymentVolume, getVisaStatus } from "@/lib/api";

// ── TradingView Ticker Tape ─────────────────────────────────────
function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "Nasdaq" },
        { proName: "INDEX:DXY", title: "US Dollar" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
        { proName: "COMEX:GC1!", title: "Gold" },
        { proName: "NYMEX:CL1!", title: "Crude Oil" },
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: "compact",
      colorTheme: "light",
      locale: "en",
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div ref={containerRef} className="tradingview-widget-container overflow-hidden" />
  );
}

// ── TradingView Market Overview widget ──────────────────────────
function MarketOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify({
      colorTheme: "light",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: 500,
      plotLineColorGrowing: "rgba(17, 17, 17, 1)",
      plotLineColorFalling: "rgba(17, 17, 17, 0.4)",
      gridLineColor: "rgba(240, 240, 240, 1)",
      scaleFontColor: "rgba(120, 120, 120, 1)",
      belowLineFillColorGrowing: "rgba(17, 17, 17, 0.04)",
      belowLineFillColorFalling: "rgba(17, 17, 17, 0.02)",
      belowLineFillColorGrowingBottom: "rgba(255, 255, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(255, 255, 255, 0)",
      symbolActiveColor: "rgba(240, 240, 240, 1)",
      tabs: [
        {
          title: "Indices",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "FOREXCOM:NSXUSD", d: "Nasdaq" },
            { s: "FOREXCOM:DJI", d: "Dow Jones" },
            { s: "INDEX:NKY", d: "Nikkei 225" },
            { s: "INDEX:DEU40", d: "DAX" },
            { s: "FOREXCOM:UKXGBP", d: "FTSE 100" },
          ],
        },
        {
          title: "Crypto",
          symbols: [
            { s: "BITSTAMP:BTCUSD", d: "Bitcoin" },
            { s: "BITSTAMP:ETHUSD", d: "Ethereum" },
            { s: "BINANCE:SOLUSDT", d: "Solana" },
            { s: "BINANCE:XRPUSDT", d: "XRP" },
          ],
        },
        {
          title: "Commodities",
          symbols: [
            { s: "COMEX:GC1!", d: "Gold" },
            { s: "NYMEX:CL1!", d: "Crude Oil" },
            { s: "COMEX:SI1!", d: "Silver" },
            { s: "NYMEX:NG1!", d: "Natural Gas" },
          ],
        },
        {
          title: "Forex",
          symbols: [
            { s: "FX:EURUSD", d: "EUR/USD" },
            { s: "FX:GBPUSD", d: "GBP/USD" },
            { s: "FX:USDJPY", d: "USD/JPY" },
            { s: "INDEX:DXY", d: "US Dollar Index" },
          ],
        },
      ],
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div ref={containerRef} className="tradingview-widget-container overflow-hidden" />
  );
}

// ── Directional Arrow ───────────────────────────────────────────
function Arrow({ value }: { value: number }) {
  if (value > 0) return <span className="text-green-700">&#9650; +{value.toFixed(1)}%</span>;
  if (value < 0) return <span className="text-red-700">&#9660; {value.toFixed(1)}%</span>;
  return <span className="text-[var(--color-text-tertiary)]">&#8212; 0.0%</span>;
}

// ── Demo Badge ──────────────────────────────────────────────────
function DemoBadge({ demo }: { demo: boolean }) {
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
      style={{
        background: demo ? "var(--color-bg-secondary)" : "#e8f5e9",
        color: demo ? "var(--color-text-secondary)" : "#2e7d32",
      }}
    >
      {demo ? "Demo Data" : "Visa Sandbox"}
    </span>
  );
}

// ── FX Rates Tab ────────────────────────────────────────────────
function FXRatesTab({ data }: { data: FXRatesResponse }) {
  const baseAmount = 100;
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {data.source} Foreign Exchange Rates
        </span>
        <DemoBadge demo={data.demo} />
      </div>
      <table className="w-full text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr className="text-left text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider border-b border-[var(--color-border)]">
            <th className="pb-2 font-medium">Currency</th>
            <th className="pb-2 font-medium text-right">Rate</th>
            <th className="pb-2 font-medium text-right">{data.source} {baseAmount}</th>
          </tr>
        </thead>
        <tbody>
          {data.rates.map((r) => (
            <tr key={r.currency} className="border-b border-[var(--color-border)]" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <td className="py-2">
                <span className="font-semibold">{r.currency}</span>
                <span className="text-[var(--color-text-tertiary)] ml-1.5">{r.name}</span>
              </td>
              <td className="py-2 text-right">{r.rate < 1 ? r.rate.toFixed(4) : r.rate.toFixed(2)}</td>
              <td className="py-2 text-right font-medium">
                {(baseAmount * r.rate) < 1
                  ? (baseAmount * r.rate).toFixed(4)
                  : (baseAmount * r.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Spend Insights Tab ──────────────────────────────────────────
function SpendInsightsTab({ data }: { data: SpendInsightsResponse }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Consumer Spending — {data.country}
        </span>
        <DemoBadge demo={data.demo} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {data.insights.map((ins) => (
          <div
            key={ins.category}
            className="border border-[var(--color-border)] p-3"
          >
            <div className="text-[13px] font-semibold mb-2">{ins.category}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
              <div className="text-[var(--color-text-tertiary)]">Sales MoM</div>
              <div className="text-right"><Arrow value={ins.sales_mom} /></div>
              <div className="text-[var(--color-text-tertiary)]">Sales YoY</div>
              <div className="text-right"><Arrow value={ins.sales_yoy} /></div>
              <div className="text-[var(--color-text-tertiary)]">Txn MoM</div>
              <div className="text-right"><Arrow value={ins.txn_mom} /></div>
              <div className="text-[var(--color-text-tertiary)]">Txn YoY</div>
              <div className="text-right"><Arrow value={ins.txn_yoy} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payment Volume Tab ──────────────────────────────────────────
function PaymentVolumeTab({ data }: { data: PaymentVolumeResponse }) {
  const maxVol = Math.max(...data.months.map((m) => m.volume_trillions));
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Global Payment Volume
        </span>
        <DemoBadge demo={data.demo} />
      </div>
      <div className="space-y-2">
        {data.months.map((m) => {
          const pct = (m.volume_trillions / maxVol) * 100;
          return (
            <div key={m.month} className="flex items-center gap-3 text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              <span className="w-[72px] shrink-0 text-[var(--color-text-secondary)]">{m.month}</span>
              <div className="flex-1 h-6 bg-[var(--color-bg-secondary)] relative">
                <div
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-[80px] text-right font-medium">${m.volume_trillions.toFixed(2)}T</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Loading / Error states ──────────────────────────────────────
function TabLoading() {
  return (
    <div className="px-5 py-12 text-center text-[13px] text-[var(--color-text-tertiary)]">
      Loading Visa data&hellip;
    </div>
  );
}

function TabError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-[13px] text-red-700 mb-2">{message}</p>
      <button onClick={onRetry} className="text-[12px] underline">
        Retry
      </button>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────
type Tab = "overview" | "fx" | "spending" | "volume";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "fx", label: "Visa FX" },
  { id: "spending", label: "Spending" },
  { id: "volume", label: "Volume" },
];

// ── Main Component ──────────────────────────────────────────────
export default function MarketDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [visaConfigured, setVisaConfigured] = useState(false);

  // Lazy-loaded data per tab
  const [fxData, setFxData] = useState<FXRatesResponse | null>(null);
  const [spendData, setSpendData] = useState<SpendInsightsResponse | null>(null);
  const [volumeData, setVolumeData] = useState<PaymentVolumeResponse | null>(null);

  const [loading, setLoading] = useState<Tab | null>(null);
  const [error, setError] = useState<{ tab: Tab; message: string } | null>(null);

  // Check Visa status once
  useEffect(() => {
    getVisaStatus().then((s) => setVisaConfigured(s.configured)).catch(() => {});
  }, []);

  const loadTab = useCallback(async (t: Tab) => {
    if (t === "overview") return;
    if (t === "fx" && fxData) return;
    if (t === "spending" && spendData) return;
    if (t === "volume" && volumeData) return;

    setLoading(t);
    setError(null);
    try {
      if (t === "fx") setFxData(await getVisaFXRates());
      else if (t === "spending") setSpendData(await getVisaSpendInsights());
      else if (t === "volume") setVolumeData(await getVisaPaymentVolume());
    } catch (e) {
      setError({ tab: t, message: e instanceof Error ? e.message : "Failed to load data" });
    } finally {
      setLoading(null);
    }
  }, [fxData, spendData, volumeData]);

  const handleTabClick = (t: Tab) => {
    setTab(t);
    loadTab(t);
  };

  const handleRetry = () => {
    if (error) {
      // Clear cached data so loadTab refetches
      if (error.tab === "fx") setFxData(null);
      if (error.tab === "spending") setSpendData(null);
      if (error.tab === "volume") setVolumeData(null);
      setError(null);
    }
    // Need to trigger loadTab after state clears
    setTimeout(() => loadTab(tab), 0);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--color-border)] shrink-0 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[15px]" style={{ fontFamily: "var(--font-headline)" }}>
            Markets
          </h3>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
            Live data &middot; Select a headline to read AI analysis
          </p>
        </div>
        {tab !== "overview" && (
          <DemoBadge demo={!visaConfigured} />
        )}
      </div>

      {/* Ticker tape */}
      <div className="border-b border-[var(--color-border)] shrink-0 overflow-hidden">
        <TickerTape />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabClick(t.id)}
            className="px-4 py-2 text-[12px] font-medium transition-colors relative"
            style={{
              color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
            }}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "overview" && <MarketOverview />}

        {tab === "fx" && (
          loading === "fx" ? <TabLoading /> :
          error?.tab === "fx" ? <TabError message={error.message} onRetry={handleRetry} /> :
          fxData ? <FXRatesTab data={fxData} /> : <TabLoading />
        )}

        {tab === "spending" && (
          loading === "spending" ? <TabLoading /> :
          error?.tab === "spending" ? <TabError message={error.message} onRetry={handleRetry} /> :
          spendData ? <SpendInsightsTab data={spendData} /> : <TabLoading />
        )}

        {tab === "volume" && (
          loading === "volume" ? <TabLoading /> :
          error?.tab === "volume" ? <TabError message={error.message} onRetry={handleRetry} /> :
          volumeData ? <PaymentVolumeTab data={volumeData} /> : <TabLoading />
        )}
      </div>
    </div>
  );
}
