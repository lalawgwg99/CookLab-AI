const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-cache, no-store, must-revalidate",
  "access-control-allow-origin": "*"
};

const TOOLS = [
  "layout", "ai", "hook", "title", "bio",
  "symbols", "emoji", "kaomoji", "fonts",
  "hashtags", "blank", "nickname"
];

export const onRequest: PagesFunction<Cloudflare.Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: jsonHeaders });
  }

  const day = new Date().toISOString().slice(0, 10);
  const pvKey = `analytics:${day}:pv`;
  const uvKey = `analytics:${day}:uv`;
  const copyKey = `analytics:${day}:copies`;

  try {
    const [pvRaw, uvRaw, copyRaw] = await Promise.all([
      env.AI_RATE_LIMITS.get(pvKey),
      env.AI_RATE_LIMITS.get(uvKey),
      env.AI_RATE_LIMITS.get(copyKey)
    ]);

    const toolPromises = TOOLS.map(async (tool) => {
      const count = await env.AI_RATE_LIMITS.get(`analytics:${day}:tool:${tool}`);
      return [tool, Number(count || "0")] as const;
    });

    const toolEntries = await Promise.all(toolPromises);
    const toolStats = Object.fromEntries(toolEntries);

    const data = {
      date: day,
      pv: Number(pvRaw || "0"),
      uv: Number(uvRaw || "0"),
      copies: Number(copyRaw || "0"),
      conversionRate: pvRaw && Number(pvRaw) > 0 ? `${((Number(copyRaw || 0) / Number(pvRaw)) * 100).toFixed(1)}%` : "0%",
      tools: toolStats,
      serverTime: new Date().toISOString()
    };

    return new Response(JSON.stringify(data, null, 2), { status: 200, headers: jsonHeaders });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "failed_to_fetch_stats",
      message: err instanceof Error ? err.message : "unknown"
    }), { status: 500, headers: jsonHeaders });
  }
};
