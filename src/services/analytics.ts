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

// Fetch aggregated live stats from backend, fallback to local telemetry
export async function fetchLiveStats(): Promise<LiveStatsData> {
  try {
    const res = await fetch("/api/stats", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && "pv" in data) {
        return data as LiveStatsData;
      }
    }
  } catch {}

  // Fallback to local browser analytics
  try {
    const raw = localStorage.getItem("textlab.telemetry");
    if (raw) {
      return JSON.parse(raw) as LiveStatsData;
    }
  } catch {}

  return {
    date: new Date().toISOString().slice(0, 10),
    pv: 1,
    uv: 1,
    copies: 0,
    conversionRate: "0%",
    tools: { layout: 1 }
  };
}
