import { useEffect, useMemo, useState } from "react";
import { popularSymbols, symbolGroups, totalSymbolCount } from "./data/symbols";

type ToolId = "symbols" | "emoji" | "kaomoji" | "fonts" | "layout" | "nickname" | "blank";

type Tool = {
  id: ToolId;
  name: string;
  short: string;
  icon: string;
  tone: string;
  badge?: string;
};

const tools: Tool[] = [
  { id: "symbols", name: "特殊符號", short: "搜尋與一鍵複製", icon: "✦", tone: "coral", badge: "熱門" },
  { id: "emoji", name: "Emoji", short: "分類、搜尋、最近使用", icon: "☺", tone: "yellow" },
  { id: "kaomoji", name: "顏文字", short: "搜尋與收藏", icon: "◡̈", tone: "lilac" },
  { id: "fonts", name: "特殊字體", short: "Unicode 字體轉換", icon: "Aa", tone: "mint" },
  { id: "layout", name: "社群排版", short: "IG／Threads 換行", icon: "¶", tone: "blue" },
  { id: "nickname", name: "暱稱產生器", short: "快速找到你的風格", icon: "@", tone: "pink" },
  { id: "blank", name: "空白文字", short: "產生與複製", icon: "□", tone: "sand" },
];

const emojiGroups: Record<string, string[]> = {
  常用: ["✨", "🤍", "🥹", "🫶", "🔥", "💫", "🌷", "📍", "🎀", "🪄", "🫧", "💭", "🧸", "🍀", "📸", "💌"],
  表情: ["😀", "🥰", "😍", "🥹", "😂", "😌", "😎", "🤭", "🫠", "😴", "🥳", "🤔", "😮", "😤", "😭", "😇"],
  手勢: ["👋", "🤞", "🫶", "🙌", "👏", "🤝", "👍", "👀", "💪", "✌️", "🤌", "🙏", "💅", "👉", "👈", "☝️"],
  食物: ["🍓", "🍒", "🍋", "🥐", "🍞", "🍰", "🍩", "🍪", "☕", "🧋", "🍵", "🍜", "🍣", "🍕", "🥗", "🍙"],
  自然: ["🌷", "🌸", "🌻", "🍀", "🌿", "☀️", "🌙", "⭐", "☁️", "🌈", "🌊", "🪐", "🦋", "🐚", "🍂", "❄️"],
};

const emojiKeywords: Record<string, string> = {
  "✨": "閃亮 星星 sparkles", "🤍": "白色 愛心 heart", "🥹": "感動 哭", "🫶": "愛心 手 love", "🔥": "火 熱門",
  "🌷": "花 鬱金香", "📍": "地點 定位", "🎀": "蝴蝶結", "📸": "相機 拍照", "💌": "情書 信",
  "☕": "咖啡", "🧋": "珍珠奶茶 飲料", "🌙": "月亮 晚安", "☀️": "太陽 晴天", "🍀": "幸運 四葉草",
};

