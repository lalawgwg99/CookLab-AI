// Direct monetization and paid license entitlement management

export interface UserEntitlements {
  isPro: boolean;
  tier: "free" | "pro";
  expireAt: number | null;
  licenseKey?: string;
}

const STORAGE_KEY = "textlab.user_entitlements";

// Payment links for direct checkout (can be configured via localStorage or environment)
export const CHECKOUT_CONFIG = {
  lifetimeUrl: "https://cooklabai.com/checkout?plan=lifetime",
  yearlyUrl: "https://cooklabai.com/checkout?plan=yearly",
  priceLifetime: "NT$ 399",
  priceYearly: "NT$ 499"
};

// Valid purchased license keys (365 days, lifetime)
const PURCHASED_LICENSES: Record<string, number> = {
  "LIFETIME-399": 3650,
  "EARLYBIRD-399": 3650,
  "PRO-LIFETIME": 3650,
  "ANNUAL-499": 365,
  "TEXTLAB-PRO-LIFETIME": 3650,
  "VIP2026": 365
};

export function getEntitlements(): UserEntitlements {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as UserEntitlements;
      if (data.isPro && data.expireAt && data.expireAt < Date.now()) {
        data.isPro = false;
        data.tier = "free";
        saveEntitlements(data);
      }
      return data;
    }
  } catch {}
  return { isPro: false, tier: "free", expireAt: null };
}

export function saveEntitlements(entitlements: UserEntitlements) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entitlements));
    window.dispatchEvent(new CustomEvent("textlab-entitlement-updated", { detail: entitlements }));
  } catch {}
}

// Verify purchased license key entered by user after direct payment
export function verifyLicenseKey(key: string): { success: boolean; message: string } {
  const trimmed = key.trim().toUpperCase();
  const days = PURCHASED_LICENSES[trimmed];

  if (!days) {
    // Check if key matches standard paid format e.g. TL-XXXX-XXXX
    if (/^TL-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trimmed)) {
      const expireAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
      const entitlements: UserEntitlements = {
        isPro: true,
        tier: "pro",
        expireAt,
        licenseKey: trimmed
      };
      saveEntitlements(entitlements);
      return { success: true, message: "授權序號驗證成功，已為您開通 1 年 Pro 專業版！" };
    }
    return { success: false, message: "無效的購買授權碼，請確認購買訂單收據上的序號。" };
  }

  const expireAt = Date.now() + days * 24 * 60 * 60 * 1000;
  const entitlements: UserEntitlements = {
    isPro: true,
    tier: "pro",
    expireAt,
    licenseKey: trimmed
  };

  saveEntitlements(entitlements);
  return { success: true, message: `授權驗證成功，已開通 Pro 專業會員資格 (${days} 天)！` };
}

export function directCheckout(plan: "lifetime" | "yearly") {
  const url = plan === "yearly" ? CHECKOUT_CONFIG.yearlyUrl : CHECKOUT_CONFIG.lifetimeUrl;
  // If payment gateway URL is active, open it, or alert instructions
  window.open(url, "_blank");
}

export function checkDailyAiLimit(): { allowed: boolean; remaining: number } {
  const ent = getEntitlements();
  if (ent.isPro) return { allowed: true, remaining: 999 };

  const today = new Date().toISOString().slice(0, 10);
  const key = `textlab.ai_usage.${today}`;
  const used = parseInt(localStorage.getItem(key) || "0", 10);
  const limit = 3;
  if (used >= limit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - used };
}

export function incrementDailyAiUsage() {
  const ent = getEntitlements();
  if (ent.isPro) return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `textlab.ai_usage.${today}`;
  const used = parseInt(localStorage.getItem(key) || "0", 10);
  localStorage.setItem(key, String(used + 1));
}

