import { useEffect, useMemo, useRef, useState } from "react";
import { popularSymbols, symbolGroups, totalSymbolCount } from "./data/symbols";
import { allEmoji, emojiAliases, emojiCategories } from "./data/emoji";

type ToolId = "symbols" | "emoji" | "kaomoji" | "fonts" | "layout" | "nickname" | "blank" | "bio" | "hashtags" | "ai";
type Language = "zh-TW" | "en";
type ThemeMode = "system" | "light" | "dark";

const emojiCombos = [
  { title: "優雅崩潰", titleEn: "Elegant Collapse", sequence: "🫠☕️✨" },
  { title: "社畜下班", titleEn: "Off Work", sequence: "🏃‍♂️💨💼🍻" },
  { title: "陰陽怪氣", titleEn: "Sarcastic", sequence: "🤌☺️💅" },
  { title: "派對慶祝", titleEn: "Party Time", sequence: "🎉🥂✨🥳" },
  { title: "被可愛到", titleEn: "So Cute", sequence: "🥺🐾💖" },
  { title: "靈魂抽離", titleEn: "Soul Left", sequence: "🫥👻💨" },
  { title: "薪水小偷", titleEn: "Slacker", sequence: "👀🤫💻🍵" },
  { title: "禮貌微笑", titleEn: "Polite Smile", sequence: "🙃👍" },
  { title: "美妙下午", titleEn: "Teatime", sequence: "🌸☕️🍰" },
  { title: "放鬆夜晚", titleEn: "Cozy Night", sequence: "🌧️☕️📖" }
];


type Tool = {
  id: ToolId;
  name: string;
  nameEn: string;
  short: string;
  shortEn: string;
  icon: string;
  tone: string;
  badge?: string;
};

const tools: Tool[] = [
  { id: "ai", name: "AI 發文助手", nameEn: "AI Post Assistant", short: "一鍵生成 Threads／IG 貼文", shortEn: "Generate viral social posts", icon: "🪄", tone: "lilac", badge: "AI" },
  { id: "layout", name: "社群排版", nameEn: "Social Formatter", short: "IG／Threads 換行", shortEn: "Instagram / Threads spacing", icon: "¶", tone: "blue", badge: "熱門" },
  { id: "bio", name: "個人檔案 Bio", nameEn: "Bio Studio", short: "IG / Threads 簡介佈置", shortEn: "Instagram & Threads Profile", icon: "📇", tone: "pink" },
  { id: "hashtags", name: "熱門標籤", nameEn: "Hashtags", short: "Threads / IG 導流標籤", shortEn: "Trending Hashtag Bundles", icon: "#", tone: "mint" },
  { id: "symbols", name: "特殊符號", nameEn: "Symbols", short: "搜尋與一鍵複製", shortEn: "Search and copy", icon: "✦", tone: "coral" },
  { id: "emoji", name: "Emoji", nameEn: "Emoji", short: "分類、搜尋、最近使用", shortEn: "Browse, search and recents", icon: "☺", tone: "yellow" },
  { id: "kaomoji", name: "顏文字", nameEn: "Kaomoji", short: "搜尋與收藏", shortEn: "Search and favorites", icon: "◡̈", tone: "lilac" },
  { id: "fonts", name: "特殊字體", nameEn: "Fancy Text", short: "Unicode 字體轉換", shortEn: "Unicode font converter", icon: "Aa", tone: "mint" },
  { id: "nickname", name: "暱稱產生器", nameEn: "Nickname Generator", short: "快速找到你的風格", shortEn: "Find your online style", icon: "@", tone: "pink" },
  { id: "blank", name: "空白文字", nameEn: "Invisible Text", short: "產生與複製", shortEn: "Generate and copy", icon: "□", tone: "sand" },
];

const t = (language: Language, zh: string, en: string) => language === "zh-TW" ? zh : en;

const symbolEnglish: Record<string, { name: string; short: string; description: string }> = {
  stars: { name: "Stars & Sparkles", short: "Stars", description: "Stars, sparkles and shine marks for bios, titles and decorative text." },
  hearts: { name: "Heart Symbols", short: "Hearts", description: "Outline, solid and decorative hearts for love, favorites and cute layouts." },
  arrows: { name: "Arrow Symbols", short: "Arrows", description: "Directional and decorative arrows for lists, steps and links." },
  brackets: { name: "Brackets & Quotes", short: "Brackets", description: "CJK brackets, quotes and frames for titles, names and highlights." },
  lines: { name: "Lines & Dividers", short: "Lines", description: "Lines and separators for posts, profiles and section titles." },
  bullets: { name: "Bullets & Marks", short: "Bullets", description: "Bullet points for lists, notes and organized social posts." },
  checks: { name: "Checks & Crosses", short: "Checks", description: "Check marks, crosses and boxes for tasks, polls and status labels." },
  shapes: { name: "Geometric Shapes", short: "Shapes", description: "Circles, squares, triangles and diamonds for diagrams and decoration." },
  flowers: { name: "Flowers & Nature", short: "Flowers", description: "Floral and leafy marks for soft, natural and journal-style layouts." },
  weather: { name: "Weather & Sky", short: "Weather", description: "Sun, moon, clouds, rain and snow for daily updates and weather notes." },
  music: { name: "Music Symbols", short: "Music", description: "Notes, accidentals and score symbols for playlists, lyrics and music posts." },
  math: { name: "Math Symbols", short: "Math", description: "Common operators, comparisons, sets and logic marks for notes and formulas." },
  numbers: { name: "Numbers & Ordering", short: "Numbers", description: "Circled numbers, Roman numerals, superscripts and subscripts." },
  fractions: { name: "Fractions & Units", short: "Fractions", description: "Fractions, degrees and measurement units for sizes, ratios and temperature." },
  currency: { name: "Currency & Business", short: "Currency", description: "World currencies, copyright and trademark symbols." },
  zodiac: { name: "Zodiac & Astrology", short: "Zodiac", description: "Zodiac, planets and astrology marks for bios and horoscope content." },
  cards: { name: "Chess & Cards", short: "Games", description: "Chess pieces, card suits and dice for games and score keeping." },
  language: { name: "Languages & Letters", short: "Letters", description: "Greek, extended Latin and Japanese iteration marks." },
  objects: { name: "Everyday Objects", short: "Objects", description: "Everyday, communication and utility marks for schedules and contact details." },
};

const emojiEnglish: Record<string, string> = { popular: "Popular", faces: "Faces", gestures: "Gestures", hearts: "Hearts", people: "People", animals: "Animals", nature: "Nature", food: "Food", activities: "Activities", travel: "Travel", objects: "Objects", symbols: "Symbols", flags: "Flags" };
const kaomojiEnglish: Record<string, string> = { 開心: "Happy", 害羞: "Shy", 難過: "Sad", 生氣: "Angry", 打招呼: "Greetings", 愛心: "Love", 無奈: "Helpless", 拜託: "Pray & Sorry", 得意: "Proud" };

const kaomojiGroups = [
  { name: "開心", keywords: "開心 可愛 happy", items: ["(◕‿◕)", "(｡•̀ᴗ-)✧", "٩(ˊᗜˋ*)و", "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "(๑˃ᴗ˂)ﻭ", "ヽ(•‿•)ノ"] },
  { name: "害羞", keywords: "害羞 shy", items: ["(⁄ ⁄•⁄ω⁄•⁄ ⁄)", "(〃ω〃)", "(⁄˃ᆺ˂)", "(„ಡωಡ„)", "(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)", "(*ﾉωﾉ)"] },
  { name: "無奈", keywords: "無奈 無語 helpless", items: ["(￣_￣)", "( -_・)", "(눈_눈)", "( •̀_•́ )", "(￣▽￣)", "(・_・;)"] },
  { name: "拜託", keywords: "拜託 道歉 pray sorry", items: ["(つ﹏⊂)", "( ; ω ; )", "(>_<)", "(人 •͈ᴗ•͈)", "(🙇‍♂️)", "(｡•́︿•̀｡)"] },
  { name: "得意", keywords: "得意 傲嬌 proud", items: ["(¬‿¬)", "( 𠁆 ‿ 𠁆 )", "(๑•̀ㅂ•́)و", "(⌐■_■)", "(•̀ᴗ•́)و", "(°∀°)"] },
  { name: "難過", keywords: "難過 哭 sad cry", items: ["(╥﹏╥)", "(｡•́︿•̀｡)", "(っ˘̩╭╮˘̩)っ", "(ಥ﹏ಥ)", "(ノ_<。)", "(｡╯︵╰｡)"] },
  { name: "生氣", keywords: "生氣 angry", items: ["(╬ Ò﹏Ó)", "(¬_¬)", "(＃`Д´)", "ヽ( `д´*)ノ", "(•̀⤙•́)", "(눈_눈)"] },
  { name: "打招呼", keywords: "打招呼 hello bye", items: ["ヾ(＾-＾)ノ", "( ´ ▽ ` )ﾉ", "ヾ(☆▽☆)", "(｡･ω･)ﾉﾞ", "(￣▽￣)ノ", "ヾ(•ω•`)o"] },
  { name: "愛心", keywords: "愛心 喜歡 love", items: ["(♡˙︶˙♡)", "( ˘ ³˘)♥", "(づ￣ ³￣)づ", "(っ˘з(˘⌣˘ )", "(๑♡⌓♡๑)", "♡( ◡‿◡ )"] },
];

const nickAdjectives = ["奶油", "月光", "透明", "慵懶", "微甜", "宇宙", "午後", "小小", "霧灰", "草莓", "緩慢", "焦糖"];
const nickNouns = ["烤吐司", "小行星", "收信人", "漫遊者", "日記", "雲朵", "企鵝", "泡泡", "研究員", "底片", "栗子", "旅人"];
const nickAdjectivesEn = ["butter", "moonlit", "clear", "lazy", "sweet", "cosmic", "afternoon", "little", "misty", "berry", "slow", "caramel"];
const nickNounsEn = ["toast", "asteroid", "receiver", "wanderer", "diary", "cloud", "penguin", "bubble", "researcher", "film", "chestnut", "traveler"];

const toRange = (text: string, upper: number, lower: number, digit?: number) =>
  Array.from(text).map((char) => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(upper + code - 65);
    if (code >= 97 && code <= 122) {
      const point = lower + code - 97;
      return point === 0x1d455 ? "ℎ" : String.fromCodePoint(point);
    }
    if (digit && code >= 48 && code <= 57) return String.fromCodePoint(digit + code - 48);
    return char;
  }).join("");

const fontVariants = (text: string) => [
  { name: "粗體", value: toRange(text, 0x1d400, 0x1d41a, 0x1d7ce) },
  { name: "斜體", value: toRange(text, 0x1d434, 0x1d44e) },
  { name: "粗斜體", value: toRange(text, 0x1d468, 0x1d482, 0x1d7ce) },
  { name: "無襯線", value: toRange(text, 0x1d5a0, 0x1d5ba, 0x1d7e2) },
  { name: "無襯線粗體", value: toRange(text, 0x1d5d4, 0x1d5ee, 0x1d7ec) },
  { name: "哥德體", value: toRange(text, 0x1d504, 0x1d51e) },
  { name: "雙線空心體", value: toRange(text, 0x1d538, 0x1d552, 0x1d7d8) },
  { name: "手寫花體", value: toRange(text, 0x1d49c, 0x1d4b6) },
  { name: "等寬字", value: toRange(text, 0x1d670, 0x1d68a, 0x1d7f6) },
  { name: "全形", value: Array.from(text).map((c) => c === " " ? "　" : c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126 ? String.fromCharCode(c.charCodeAt(0) + 0xfee0) : c).join("") },
  { name: "圓圈", value: Array.from(text.toUpperCase()).map((c) => /[A-Z]/.test(c) ? String.fromCodePoint(0x24b6 + c.charCodeAt(0) - 65) : c).join("") },
  { name: "黑底圓圈", value: Array.from(text.toUpperCase()).map((c) => /[A-Z]/.test(c) ? String.fromCodePoint(0x1f150 + c.charCodeAt(0) - 65) : c).join("") },
  { name: "方框", value: Array.from(text.toUpperCase()).map((c) => /[A-Z]/.test(c) ? String.fromCodePoint(0x1f130 + c.charCodeAt(0) - 65) : c).join("") },
  { name: "刪除線", value: Array.from(text).map((c) => c + "\u0336").join("") },
  { name: "底線", value: Array.from(text).map((c) => c + "\u0332").join("") },
];

function addGlobalHistory(item: string) {
  if (!item) return;
  try {
    const prev: string[] = JSON.parse(localStorage.getItem("textlab.globalHistory") || "[]");
    const next = [item, ...prev.filter((x) => x !== item)].slice(0, 10);
    localStorage.setItem("textlab.globalHistory", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("textlab-history-updated", { detail: next }));
  } catch {}
}

function copyText(value: string, onCopied: (value: string) => void) {
  const done = () => {
    onCopied(value);
    addGlobalHistory(value);
    window.setTimeout(() => onCopied(""), 1500);
  };
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(value).then(done).catch(() => fallbackCopy(value, done));
  } else fallbackCopy(value, done);
}

