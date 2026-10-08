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

// Fetch aggregated live stats with password authorization
// 密碼驗證交給後端 /api/stats（比對 Cloudflare 環境變數 STATS_PASSWORD），
// 前端不再硬編碼密碼，避免密碼出現在公開 bundle。
export async function fetchLiveStats(password?: string): Promise<{ success: boolean; data?: LiveStatsData; error?: string }> {
  const pwd = password || sessionStorage.getItem("textlab.stats_token") || "";

  if (!pwd) {
    return { success: false, error: "invalid_password" };
  }

  try {
    const res = await fetch(`/api/stats?key=${encodeURIComponent(pwd)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && "pv" in data) {
        try { sessionStorage.setItem("textlab.stats_token", pwd); } catch {}
        return { success: true, data: data as LiveStatsData };
      }
    } else if (res.status === 401) {
      try { sessionStorage.removeItem("textlab.stats_token"); } catch {}
      return { success: false, error: "invalid_password" };
    }
  } catch {}

  // API 連不上時，退回本機遙測資料（不寫入 token，避免把錯誤密碼存起來）
  try {
    const raw = localStorage.getItem("textlab.telemetry");
    if (raw) {
      return { success: true, data: JSON.parse(raw) as LiveStatsData };
    }
  } catch {}

  return {
    success: true,
    data: {
      date: new Date().toISOString().slice(0, 10),
      pv: 1,
      uv: 1,
      copies: 0,
      conversionRate: "0%",
      tools: { layout: 1 }
    }
  };
}
