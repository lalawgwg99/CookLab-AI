import { useEffect, useRef } from "react";
import { trackAffiliateImpression } from "../services/analytics";

/**
 * 延伸閱讀／進修區（書籍／課程 affiliate 專區）：
 * - 掛在寫作工具的結果頁下方，工具本身全免費、不擋任何功能。
 * - 合作帳號尚未申請（博客來 AP、聯盟網），現階段只做 UI＋追蹤，
 *   連結位標為「接洽中」，絕對不放假連結、不放未核實的書名或課程名。
 * - 合作上線後：把對應 slot 的 status 改為 "live"、填入真實 affiliate 連結，
 *   點擊會走 trackAffiliateClick。
 */

export type AffiliateSlotStatus = "pending" | "live";

export interface AffiliateSlot {
  id: string;
  icon: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  status: AffiliateSlotStatus;
  /** 合作上線後才填：真實 affiliate 連結（未上線前一律留空） */
  href?: string;
}

const SLOTS: AffiliateSlot[] = [
  {
    id: "books",
    icon: "📚",
    titleZh: "寫作書籍推薦",
    titleEn: "Writing books",
    descZh: "寫作、文案與編輯類好書清單準備中，合作上線後在這裡顯示。",
    descEn: "A curated list of writing and editing books is coming once our partnership goes live.",
    status: "pending",
  },
  {
    id: "courses",
    icon: "🎓",
    titleZh: "寫作進修課程",
    titleEn: "Writing courses",
    descZh: "寫作與內容創作線上課程準備中，合作上線後在這裡顯示。",
    descEn: "Online writing and content courses are coming once our partnership goes live.",
    status: "pending",
  },
];

export default function AffiliateShelf({
  toolId,
  language,
}: {
  toolId: string;
  language: "zh-TW" | "en";
}) {
  const impressionSent = useRef(false);

  useEffect(() => {
    if (impressionSent.current) return;
    impressionSent.current = true;
    trackAffiliateImpression(toolId);
  }, [toolId]);

  return (
    <div
      style={{
        marginTop: "14px",
        padding: "14px",
        borderRadius: "12px",
        background: "var(--paper)",
        border: "1px dashed var(--line)",
      }}
    >
      <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
        {language === "zh-TW" ? "📖 延伸閱讀／進修" : "📖 Further reading"}
      </div>
      <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 10px" }}>
        {language === "zh-TW"
          ? "寫作書籍與課程的推薦連結正在接洽合作中；上線後會在這裡顯示。本工具完全免費，推薦不會鎖住任何功能。"
          : "Book and course recommendations are being arranged and will appear here once live. This tool is completely free; recommendations never lock any feature."}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
        {SLOTS.map((slot) => (
          <div
            key={slot.id}
            data-affiliate-slot={slot.id}
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "var(--canvas)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "16px" }}>{slot.icon}</span>
              <strong style={{ fontSize: "13px" }}>
                {language === "zh-TW" ? slot.titleZh : slot.titleEn}
              </strong>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#92400e",
                  background: "#fef3c7",
                  borderRadius: "999px",
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                }}
              >
                {language === "zh-TW" ? "接洽中" : "Coming soon"}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px" }}>
              {language === "zh-TW" ? slot.descZh : slot.descEn}
            </p>
            <button
              disabled
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                background: "var(--paper)",
                color: "var(--muted)",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "not-allowed",
              }}
            >
              {language === "zh-TW" ? "即將上線" : "Coming soon"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
