const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

async function hashIp(ip: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export const onRequest: PagesFunction<Cloudflare.Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: jsonHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: jsonHeaders });
  }

  try {
    let body: { type?: string; tool?: string; path?: string } = {};
    const text = await request.text();
    if (text) {
      try { body = JSON.parse(text); } catch {}
    }

    const day = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get("cf-connecting-ip") || "anonymous";
    const ipHash = await hashIp(ip);
    const tool = (body.tool || "general").slice(0, 32);
    const eventType = body.type || "pageview";

    const pvKey = `analytics:${day}:pv`;
    const toolKey = `analytics:${day}:tool:${tool}`;
    const uvCheckKey = `analytics:${day}:u:${ipHash}`;
    const uvCountKey = `analytics:${day}:uv`;
    const copyKey = `analytics:${day}:copies`;

    context.waitUntil((async () => {
      try {
        const [currentPv, isExistingUser, currentToolCount] = await Promise.all([
          env.AI_RATE_LIMITS.get(pvKey),
          env.AI_RATE_LIMITS.get(uvCheckKey),
          env.AI_RATE_LIMITS.get(toolKey)
        ]);

        const writes: Promise<void>[] = [];

        writes.push(env.AI_RATE_LIMITS.put(pvKey, String(Number(currentPv || "0") + 1), { expirationTtl: 604800 }));
        writes.push(env.AI_RATE_LIMITS.put(toolKey, String(Number(currentToolCount || "0") + 1), { expirationTtl: 604800 }));

        if (!isExistingUser) {
          writes.push(env.AI_RATE_LIMITS.put(uvCheckKey, "1", { expirationTtl: 86400 }));
          const currentUv = await env.AI_RATE_LIMITS.get(uvCountKey);
          writes.push(env.AI_RATE_LIMITS.put(uvCountKey, String(Number(currentUv || "0") + 1), { expirationTtl: 604800 }));
        }

        if (eventType === "copy") {
          const currentCopies = await env.AI_RATE_LIMITS.get(copyKey);
          writes.push(env.AI_RATE_LIMITS.put(copyKey, String(Number(currentCopies || "0") + 1), { expirationTtl: 604800 }));
        }

        await Promise.all(writes);
      } catch (err) {
        console.error("Failed to write analytics to KV", err);
      }
    })());

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: jsonHeaders });
  }
};
