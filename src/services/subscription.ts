// Daily AI usage counter (local only, no account system).
// Previously contained a dead client-side license/pro system (hardcoded keys
// in the public bundle, getEntitlements() hardcoded to pro). Removed 2026-10-08:
// the paywall was already gone and every caller treated the user as pro,
// so the license code was pure dead weight + a leaked key list.

const keyFor = (date: string) => `textlab.ai_usage.${date}`;

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** How many AI generations this browser has done today. Never throws. */
export function getDailyAiUsage(): number {
  try {
    const raw = localStorage.getItem(keyFor(todayKey()));
    const n = parseInt(raw || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Record one AI generation. Never throws, NaN-safe. */
export function incrementDailyAiUsage(): void {
  try {
    const k = keyFor(todayKey());
    const used = getDailyAiUsage();
    localStorage.setItem(k, String(used + 1));
  } catch {
    // storage unavailable (private mode etc.) — usage just isn't tracked
  }
}
