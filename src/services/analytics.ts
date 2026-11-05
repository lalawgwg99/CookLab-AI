// Client-side analytics and real-time event dispatcher

export interface LiveStatsData {
  date: string;
  pv: number;
  uv: number;
  copies: number;
  conversionRate: string;
  tools: Record<string, number>;
}

// Track page view for the current active tool
export function trackPageView(toolId: string) {
  recordLocalMetric("pv", toolId);

  // Send to Cloudflare Pages API endpoint without blocking page render
  try {
    const payload = JSON.stringify({ type: "pageview", tool: toolId, path: `/${toolId}` });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", payload);
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch {}

  // Google Analytics 4 (if configured)
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", "page_view", {
        page_title: toolId,
        page_path: `/${toolId}`
      });
    }
  } catch {}
}

// Track copy conversion (high intent action)
export function trackCopyAction(toolId: string) {
  recordLocalMetric("copy", toolId);

  try {
    const payload = JSON.stringify({ type: "copy", tool: toolId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", payload);
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch {}

  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", "copy_conversion", {
        event_category: "engagement",
        event_label: toolId
      });
    }
  } catch {}
}

// Local telemetry storage for instant offline viewing
function recordLocalMetric(type: "pv" | "copy", toolId: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem("textlab.telemetry");
    let data: LiveStatsData = raw ? JSON.parse(raw) : {
      date: today,
      pv: 0,
      uv: 1,
      copies: 0,
      conversionRate: "0%",
      tools: {}
    };

    if (data.date !== today) {
      data = { date: today, pv: 0, uv: 1, copies: 0, conversionRate: "0%", tools: {} };
    }

    if (type === "pv") {
      data.pv += 1;
      data.tools[toolId] = (data.tools[toolId] || 0) + 1;
    } else if (type === "copy") {
      data.copies += 1;
    }

    data.conversionRate = data.pv > 0 ? `${((data.copies / data.pv) * 100).toFixed(1)}%` : "0%";
    localStorage.setItem("textlab.telemetry", JSON.stringify(data));
  } catch {}
}

// Affiliate shelf telemetry (local-only on purpose):
// /api/track counts every event into the daily PV bucket, so sending
// impressions there would inflate pageviews. Affiliate impressions/clicks
// are kept in localStorage (same pattern as recordLocalMetric) plus a
// GA4 event when gtag exists. When affiliate links go live, clicks are
// already wired through trackAffiliateClick.
export interface AffiliateStatsData {
  date: string;
  impressions: Record<string, number>;
  clicks: Record<string, number>;
}

export function trackAffiliateImpression(toolId: string) {
  recordAffiliateMetric("impression", toolId);
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", "affiliate_impression", {
        event_category: "affiliate",
        event_label: toolId
      });
    }
  } catch {}
}

export function trackAffiliateClick(toolId: string, slotId: string) {
  recordAffiliateMetric("click", `${toolId}:${slotId}`);
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", "affiliate_click", {
        event_category: "affiliate",
        event_label: `${toolId}:${slotId}`
      });
    }
  } catch {}
}

function recordAffiliateMetric(type: "impression" | "click", key: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem("textlab.affiliate");
    let data: AffiliateStatsData = raw
      ? JSON.parse(raw)
      : { date: today, impressions: {}, clicks: {} };
    if (data.date !== today) data = { date: today, impressions: {}, clicks: {} };
    if (type === "impression") {
      data.impressions[key] = (data.impressions[key] || 0) + 1;
    } else {
      data.clicks[key] = (data.clicks[key] || 0) + 1;
    }
    localStorage.setItem("textlab.affiliate", JSON.stringify(data));
  } catch {}
}
