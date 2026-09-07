// Subscription and entitlement management service

export interface UserEntitlements {
  isPro: boolean;
  tier: "free" | "pro";
  expireAt: number | null;
  promoCode?: string;
}

const STORAGE_KEY = "textlab.user_entitlements";

// Valid promotional codes for trial, testers, or purchasers
const PROMO_CODES: Record<string, number> = {
  "VIP2026": 365,   // 1 year
  "PRO888": 30,     // 30 days
  "TEXTLAB": 30,    // 30 days
  "CREATOR": 90,    // 90 days
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

export function redeemPromoCode(code: string): { success: boolean; message: string } {
  const trimmed = code.trim().toUpperCase();
  const days = PROMO_CODES[trimmed];

  if (!days) {
    return { success: false, message: "無效的邀請碼或啟用序號，請檢查後再試。" };
  }

  const expireAt = Date.now() + days * 24 * 60 * 60 * 1000;
  const entitlements: UserEntitlements = {
    isPro: true,
    tier: "pro",
    expireAt,
    promoCode: trimmed
  };

  saveEntitlements(entitlements);
  return { success: true, message: `成功啟用 Pro 會員資格 (${days} 天免費體驗)！` };
}

export function activatePro(months = 1) {
  const expireAt = Date.now() + months * 30 * 24 * 60 * 60 * 1000;
  const entitlements: UserEntitlements = {
    isPro: true,
    tier: "pro",
    expireAt
  };
  saveEntitlements(entitlements);
}