const kaomojiGroups = [
  { name: "開心", keywords: "開心 可愛 happy", items: ["(◕‿◕)", "(｡•̀ᴗ-)✧", "٩(ˊᗜˋ*)و", "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "(๑˃ᴗ˂)ﻭ", "ヽ(•‿•)ノ"] },
  { name: "害羞", keywords: "害羞 shy", items: ["(⁄ ⁄•⁄ω⁄•⁄ ⁄)", "(〃ω〃)", "(⁄˃ᆺ˂)", "(„ಡωಡ„)", "(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)", "(*ﾉωﾉ)"] },
  { name: "難過", keywords: "難過 哭 sad cry", items: ["(╥﹏╥)", "(｡•́︿•̀｡)", "(っ˘̩╭╮˘̩)っ", "(ಥ﹏ಥ)", "(ノ_<。)", "(｡╯︵╰｡)"] },
  { name: "生氣", keywords: "生氣 angry", items: ["(╬ Ò﹏Ó)", "(¬_¬)", "(＃`Д´)", "ヽ( `д´*)ノ", "(•̀⤙•́)", "(눈_눈)"] },
  { name: "打招呼", keywords: "打招呼 hello bye", items: ["ヾ(＾-＾)ノ", "( ´ ▽ ` )ﾉ", "ヾ(☆▽☆)", "(｡･ω･)ﾉﾞ", "(￣▽￣)ノ", "ヾ(•ω•`)o"] },
  { name: "愛心", keywords: "愛心 喜歡 love", items: ["(♡˙︶˙♡)", "( ˘ ³˘)♥", "(づ￣ ³￣)づ", "(っ˘з(˘⌣˘ )", "(๑♡⌓♡๑)", "♡( ◡‿◡ )"] },
];

const nickAdjectives = ["奶油", "月光", "透明", "慵懶", "微甜", "宇宙", "午後", "小小", "霧灰", "草莓", "緩慢", "焦糖"];
const nickNouns = ["烤吐司", "小行星", "收信人", "漫遊者", "日記", "雲朵", "企鵝", "泡泡", "研究員", "底片", "栗子", "旅人"];

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
  { name: "等寬字", value: toRange(text, 0x1d670, 0x1d68a, 0x1d7f6) },
  { name: "全形", value: Array.from(text).map((c) => c === " " ? "　" : c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126 ? String.fromCharCode(c.charCodeAt(0) + 0xfee0) : c).join("") },
  { name: "圓圈", value: Array.from(text.toUpperCase()).map((c) => /[A-Z]/.test(c) ? String.fromCodePoint(0x24b6 + c.charCodeAt(0) - 65) : c).join("") },
];

function copyText(value: string, onCopied: (value: string) => void) {
  const done = () => {
    onCopied(value);
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

function ToolIntro({ tool }: { tool: Tool }) {
  return <div className="tool-heading">
    <span className={`tool-icon hero-icon ${tool.tone}`}>{tool.icon}</span>
    <div><span className="mini-label">ONLINE TOOL · 免費使用</span><h1>{tool.name}</h1><p>{tool.short}，不需登入、不會上傳你的文字。</p></div>
  </div>;
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <label className="search-box"><span>⌕</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /><kbd>⌘ K</kbd></label>;
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

function SymbolsTool({ copied, setCopied }: { copied: string; setCopied: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const initialCategory = window.location.hash.split("/")[1] || "all";
  const [category, setCategoryState] = useState(symbolGroups.some((group) => group.id === initialCategory) ? initialCategory : "all");
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.recentSymbols") || "[]"));
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.favoriteSymbols") || "[]"));
  const [selected, setSelected] = useState("");
  const groups = symbolGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !query || item.includes(query) || group.name.includes(query) || group.keywords.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter((group) => group.items.length && (query || category === "all" || group.id === category));
  const resultCount = groups.reduce((total, group) => total + group.items.length, 0);
  const selectedGroup = symbolGroups.find((group) => group.items.includes(selected));
  const activeGroup = symbolGroups.find((group) => group.id === category);

  useEffect(() => {
    document.title = activeGroup ? `${activeGroup.name}｜字研所 TextLab` : "特殊符號大全｜字研所 TextLab";
    const description = activeGroup?.description || `收錄 ${totalSymbolCount} 個特殊符號，支援分類搜尋、最近使用、收藏與一鍵複製。`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [activeGroup]);

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

  return <><ToolIntro tool={tools[0]} />
    <div className="symbol-summary"><div><strong>{totalSymbolCount}</strong><span>個精選符號</span></div><div><strong>{symbolGroups.length}</strong><span>個實用分類</span></div><p>從愛心、箭頭到數學與語言符號，都能快速找到並直接複製。</p></div>
    <SearchInput value={query} onChange={setQuery} placeholder="搜尋符號，例如：愛心、星星、打勾、數學…" />
    <div className="symbol-category-nav" aria-label="符號分類"><button className={category === "all" && !query ? "active" : ""} onClick={() => setCategory("all")}>全部</button>{symbolGroups.map((group) => <button className={category === group.id && !query ? "active" : ""} key={group.id} onClick={() => setCategory(group.id)}>{group.shortName}<small>{group.items.length}</small></button>)}</div>
    <div className="helper-row"><span>{query ? `搜尋「${query}」` : activeGroup?.description || "點一下複製，按愛心加入收藏"}</span><span>{resultCount} 個結果</span></div>
    {!query && category === "all" && <div className="personal-symbols">
      {!!recent.length && <section className="symbol-section"><div className="section-title-row"><div><span className="section-kicker">YOUR HISTORY</span><h2>最近使用</h2></div><button className="text-button" onClick={() => { setRecent([]); localStorage.removeItem("textlab.recentSymbols"); }}>清除</button></div><SymbolTiles items={recent} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>}
      {!!favorites.length && <section className="symbol-section"><div className="section-title-row"><div><span className="section-kicker">SAVED</span><h2>我的收藏</h2></div></div><SymbolTiles items={favorites} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>}
      <section className="symbol-section"><div className="section-title-row"><div><span className="section-kicker">QUICK PICKS</span><h2>熱門符號</h2></div></div><SymbolTiles items={popularSymbols} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>
    </div>}
    <div className="symbol-sections">{groups.map((group) => <section className="symbol-section" id={`symbol-${group.id}`} key={group.id}><div className="section-title-row symbol-title"><div><span className="section-kicker">{group.items.length} SYMBOLS</span><h2>{group.name}</h2><p>{group.description}</p></div><button className="share-category" onClick={() => copyText(`${window.location.origin}${window.location.pathname}#symbols/${group.id}`, setCopied)}>⌁ 複製分類連結</button></div><SymbolTiles items={group.items} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>)}</div>
    {!!selected && <aside className="symbol-detail" aria-label="已選符號資訊"><div className="selected-symbol">{selected}</div><div><span className="section-kicker">SYMBOL INFO</span><strong>{selectedGroup?.name || "特殊符號"}</strong><code>{symbolCodePoints(selected)}</code></div><button onClick={() => choose(selected)}>再次複製</button><button className={favorites.includes(selected) ? "saved" : ""} onClick={() => toggleFavorite(selected)}>{favorites.includes(selected) ? "♥ 已收藏" : "♡ 收藏"}</button><button className="detail-close" onClick={() => setSelected("")} aria-label="關閉符號資訊">×</button></aside>}
    {!groups.length && <EmptyState text="找不到這個符號，換個關鍵字試試看。" />}</>;
}

function EmojiTool({ copied, setCopied }: { copied: string; setCopied: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("常用");
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.recentEmoji") || "[]"));
  const source = query ? Array.from(new Set(Object.values(emojiGroups).flat())).filter((emoji) => emoji.includes(query) || (emojiKeywords[emoji] || "").includes(query)) : emojiGroups[category];
  const choose = (emoji: string) => { copyText(emoji, setCopied); const next = [emoji, ...recent.filter((x) => x !== emoji)].slice(0, 12); setRecent(next); localStorage.setItem("textlab.recentEmoji", JSON.stringify(next)); };
  return <><ToolIntro tool={tools[1]} /><SearchInput value={query} onChange={setQuery} placeholder="搜尋 Emoji，例如：花、咖啡、愛心…" />
    {!!recent.length && !query && <section className="compact-section"><div className="section-title-row"><h2>最近使用</h2><button className="text-button" onClick={() => { setRecent([]); localStorage.removeItem("textlab.recentEmoji"); }}>清除</button></div><div className="emoji-grid recent-grid">{recent.map((emoji) => <button key={emoji} onClick={() => choose(emoji)}>{emoji}</button>)}</div></section>}
    <div className="category-tabs">{Object.keys(emojiGroups).map((name) => <button className={category === name && !query ? "active" : ""} key={name} onClick={() => { setCategory(name); setQuery(""); }}>{name}</button>)}</div>
    <div className="emoji-grid large-grid">{source.map((emoji) => <button key={emoji} onClick={() => choose(emoji)} aria-label={`複製 ${emoji}`}>{emoji}<small>{copied === emoji ? "✓" : ""}</small></button>)}</div></>;
}

function KaomojiTool({ copied, setCopied }: { copied: string; setCopied: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem("textlab.kaomojiFavorites") || "[]"));
  const groups = kaomojiGroups.map((group) => ({ ...group, items: group.items.filter((item) => !query || item.includes(query) || group.name.includes(query) || group.keywords.includes(query)) })).filter((g) => g.items.length);
  const toggleFavorite = (item: string) => { const next = favorites.includes(item) ? favorites.filter((x) => x !== item) : [...favorites, item]; setFavorites(next); localStorage.setItem("textlab.kaomojiFavorites", JSON.stringify(next)); };
  return <><ToolIntro tool={tools[2]} /><SearchInput value={query} onChange={setQuery} placeholder="搜尋顏文字，例如：開心、害羞、生氣…" />
    {!!favorites.length && <section className="compact-section"><h2>我的收藏</h2><div className="kaomoji-grid">{favorites.map((item) => <KaomojiCard key={item} item={item} favorite copied={copied === item} onCopy={() => copyText(item, setCopied)} onFavorite={() => toggleFavorite(item)} />)}</div></section>}
    {groups.map((group) => <section className="compact-section" key={group.name}><h2>{group.name}</h2><div className="kaomoji-grid">{group.items.map((item) => <KaomojiCard key={item} item={item} favorite={favorites.includes(item)} copied={copied === item} onCopy={() => copyText(item, setCopied)} onFavorite={() => toggleFavorite(item)} />)}</div></section>)}</>;
}

function KaomojiCard({ item, favorite, copied, onCopy, onFavorite }: { item: string; favorite: boolean; copied: boolean; onCopy: () => void; onFavorite: () => void }) {
  return <div className="kaomoji-card"><button className="kaomoji-copy" onClick={onCopy}><strong>{item}</strong><small>{copied ? "已複製 ✓" : "點擊複製"}</small></button><button className={`heart-button ${favorite ? "saved" : ""}`} onClick={onFavorite} aria-label="收藏">{favorite ? "♥" : "♡"}</button></div>;
}

function FontsTool({ copied, setCopied }: { copied: string; setCopied: (v: string) => void }) {
  const [text, setText] = useState("hello studio");
  return <><ToolIntro tool={tools[3]} /><div className="input-card"><div className="field-label"><label htmlFor="font-input">輸入英文或數字</label><span>{text.length}/80</span></div><input id="font-input" className="large-input" maxLength={80} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type something…" /></div>
    <div className="result-header"><h2>轉換結果</h2><span>點擊任一款複製</span></div><div className="font-results">{fontVariants(text || "Preview").map((item) => <button key={item.name} onClick={() => copyText(item.value, setCopied)}><span className="result-name">{item.name}</span><strong>{item.value}</strong><span className="copy-mark">{copied === item.value ? "已複製 ✓" : "複製"}</span></button>)}</div></>;
}

function LayoutTool({ copied, setCopied }: { copied: string; setCopied: (v: string) => void }) {
  const [text, setText] = useState("今天也要記得，\n把喜歡的日常好好收集起來。\n\n慢慢來，也很好 ✦");
  const [style, setStyle] = useState("invisible");
  const result = useMemo(() => {
    const clean = text.trim().replace(/\n{3,}/g, "\n\n");
    if (style === "invisible") return clean.replace(/\n\n/g, "\n⠀\n");
    if (style === "dot") return clean.replace(/\n\n/g, "\n·\n");
    return clean;
  }, [text, style]);
  return <><ToolIntro tool={tools[4]} /><div className="editor-grid"><div className="input-card"><div className="field-label"><label htmlFor="layout-input">原始文字</label><span>{text.length} 字</span></div><textarea id="layout-input" value={text} onChange={(e) => setText(e.target.value)} /></div><div className="input-card result-card"><div className="field-label"><span>排版預覽</span><span>可直接貼到 IG／Threads</span></div><div className="preview-text">{result}</div></div></div>
    <div className="option-card"><span>空行樣式</span><div className="segmented">{[["invisible", "隱形空白"], ["dot", "中間點 ·"], ["plain", "一般換行"]].map(([id, label]) => <button key={id} className={style === id ? "active" : ""} onClick={() => setStyle(id)}>{label}</button>)}</div><button className="primary-button" onClick={() => copyText(result, setCopied)}>{copied === result ? "已複製 ✓" : "複製排版文字"}</button></div></>;
}

function NicknameTool({ copied, setCopied }: { copied: string; setCopied: (v: string) => void }) {
  const [seed, setSeed] = useState("小安");
  const [style, setStyle] = useState("日系清新");
  const [round, setRound] = useState(0);
  const results = useMemo(() => {
    const base = seed.trim() || "小安"; const offset = round % nickAdjectives.length;
    const decor = style === "可愛甜系" ? ["ෆ", "♡", "୨୧", "₊˚"] : style === "極簡質感" ? ["", "_", ".", "°"] : ["☁", "﹏", "𓂃", "✦"];
    return Array.from({ length: 8 }, (_, i) => `${decor[i % 4]}${nickAdjectives[(i + offset) % nickAdjectives.length]}${i % 2 ? base : nickNouns[(i + offset) % nickNouns.length]}${decor[(i + 1) % 4]}`);
  }, [seed, style, round]);
  return <><ToolIntro tool={tools[5]} /><div className="generator-card"><label>放入一個名字或關鍵字<input value={seed} maxLength={12} onChange={(e) => setSeed(e.target.value)} placeholder="例如：小安、咖啡、旅行" /></label><label>想要的風格<div className="category-tabs left-tabs">{["日系清新", "可愛甜系", "極簡質感"].map((name) => <button key={name} className={style === name ? "active" : ""} onClick={() => setStyle(name)}>{name}</button>)}</div></label><button className="primary-button" onClick={() => setRound((x) => x + 1)}>↻ 再產生一組</button></div><div className="nickname-grid">{results.map((name) => <button key={name} onClick={() => copyText(name, setCopied)}><strong>{name}</strong><span>{copied === name ? "已複製 ✓" : "複製"}</span></button>)}</div></>;
}

function BlankTool({ copied, setCopied }: { copied: string; setCopied: (v: string) => void }) {
  const [count, setCount] = useState(1); const blank = "ㅤ".repeat(count);
  return <><ToolIntro tool={tools[6]} /><div className="blank-card"><div className="blank-visual"><div className="blank-cursor" /><span>這裡有 {count} 個看不見的字元</span></div><label>空白長度<div className="stepper"><button onClick={() => setCount(Math.max(1, count - 1))}>−</button><strong>{count}</strong><button onClick={() => setCount(Math.min(30, count + 1))}>＋</button></div></label><button className="primary-button wide" onClick={() => copyText(blank, setCopied)}>{copied === blank ? "空白文字已複製 ✓" : "複製空白文字"}</button><p>適合用於 IG 精選名稱、遊戲暱稱、社群空白貼文。部分平台可能會過濾空白字元。</p></div></>;
}

function EmptyState({ text }: { text: string }) { return <div className="empty-state"><span>⌕</span><p>{text}</p></div>; }

export default function App() {
  const [active, setActive] = useState<ToolId>(() => (window.location.hash.replace("#", "").split("/")[0] as ToolId) || "symbols");
  const [copied, setCopied] = useState("");
  const current = tools.find((tool) => tool.id === active) || tools[0];
  const selectTool = (id: ToolId) => { setActive(id); window.location.hash = id; window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => {
    if (current.id !== "symbols") {
      document.title = `${current.name}｜字研所 TextLab`;
      document.querySelector('meta[name="description"]')?.setAttribute("content", `${current.name}線上工具：${current.short}，免費使用、不需登入，所有處理都在瀏覽器完成。`);
    }
  }, [current]);
  const toolProps = { copied, setCopied };
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#symbols" onClick={() => selectTool("symbols")}><span className="brand-mark">字</span><span><strong>字研所</strong><small>TEXT LAB</small></span></a><nav><button onClick={() => selectTool("symbols")}>所有工具</button><a href="#about">關於</a><span className="free-pill">完全免費</span></nav></header>
    <div className="layout">
      <aside className="sidebar"><p className="sidebar-label">文字工具箱</p><div className="tool-nav">{tools.map((tool) => <button key={tool.id} className={active === tool.id ? "active" : ""} onClick={() => selectTool(tool.id)}><span className={`tool-icon ${tool.tone}`}>{tool.icon}</span><span><strong>{tool.name}</strong><small>{tool.short}</small></span>{tool.badge && <em>{tool.badge}</em>}</button>)}</div><div className="sidebar-note"><span>✦</span><p><strong>你的文字，只留在這裡</strong><br />所有轉換都在瀏覽器完成，我們不會儲存內容。</p></div></aside>
      <main className="workspace"><div className="mobile-tool-picker"><span>目前工具</span><select value={active} onChange={(e) => selectTool(e.target.value as ToolId)}>{tools.map((tool) => <option value={tool.id} key={tool.id}>{tool.name}｜{tool.short}</option>)}</select></div>
        <div className="tool-surface">
          {active === "symbols" && <SymbolsTool {...toolProps} />}
          {active === "emoji" && <EmojiTool {...toolProps} />}
          {active === "kaomoji" && <KaomojiTool {...toolProps} />}
          {active === "fonts" && <FontsTool {...toolProps} />}
          {active === "layout" && <LayoutTool {...toolProps} />}
          {active === "nickname" && <NicknameTool {...toolProps} />}
          {active === "blank" && <BlankTool {...toolProps} />}
        </div>
        <footer id="about"><span>字研所 TEXT LAB</span><p>讓每一段文字，都剛剛好。</p><small>© 2026 · Made for everyday expression</small></footer>
      </main>
    </div>
    {!!copied && <div className="toast" role="status"><span>✓</span> 已複製到剪貼簿</div>}
  </div>;
}