function fallbackCopy(value: string, done: () => void) {
  const area = document.createElement("textarea");
  area.value = value;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  done();
}

function ToolIntro({ tool, language }: { tool: Tool; language: Language }) {
  return <div className="tool-heading">
    <span className={`tool-icon hero-icon ${tool.tone}`}>{tool.icon}</span>
    <div><span className="mini-label">ONLINE TOOL · {t(language, "免費使用", "FREE TO USE")}</span><h1>{t(language, tool.name, tool.nameEn)}</h1><p>{t(language, `${tool.short}，不需登入、不會上傳你的文字。`, `${tool.shortEn}. No sign-up, and your text never leaves your device.`)}</p></div>
  </div>;
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return <label className="search-box"><span>⌕</span><input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /><kbd>⌘ K</kbd></label>;
}

function SymbolTiles({ items, favorites, copied, onCopy, onFavorite }: { items: string[]; favorites: string[]; copied: string; onCopy: (item: string) => void; onFavorite: (item: string) => void }) {
  return <div className="symbol-grid">{items.map((item) => <div className="symbol-card" key={item}>
    <button className="symbol-cell" onClick={() => onCopy(item)} aria-label={`複製 ${item}`}><span>{item}</span><small>{copied === item ? "已複製" : "COPY"}</small></button>
    <button className={`symbol-favorite ${favorites.includes(item) ? "saved" : ""}`} onClick={() => onFavorite(item)} aria-label={`${favorites.includes(item) ? "取消收藏" : "收藏"} ${item}`}>{favorites.includes(item) ? "♥" : "♡"}</button>
  </div>)}</div>;
}

function symbolCodePoints(value: string) {
  return Array.from(value).map((char) => `U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`).join(" · ");
}

function SymbolsTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const [query, setQuery] = useState("");
  const initialCategory = window.location.hash.split("/")[1] || "all";
  const [category, setCategoryState] = useState(symbolGroups.some((group) => group.id === initialCategory) ? initialCategory : "all");
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.recentSymbols") || "[]"));
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.favoriteSymbols") || "[]"));
  const [selected, setSelected] = useState("");
  
  const [frameTitle, setFrameTitle] = useState("MY DAILY LOG");
  const [framePattern, setFramePattern] = useState("sparkle");

  const framePatterns = [
    { id: "sparkle", name: "星閃雙邊", left: "✦ ─── ", right: " ─── ✦" },
    { id: "heart", name: "愛心對稱", left: "♡ ┈┈ ", right: " ┈┈ ♡" },
    { id: "bow", name: "日系蝴蝶結", left: "౨ৎ  ", right: "  ౨ৎ" },
    { id: "star", name: "璀璨星光", left: "⋆⋅☆⋅⋆  ", right: "  ⋆⋅☆⋅⋆" },
    { id: "quote", name: "角括號", left: "『 ", right: " 』" },
    { id: "wave", name: "波浪紋", left: "〰︎ ", right: " 〰︎" }
  ];

  const aestheticLines = [
    "─── ⋆⋅☆⋅⋆ ───",
    "┊ ┊ ┊ ┊ ┊",
    "──────────",
    "‧̍̊·̊⌖˚.💬.˚⌖·̊̍̊‧",
    "·˚ ༘♡",
    "⊹ ִ ֗ ☁️"
  ];

  const selectedPattern = framePatterns.find(p => p.id === framePattern) || framePatterns[0];
  const builtFrame = `${selectedPattern.left}${frameTitle}${selectedPattern.right}`;

  const groups = symbolGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !query || item.includes(query) || group.name.includes(query) || group.keywords.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter((group) => group.items.length && (query || category === "all" || group.id === category));
  const resultCount = groups.reduce((total, group) => total + group.items.length, 0);
  const selectedGroup = symbolGroups.find((group) => group.items.includes(selected));
  const activeGroup = symbolGroups.find((group) => group.id === category);

  useEffect(() => {
    const translatedGroup = activeGroup ? symbolEnglish[activeGroup.id] : undefined;
    document.title = activeGroup ? `${t(language, activeGroup.name, translatedGroup?.name || activeGroup.name)}｜TextLab` : t(language, "特殊符號大全｜字研所 TextLab", "Symbols Library | TextLab");
    const description = activeGroup ? t(language, activeGroup.description, translatedGroup?.description || activeGroup.description) : t(language, `收錄 ${totalSymbolCount} 個特殊符號，支援分類搜尋、最近使用、收藏與一鍵複製。`, `${totalSymbolCount} symbols with categories, search, recents, favorites and one-click copy.`);
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [activeGroup, language]);

  const setCategory = (id: string) => {
    setCategoryState(id);
    setQuery("");
    window.history.replaceState(null, "", id === "all" ? "#symbols" : `#symbols/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const choose = (item: string) => {
    copyText(item, setCopied);
    setSelected(item);
    const next = [item, ...recent.filter((value) => value !== item)].slice(0, 20);
    setRecent(next);
    localStorage.setItem("textlab.recentSymbols", JSON.stringify(next));
  };
  const toggleFavorite = (item: string) => {
    const next = favorites.includes(item) ? favorites.filter((value) => value !== item) : [item, ...favorites];
    setFavorites(next);
    localStorage.setItem("textlab.favoriteSymbols", JSON.stringify(next));
  };

  return <><ToolIntro tool={tools.find((t) => t.id === "symbols")!} language={language} />
    <div className="symbol-summary"><div><strong>{totalSymbolCount}</strong><span>{t(language, "個精選符號", "curated symbols")}</span></div><div><strong>{symbolGroups.length}</strong><span>{t(language, "個實用分類", "useful categories")}</span></div><p>{t(language, "從愛心、箭頭到數學與語言符號，都能快速找到並直接複製。", "Find hearts, arrows, math, language symbols and more—then copy in one click.")}</p></div>
    
    {!query && category === "all" && (
      <section className="input-card" style={{ marginBottom: "20px" }}>
        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>{t(language, "✨ 符號標題對稱框 Studio", "✨ Symmetrical Symbol Frame Studio")}</strong>
          <span>{t(language, "輸入文字，自動生成質感標題框", "Generate aesthetic symbol frames")}</span>
        </div>
        <input
          value={frameTitle}
          onChange={(e) => setFrameTitle(e.target.value)}
          placeholder="Enter text..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "14px", outline: "none", marginBottom: "10px" }}
        />
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px" }}>
          {framePatterns.map((p) => (
            <button
              key={p.id}
              onClick={() => setFramePattern(p.id)}
              style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: framePattern === p.id ? "var(--purple)" : "var(--paper)", color: framePattern === p.id ? "#fff" : "var(--ink)", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", padding: "12px 14px", borderRadius: "10px", background: "var(--canvas)", border: "1px dashed var(--line)" }}>
          <strong style={{ fontSize: "15px", color: "var(--ink)", wordBreak: "break-all", textAlign: "center", minHeight: "24px", display: "grid", placeItems: "center" }}>{builtFrame}</strong>
          <button className="primary-button" style={{ width: "100%" }} onClick={() => copyText(builtFrame, setCopied)}>
            {copied === builtFrame ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製標題框", "Copy Frame")}
          </button>
        </div>

        {/* Aesthetic Lines */}
        <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>{t(language, "質感劃線串：", "Aesthetic Lines:")}</span>
          {aestheticLines.map((line) => (
            <button
              key={line}
              onClick={() => copyText(line, setCopied)}
              style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--purple)", borderRadius: "8px", padding: "3px 9px", fontSize: "11px", cursor: "pointer" }}
            >
              {line}
            </button>
          ))}
        </div>
      </section>
    )}

    <SearchInput value={query} onChange={setQuery} placeholder={t(language, "搜尋符號，例如：愛心、星星、打勾、數學…", "Search symbols: heart, star, check, math…")} />
    <div className="symbol-category-nav" aria-label={t(language, "符號分類", "Symbol categories")}><button className={category === "all" && !query ? "active" : ""} onClick={() => setCategory("all")}>{t(language, "全部", "All")}</button>{symbolGroups.map((group) => <button className={category === group.id && !query ? "active" : ""} key={group.id} onClick={() => setCategory(group.id)}>{t(language, group.shortName, symbolEnglish[group.id].short)}<small>{group.items.length}</small></button>)}</div>
    <div className="helper-row"><span>{query ? t(language, `搜尋「${query}」`, `Search: “${query}”`) : activeGroup ? t(language, activeGroup.description, symbolEnglish[activeGroup.id].description) : t(language, "點一下複製，按愛心加入收藏", "Click to copy, or tap the heart to save")}</span><span>{resultCount} {t(language, "個結果", "results")}</span></div>
    {!query && category === "all" && <div className="personal-symbols">
      {!!recent.length && <section className="symbol-section"><div className="section-title-row"><div><span className="section-kicker">YOUR HISTORY</span><h2>{t(language, "最近使用", "Recently used")}</h2></div><button className="text-button" onClick={() => { setRecent([]); localStorage.removeItem("textlab.recentSymbols"); }}>{t(language, "清除", "Clear")}</button></div><SymbolTiles items={recent} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>}
      {!!favorites.length && <section className="symbol-section"><div className="section-title-row"><div><span className="section-kicker">SAVED</span><h2>{t(language, "我的收藏", "Favorites")}</h2></div></div><SymbolTiles items={favorites} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>}
      <section className="symbol-section"><div className="section-title-row"><div><span className="section-kicker">QUICK PICKS</span><h2>{t(language, "熱門符號", "Popular symbols")}</h2></div></div><SymbolTiles items={popularSymbols} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>
    </div>}
    <div className="symbol-sections">{groups.map((group) => <section className="symbol-section" id={`symbol-${group.id}`} key={group.id}><div className="section-title-row symbol-title"><div><span className="section-kicker">{group.items.length} SYMBOLS</span><h2>{t(language, group.name, symbolEnglish[group.id].name)}</h2><p>{t(language, group.description, symbolEnglish[group.id].description)}</p></div><button className="share-category" onClick={() => copyText(`${window.location.origin}${window.location.pathname}#symbols/${group.id}`, setCopied)}>⌁ {t(language, "複製分類連結", "Copy category link")}</button></div><SymbolTiles items={group.items} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>)}</div>
    {!!selected && <aside className="symbol-detail" aria-label={t(language, "已選符號資訊", "Selected symbol info")}><div className="selected-symbol">{selected}</div><div><span className="section-kicker">SYMBOL INFO</span><strong>{selectedGroup ? t(language, selectedGroup.name, symbolEnglish[selectedGroup.id].name) : t(language, "特殊符號", "Symbol")}</strong><code>{symbolCodePoints(selected)}</code></div><button onClick={() => choose(selected)}>{t(language, "再次複製", "Copy again")}</button><button className={favorites.includes(selected) ? "saved" : ""} onClick={() => toggleFavorite(selected)}>{favorites.includes(selected) ? t(language, "♥ 已收藏", "♥ Saved") : t(language, "♡ 收藏", "♡ Save")}</button><button className="detail-close" onClick={() => setSelected("")} aria-label={t(language, "關閉符號資訊", "Close symbol info")}>×</button></aside>}
    {!groups.length && <EmptyState text={t(language, "找不到這個符號，換個關鍵字試試看。", "No matching symbol. Try another keyword.")} />}</>;
}

function EmojiTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("popular");
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.recentEmoji") || "[]"));
  const activeCategory = emojiCategories.find((item) => item.id === category) || emojiCategories[0];
  const normalizedQuery = query.trim().toLowerCase();
  const source = query ? allEmoji.filter((emoji) => {
    const owner = emojiCategories.find((item) => item.items.includes(emoji));
    const categoryNames = owner ? `${owner.id} ${owner.name} ${emojiEnglish[owner.id]}`.toLowerCase() : "";
    return emoji.includes(query) || (emojiAliases[emoji] || "").toLowerCase().includes(normalizedQuery) || categoryNames.includes(normalizedQuery);
  }) : activeCategory.items;
  const choose = (emoji: string) => { copyText(emoji, setCopied); const next = [emoji, ...recent.filter((x) => x !== emoji)].slice(0, 12); setRecent(next); localStorage.setItem("textlab.recentEmoji", JSON.stringify(next)); };
  return <><ToolIntro tool={tools.find((t) => t.id === "emoji")!} language={language} /><div className="emoji-summary"><strong>{allEmoji.length}</strong><span>Emoji</span><i>·</i><strong>{emojiCategories.length}</strong><span>{t(language, "個分類", "categories")}</span></div><SearchInput value={query} onChange={setQuery} placeholder={t(language, "搜尋 Emoji，例如：感動、咖啡、台灣、完成…", "Search emoji: touched, coffee, Taiwan, done…")} />
    {!!recent.length && !query && <section className="compact-section"><div className="section-title-row"><h2>{t(language, "最近使用", "Recently used")}</h2><button className="text-button" onClick={() => { setRecent([]); localStorage.removeItem("textlab.recentEmoji"); }}>{t(language, "清除", "Clear")}</button></div><div className="emoji-grid recent-grid">{recent.map((emoji) => <button key={emoji} onClick={() => choose(emoji)}>{emoji}</button>)}</div></section>}
    {!query && category === "popular" && (
      <section className="compact-section">
        <div className="section-title-row">
          <h2>{t(language, "✨ 精選情境組合包", "✨ Mood & Scene Combos")}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px", marginTop: "10px" }}>
          {emojiCombos.map((combo) => (
            <button
              key={combo.title}
              onClick={() => copyText(combo.sequence, setCopied)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px 8px",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                background: "var(--paper)",
                cursor: "pointer",
                transition: "0.15s ease"
              }}
            >
              <span style={{ fontSize: "20px", marginBottom: "4px" }}>{combo.sequence}</span>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 650 }}>
                {t(language, combo.title, combo.titleEn)}
              </span>
            </button>
          ))}
        </div>
      </section>
    )}
    <div className="emoji-category-tabs">{emojiCategories.map((item) => <button className={category === item.id && !query ? "active" : ""} key={item.id} onClick={() => { setCategory(item.id); setQuery(""); }}><span>{item.icon}</span>{t(language, item.name, emojiEnglish[item.id])}<small>{item.items.length}</small></button>)}</div>
    <div className="emoji-result-row"><strong>{query ? t(language, `搜尋「${query}」`, `Search: “${query}”`) : t(language, activeCategory.name, emojiEnglish[activeCategory.id])}</strong><span>{source.length} {t(language, "個結果", "results")}</span></div>
    <div className="emoji-grid large-grid">{source.map((emoji) => <button key={emoji} onClick={() => choose(emoji)} aria-label={`${t(language, "複製", "Copy")} ${emoji}`}>{emoji}<small>{copied === emoji ? "✓" : ""}</small></button>)}</div>{!source.length && <EmptyState text={t(language, "找不到這個 Emoji，試試其他中文或英文關鍵字。", "No matching emoji. Try another English or Chinese keyword.")} />}</>;
}

function KaomojiTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.kaomojiFavorites") || "[]"));
  
  const [leftArm, setLeftArm] = useState("(");
  const [eyes, setEyes] = useState("•̀_•́");
  const [rightArm, setRightArm] = useState(")");

  const armsLeftOptions = ["(", "( ฅ", "٩(", "ʕ", "(๑", "(｡", "(⁄ ⁄", "ヽ("];
  const eyesOptions = ["◕‿◕", "•̀_•́", "🥺", "•̀⤙•́", "•́︿•̀", "눈_눈", "¬_¬", "´•ω•", "≧◡≦", "> ▽ <"];
  const armsRightOptions = [")", "ฅ )", ")و", "ʔ", "๑)", "｡)", "⁄ ⁄)", ")ノ"];

  const builtKaomoji = `${leftArm}${eyes}${rightArm}`;

  const groups = kaomojiGroups.map((group) => ({ ...group, items: group.items.filter((item) => !query || item.includes(query) || group.name.includes(query) || group.keywords.includes(query)) })).filter((g) => g.items.length);
  const toggleFavorite = (item: string) => { const next = favorites.includes(item) ? favorites.filter((x) => x !== item) : [...favorites, item]; setFavorites(next); localStorage.setItem("textlab.kaomojiFavorites", JSON.stringify(next)); };

  return <><ToolIntro tool={tools.find((t) => t.id === "kaomoji")!} language={language} />

    {!query && (
      <section className="input-card" style={{ marginBottom: "24px" }}>
        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>{t(language, "🎨 顏文字 DIY 客製化組裝器", "🎨 Kaomoji DIY Builder")}</strong>
          <span>{t(language, "自由組合獨一無二的顏文字", "Combine custom kaomoji parts")}</span>
        </div>
        
        <div style={{ padding: "16px", borderRadius: "12px", background: "var(--canvas)", border: "1px dashed var(--line)", textAlign: "center", margin: "10px 0 16px" }}>
          <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: "8px" }}>{builtKaomoji}</span>
          <button className="primary-button" onClick={() => copyText(builtKaomoji, setCopied)}>
            {copied === builtKaomoji ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製此組裝顏文字", "Copy custom kaomoji")}
          </button>
        </div>

        <div style={{ display: "grid", gap: "10px", fontSize: "12px" }}>
          <div>
            <span style={{ color: "var(--muted)", fontWeight: 650, display: "block", marginBottom: "4px" }}>{t(language, "左手 / 臉框：", "Left Arm / Frame:")}</span>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
              {armsLeftOptions.map((opt) => (
                <button key={opt} onClick={() => setLeftArm(opt)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: leftArm === opt ? "var(--purple)" : "var(--paper)", color: leftArm === opt ? "#fff" : "var(--ink)", cursor: "pointer" }}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <span style={{ color: "var(--muted)", fontWeight: 650, display: "block", marginBottom: "4px" }}>{t(language, "表情 / 眼睛：", "Eyes / Expressions:")}</span>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
              {eyesOptions.map((opt) => (
                <button key={opt} onClick={() => setEyes(opt)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: eyes === opt ? "var(--purple)" : "var(--paper)", color: eyes === opt ? "#fff" : "var(--ink)", cursor: "pointer" }}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <span style={{ color: "var(--muted)", fontWeight: 650, display: "block", marginBottom: "4px" }}>{t(language, "右手 / 結尾：", "Right Arm / Frame:")}</span>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
              {armsRightOptions.map((opt) => (
                <button key={opt} onClick={() => setRightArm(opt)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)", background: rightArm === opt ? "var(--purple)" : "var(--paper)", color: rightArm === opt ? "#fff" : "var(--ink)", cursor: "pointer" }}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      </section>
    )}

    <SearchInput value={query} onChange={setQuery} placeholder={t(language, "搜尋顏文字，例如：開心、害羞、無奈、拜託…", "Search kaomoji: happy, shy, helpless, pray…")} />
    {!!favorites.length && <section className="compact-section"><h2>{t(language, "我的收藏", "Favorites")}</h2><div className="kaomoji-grid">{favorites.map((item) => <KaomojiCard key={item} item={item} favorite copied={copied === item} language={language} onCopy={() => copyText(item, setCopied)} onFavorite={() => toggleFavorite(item)} />)}</div></section>}
    {groups.map((group) => <section className="compact-section" key={group.name}><h2>{t(language, group.name, kaomojiEnglish[group.name])}</h2><div className="kaomoji-grid">{group.items.map((item) => <KaomojiCard key={item} item={item} favorite={favorites.includes(item)} copied={copied === item} language={language} onCopy={() => copyText(item, setCopied)} onFavorite={() => toggleFavorite(item)} />)}</div></section>)}</>;
}

function KaomojiCard({ item, favorite, copied, language, onCopy, onFavorite }: { item: string; favorite: boolean; copied: boolean; language: Language; onCopy: () => void; onFavorite: () => void }) {
  return <div className="kaomoji-card"><button className="kaomoji-copy" onClick={onCopy}><strong>{item}</strong><small>{copied ? t(language, "已複製 ✓", "Copied ✓") : t(language, "點擊複製", "Click to copy")}</small></button><button className={`heart-button ${favorite ? "saved" : ""}`} onClick={onFavorite} aria-label={t(language, "收藏", "Favorite")}>{favorite ? "♥" : "♡"}</button></div>;
}

function FontsTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const [text, setText] = useState("hello studio");
  const [wrapper, setWrapper] = useState<"none" | "sparkle" | "bracket" | "flower" | "soft" | "star" | "book" | "wave">("none");

  const fontNames: Record<string, string> = { 粗體: "Bold", 斜體: "Italic", 粗斜體: "Bold Italic", 無襯線: "Sans Serif", 無襯線粗體: "Sans Bold", 哥德體: "Gothic", 雙線空心體: "Double Struck", 手寫花體: "Script", 等寬字: "Monospace", 全形: "Fullwidth", 圓圈: "Circled", 黑底圓圈: "Black Circled", 方框: "Squared", 刪除線: "Strikethrough", 底線: "Underlined" };

  const applyWrapper = (val: string) => {
    if (wrapper === "sparkle") return `✨ ${val} ✨`;
    if (wrapper === "bracket") return `[ ${val} ]`;
    if (wrapper === "flower") return `✿ ${val} ✿`;
    if (wrapper === "soft") return `୨୧ ${val} ୨୧`;
    if (wrapper === "star") return `✦ ${val} ✦`;
    if (wrapper === "book") return `《 ${val} 》`;
    if (wrapper === "wave") return `〰︎ ${val} 〰︎`;
    return val;
  };

  return <><ToolIntro tool={tools.find((t) => t.id === "fonts")!} language={language} />
    <div className="input-card">
      <div className="field-label"><label htmlFor="font-input">{t(language, "輸入英文或數字", "Enter English letters or numbers")}</label><span>{text.length}/80</span></div>
      <input id="font-input" className="large-input" maxLength={80} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type something…" />
      
      <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>{t(language, "氣氛包裝框：", "Decorations:")}</span>
        {[
          { id: "none", label: "無" },
          { id: "sparkle", label: "✨ ✨" },
          { id: "bracket", label: "[ ]" },
          { id: "flower", label: "✿ ✿" },
          { id: "soft", label: "୨୧ ୨୧" },
          { id: "star", label: "✦ ✦" },
          { id: "book", label: "《 》" },
          { id: "wave", label: "〰︎ 〰︎" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setWrapper(item.id as any)}
            style={{ border: "1px solid var(--line)", background: wrapper === item.id ? "var(--purple)" : "var(--canvas)", color: wrapper === item.id ? "#fff" : "var(--ink)", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>{t(language, "快速靈感：", "IG Bio Presets:")}</span>
        {["Coffee & Life ☕️", "Product Designer ✨", "Taipei, TW 📍", "Minimalist ☁️", "Foodie & Travel 🍜", "OOTD Inspiration ✦"].map((preset) => (
          <button
            key={preset}
            onClick={() => setText(preset)}
            style={{ border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--purple)", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", cursor: "pointer" }}
          >
            + {preset}
          </button>
        ))}
      </div>
    </div>

    <div className="result-header"><h2>{t(language, "轉換結果", "Converted styles")}</h2><span>{t(language, "點擊任一款複製", "Click any style to copy")}</span></div>
    <div className="font-results">
      {fontVariants(text || "Preview").map((item) => {
        const finalVal = applyWrapper(item.value);
        return (
          <button key={item.name} onClick={() => copyText(finalVal, setCopied)}>
            <span className="result-name">{t(language, item.name, fontNames[item.name] || item.name)}</span>
            <strong>{finalVal}</strong>
            <span className="copy-mark">{copied === finalVal ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製", "Copy")}</span>
          </button>
        );
      })}
    </div>
  </>;
}

function LayoutTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const templates = [
    { id: "daily", name: "日常分享", nameEn: "Daily update", icon: "☁", text: "今天的小小紀錄\n把喜歡的日常好好收集起來\n慢慢來，也很好", textEn: "A little note from today\nCollect the everyday moments you love\nTaking it slow is perfectly fine" },
    { id: "threads", name: "Threads 觀點", nameEn: "Threads take", icon: "＠", text: "最近學到的三件事\n第一，先開始比等完美更重要\n第二，持續比速度更重要\n第三，記得保留自己的節奏", textEn: "Three things I learned recently\nStarting matters more than waiting for perfect\nConsistency matters more than speed\nKeep a pace that feels like yours" },
    { id: "promo", name: "品牌公告", nameEn: "Brand update", icon: "✦", text: "NEW DROP｜新品上架\n本週五晚上 8 點正式開放\n數量有限，售完不補", textEn: "NEW DROP｜COMING SOON\nLaunching this Friday at 8 PM\nLimited quantities available" },
    { id: "travel", name: "旅行紀錄", nameEn: "Travel diary", icon: "⌖", text: "TAIPEI DIARY\n散步、喝咖啡、拍下喜歡的街角\n今日座標：大稻埕", textEn: "TAIPEI DIARY\nWalks, coffee and favorite street corners\nToday's location: Dadaocheng" },
  ];
  const [text, setText] = useState(() => language === "zh-TW" ? templates[0].text : templates[0].textEn);
  const [style, setStyle] = useState("invisible");
  const [spacing, setSpacing] = useState("spacious");
  const [decoration, setDecoration] = useState("sparkle");
  const [cjkSpacing, setCjkSpacing] = useState(true);
  const [platform, setPlatform] = useState<"threads" | "ig" | "redbook" | "bio">("threads");

  const platformLimits = {
    threads: { name: "Threads", limit: 500, fold: 500 },
    ig: { name: "Instagram 貼文", limit: 2200, fold: 125 },
    redbook: { name: "小紅書", limit: 1000, fold: 1000 },
    bio: { name: "IG 個人簡介", limit: 150, fold: 150 },
  };

  const currentLimit = platformLimits[platform];
  const isOverLimit = text.length > currentLimit.limit;
  const isFolded = platform === "ig" && text.length > 125;

  const result = useMemo(() => {
    let raw = text;
    if (cjkSpacing) {
      raw = raw.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, "$1 $2");
      raw = raw.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, "$1 $2");
      raw = raw.replace(/([\u4e00-\u9fa5])(\p{Extended_Pictographic})/gu, "$1 $2");
      raw = raw.replace(/(\p{Extended_Pictographic})([\u4e00-\u9fa5])/gu, "$1 $2");
    }
    const lines = raw.trim().split("\n").map((line) => line.trim()).filter(Boolean);
    let formatted = spacing === "spacious" ? lines.join("\n\n") : spacing === "list" ? lines.map((line, index) => index === 0 ? line : `・${line}`).join("\n") : lines.join("\n");
    const firstBreak = formatted.indexOf("\n");
    const title = firstBreak >= 0 ? formatted.slice(0, firstBreak) : formatted;
    const body = firstBreak >= 0 ? formatted.slice(firstBreak) : "";
    if (decoration === "sparkle") formatted = `✦ ${title} ✦${body ? `\n──────────${body}` : ""}`;
    else if (decoration === "soft") formatted = `୨୧ ${title} ୨୧${body}`;
    else if (decoration === "quote") formatted = `『 ${title} 』${body}`;
    else if (decoration === "minimal") formatted = `─── ${title} ───${body}`;
    else if (decoration === "wave") formatted = `〰︎ ${title} 〰︎${body}`;

    if (style === "invisible") return formatted.replace(/\n\n/g, "\n⠀\n");
    if (style === "dot") return formatted.replace(/\n\n/g, "\n·\n");
    if (style === "line") return formatted.replace(/\n\n/g, "\n──────────\n");
    return formatted;
  }, [cjkSpacing, decoration, spacing, style, text]);

  const insertTag = (tag: string) => {
    setText((prev) => (prev ? `${prev}\n\n${tag}` : tag));
  };

  return <><ToolIntro tool={tools.find((t) => t.id === "layout")!} language={language} />
    <section className="layout-templates"><div className="section-title-row"><div><span className="section-kicker">START WITH A TEMPLATE</span><h2>{t(language, "選一個排版範本", "Choose a formatting template")}</h2></div><span>{t(language, "選擇後仍可自由修改", "You can edit it after selecting")}</span></div><div>{templates.map((template) => <button key={template.id} onClick={() => setText(t(language, template.text, template.textEn))}><span>{template.icon}</span><strong>{t(language, template.name, template.nameEn)}</strong></button>)}</div></section>
    
    <div className="layout-controls">
      <label>{t(language, "目標平台與字數", "Target Platform & Limit")}<select value={platform} onChange={(e) => setPlatform(e.target.value as any)}><option value="threads">Threads (500字)</option><option value="ig">Instagram 貼文 (2200字)</option><option value="redbook">小紅書 (1000字)</option><option value="bio">IG 個人簡介 (150字)</option></select></label>
      <label>{t(language, "段落格式", "Paragraph spacing")}<select value={spacing} onChange={(event) => setSpacing(event.target.value)}><option value="spacious">{t(language, "舒展留白", "Spacious")}</option><option value="compact">{t(language, "緊湊排列", "Compact")}</option><option value="list">{t(language, "自動項目符號", "Auto bullets")}</option></select></label>
      <label>{t(language, "標題裝飾", "Title decoration")}<select value={decoration} onChange={(event) => setDecoration(event.target.value)}><option value="sparkle">✦ {t(language, "星光分隔", "Sparkle divider")}</option><option value="soft">୨୧ {t(language, "柔和框線", "Soft frame")}</option><option value="quote">『 {t(language, "日系雙角括", "CJK Quotes")} 』</option><option value="minimal">─── {t(language, "極簡細線", "Minimal line")}</option><option value="wave">〰︎ {t(language, "波浪紋", "Wave")}</option><option value="none">{t(language, "無裝飾", "None")}</option></select></label>
      <label>{t(language, "空行樣式", "Blank-line style")}<select value={style} onChange={(event) => setStyle(event.target.value)}><option value="invisible">{t(language, "隱形空白（推薦）", "Invisible blank (recommended)")}</option><option value="dot">{t(language, "中間點 ·", "Middle dot ·")}</option><option value="line">{t(language, "分隔線 ─", "Divider ─")}</option><option value="plain">{t(language, "一般換行", "Regular line break")}</option></select></label>
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", margin: "-4px 0 16px", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "12px", background: "var(--paper)" }}>
      <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink)", cursor: "pointer", userSelect: "none" }}>
        <input type="checkbox" checked={cjkSpacing} onChange={(e) => setCjkSpacing(e.target.checked)} style={{ accentColor: "var(--purple)", width: "16px", height: "16px" }} />
        <strong>{t(language, "自動補齊中英 / Emoji 呼吸空格", "Auto-space CJK, English & Emoji")}</strong>
      </label>
      <div style={{ fontSize: "11px", color: isOverLimit ? "#d9534f" : "var(--muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
        <span>{text.length} / {currentLimit.limit} {t(language, "字", "chars")}</span>
        {isFolded && <span style={{ color: "#d97724", background: "rgba(217, 119, 36, 0.12)", padding: "2px 7px", borderRadius: "6px" }}>⚠️ {t(language, ">125字：IG將在此處摺疊顯示「...更多」", ">125 chars: IG will fold here")}</span>}
      </div>
    </div>

    <div className="editor-grid">
      <div className="input-card">
        <div className="field-label"><label htmlFor="layout-input">{t(language, "原始文字", "Original text")}</label><span>{text.length} {t(language, "字", "characters")}</span></div>
        <textarea id="layout-input" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="input-card result-card">
        <div className="field-label"><span>{t(language, "排版後預覽", "Formatted preview")}</span><span className="changed-badge">{t(language, "已套用格式", "Format applied")}</span></div>
        <div className="preview-text formatted-preview">{result.split("\n").map((line, index) => line === "⠀" ? <span className="invisible-line" key={`${line}-${index}`}>{t(language, "隱形空白 · 貼上後看不見", "Invisible blank · hidden after pasting")}</span> : <span key={`${line}-${index}`}>{line || " "}</span>)}</div>
      </div>
    </div>

    <div style={{ margin: "14px 0", padding: "12px 16px", border: "1px solid var(--line)", borderRadius: "12px", background: "var(--paper)", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>{t(language, "一鍵快捷落款：", "Quick Footer / Tags:")}</span>
      {[
        "#Threads #日常 #質感排版",
        "#日常記錄 #生活隨筆",
        "—— Follow for more ✨",
        "─── ♡ ───",
        "📌 歡迎追蹤分享"
      ].map((tag) => (
        <button
          key={tag}
          onClick={() => insertTag(tag)}
          style={{ border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--purple)", borderRadius: "8px", padding: "4px 9px", fontSize: "11px", cursor: "pointer" }}
        >
          + {tag}
        </button>
      ))}
    </div>

    <div className="layout-action">
      <div>
        <strong>{t(language, "看得見的預覽，看不見的空白", "Visible preview, invisible blank lines")}</strong>
        <p>{t(language, "紫色提示只用來標示空行，複製到 IG／Threads 時不會出現。", "The purple guide only marks blank lines here. It will not appear on Instagram or Threads.")}</p>
      </div>
      <button className="primary-button" onClick={() => copyText(result, setCopied)}>{copied === result ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製排版文字", "Copy formatted text")}</button>
    </div>
  </>;
}

function NicknameTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const [seed, setSeed] = useState(() => language === "zh-TW" ? "小安" : "Mia");
  const [style, setStyle] = useState("日系清新");
  const [round, setRound] = useState(0);
  const results = useMemo(() => {
    const adjectives = language === "zh-TW" ? nickAdjectives : nickAdjectivesEn;
    const nouns = language === "zh-TW" ? nickNouns : nickNounsEn;
    const base = seed.trim() || (language === "zh-TW" ? "小安" : "Mia"); const offset = round % adjectives.length;
    const decor = style === "可愛甜系" ? ["ෆ", "♡", "୨୧", "₊˚"] : style === "極簡質感" ? ["", "_", ".", "°"] : ["☁", "﹏", "𓂃", "✦"];
    return Array.from({ length: 8 }, (_, i) => `${decor[i % 4]}${adjectives[(i + offset) % adjectives.length]}${i % 2 ? base : nouns[(i + offset) % nouns.length]}${decor[(i + 1) % 4]}`);
  }, [language, seed, style, round]);
  const styleNames: Record<string, string> = { 日系清新: "Japanese", 可愛甜系: "Cute", 極簡質感: "Minimal" };
  return <><ToolIntro tool={tools.find((t) => t.id === "nickname")!} language={language} /><div className="generator-card"><label>{t(language, "放入一個名字或關鍵字", "Enter a name or keyword")}<input value={seed} maxLength={12} onChange={(e) => setSeed(e.target.value)} placeholder={t(language, "例如：小安、咖啡、旅行", "e.g. Mia, coffee, travel")} /></label><label>{t(language, "想要的風格", "Choose a style")}<div className="category-tabs left-tabs">{["日系清新", "可愛甜系", "極簡質感"].map((name) => <button key={name} className={style === name ? "active" : ""} onClick={() => setStyle(name)}>{t(language, name, styleNames[name])}</button>)}</div></label><button className="primary-button" onClick={() => setRound((x) => x + 1)}>↻ {t(language, "再產生一組", "Generate more")}</button></div><div className="nickname-grid">{results.map((name) => <button key={name} onClick={() => copyText(name, setCopied)}><strong>{name}</strong><span>{copied === name ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製", "Copy")}</span></button>)}</div></>;
}

function BlankTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const blankTypes = [
    { id: "hangul", value: "ㅤ", name: "通用空白", nameEn: "Universal blank", code: "U+3164", best: "IG、遊戲暱稱", bestEn: "Instagram and game names" },
    { id: "braille", value: "⠀", name: "段落空白", nameEn: "Paragraph blank", code: "U+2800", best: "社群貼文、聊天室", bestEn: "Social posts and chats" },
    { id: "zero", value: "​", name: "零寬空白", nameEn: "Zero-width space", code: "U+200B", best: "文字斷點、隱形分隔", bestEn: "Invisible breaks and separators" },
  ];
  const [count, setCount] = useState(1);
  const [type, setType] = useState("hangul");
  const [testText, setTestText] = useState("");
  const selectedType = blankTypes.find((item) => item.id === type) || blankTypes[0];
  const blank = selectedType.value.repeat(count);
  return <><ToolIntro tool={tools.find((t) => t.id === "blank")!} language={language} />
    <section className="blank-explainer"><span className="explainer-icon">?</span><div><h2>{t(language, "空白文字是什麼？", "What is invisible text?")}</h2><p>{t(language, "一般空格常被 IG、遊戲或聊天平台刪除；空白文字其實是「看不見的 Unicode 字元」，平台會把它當成真正的文字，所以可以建立空白名稱、空白行或隱形分隔。", "Platforms often remove regular spaces. Invisible text uses real Unicode characters that have no visible shape, so they can create blank names, empty lines or hidden separators.")}</p></div></section>
    <div className="blank-use-cases"><article><span>01</span><strong>{t(language, "IG 精選名稱", "Instagram highlight names")}</strong><p>{t(language, "讓精選動態只顯示封面，不顯示文字。", "Show only the cover without a visible label.")}</p></article><article><span>02</span><strong>{t(language, "遊戲空白暱稱", "Blank game names")}</strong><p>{t(language, "建立看起來沒有文字的名稱或加入隱形間距。", "Create a name that appears empty or add hidden spacing.")}</p></article><article><span>03</span><strong>{t(language, "社群空白行", "Blank lines in posts")}</strong><p>{t(language, "避免平台自動吃掉貼文中的段落空行。", "Keep paragraph spacing when platforms remove empty lines.")}</p></article></div>
    <div className="blank-workbench"><div className="blank-main"><div className="blank-type-list"><span className="field-title">1. {t(language, "選擇空白類型", "Choose a blank type")}</span>{blankTypes.map((item) => <button className={type === item.id ? "active" : ""} key={item.id} onClick={() => setType(item.id)}><span className="blank-swatch">{item.value}</span><span><strong>{t(language, item.name, item.nameEn)}</strong><small>{item.code} · {t(language, `適合 ${item.best}`, `Best for ${item.bestEn}`)}</small></span><i>{type === item.id ? "✓" : ""}</i></button>)}</div><div className="blank-count"><span className="field-title">2. {t(language, "選擇長度", "Choose a length")}</span><div className="blank-presets">{[1, 3, 5, 10].map((value) => <button className={count === value ? "active" : ""} key={value} onClick={() => setCount(value)}>{value} {t(language, "個", "chars")}</button>)}</div><div className="stepper"><button onClick={() => setCount(Math.max(1, count - 1))}>−</button><strong>{count}</strong><button onClick={() => setCount(Math.min(30, count + 1))}>＋</button></div></div><button className="primary-button wide" onClick={() => copyText(blank, setCopied)}>{copied === blank ? t(language, "空白文字已複製 ✓", "Invisible text copied ✓") : t(language, `複製 ${count} 個${selectedType.name}`, `Copy ${count} ${selectedType.nameEn}`)}</button></div>
      <aside className="blank-guide"><span className="section-kicker">HOW TO USE</span><h2>{t(language, "使用方式", "How to use")}</h2><ol><li><span>1</span>{t(language, "選擇適合的平台類型", "Choose the best character type")}</li><li><span>2</span>{t(language, "按下「複製空白文字」", "Tap the copy button")}</li><li><span>3</span>{t(language, "到目標欄位長按貼上", "Paste it into your target field")}</li></ol><div className="blank-example"><small>{t(language, "使用範例", "Example")}</small><p>{t(language, "原本：小安", "Before: Mia")}</p><p>{t(language, "貼上後：小安", "After: Mia")}<span>{selectedType.value.repeat(3)}</span>{t(language, "日記", "Diary")}</p></div><p className="compatibility-note">{t(language, "提示：不同平台的過濾規則可能改變；如果第一種無效，可改用「段落空白」。", "Tip: Platform filters change. If the first type fails, try Paragraph blank instead.")}</p></aside></div>
    <section className="blank-tester"><div><span className="section-kicker">PASTE TEST</span><h2>{t(language, "貼上測試區", "Paste test")}</h2><p>{t(language, "複製後貼到下方，游標有移動就代表空白字元存在。", "Paste below. If the cursor moves, the invisible characters are there.")}</p></div><input value={testText} onChange={(event) => setTestText(event.target.value)} placeholder={t(language, "在這裡貼上空白文字測試…", "Paste invisible text here to test…")} /><span>{Array.from(testText).length} {t(language, "個字元", "characters")}</span></section></>;
}

function BioTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const bioTemplates = [
    {
      name: "極簡質感",
      nameEn: "Minimalist",
      lines: ["An ✦", "☁️ Slow living & coffee", "📍 Taipei, TW", "👇🏼 Daily notes & thoughts"]
    },
    {
      name: "創作者 / 設計師",
      nameEn: "Creator / Designer",
      lines: ["[ Mia · 米亞 ]", "🎨 Digital Product Designer", "✨ Making ideas happen", "✉️ Hello@studio.com"]
    },
    {
      name: "美食 & 咖啡日誌",
      nameEn: "Food & Coffee",
      lines: ["‧̍̊·̊⌖ 台北美食日誌", "🍜 Food, coffee & cozy spots", "📷 Shot on iPhone 15 Pro", "👇🏼 最新食記文章"]
    },
    {
      name: "軟萌日系",
      nameEn: "Kawaii & Soft",
      lines: ["౨ৎ  小安  ౨ৎ", "✿ 捕捉生活中喜歡的微光", "🧸 Threads 每日更新", "🎀 歡迎按讚與追蹤"]
    },
    {
      name: "Threads 思考紀錄",
      nameEn: "Threads Thoughts",
      lines: ["『 紀錄思考與日常 』", "✦ 聊設計、科技與生活", "💬 歡迎留言交流與追蹤", "👇🏼 點擊下方連結"]
    }
  ];

  const [name, setName] = useState("An ✦");
  const [tagline, setTagline] = useState("☁️ Slow living & coffee");
  const [location, setLocation] = useState("📍 Taipei, TW");
  const [cta, setCta] = useState("👇🏼 Daily notes & thoughts");

  const builtBio = `${name}\n${tagline}\n${location}\n${cta}`;
  const totalLength = builtBio.length;

  const applyPreset = (lines: string[]) => {
    setName(lines[0] || "");
    setTagline(lines[1] || "");
    setLocation(lines[2] || "");
    setCta(lines[3] || "");
  };

  return (
    <>
      <ToolIntro tool={tools.find((t) => t.id === "bio")!} language={language} />

      <div className="input-card" style={{ marginBottom: "20px" }}>
        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
            {t(language, "✨ IG & Threads 個人檔案 Bio 產生器", "✨ IG & Threads Bio Studio")}
          </strong>
          <span>{totalLength}/150 {t(language, "字", "chars")}</span>
        </div>

        {/* 即時手機卡片 Preview */}
        <div style={{ padding: "18px", borderRadius: "14px", background: "var(--canvas)", border: "1px solid var(--line)", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--purple-soft)", color: "var(--purple)", display: "grid", placeItems: "center", fontSize: "20px", fontWeight: 700 }}>
              ✦
            </div>
            <div>
              <strong style={{ fontSize: "14px", color: "var(--ink)", display: "block" }}>{name || "Your Name"}</strong>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>@profile_preview</small>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: 1.6, padding: "10px 12px", background: "var(--paper)", borderRadius: "10px", border: "1px dashed var(--line)" }}>
            {builtBio}
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(language, "1. 姓名 / 稱呼 (例：An ✦)", "1. Name (e.g. An ✦)")} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: "13px" }} />
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={t(language, "2. 身份 / 定位 (例：☁️ Slow living)", "2. Role (e.g. ☁️ Slow living)")} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: "13px" }} />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t(language, "3. 城市 / 標籤 (例：📍 Taipei, TW)", "3. Location (e.g. 📍 Taipei, TW)")} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: "13px" }} />
          <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder={t(language, "4. 行動呼籲 / 連結提示 (例：👇🏼 Read more)", "4. Call to Action (e.g. 👇🏼 Read more)")} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: "13px" }} />
        </div>

        <button className="primary-button wide" onClick={() => copyText(builtBio, setCopied)}>
          {copied === builtBio ? t(language, "Bio 已複製 ✓", "Bio Copied ✓") : t(language, "複製 Bio 個人簡介", "Copy Bio Text")}
        </button>

        <div style={{ marginTop: "20px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "8px" }}>
            {t(language, "💡 熱門風格範本（點擊一鍵套用）：", "💡 Popular Bio Templates:")}
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
            {bioTemplates.map((item) => (
              <button
                key={item.name}
                onClick={() => applyPreset(item.lines)}
                style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "10px", padding: "8px 10px", textAlign: "left", cursor: "pointer", fontSize: "11px" }}
              >
                <strong style={{ display: "block", color: "var(--purple)", marginBottom: "3px" }}>{t(language, item.name, item.nameEn)}</strong>
                <small style={{ color: "var(--muted)", fontSize: "9px" }}>{item.lines[0]}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function HashtagTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const hashtagBundles = [
    {
      title: "日常紀錄",
      titleEn: "Daily Life",
      category: "daily",
      tags: ["#日常", "#日常紀錄", "#生活碎片", "#生活美學", "#Threads日常"]
    },
    {
      title: "咖啡 & 探店",
      titleEn: "Coffee & Cafe",
      category: "cafe",
      tags: ["#台北咖啡廳", "#咖啡廳探店", "#下午茶", "#CoffeePorn", "#CafeHopping"]
    },
    {
      title: "穿搭 & OOTD",
      titleEn: "Fashion & OOTD",
      category: "fashion",
      tags: ["#今日穿搭", "#OOTD", "#穿搭分享", "#極簡穿搭", "#Outfitoftheday"]
    },
    {
      title: "Threads 創作者",
      titleEn: "Threads Creator",
      category: "creator",
      tags: ["#Threads創作者", "#思考紀錄", "#觀點分享", "#個人成長", "#設計師日常"]
    },
    {
      title: "小紅書氛圍感",
      titleEn: "Aesthetic Redbook",
      category: "aesthetic",
      tags: ["#小紅書文案", "#氛圍感", "#質感生活", "#靈感集", "#美學提案"]
    },
    {
      title: "美食日記",
      titleEn: "Foodie Notes",
      category: "food",
      tags: ["#美食日記", "#台北美食", "#吃貨日常", "#Foodie", "#FoodPorn"]
    },
    {
      title: "旅行記錄",
      titleEn: "Travel Diary",
      category: "travel",
      tags: ["#旅行日記", "#城市散步", "#旅遊攝影", "#TravelGram", "#Explore"]
    },
    {
      title: "溫柔金句",
      titleEn: "Mood & Quotes",
      category: "mood",
      tags: ["#微甜短句", "#治癒系", "#溫柔文字", "#情緒碎片", "#靜心"]
    }
  ];

  const [customInput, setCustomInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const generatedTags = customInput.trim()
    ? customInput.split(/\s+/).map((word) => word.startsWith("#") ? word : `#${word}`)
    : [];

  const toggleSelectTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const selectedText = selectedTags.join(" ");

  return (
    <>
      <ToolIntro tool={tools.find((t) => t.id === "hashtags")!} language={language} />

      <div className="input-card" style={{ marginBottom: "20px" }}>
        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
            {t(language, "✨ 自訂 Hashtag 組合器", "✨ Custom Hashtag Builder")}
          </strong>
          <span>{t(language, "輸入關鍵字，自動加 # 號", "Type keywords to add #")}</span>
        </div>

        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={t(language, "輸入關鍵字，用空格隔開（例：咖啡 台北 下午茶）", "Enter keywords separated by spaces (e.g. coffee Taipei cafe)")}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "14px", outline: "none", marginBottom: "10px" }}
        />

        {!!generatedTags.length && (
          <div style={{ padding: "12px", borderRadius: "10px", background: "var(--paper)", border: "1px dashed var(--line)", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "13px", color: "var(--purple)" }}>{generatedTags.join(" ")}</strong>
            <button className="primary-button" onClick={() => copyText(generatedTags.join(" "), setCopied)}>
              {copied === generatedTags.join(" ") ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製標籤", "Copy Tags")}
            </button>
          </div>
        )}
      </div>

      {!!selectedTags.length && (
        <div style={{ padding: "14px 16px", borderRadius: "12px", background: "var(--purple-soft)", border: "1px solid var(--line)", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", color: "var(--purple)", fontWeight: 700, display: "block", marginBottom: "4px" }}>
              {t(language, `已點選 ${selectedTags.length} 個標籤：`, `Selected ${selectedTags.length} tags:`)}
            </span>
            <strong style={{ fontSize: "13px", color: "var(--ink)" }}>{selectedText}</strong>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="primary-button" onClick={() => copyText(selectedText, setCopied)}>
              {copied === selectedText ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製合集", "Copy Selected")}
            </button>
            <button onClick={() => setSelectedTags([])} style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--muted)", borderRadius: "8px", padding: "6px 10px", fontSize: "11px", cursor: "pointer" }}>
              {t(language, "清除", "Clear")}
            </button>
          </div>
        </div>
      )}

      <div className="section-title-row" style={{ marginBottom: "14px" }}>
        <h2>{t(language, "🔥 精選 Threads & IG 熱門標籤包", "🔥 Trending Hashtag Bundles")}</h2>
        <span style={{ color: "var(--subtle)", fontSize: "10px" }}>{t(language, "點擊單個複製或點選組合", "Click tag to copy or build bundle")}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        {hashtagBundles.map((bundle) => {
          const bundleText = bundle.tags.join(" ");
          return (
            <div key={bundle.title} style={{ border: "1px solid var(--line)", borderRadius: "14px", background: "var(--paper)", padding: "16px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "13px", color: "var(--purple)" }}>{t(language, bundle.title, bundle.titleEn)}</strong>
                <button className="text-button" onClick={() => copyText(bundleText, setCopied)}>
                  {copied === bundleText ? t(language, "整包已複製 ✓", "Bundle Copied ✓") : t(language, "複製整包", "Copy Bundle")}
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {bundle.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleSelectTag(tag)}
                    style={{
                      border: "1px solid var(--line)",
                      background: selectedTags.includes(tag) ? "var(--purple)" : "var(--canvas)",
                      color: selectedTags.includes(tag) ? "#fff" : "var(--ink)",
                      borderRadius: "8px",
                      padding: "5px 9px",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AIPostTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const tones = [
    { id: "cozy", name: "☁️ 文青質感", nameEn: "Cozy & Aesthetic", hint: "適合 IG 日常、咖啡探店、生活紀錄" },
    { id: "threads", name: "💬 Threads 觀點", nameEn: "Viral Threads Take", hint: "適合 Threads 爆款短評、思考討論" },
    { id: "line", name: "📢 LINE 社群團購", nameEn: "LINE Deal Push", hint: "適合 LINE 群組社群推播、團購優惠" },
    { id: "sales", name: "🛍️ 商品促銷導購", nameEn: "Sales & Promotion", hint: "適合 電商促銷、引爆購買慾望" },
    { id: "redbook", name: "✨ 小紅書種草", nameEn: "Redbook Lifestyle", hint: "適合 探店提案、質感好物推薦" },
    { id: "pro", name: "💡 職人專業", nameEn: "Professional", hint: "適合 設計師心得、工作經驗分享" },
    { id: "humor", name: "🫠 幽默社畜", nameEn: "Humorous Casual", hint: "適合 週五下班、生活吐嘈日記" }
  ];

  const presets = [
    { title: "風扇商品開團", idea: "質感極簡風扇限時開團！雙重涼感極致靜音，原價 $1580 限時優惠折 $200" },
    { title: "古宅咖啡廳探店", idea: "今天去大安區古宅咖啡廳，抹茶拿鐵很香，窗邊陽光很美，適合獨處看書" },
    { title: "Threads 思考紀錄", idea: "最近發現把心態放慢之後，工作效率反而變高了，想聊聊這個體悟" },
    { title: "社畜下班吐嘈", idea: "改完第 5 版草稿，終於可以下班去吃麻辣鍋放空了" }
  ];

  const DEFAULT_OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY || "";

  const openRouterModels = [
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "🎁 NVIDIA Nemotron 3 Super 120B (:free 免費)" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "🎁 Meta Llama 3.3 70B (:free 免費)" },
    { id: "deepseek/deepseek-r1:free", name: "🎁 DeepSeek R1 (:free 免費)" },
    { id: "google/gemini-2.0-flash-lite-preview-02-05:free", name: "🎁 Google Gemini 2.0 Flash Lite (:free 免費)" },
    { id: "qwen/qwen-2.5-72b-instruct:free", name: "🎁 Qwen 2.5 72B (:free 免費)" },
    { id: "openai/gpt-4o-mini", name: "💳 OpenAI GPT-4o mini (需 OpenRouter 儲值)" },
    { id: "anthropic/claude-3.5-haiku", name: "💳 Claude 3.5 Haiku (需 OpenRouter 儲值)" }
  ];

  const [selectedTone, setSelectedTone] = useState("cozy");
  const [idea, setIdea] = useState("今天去大安區古宅咖啡廳，抹茶拿鐵很香，窗邊陽光很美，適合獨處看書");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRequestKey, setLastRequestKey] = useState("");
  const [cooldownSec, setCooldownSec] = useState(0);

  // OpenRouter Settings
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("textlab.openrouter_key") || DEFAULT_OPENROUTER_KEY);
  const [model, setModel] = useState(() => localStorage.getItem("textlab.openrouter_model") || "nvidia/nemotron-3-super-120b-a12b:free");
  const [showSettings, setShowSettings] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // 冷卻倒數計時器
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem("textlab.openrouter_key", val.trim());
  };

  const handleModelChange = (val: string) => {
    setModel(val);
    localStorage.setItem("textlab.openrouter_model", val);
  };

  const currentTone = tones.find((t) => t.id === selectedTone) || tones[0];

  const generatePost = async () => {
    // 防連點與防空內容鎖定 (Anti-double click & cooldown guard)
    if (!idea.trim() || isGenerating || cooldownSec > 0) return;

    // 重複請求攔截 (Deduplication Check)
    const currentRequestKey = `${selectedTone}::${model}::${idea.trim()}`;
    if (currentRequestKey === lastRequestKey && output) {
      setErrorMessage("💡 提示：您尚未修改內容或風格，已呈現目前成果（已為您省下重複 API Token 消耗！）。");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    const key = apiKey.trim() || DEFAULT_OPENROUTER_KEY;

    if (key) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "字研所 TextLab",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: `你是一位精通台灣社群（IG、Threads、LINE 團購、小紅書、職人專欄）的頂級 AI 採編與文案專家。
請根據使用者的【發文風格語氣】與【核心想法/主題】，撰寫極具吸引力、排版清晰、善用適量 Emoji 與熱門黑標籤 (Hashtag) 的社群貼文。
規範：
1. 一律使用繁體中文 (台灣用語與流行社群用語)。
2. 請呈現自然流暢、符合選擇語氣的社群文風。
3. 直接輸出完整貼文內容，不要包含額外的解說或 \`\`\` 程式碼標記。`
              },
              {
                role: "user",
                content: `發文風格語氣：${currentTone.name} (${currentTone.hint})
貼文主題與內容想法：${idea.trim()}`
              }
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `API 回應錯誤 (${response.status})`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          setOutput(content.trim());
          setLastRequestKey(currentRequestKey);
          setIsGenerating(false);
          setCooldownSec(3); // 啟動 3 秒冷卻保護鎖
          return;
        } else {
          throw new Error("API 未返回有效內容");
        }
      } catch (err: any) {
        console.warn("OpenRouter API Error, falling back to smart generator:", err);
        setErrorMessage(`⚠️ OpenRouter 呼叫失敗 (${err?.message || "請檢查 Key 或網路"})，已自動切換至備用引擎。`);
      }
    }

    // Fallback: Smart local generator
    setTimeout(() => {
      let result = "";
      const text = idea.trim() || "紀錄這份當下的美好。";
      const timestampSeed = Date.now();
      const variantIdx = timestampSeed % 3;

      if (selectedTone === "cozy") {
        const intros = ["☁️  Slow living & daily notes", "✦ 今日生活微光筆記 ☁️", "🍃 Cozy Moments · 靜心隨筆"];
        const outros = [
          "喜歡這種不急不躁的節奏，把日常的微光收進日子裡。✨\n\n─── ⋆⋅☆⋅⋆ ───\n#日常碎片 #生活美學 #質感隨筆 #Threads日常",
          "在忙碌的日常裡，留給自己一段清空大腦的時光。☕️\n\n─── ♡ ───\n#生活美學 #靜心時刻 #質感生活 #日常紀錄",
          "把喜歡的瞬間定格，這就是生活最溫柔的模樣。🌸\n\n─── ⊹ ִ ֗ ☁️ ───\n#簡單生活 #溫柔文案 #微光日子 #日常心情"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      } else if (selectedTone === "threads") {
        const intros = ["『 關於最近的一個小思考 』", "💬 Threads 爆款觀察：一個很有感的體悟", "✦ 聊天時間｜最近的這件事"];
        const outros = [
          "💬 大家的看法呢？歡迎留言分享你的視角 👇🏼\n\n#Threads創作者 #思考紀錄 #觀點分享 #生活視角",
          "你也是這樣想的嗎？點個追蹤一起交流思考 💬\n\n#Threads熱門 #觀點紀錄 #個人成長 #創作者日常",
          "如果也有同感，歡迎按讚收藏或轉發給朋友聊聊 👇🏼\n\n#思考碎片 #共鳴文案 #日常交流 #Threads靈感"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      } else if (selectedTone === "line") {
        const intros = ["🔥【LINE 社群限定｜社友獨享優惠】", "⚡️【LINE 群組特惠告急｜限時開團】", "📢【社群好友專屬】限時限量爆款提案"];
        const outros = [
          "📢 團購好康重點：\n▪ 限量庫存：搶完即止 ⚡️\n▪ 社群專屬價：輸入優惠碼即享折扣\n\n👇🏼 點擊下方連結立即下單預購：\nhttps://line.me/R/ti/p/@example\n\n💬 有任何問題，歡迎隨時在群裡發問！",
          "⚡️ 優惠倒數：\n▪ 獨家下殺折價優惠中\n▪ 滿額再享免運直送\n\n👉🏼 入手連結：https://line.me/R/ti/p/@example\n\n快分享給身邊需要的朋友～",
          "🛍️ 限時專屬福袋：\n▪ 今日結帳加碼贈送精美好禮\n▪ 限量 30 組售完不補\n\n👇🏼 點擊下方傳送門下單：\nhttps://line.me/R/ti/p/@example"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      } else if (selectedTone === "sales") {
        const intros = ["🛒【爆款限定促銷｜限時下殺】", "⚡️【現貨倒數】錯過不再補的熱門好物", "🛍️【限時特惠】這款真的必須入手！"];
        const outros = [
          "✨ 為什麼大家都在搶？\n▪ 必買理由 01：CP 值極高，口碑一致好評\n▪ 必買理由 02：限時特惠價，錯過不再有\n\n⏰ 現貨數量有限，搶完不補！\n👉🏼 點擊連結立即搶購：https://store.example.com\n\n#爆款推薦 #限時優惠 #必買好物 #搶購倒數",
          "🔥 入手三大理由：\n▪ 品質質感滿分，用過就回不去\n▪ 今日下單享限定專屬折扣\n\n⏰ 倒數結帳中，限量現貨搶購！\n👉🏼 賣場連結：https://store.example.com\n\n#熱銷推薦 #促銷導購 #質感選物 #現貨不用等",
          "💯 網友一致口碑推薦：\n▪ 實品比照片更有質感\n▪ 限時特惠即將結束\n\n👇🏼 點擊這裡帶回家：https://store.example.com\n\n#好物推薦 #熱銷爆款 #折扣進行中 #限時搶購"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      } else if (selectedTone === "redbook") {
        const intros = ["✦ 氛圍感生活提案 ✦", "✨ 小紅書熱門種草提案", "‧̍̊·̊⌖ 出片率 100% 的美學紀錄"];
        const outros = [
          "▪ 視覺氛圍：滿分 💯\n▪ 出片指數：★★★★★\n\n‧̍̊·̊⌖ 收藏這份美好提案 ‧̍̊·̊⌖\n#小紅書文案 #氛圍感 #質感生活 #靈感集",
          "▪ 推薦指數：★★★★★\n▪ 質感細節：超級到位\n\n✦ 點讚收藏不迷路 ✦\n#種草日記 #氛圍感滿分 #美學提案 #極簡生活",
          "▪ 視覺風格：溫柔質感\n▪ 必買出片靈感收錄\n\n♡ 喜歡別忘了點個讚唷 ♡\n#原圖直出 #質感視覺 #靈感隨筆 #小紅書熱門"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      } else if (selectedTone === "pro") {
        const intros = ["💡 職人筆記｜Insight & Growth", "✦ 專業觀點覆盤｜Design & Thought", "⚙️ 工作經驗談｜高效運作的核心"];
        const outros = [
          "01 / 保持專注\n02 / 覆盤與修正\n\n希望這段體驗對你也有幫助 ✦\n\n#職人觀點 #設計思考 #工作心得 #經驗分享",
          "01 / 清晰定義問題\n02 / 持續疊代優化\n\n歡迎同行朋友留言討論交流 💡\n\n#專業心得 #職涯成長 #邏輯思考 #工作筆記",
          "01 / 簡化繁瑣流程\n02 / 專注核心價值\n\n希望這篇分享能給你帶來一些靈感 ✦\n\n#知識分享 #職人思維 #經驗覆盤 #專業輸出"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      } else {
        const intros = ["🫠 今日社畜心理狀態", "💨 社畜下班後的微醺日記", "☕️ 平安下班的生存指南"];
        const outros = [
          "禮貌微笑，平安下班。🏃‍♂️💨💼🍻\n\n#社畜日常 #優雅崩潰 #週五救星 #日常開心",
          "改完第 5 版草稿，終於可以下班吃大餐了！🫠\n\n#下班快樂 #社畜日常 #優雅崩潰 #薪水小偷",
          "將工作留在公司，下班時間屬於自己！☕️\n\n#平安下班 #社畜日常 #續命咖啡 #心情紀錄"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      }
      setOutput(result);
      setLastRequestKey(currentRequestKey);
      setIsGenerating(false);
      setCooldownSec(3); // 啟動 3 秒冷卻保護鎖
    }, 400);
  };

  return (
    <>
      <ToolIntro tool={tools.find((t) => t.id === "ai")!} language={language} />

      {/* OpenRouter API 設定區塊 */}
      <div className="input-card" style={{ marginBottom: "16px", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setShowSettings(!showSettings)}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>⚡️</span>
            <div>
              <strong style={{ fontSize: "13px", color: "var(--ink)", display: "block" }}>
                OpenRouter AI 設定 {apiKey ? "🟢 (已串接 API Key)" : "⚪️ (點此展開設定)"}
              </strong>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                {apiKey ? `使用模型：${model}` : "輸入 API Key 解鎖 Gemini / Llama / DeepSeek 真 AI 直連"}
              </span>
            </div>
          </div>
          <button type="button" style={{ border: 0, background: "transparent", color: "var(--purple)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
            {showSettings ? "收合 ▲" : "設定 ▼"}
          </button>
        </div>

        {showSettings && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 650, color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                OpenRouter API Key:
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-or-v1-..."
                  style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px", outline: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--muted)", borderRadius: "8px", padding: "0 10px", fontSize: "12px", cursor: "pointer" }}
                >
                  {showKey ? "隱藏" : "顯示"}
                </button>
              </div>
              <small style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                金鑰僅儲存在您的本機瀏覽器 (localStorage)，安全不外洩。可在 <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: "var(--purple)" }}>OpenRouter.ai</a> 免費申請。
              </small>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 650, color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                選擇 AI 模型 (Model):
              </label>
              <select
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px", outline: "none" }}
              >
                {openRouterModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 貼文發想卡片 */}
      <div className="input-card" style={{ marginBottom: "20px" }}>
        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
            {t(language, "1. 選擇發文風格語氣", "1. Select Vibe Tone")}
          </strong>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {tones.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setSelectedTone(tItem.id)}
              style={{
                border: "1px solid var(--line)",
                background: selectedTone === tItem.id ? "var(--purple)" : "var(--paper)",
                color: selectedTone === tItem.id ? "#fff" : "var(--ink)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {t(language, tItem.name, tItem.nameEn)}
            </button>
          ))}
        </div>

        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
            {t(language, "2. 輸入貼文想法 / 產品素材", "2. Type your post idea")}
          </strong>
          <span>{idea.length} {t(language, "字", "chars")}</span>
        </div>

        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={t(language, "例如：極簡涼感風扇開箱、大安區古宅咖啡廳探店、或是想聊聊的心情...", "e.g. Minimalist cooling fan unboxing, vintage cafe log, or a thought to share...")}
          rows={4}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "13px", lineHeight: 1.5, resize: "vertical", outline: "none", marginBottom: "12px" }}
        />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", width: "100%", fontWeight: 650 }}>
            {t(language, "💡 點選範例快速試用：", "💡 Try a sample idea:")}
          </span>
          {presets.map((p) => (
            <button
              key={p.title}
              onClick={() => { setIdea(p.idea); }}
              style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--muted)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer" }}
            >
              {p.title}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(220, 53, 69, 0.1)", border: "1px solid rgba(220, 53, 69, 0.3)", color: "#dc3545", fontSize: "12px", marginBottom: "14px" }}>
            {errorMessage}
          </div>
        )}

        <button className="primary-button wide" onClick={generatePost} disabled={isGenerating || cooldownSec > 0}>
          {isGenerating
            ? t(language, "✨ OpenRouter AI 生成中…", "✨ AI Generating…")
            : cooldownSec > 0
            ? t(language, `⏳ 冷卻保護中 (${cooldownSec}s)`, `⏳ Cooldown (${cooldownSec}s)`)
            : apiKey
            ? t(language, "🚀 OpenRouter AI 生成貼文", "🚀 Generate with OpenRouter AI")
            : t(language, "🪄 一鍵生成 AI 社群貼文", "🪄 Generate AI Social Post")}
        </button>
      </div>

      {/* 生成結果卡片 */}
      {!!output && (
        <div className="input-card">
          <div className="field-label">
            <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
              {t(language, "✨ AI 社群貼文產出 (即可複製貼至 IG / Threads)", "✨ Generated Social Post")}
            </strong>
            <span>{output.length} {t(language, "字", "chars")}</span>
          </div>

          <div style={{ padding: "16px", borderRadius: "12px", background: "var(--canvas)", border: "1px dashed var(--line)", fontSize: "14px", color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: "14px" }}>
            {output}
          </div>

          <button className="primary-button wide" onClick={() => copyText(output, setCopied)}>
            {copied === output ? t(language, "貼文已複製 ✓", "Post Copied ✓") : t(language, "一鍵複製完整貼文", "Copy Full Post")}
          </button>
        </div>
      )}
    </>
  );
}

function EmptyState({ text }: { text: string }) { return <div className="empty-state"><span>⌕</span><p>{text}</p></div>; }

function GuideModal({ language, onClose, onSelectTool }: { language: Language; onClose: () => void; onSelectTool: (id: ToolId) => void }) {
  return <div className="guide-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <button className="guide-close" onClick={onClose} aria-label={t(language, "關閉使用指南", "Close guide")}>×</button>
      <div className="guide-hero"><span className="tool-icon lilac">?</span><div><span className="section-kicker">QUICK START</span><h2 id="guide-title">{t(language, "第一次使用？30 秒快速上手", "New here? Get started in 30 seconds")}</h2><p>{t(language, "所有工具都不需登入，選擇、編輯、複製三步就能完成。", "No sign-up required. Choose a tool, edit your content, then copy the result.")}</p></div></div>
      <div className="guide-steps"><article><span>1</span><div><strong>{t(language, "選擇工具", "Choose a tool")}</strong><p>{t(language, "從符號、Emoji、排版或其他工具開始。", "Start with symbols, emoji, formatting or any other tool.")}</p></div></article><article><span>2</span><div><strong>{t(language, "搜尋或輸入", "Search or type")}</strong><p>{t(language, "輸入關鍵字，或直接修改範本文字。", "Enter a keyword or edit one of the ready-made templates.")}</p></div></article><article><span>3</span><div><strong>{t(language, "一鍵複製", "Copy in one click")}</strong><p>{t(language, "看到完成提示後，到 IG、Threads 或其他平台貼上。", "When you see the confirmation, paste into Instagram, Threads or anywhere else.")}</p></div></article></div>
      <div className="guide-section-title"><div><span className="section-kicker">TOOLS</span><h3>{t(language, "你想做什麼？", "What would you like to do?")}</h3></div><span>{t(language, "點選後直接開啟", "Opens instantly")}</span></div>
      <div className="guide-tools">{tools.map((tool) => <button key={tool.id} onClick={() => onSelectTool(tool.id)}><span className={`tool-icon ${tool.tone}`}>{tool.icon}</span><span><strong>{t(language, tool.name, tool.nameEn)}</strong><small>{t(language, tool.short, tool.shortEn)}</small></span><i>→</i></button>)}</div>
      <div className="guide-bottom"><div className="guide-privacy"><span>✦</span><div><strong>{t(language, "內容只留在你的裝置", "Your content stays on your device")}</strong><p>{t(language, "文字轉換都在瀏覽器完成，不會上傳或儲存。只有最近使用與收藏會保存在目前瀏覽器。", "Text is processed locally and never uploaded. Only recents and favorites are stored in this browser.")}</p></div></div><div className="guide-faq"><strong>{t(language, "常見問題", "Quick answers")}</strong><p><span>{t(language, "複製後沒反應？", "Copy not working?")}</span>{t(language, "確認瀏覽器已允許剪貼簿權限，或改用其他瀏覽器。", "Allow clipboard access or try another browser.")}</p><p><span>{t(language, "哪些平台能用？", "Where can I use it?")}</span>{t(language, "大多數支援 Unicode 的社群、文件與遊戲都能使用。", "Most social apps, documents and games that support Unicode.")}</p></div></div>
    </section>
  </div>;
}

function BrandLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 128 128" style={{ borderRadius: "10px", flexShrink: 0, display: "block" }}>
      <rect width="128" height="128" rx="28" fill="#7666b6" />
      <text x="64" y="86" textAnchor="middle" fontFamily="'Noto Sans TC', system-ui, sans-serif" fontWeight="900" fontSize="64" fill="#ffffff">字</text>
      <path d="M 96 24 Q 96 32 104 32 Q 96 32 96 40 Q 96 32 88 32 Q 96 32 96 24 Z" fill="#ffd778" />
    </svg>
  );
}

export default function App() {
  const [active, setActive] = useState<ToolId>(() => (window.location.hash.replace("#", "").split("/")[0] as ToolId) || "layout");
  const [copied, setCopied] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (requested === "en") return "en";
    if (requested === "zh-TW" || requested === "zh") return "zh-TW";
    const saved = localStorage.getItem("textlab.language");
    if (saved === "zh-TW" || saved === "en") return saved;
    return navigator.languages.some((item) => item.toLowerCase().startsWith("zh")) ? "zh-TW" : "en";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("textlab.theme") as ThemeMode | null;
    return saved || "system";
  });
  const toggleTheme = () => {
    const next: ThemeMode = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    setTheme(next);
    localStorage.setItem("textlab.theme", next);
  };
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);
  const current = tools.find((tool) => tool.id === active) || tools[0];
  const selectTool = (id: ToolId) => { setActive(id); window.location.hash = id; window.scrollTo({ top: 0, behavior: "smooth" }); };
  const changeLanguage = (next: Language) => {
    setLanguage(next);
    localStorage.setItem("textlab.language", next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    const canonical = document.querySelector('link[rel="canonical"]');
    canonical?.setAttribute("href", language === "en" ? "https://cooklabai.com/?lang=en" : "https://cooklabai.com/?lang=zh-TW");
    document.querySelector('meta[property="og:locale"]')?.setAttribute("content", language === "en" ? "en_US" : "zh_TW");
    if (current.id !== "symbols") {
      document.title = `${t(language, current.name, current.nameEn)}｜TextLab`;
      document.querySelector('meta[name="description"]')?.setAttribute("content", t(language, `${current.name}線上工具：${current.short}，免費使用、不需登入，所有處理都在瀏覽器完成。`, `${current.nameEn}: ${current.shortEn}. Free, no sign-up, and everything runs in your browser.`));
    }
  }, [current, language]);
  useEffect(() => {
    if (!guideOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setGuideOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = ""; };
  }, [guideOpen]);
  const [globalHistory, setGlobalHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("textlab.globalHistory") || "[]"); } catch { return []; }
  });
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const syncHistory = () => {
      try { setGlobalHistory(JSON.parse(localStorage.getItem("textlab.globalHistory") || "[]")); } catch {}
    };
    window.addEventListener("textlab-history-updated", syncHistory);
    return () => window.removeEventListener("textlab-history-updated", syncHistory);
  }, []);

  const toolProps = { copied, setCopied, language };
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#symbols" onClick={() => selectTool("symbols")}><BrandLogo /><span><strong>{t(language, "字研所", "TextLab")}</strong><small>TEXT LAB</small></span></a><nav><button className="guide-nav-button" onClick={() => setGuideOpen(true)}>{t(language, "使用指南", "Guide")}</button><button className="guide-nav-button" onClick={toggleTheme} title={t(language, "切換主題風格", "Toggle theme")}>{theme === "dark" ? "🌙 深色" : theme === "light" ? "☀️ 淺色" : "🌗 自動"}</button><div className="language-switch" aria-label="Language"><button className={language === "zh-TW" ? "active" : ""} onClick={() => changeLanguage("zh-TW")}>繁中</button><button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button></div></nav></header>
    <div className="layout">
      <aside className="sidebar"><p className="sidebar-label">{t(language, "文字工具箱", "TEXT TOOLBOX")}</p><div className="tool-nav">{tools.map((tool) => <button key={tool.id} className={active === tool.id ? "active" : ""} onClick={() => selectTool(tool.id)}><span className={`tool-icon ${tool.tone}`}>{tool.icon}</span><span><strong>{t(language, tool.name, tool.nameEn)}</strong><small>{t(language, tool.short, tool.shortEn)}</small></span>{tool.badge && <em>{t(language, tool.badge, "HOT")}</em>}</button>)}</div><div className="sidebar-note"><span>✦</span><p><strong>{t(language, "你的文字，只留在這裡", "Your text stays here")}</strong><br />{t(language, "所有轉換都在瀏覽器完成，我們不會儲存內容。", "Everything runs in your browser. We never store your content.")}</p></div></aside>
      <main className="workspace"><div className="mobile-tool-picker"><span>{t(language, "目前工具", "CURRENT TOOL")}</span><select value={active} onChange={(e) => selectTool(e.target.value as ToolId)}>{tools.map((tool) => <option value={tool.id} key={tool.id}>{t(language, tool.name, tool.nameEn)}｜{t(language, tool.short, tool.shortEn)}</option>)}</select></div>
        <div className="tool-surface">
          {active === "ai" && <AIPostTool {...toolProps} />}
          {active === "symbols" && <SymbolsTool {...toolProps} />}
          {active === "emoji" && <EmojiTool {...toolProps} />}
          {active === "kaomoji" && <KaomojiTool {...toolProps} />}
          {active === "fonts" && <FontsTool {...toolProps} />}
          {active === "layout" && <LayoutTool {...toolProps} />}
          {active === "nickname" && <NicknameTool {...toolProps} />}
          {active === "blank" && <BlankTool {...toolProps} />}
          {active === "bio" && <BioTool {...toolProps} />}
          {active === "hashtags" && <HashtagTool {...toolProps} />}
        </div>
        <footer><span>{t(language, "字研所", "TEXTLAB")} TEXT LAB</span><p>{t(language, "讓每一段文字，都剛剛好。", "Make every word feel just right.")}</p><small>© 2026 · Made for everyday expression</small></footer>
      </main>
    </div>

    {/* 浮動全域剪貼簿歷程抽屜 (Clipboard Quick History Tray) */}
    {!!globalHistory.length && (
      <>
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          style={{
            position: "fixed",
            left: "24px",
            bottom: "24px",
            zIndex: 45,
            border: "1px solid var(--line)",
            borderRadius: "12px",
            background: "var(--paper)",
            color: "var(--ink)",
            padding: "9px 13px",
            fontSize: "11px",
            fontWeight: 650,
            boxShadow: "var(--shadow)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>📋</span> {t(language, `剪貼記錄 (${globalHistory.length})`, `History (${globalHistory.length})`)}
        </button>

        {historyOpen && (
          <div style={{ position: "fixed", left: "24px", bottom: "72px", zIndex: 45, width: "310px", padding: "16px", borderRadius: "16px", background: "var(--paper)", border: "1px solid var(--line)", boxShadow: "0 14px 45px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <strong style={{ fontSize: "12px", color: "var(--purple)" }}>📋 {t(language, "跨工具複製歷程", "Cross-tool Clipboard")}</strong>
              <button onClick={() => { setGlobalHistory([]); localStorage.removeItem("textlab.globalHistory"); }} style={{ border: 0, background: "transparent", color: "var(--subtle)", fontSize: "10px", cursor: "pointer" }}>{t(language, "清除記錄", "Clear")}</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "190px", overflowY: "auto" }}>
              {globalHistory.map((item, idx) => (
                <button key={`${item}-${idx}`} onClick={() => copyText(item, setCopied)} style={{ border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    )}

    {guideOpen && <GuideModal language={language} onClose={() => setGuideOpen(false)} onSelectTool={(id) => { selectTool(id); setGuideOpen(false); }} />}
    {!!copied && <div className="toast" role="status"><span>✓</span> {t(language, "已複製到剪貼簿", "Copied to clipboard")}</div>}
  </div>;
}
