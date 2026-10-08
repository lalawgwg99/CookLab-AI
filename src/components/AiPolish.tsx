import { useState } from "react";
import { incrementDailyAiUsage } from "../services/subscription";

export type AiPolishLang = "zh-TW" | "en";

type Props = {
  /** 要潤飾的原文 */
  text: string;
  /** 使用者按下某版本的「套用」時呼叫 */
  onApply: (version: string) => void;
  language?: AiPolishLang;
};

type Status = "idle" | "loading" | "done" | "error";

type Version = {
  key: "casual" | "formal" | "brief";
  label: string;
  text: string;
};

const VERSION_ORDER: Array<{ key: Version["key"]; match: RegExp; label: string; labelEn: string }> = [
  { key: "casual", match: /^口語版\s*[:：]/, label: "口語版", labelEn: "Casual" },
  { key: "formal", match: /^正式版\s*[:：]/, label: "正式版", labelEn: "Formal" },
  { key: "brief", match: /^精簡版\s*[:：]/, label: "精簡版", labelEn: "Concise" },
];

function parseVersions(raw: string, language: AiPolishLang): Version[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const found: Version[] = [];
  for (const line of lines) {
    const def = VERSION_ORDER.find((d) => d.match.test(line));
    if (!def) continue;
    if (found.some((f) => f.key === def.key)) continue;
    const text = line.replace(def.match, "").trim();
    if (!text) continue;
    found.push({ key: def.key, label: language === "zh-TW" ? def.label : def.labelEn, text });
  }
  if (found.length > 0) {
    return VERSION_ORDER.map((d) => found.find((f) => f.key === d.key)).filter((v): v is Version => !!v);
  }
  return lines.slice(0, 3).map((text, i) => {
    const def = VERSION_ORDER[i];
    return { key: def.key, label: language === "zh-TW" ? def.label : def.labelEn, text };
  });
}

export default function AiPolish({ text, onApply, language = "zh-TW" }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [versions, setVersions] = useState<Version[]>([]);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);

  const zh = language === "zh-TW";
  const canRun = text.trim().length > 0 && status !== "loading";

  const run = async () => {
    if (!canRun) return;
    setStatus("loading");
    setAppliedKey(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("https://ai.taicalc.com/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "polish", payload: { text: text.trim().slice(0, 2000) } }),
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok && data && typeof data === "object" && "text" in data && typeof data.text === "string" && data.text.trim()) {
        const parsed = parseVersions(data.text, language);
        if (parsed.length === 0) throw new Error("parse_failed");
        setVersions(parsed);
        setStatus("done");
        incrementDailyAiUsage();
        return;
      }
      throw new Error(`ai_failed_${response.status}`);
    } catch {
      setStatus("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const apply = (v: Version) => {
    onApply(v.text);
    setAppliedKey(v.key);
    window.setTimeout(() => setAppliedKey(null), 1500);
  };

  return (
    <div style={{ marginTop: "12px" }}>
      {status !== "done" && status !== "error" && (
        <button className="primary-button" onClick={run} disabled={!canRun} style={!canRun ? { opacity: 0.45, cursor: "not-allowed", transform: "none" } : undefined}>
          {status === "loading" ? (zh ? "✨ 潤飾中…" : "✨ Polishing…") : zh ? "✨ AI 幫你潤飾" : "✨ Polish with AI"}
        </button>
      )}

      {status === "error" && (
        <div style={{ padding: "12px 14px", borderRadius: "10px", background: "var(--canvas)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
            {zh ? "AI 忙線中，稍後再試" : "AI is busy, try again later"}
          </span>
          <button
            onClick={() => { setStatus("idle"); void run(); }}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            {zh ? "再試一次" : "Retry"}
          </button>
        </div>
      )}

      {status === "done" && versions.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>
              {zh ? "✨ 潤飾好了，選一個套用" : "✨ Polished — pick one to apply"}
            </span>
            <button
              onClick={run}
              style={{ background: "transparent", border: 0, color: "var(--muted)", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}
            >
              {zh ? "再潤一次" : "Polish again"}
            </button>
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            {versions.map((v) => (
              <div key={v.key} style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--paper)", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.04em" }}>{v.label}</span>
                  <button
                    onClick={() => apply(v)}
                    style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: appliedKey === v.key ? "#16a34a" : "var(--purple)", color: "#fff", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
                  >
                    {appliedKey === v.key ? (zh ? "已套用 ✓" : "Applied ✓") : zh ? "套用" : "Apply"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--ink)", whiteSpace: "pre-wrap" }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
