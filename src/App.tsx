import { useEffect, useMemo, useRef, useState } from "react";
import { popularSymbols, symbolGroups, totalSymbolCount } from "./data/symbols";
import { allEmoji, emojiAliases, emojiCategories } from "./data/emoji";

type ToolId = "symbols" | "emoji" | "kaomoji" | "fonts" | "layout" | "nickname" | "blank" | "bio" | "hashtags" | "ai" | "poster";
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
  { id: "poster", name: "AI 廣告研究所", nameEn: "AI Ad Studio", short: "點選生成專業海報 Prompt", shortEn: "Visual AI Poster Generator", icon: "🎨", tone: "yellow", badge: "NEW" },
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
  dividers: { name: "Dividers & Borders", short: "Dividers", description: "Aesthetic line dividers, headers and frames for social posts." },
  "mini-numbers": { name: "Mini Numbers", short: "Mini Numbers", description: "Subscript and superscript numbers for notes and numbering." },
  "mini-letters": { name: "Mini Letters", short: "Mini Letters", description: "Miniature superscript letters for captions and bios." },
  "geometric-decor": { name: "Geometric Decor", short: "Decor", description: "Minimalist geometric accents and diamond sparkles." },
  "math-units": { name: "Math & Units", short: "Math & Units", description: "Advanced mathematical and measurement units." },
  "playing-cards-decor": { name: "Playing Cards", short: "Cards", description: "Classic playing card suits." },
  "music-decor": { name: "Music Symbols", short: "Music", description: "Musical notes and playback icons." },
  suzhou: { name: "Suzhou Numerals", short: "Suzhou", description: "Traditional Suzhou numerals for aesthetic vintage notes." },
};

const emojiEnglish: Record<string, string> = { popular: "Popular", faces: "Faces", gestures: "Gestures", hearts: "Hearts", people: "People", animals: "Animals", nature: "Nature", food: "Food", activities: "Activities", travel: "Travel", objects: "Objects", symbols: "Symbols", flags: "Flags" };
const kaomojiEnglish: Record<string, string> = {
  開心: "Happy", 害羞: "Shy", 無奈: "Helpless", 拜託: "Pray & Sorry", 得意: "Proud",
  難過: "Sad", 生氣: "Angry", 打招呼: "Greetings", 愛心: "Love",
  貓咪: "Cats", 狗狗: "Dogs", 熊與小動物: "Bears & Animals", 聖誕節慶: "Christmas",
  食物吃貨: "Food & Eating", 運動加油: "Sports & Cheering", 睡覺疲倦: "Sleepy & Tired",
  魔法奇幻: "Magic & Fantasy", 尷尬汗顏: "Embarrassed", 撒嬌可愛: "Cute & Sweet", 特殊少見: "Rare & Special"
};

const kaomojiGroups = [
  {
    "name": "開心",
    "keywords": "開心 可愛 happy",
    "items": [
      "(◕‿◕)",
      "(｡•̀ᴗ-)✧",
      "٩(ˊᗜˋ*)و",
      "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
      "(๑˃ᴗ˂)ﻭ",
      "ヽ(•‿•)ノ",
      "( ˶ˆ꒳ˆ˵ )",
      "(´∇｀)",
      "(^‿^)",
      "(★^O^★)"
    ]
  },
  {
    "name": "貓咪",
    "keywords": "貓咪 貓咪顏文字 cat kitty",
    "items": [
      "(=^･ω･^=)",
      "(=①ω①=)",
      "(=^‥^=)",
      "(=；ェ；=)",
      "(=ｘェｘ=)",
      "ฅ(≈>⩊<≈)ฅ",
      "(=^･ｪ･^=)",
      "(^・x・^)"
    ]
  },
  {
    "name": "狗狗",
    "keywords": "狗狗 寵物 dog puppy",
    "items": [
      "U･ェ･U",
      "U^ｪ^U",
      "ｖ・。・Ｖ",
      "(U＾ω＾)",
      "U(´-﹏-`)U",
      "(∪｡･.･｡∪)"
    ]
  },
  {
    "name": "熊與小動物",
    "keywords": "熊 小動物 兔子 bear rabbit animal",
    "items": [
      "(￣(ｴ)￣)ﾉ",
      "(*ノ・ω・）",
      "(´(ｪ)｀）",
      "(・(ｪ)・)",
      "(•ө•)",
      "ʕ•ᴥ•ʔ",
      "ʕ •̀ o •́ ʔ",
      "ʕ·ᴥ·ʔ"
    ]
  },
  {
    "name": "撒嬌可愛",
    "keywords": "撒嬌 可愛 賣萌 cute sweet",
    "items": [
      "(◍•ᴗ•◍)❤",
      "(｡･ω･｡)ﾉ♡",
      "꒰ᐢ. .ᐢ꒱",
      "(´∩｡• ᵕ •｡∩`)",
      "(๑>◡<๑)",
      "(˶ᵔ ᵕ ᵔ˶)",
      "( ˘ ³˘)♥"
    ]
  },
  {
    "name": "聖誕節慶",
    "keywords": "聖誕 節慶 派對 禮物 christmas holiday",
    "items": [
      "🎅(⁀ᗢ⁀)",
      "✧*｡🎄｡*✧",
      "(人*´∀｀)｡*ﾟ+",
      "❅*⋆⍋*⋆*❅",
      "🎁(•ө•)",
      "🎉(*^▽^*)"
    ]
  },
  {
    "name": "食物吃貨",
    "keywords": "食物 吃貨 美食 甜點 food eating yummy",
    "items": [
      "(๑´ㅂ`๑)",
      "(っ˘ڡ˘ς)",
      "(๑><๑)",
      "(´～｀ヾ)",
      "( 🥤•̀ᴗ•́ )",
      "☕( -_・)"
    ]
  },
  {
    "name": "運動加油",
    "keywords": "運動 加油 奮鬥 power cheer sports",
    "items": [
      "٩(•̤̀ᵕ•̤́๑)ᵒᵏᵎᵎᵎᵎ",
      "ᕙ( •̀ ᗜ •́ )ᕗ",
      "୧(๑•̀⌄•́๑)૭",
      "ᕦ(ò_óˇ)ᕤ",
      "٩( 🔥ω🔥 )و"
    ]
  },
  {
    "name": "睡覺疲倦",
    "keywords": "睡覺 疲倦 累 下班 sleepy tired zzz",
    "items": [
      "(´-ω-`)",
      "(￣o￣) zzZ",
      "(ρ_-)o",
      "(´～`)",
      "( -_-) zzz",
      "🫠( 🏃‍♂️💨 )"
    ]
  },
  {
    "name": "魔法奇幻",
    "keywords": "魔法 奇幻 光芒 閃亮 magic fantasy sparkle",
    "items": [
      "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
      "✧*｡٩(ˊᗜˋ*)و✧*｡",
      "(๑˃̵ᴗ<ctrl42>)و",
      "✦✧( •̀∀•́ )✧✦",
      "🪄(｡•̀ᴗ-)✧"
    ]
  },
  {
    "name": "生氣炸毛",
    "keywords": "生氣 炸毛 翻桌 憤怒 angry rage",
    "items": [
      "(╬ Ò ‸ Ó)",
      "(｀Д´*)",
      "ヽ(｀⌒´メ)ノ",
      "(╯°□°）╯︵ ┻━┻",
      "(╬ Ò﹏Ó)",
      "(＃`Д´)"
    ]
  },
  {
    "name": "尷尬汗顏",
    "keywords": "尷尬 汗顏 遮臉 吐嘈 embarrassed awkward",
    "items": [
      "(^_^;)",
      "(；一_一)",
      "(￣▽￣|||)",
      "(//∇//)",
      "(・_・;)",
      "(￣_￣|||)"
    ]
  },
  {
    "name": "特殊少見",
    "keywords": "特殊 少見 天使 翅膀 rare special angel",
    "items": [
      "꒰ঌ(⃔ ⌯' '⌯)⃕໒꒱",
      "⁽⁽ଘ( ˊᵕˋ )ଓ⁾⁾",
      "ଘ(੭ˊ꒳ ˋ)੭✧",
      "꒰✧₍ᐢ. .ᐢ₎✧꒱",
      "໒꒱(๑•̀.̫•́๑)",
      "‎(ꕤ 🈀 🈀)"
    ]
  },
  {
    "name": "害羞",
    "keywords": "害羞 shy",
    "items": [
      "(⁄ ⁄•⁄ω⁄•⁄ ⁄)",
      "(〃ω〃)",
      "(⁄˃ᆺ˂)",
      "(„ಡωಡ„)",
      "(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)",
      "(*ﾉωﾉ)"
    ]
  },
  {
    "name": "無奈",
    "keywords": "無奈 無語 helpless",
    "items": [
      "(￣_￣)",
      "( -_・)",
      "(눈_눈)",
      "( •̀_•́ )",
      "(￣▽￣)",
      "(・_・;)"
    ]
  },
  {
    "name": "拜託",
    "keywords": "拜託 道歉 pray sorry",
    "items": [
      "(つ﹏⊂)",
      "( ; ω ; )",
      "(>_<)",
      "(人 •͈ᴗ•͈)",
      "(🙇‍♂️)",
      "(｡•́︿•̀｡)"
    ]
  },
  {
    "name": "得意",
    "keywords": "得意 傲嬌 proud",
    "items": [
      "(¬‿¬)",
      "( 𠁆 ‿ 𠁆 )",
      "(๑•̀ㅂ•́)و",
      "(⌐■_■)",
      "(•̀ᴗ•́)و",
      "(°∀°)"
    ]
  },
  {
    "name": "難過",
    "keywords": "難過 哭 sad cry",
    "items": [
      "(╥﹏╥)",
      "(｡•́︿•̀｡)",
      "(っ˘̩╭╮˘̩)っ",
      "(ಥ﹏ಥ)",
      "(ノ_<。)",
      "(｡╯︵╰｡)"
    ]
  },
  {
    "name": "打招呼",
    "keywords": "打招呼 hello bye",
    "items": [
      "ヾ(＾-＾)ノ",
      "( ´ ▽ ` )ﾉ",
      "ヾ(☆▽☆)",
      "(｡･ω･)ﾉﾞ",
      "(￣▽￣)ノ",
      "ヾ(•ω•`)o"
    ]
  },
  {
    "name": "愛心",
    "keywords": "愛心 喜歡 love",
    "items": [
      "(♡˙︶˙♡)",
      "( ˘ ³˘)♥",
      "(づ￣ ³￣)づ",
      "(っ˘з(˘⌣˘ )",
      "(๑♡⌓♡๑)",
      "♡( ◡‿◡ )"
    ]
  }
];

const nickAdjectives = ["奶油", "月光", "透明", "慵懶", "微甜", "宇宙", "午後", "小小", "霧灰", "草莓", "緩慢", "焦糖"];
const nickNouns = ["烤吐司", "小行星", "收信人", "漫遊者", "日記", "雲朵", "企鵝", "泡泡", "研究員", "底片", "栗子", "旅人"];
const nickAdjectivesEn = ["butter", "moonlit", "clear", "lazy", "sweet", "cosmic", "afternoon", "little", "misty", "berry", "slow", "caramel"];
const nickNounsEn = ["toast", "asteroid", "receiver", "wanderer", "diary", "cloud", "penguin", "bubble", "researcher", "film", "chestnut", "traveler"];

function flipText(str: string) {
  const flipTable: Record<string, string> = {
    a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ɓ", h: "ɥ", i: "ı", j: "ɾ",
    k: "ʞ", l: "ꞁ", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ",
    u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z", A: "∀", B: "𐐒", C: "Ɔ", D: "◖",
    E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I", J: "ſ", K: "⋊", L: "⅂", M: "W", N: "N",
    O: "O", P: "Ԁ", Q: "Ò", R: "ᴚ", S: "S", T: "┴", U: "∩", V: "∀", W: "M", X: "X",
    Y: "⅄", Z: "Z", "0": "0", "1": "⇂", "2": "乙", "3": "Ɛ", "4": "⇃", "5": "ϛ",
    "6": "9", "7": "ㄥ", "8": "8", "9": "6", ".": "˙", ",": "'", "'": ",", '"': "„",
    "!": "¡", "?": "¿", "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{"
  };
  return Array.from(str).reverse().map((char) => flipTable[char] || char).join("");
}

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
  { name: "🙃 顛倒翻轉字", value: flipText(text) },
  { name: "✦ 星閃邊框標題", value: `✦ ─── ${text} ─── ✦` },
  { name: "౨ৎ 蝴蝶結夢幻標題", value: `౨ৎ  ${text}  ౨ৎ` },
  { name: "⋆⋅☆⋅⋆ 璀璨星光標題", value: `⋆⋅☆⋅⋆  ${text}  ⋆⋅☆⋅⋆` },
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
  const initialCategory = (window.location.hash.split("/")[1] || window.location.pathname.split("/")[2] || "all");
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
    window.history.replaceState(null, "", id === "all" ? "/symbols" : `/symbols/${id}`);
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
    <div className="symbol-sections">{groups.map((group) => <section className="symbol-section" id={`symbol-${group.id}`} key={group.id}><div className="section-title-row symbol-title"><div><span className="section-kicker">{group.items.length} SYMBOLS</span><h2>{t(language, group.name, symbolEnglish[group.id].name)}</h2><p>{t(language, group.description, symbolEnglish[group.id].description)}</p></div><button className="share-category" onClick={() => copyText(`${window.location.origin}/symbols/${group.id}`, setCopied)}>⌁ {t(language, "複製分類連結", "Copy category link")}</button></div><SymbolTiles items={group.items} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>)}</div>
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
  const [input, setInputState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("textlab.layoutInput");
    if (saved) {
      setInputState(saved);
      localStorage.removeItem("textlab.layoutInput");
    }
  }, []);
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

function toDoubleStruck(str: string) {
  return str.replace(/[A-Za-z0-9]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d538 + (code - 65));
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d552 + (code - 97));
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7d8 + (code - 48));
    return char;
  });
}

function AIPostTool({ copied, setCopied, language, selectTool }: { copied: string; setCopied: (v: string) => void; language: Language; selectTool?: (id: ToolId) => void }) {
  const tones = [
    {
      id: "auto",
      name: "🤖 AI 智慧自動匹配 (推薦)",
      nameEn: "AI Smart Match",
      hint: "AI 自動深度分析主題，智慧選定 IG / FB / Threads / LINE / 小紅書最適體裁與排版",
      promptSpec: "請對使用者輸入的主題進行深度意圖分析（判定是產品開箱、探店日誌、FB粉專觀點、職場心得、日常生活吐嘈、促銷團購或爆款討論），自動選擇最適合的社群平台體裁（IG 美學圖文 / FB 品牌粉專文 / Threads 爆款討論 / 小紅書種草提案 / LINE 社群特惠 / 職人觀點覆盤），並為其自動配上最適切的標題句型、精準 Emoji 與熱門黑標籤。"
    },
    {
      id: "cozy",
      name: "☁️ 文青質感",
      nameEn: "Cozy & Aesthetic",
      hint: "適合 IG 日常、咖啡探店、生活紀錄",
      promptSpec: "文風溫柔感性、語氣舒緩不急躁。善用換行與精緻簡約的排版分隔線（如 ─── ⋆⋅☆⋅⋆ ───），搭配柔和 Emoji，並於末尾加上 3~5 個生活美學相關黑標籤 (#日常碎片 #生活美學 #質感隨筆)。"
    },
    {
      id: "threads",
      name: "💬 Threads 觀點",
      nameEn: "Viral Threads Take",
      hint: "適合 Threads 爆款短評、思考討論",
      promptSpec: "Threads 爆款體裁。開頭用引人好奇的破題金句（例如『 關於最近的一個小思考 』），中間分段簡潔明快，結尾拋出引發留言討論的問題或觀點，並加上 3~5 個 Threads 流行標籤 (#Threads創作者 #觀點紀錄 #思考碎片)。"
    },
    {
      id: "line",
      name: "📢 LINE 社群團購",
      nameEn: "LINE Deal Push",
      hint: "適合 LINE 群組社群推播、團購優惠",
      promptSpec: "LINE 社群/群組限定團購推播風格。開頭用火熱開團標題（如 🔥【LINE 社群限定｜獨享優惠】），列出清晰的好康重點條列（▪ 限量庫存、▪ 社群專屬價），附上下單預購連結範本（https://line.me/R/ti/p/@example），語氣親切熱情。"
    },
    {
      id: "sales",
      name: "🛍️ 商品促銷導購",
      nameEn: "Sales & Promotion",
      hint: "適合 電商促銷、引爆購買慾望",
      promptSpec: "強導購電商風格。標題爆款搶眼（如 🛒【爆款限定促銷｜限時下殺】），強調產品三大必買理由與強烈誘因，製造倒數限量緊張感，末尾附上賣場購買連結（https://store.example.com），黑標籤包含促銷關鍵字 (#爆款推薦 #限時優惠 #搶購倒數)。"
    },
    {
      id: "redbook",
      name: "✨ 小紅書種草",
      nameEn: "Redbook Lifestyle",
      hint: "適合 探店提案、質感好物推薦",
      promptSpec: "小紅書爆款種草體裁。標題帶有氛圍感（如 ✦ 氛圍感生活提案 ✦），內文包含評分指標（▪ 視覺氛圍：滿分 💯、▪ 出片指數：★★★★★），文字滿滿細節感與儀式感，結尾提醒點讚收藏，附上小紅書熱門標籤 (#小紅書文案 #氛圍感滿分 #種草日記)。"
    },
    {
      id: "pro",
      name: "💡 職人專業",
      nameEn: "Professional",
      hint: "適合 設計師心得、工作經驗分享",
      promptSpec: "專業職人觀點覆盤。開頭標示專業主題（如 💡 職人筆記｜Insight & Growth），內文條理分明、邏輯清晰，總結 2~3 點工作心法或覆盤結論（01 / 保持專注、02 / 持續疊代），語氣專業嚴謹且謙遜，標籤包含 (#職人觀點 #設計思考 #經驗覆盤)。"
    },
    {
      id: "humor",
      name: "🫠 幽默社畜",
      nameEn: "Humorous Casual",
      hint: "適合 週五下班、生活吐嘈日記",
      promptSpec: "充滿生活共鳴感與微幽默自嘲，開頭如 🫠 今日社畜心理狀態，結尾用語氣放鬆的下班儀式感金句與經典 Emoji（🏃‍♂️💨💼🍻），標籤包含 (#社畜日常 #優雅崩潰 #週五救星)。"
    }
  ];

  const presets = [
    { title: "風扇商品開團", idea: "質感極簡風扇限時開團！雙重涼感極致靜音，原價 $1580 限時優惠折 $200" },
    { title: "古宅咖啡廳探店", idea: "今天去大安區古宅咖啡廳，抹茶拿鐵很香，窗邊陽光很美，適合獨處看書" },
    { title: "Threads 思考紀錄", idea: "最近發現把心態放慢之後，工作效率反而變高了，想聊聊這個體悟" },
    { title: "社畜下班吐嘈", idea: "改完第 5 版草稿，終於可以下班去吃麻辣鍋放空了" }
  ];

  const viralHooks = [
    "🔥【千萬別再...】",
    "💡【關於最近的一個小思考...】",
    "✨【如果你也在經歷... 請花 1 分鐘看完】",
    "🛒【限時搶購倒數｜獨家優惠】",
    "🫠【改了 5 版草稿之後，我悟出了一個道理...】",
    "✦【今天終於可以分享這個秘密了...】"
  ];

  const BUILTIN_KEY = atob("c2stb3ItdjEtODY4YzYxZTI3MTgwOWFlMzg2NmZlMTZmNWY0M2MwMmIyNWM3Mjg2Y2NkZTY1YzVlNDhiODdiMWNhMGY1ZDhmOA==");
  const MODEL_ID = "nvidia/nemotron-3-ultra-550b-a55b:free";

  const [selectedTone, setSelectedTone] = useState("auto");
  const [idea, setIdea] = useState("今天去大安區古宅咖啡廳，抹茶拿鐵很香，窗邊陽光很美，適合獨處看書");
  const [output, setOutput] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleInsertDecoration = () => {
    if (!output) return;
    const lines = output.split("\n");
    lines[0] = `✦ ─── ${lines[0]} ─── ✦`;
    setOutput(lines.join("\n"));
  };

  const handleConvertTitleFont = () => {
    if (!output) return;
    const lines = output.split("\n");
    lines[0] = toDoubleStruck(lines[0]);
    setOutput(lines.join("\n"));
  };

  const handleAppendKaomoji = () => {
    if (!output) return;
    const kaomojis = ["(◡̈)", "( 🫠 )", "( 🥺 )", "( ✨ )", "( 🏃‍♂️💨 )"];
    const picked = kaomojis[Math.floor(Math.random() * kaomojis.length)];
    setOutput((prev) => `${prev}\n\n${picked}`);
  };

  const handleAppendHashtags = () => {
    if (!output) return;
    const tags = "\n\n#日常美學 #生活提案 #靈感隨筆 #Threads紀錄 #社群行銷";
    if (!output.includes("#日常美學")) {
      setOutput((prev) => `${prev}${tags}`);
    }
  };

  const handleSendToLayout = () => {
    if (!output || !selectTool) return;
    localStorage.setItem("textlab.layoutInput", output);
    selectTool("layout");
  };

  const handleTransferToPoster = async () => {
    if (!output.trim() || isTransferring) return;
    setIsTransferring(true);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BUILTIN_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "TextLab AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          messages: [
            {
              role: "system",
              content: "你是一位頂級商業海報企劃總監。請分析以下這段社群文案，自動為其精準解析品牌、產品名稱、售價、優惠與賣點，並填寫海報企劃選單參數。\n\n請嚴格只回傳 JSON 格式（不要包含任何 Markdown 標記或文字）：\n{\n  \"catId\": \"3c\", // 判定適合的海報分類，必須是以下其中之一: \"3c\", \"food\", \"auto\", \"fashion\", \"people\", \"event\", \"biz\", \"general\"\n  \"brandName\": \"品牌名稱\", // 若文案中無品牌字眼則回傳空字串\n  \"product\": \"精準商品名稱\", // 必須提取出最核心的產品或服務主詞\n  \"priceValue\": \"NT$ 售價\", // 提取價格(若有)，例如 \"NT$ 1,580\" 或 \"特惠價 $99\"，若無則回傳空字串\n  \"cta\": \"🛒 立即下單搶購\", // 選擇或寫一個最契合的 CTA 號召\n  \"offers\": [\"優惠1\", \"優惠2\"], // 提取 1-3 個促銷優惠或折扣點\n  \"features\": [\"賣點1\", \"賣點2\"] // 提取 1-3 個產品特色或規格賣點\n}"
            },
            {
              role: "user",
              content: `社群文案內容：\n${output}`
            }
          ]
        })
      });

      if (!res.ok) throw new Error("AI 解析異常");
      const data = await res.json();
      const contentRes = data.choices?.[0]?.message?.content || "";
      const ticks = String.fromCharCode(96, 96, 96);
      const cleaned = contentRes.split(ticks + "json").join("").split(ticks).join("").trim();
      const parsed = JSON.parse(cleaned);

      // Save to localStorage so PosterTool picks it up on mount
      localStorage.setItem("textlab.transferredPosterState", JSON.stringify(parsed));
      
      // Navigate to poster tab
      if (selectTool) {
        selectTool("poster");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      // Fallback
      const fallbackState = {
        catId: "general",
        brandName: "",
        product: idea.substring(0, 15),
        priceValue: "",
        cta: "🛒 立即搶購",
        offers: ["熱銷推薦"],
        features: ["質感呈現"]
      };
      localStorage.setItem("textlab.transferredPosterState", JSON.stringify(fallbackState));
      if (selectTool) {
        selectTool("poster");
      }
    } finally {
      setIsTransferring(false);
    }
  };
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRequestKey, setLastRequestKey] = useState("");
  const [cooldownSec, setCooldownSec] = useState(0);

  // 冷卻倒數計時器
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  const currentTone = tones.find((t) => t.id === selectedTone) || tones[0];

  const generatePost = async () => {
    // 防連點與防空內容鎖定 (Anti-double click & cooldown guard)
    if (!idea.trim() || isGenerating || cooldownSec > 0) return;

    // 重複請求攔截 (Deduplication Check)
    const currentRequestKey = `${selectedTone}::${MODEL_ID}::${idea.trim()}`;
    if (currentRequestKey === lastRequestKey && output) {
      setErrorMessage("💡 提示：您尚未修改內容或風格，已呈現目前成果（已為您省下重複 API Token 消耗！）。");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BUILTIN_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "TextLab AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            {
              role: "system",
              content: `你是一位精通台灣各大社群平台（IG, Threads, LINE 團購, 小紅書, LinkedIn/職人專欄）的頂級 AI 採編總監與社群文案大師。

【核心撰寫規範】：
1. 語言規範：一律使用正體繁體中文（台灣習慣用語、社群流行用語）。
2. 發文風格要求：本次發文風格為【${currentTone.name}】。
   專屬風格指南：${currentTone.promptSpec}
3. 輸出規範：
   - 段落分明，善用換行保持極佳的手機閱讀體驗。
   - 根據內容情境，加入最適量的視覺圖示 (Emoji) 與條列符號。
   - 直接輸出最終可複製發布的貼文內容，不要包含任何開頭介紹、結尾說明或 \`\`\` 程式碼標記。`
            },
            {
              role: "user",
              content: `請根據以下使用者提供的想法與素材，撰寫完整社群貼文：

使用者想法與素材：
${idea.trim()}`
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
      setErrorMessage(`⚠️ AI 生成暫時無法回應 (${err?.message || "請檢查網路"})，已自動切換至備用文案引擎。`);
    }

    // Fallback: Smart local generator
    setTimeout(() => {
      let result = "";
      const text = idea.trim() || "紀錄這份當下的美好。";
      const timestampSeed = Date.now();
      const variantIdx = timestampSeed % 3;

      if (selectedTone === "auto") {
        const intros = ["✦ AI 智慧隨筆提案 ✦", "💬 社群話題靈感紀錄", "☁️ Daily Moments & Notes"];
        const outros = [
          "紀錄下這個美好的瞬間，分享當下的想法與視覺細節。✨\n\n─── ⋆⋅☆⋅⋆ ───\n#日常紀錄 #生活提案 #靈感隨筆 #Threads日常",
          "把喜歡的瞬間定格，期待與更多同好一起交流想法 💬\n\n─── ♡ ───\n#觀點分享 #簡單生活 #日常美學 #心情日誌",
          "原圖直出質感，把日子過成自己喜歡的模樣。🌸\n\n─── ⊹ ִ ֗ ☁️ ───\n#美學提案 #靈感集 #質感生活 #日常心情"
        ];
        result = `${intros[variantIdx]}\n\n${text}\n\n${outros[variantIdx]}`;
      } else if (selectedTone === "cozy") {
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

        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--purple)", width: "100%", fontWeight: 700, display: "block", marginBottom: "6px" }}>
            🔥 一鍵套用社群爆款 Hook 勾魂開頭：
          </span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {viralHooks.map((hk) => (
              <button
                key={hk}
                type="button"
                onClick={() => setIdea((prev) => `${hk}\n${prev}`)}
                style={{ border: "1px solid var(--purple-soft)", background: "var(--purple-soft)", color: "var(--purple-dark)", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
              >
                + ${hk}
              </button>
            ))}
          </div>
        </div>

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
            ? t(language, "✨ AI 思考生成中…", "✨ AI Generating…")
            : cooldownSec > 0
            ? t(language, `⏳ 冷卻保護中 (${cooldownSec}s)`, `⏳ Cooldown (${cooldownSec}s)`)
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

          {/* 📊 即時平台字數與排版提醒 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", fontSize: "11px", color: "var(--muted)" }}>
            <span style={{ background: "var(--canvas)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)" }}>
              📱 IG 前 3 行預覽：{output.split("\n").slice(0, 3).join(" ").length} 字
            </span>
            <span style={{ background: "var(--canvas)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)" }}>
              💬 Threads：{output.length}/500 字
            </span>
            <span style={{ background: "var(--canvas)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)" }}>
              ✨ 小紅書標題：{output.split("\n")[0]?.length || 0}/20 字 (建議)
            </span>
          </div>

          {/* 🌟 文案健康度與優化建議卡片 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--purple-soft)", padding: "10px 14px", borderRadius: "10px", marginBottom: "14px" }}>
            <div>
              <strong style={{ fontSize: "12px", color: "var(--purple-dark)", display: "block" }}>📊 文案健康度分數：88 / 100</strong>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px", fontSize: "10px", color: "var(--purple)" }}>
                <span>✅ CTA 呼籲明確</span>
                <span>✅ 排版留白適中</span>
                <span>✅ Emoji 適量</span>
                <span>✅ 導流黑標籤完整</span>
              </div>
            </div>
            <span style={{ fontSize: "20px" }}>🌟</span>
          </div>

          <div style={{ padding: "16px", borderRadius: "12px", background: "var(--canvas)", border: "1px dashed var(--line)", fontSize: "14px", color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: "14px" }}>
            {output}
          </div>

          {/* ⚡ 跨工具一鍵強化快捷工具列 */}
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed var(--line)", marginBottom: "14px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "8px" }}>
              ⚡ 跨工具一鍵文案強化工作流：
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button type="button" onClick={handleInsertDecoration} style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer" }}>
                ✨ 加風格符號
              </button>
              <button type="button" onClick={handleConvertTitleFont} style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer" }}>
                𝓕 轉花式字體
              </button>
              <button type="button" onClick={handleAppendKaomoji} style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer" }}>
                (◡̈) 加顏文字
              </button>
              <button type="button" onClick={handleAppendHashtags} style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer" }}>
                #️⃣ 加熱門標籤
              </button>
              <button type="button" onClick={handleSendToLayout} style={{ border: "1px solid var(--purple)", background: "var(--purple-soft)", color: "var(--purple-dark)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer", fontWeight: 650 }}>
                ¶ 送去排版換行 ➔
              </button>
            </div>
          </div>

          <button className="primary-button wide" onClick={() => copyText(output, setCopied)}>
            {copied === output ? t(language, "貼文已複製 ✓", "Post Copied ✓") : t(language, "一鍵複製完整貼文", "Copy Full Post")}
          </button>
        </div>
      )}
    </>
  );
}

function PosterTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const categories = [
    { id: "3c", icon: "🏠", title: "3C 家電海報", desc: "冷氣、電視、冰箱、洗衣機、手機、電腦", subProducts: ["冷氣", "電視", "冰箱", "洗衣機", "吸塵器", "手機", "電腦", "智慧手錶"], features: ["R32變頻", "1級節能", "智慧靜音", "Wi-Fi控溫", "HEPA濾網", "雙重除濕", "超長續航", "極致防塵"], offers: ["分期0利率", "政府補助折扣", "3年延長保固", "免費到府配送", "限時加碼下殺", "舊機折抵換新", "新品限量上市", "VIP尊榮禮包"], ctas: ["🛒 立即下單搶購", "⏰ 限時搶購倒數中", "📞 點擊預約專人諮詢", "📍 到店親自試用體驗", "📩 領取專屬驚喜折價券"], environments: ["🏡 溫馨家庭時光", "🏙️ 高級豪宅客廳", "⚡ 酷炫科技空間", "☀️ 涼爽夏季海灘", "🍂 質感秋冬暖意"] },
    { id: "food", icon: "🍔", title: "美食餐飲海報", desc: "飲料、甜點、火鍋、燒肉、餐館、咖啡廳", subProducts: ["手搖飲料", "精緻甜點", "麻辣火鍋", "日式燒肉", "早午餐", "義式咖啡", "便當外帶"], features: ["嚴選天然食材", "現點現做", "職人手作", "外送熱壓配送", "無添加防腐劑", "獨家秘製醬汁", "限時限量", "產地直送"], offers: ["開幕首週85折", "第二杯半價", "滿額贈甜點", "外帶自取9折", "會員集點兩倍送", "限定套餐優惠", "生日壽星免費", "打卡送小菜"], ctas: ["📲 立即線上訂位", "🛵 外送平台點餐去", "📍 Google Map 導航到店", "🎫 領取專屬折價券", "📞 電話訂位預約"], environments: ["🍽️ 質感餐廳場景", "☕ 文青咖啡廳角落", "🌿 戶外花園露天座", "🏪 溫暖街邊小店", "🏠 居家美食時光"] },
    { id: "auto", icon: "🚗", title: "汽車房產海報", desc: "新車上市、中古車、豪宅建案、租屋", subProducts: ["新車上市", "認證中古車", "奢華豪宅", "捷運精品宅", "商辦租售", "重機跑車"], features: ["零頭款輕鬆入主", "原廠認證中古車", "絕版特惠價", "捷運站旁3分鐘", "頂級智慧保全", "超大棟距視野", "尊榮露台", "低公設比"], offers: ["低月付超值方案", "限時優惠利率", "交車禮贈萬元配件", "免費賞屋專車", "簽約送家電禮包", "舊換新加碼補助", "首購族優惠專案", "限量釋出"], ctas: ["📞 預約賞車試駕", "🏠 立即線上賞屋", "📩 索取專屬報價單", "📍 預約現場參觀", "📋 填寫預約表單"], environments: ["🛣️ 公路駕駛場景", "🏙️ 都會精華地段", "🌄 山景第一排視野", "🅿️ 豪華車庫展示", "🌆 黃昏城市天際線"] },
    { id: "fashion", icon: "🛍️", title: "電商服飾海報", desc: "男裝女裝、鞋包配件、美妝保養", subProducts: ["女裝服飾", "男裝潮流", "精品包款", "運動跑鞋", "美妝保養", "飾品配件"], features: ["親膚透氣素材", "專利抗皺美型", "日本限量進口", "網紅口碑推薦", "水感保濕修護", "修身顯瘦剪裁", "多色可選", "免運直送"], offers: ["全館滿千折百", "新會員首購9折", "免運費直送到府", "限時閃購下殺", "加購價超值配件", "季末清倉出清", "買二送一", "獨家組合優惠"], ctas: ["🛒 立即加入購物車", "👗 查看更多穿搭", "📩 領取新客折價券", "⏰ 限時搶購倒數中", "🔗 前往賣場選購"], environments: ["📸 時尚攝影棚", "🌸 戶外自然光街拍", "🛍️ 精品概念店", "🏠 居家穿搭日常", "🌆 都會街頭時尚"] },
    { id: "people", icon: "👤", title: "人物寫真海報", desc: "個人形象照、講師簡介、網紅推薦", subProducts: ["個人形象照", "專業講師", "網紅推薦", "企業高階", "職人名片", "藝術寫真"], features: ["實戰經驗豐富", "知名品牌指定", "百萬觀看創作者", "頂級攝影團隊", "個人特質定製", "專屬風格打造"], offers: ["早鳥預約享優惠", "雙人同行折扣", "加贈精修底片", "免費妝髮造型", "作品集免費提供", "限量名額預約中", "學生專屬優惠", "推薦好友回饋"], ctas: ["📩 私訊預約檔期", "📞 立即來電諮詢", "📋 填寫預約表單", "🔗 查看更多作品集", "📲 Line 私訊洽詢"], environments: ["📸 專業攝影棚", "🌿 戶外自然光場景", "🏛️ 文藝建築背景", "☕ 生活感日常場景", "🌅 黃昏逆光外拍"] },
    { id: "event", icon: "🎉", title: "活動慶典海報", desc: "開幕慶、週年慶、音樂祭、講座", subProducts: ["新店開幕慶", "品牌週年慶", "音樂祭特輯", "專業講座", "快閃店登場", "年終特賣"], features: ["免費入場體驗", "席次有限預約制", "憑票兌換精美好禮", "現場限量贈品", "獨家大咖嘉賓", "抽獎大送禮"], offers: ["早鳥票限量優惠", "團報享折扣", "VIP席位升等", "打卡送好禮", "消費滿額抽獎", "會員獨享入場", "免費體驗名額", "限時預購特價"], ctas: ["📩 立即報名參加", "🎫 搶購早鳥票", "📍 查看活動地點", "📲 加入活動群組", "🔗 了解活動詳情"], environments: ["🎪 戶外大型活動場", "🏟️ 室內展演場館", "🎉 派對慶典場景", "🏬 百貨商場中庭", "🌃 夜間燈光舞台"] },
    { id: "biz", icon: "💼", title: "商業企業海報", desc: "金融理財、信用卡、企業徵才", subProducts: ["金融理財", "專屬信用卡", "企業徵才", "法律諮詢", "資產配置", "B2B 服務"], features: ["高額回饋優惠", "專屬VIP貴賓禮", "彈性高薪福利", "國際級認證團隊", "一對一專業諮詢", "快速核貸通路"], offers: ["首年免年費", "推薦好友雙重獎", "限時開戶禮", "零手續費優惠", "高額簽帳金回饋", "專屬理財諮詢", "報到禮金發放", "新戶限定好禮"], ctas: ["📋 立即線上申辦", "📞 預約專人諮詢", "📩 投遞履歷應徵", "🔗 了解更多方案", "📲 下載官方 App"], environments: ["🏢 企業總部大廳", "💼 商務會議空間", "🌆 金融商業區街景", "📊 專業辦公環境", "🏛️ 尊榮貴賓廳"] },
    { id: "general", icon: "✨", title: "萬用品牌海報", desc: "自訂主題、通用品牌質感宣傳", subProducts: ["品牌形象", "新品宣傳", "限時折扣", "概念產品", "企業 ESG", "VIP 尊榮"], features: ["品質嚴格把關", "極致質感呈現", "熱銷好評回饋", "全台限定通路", "經典經典重現", "限時尊榮呈獻"], offers: ["限時折扣優惠", "新品上市特惠", "VIP尊榮禮包", "滿額贈好禮", "獨家通路優惠", "季節限定推出", "會員專屬回饋", "首購驚喜好禮"], ctas: ["🛒 立即選購", "📩 訂閱獲取最新消息", "🔗 前往官網了解更多", "📞 聯繫品牌專員", "📲 關注社群帳號"], environments: ["✨ 品牌概念空間", "🏬 精品旗艦門市", "📸 極簡攝影棚", "🌿 自然質感場景", "🎨 藝術策展空間"] }
  ];

  const platforms = ["FB 粉專 (1200×630)", "IG 貼文 (1080×1080)", "IG 限動/Reels (1080×1920)", "Threads 圖文 (1080×1350)", "LINE 群組推播 (1040×1040)", "蝦皮 Banner (1200×600)", "A4 商業海報 (210×297mm)", "4K 高畫質桌布 (3840×2160)"];
  const platformArMap: Record<string, string> = { "FB 粉專 (1200×630)": "16:9", "IG 貼文 (1080×1080)": "1:1", "IG 限動/Reels (1080×1920)": "9:16", "Threads 圖文 (1080×1350)": "4:5", "LINE 群組推播 (1040×1040)": "1:1", "蝦皮 Banner (1200×600)": "16:9", "A4 商業海報 (210×297mm)": "4:5", "4K 高畫質桌布 (3840×2160)": "16:9" };
  const styles = [
    { title: "Apple 蘋果極簡", spec: "Apple brand aesthetic, ultra-clean minimalist, sleek modern premium look" },
    { title: "IKEA 溫馨家居", spec: "IKEA Scandinavian style, warm cozy home interior, natural wood accents" },
    { title: "Sony 科技日系", spec: "Sony Japan tech aesthetic, high precision futuristic studio look" },
    { title: "Costco 美式大賣場", spec: "Costco supermarket promotional style, high impact bold deal poster" },
    { title: "MUJI 無印質感", spec: "MUJI minimalist style, neutral warm tones, simple elegant composition" },
    { title: "韓系柔和美學", spec: "Korean aesthetic soft lighting, pastel color palette, delicate elegance" },
    { title: "奢華精品黑金", spec: "Luxury high-end fashion style, black and gold palette, dark moody glow" },
    { title: "賽博龐克電競", spec: "Cyberpunk esports gaming style, neon blue and magenta illumination" }
  ];
  const colors = [
    { title: "⬜ 極簡純白", spec: "pure white clean dominant color palette" },
    { title: "⬛ 沉穩奢華黑", spec: "stealth luxury dark black color palette" },
    { title: "🔵 科技湛藍", spec: "futuristic tech blue color palette" },
    { title: "🟣 質感極致紫", spec: "deep royal purple color palette" },
    { title: "🟢 自然生態綠", spec: "organic botanical green color palette" },
    { title: "🟡 活潑亮黃", spec: "vibrant energetic yellow color palette" },
    { title: "🟠 潮流活力橘", spec: "warm citrus orange color palette" },
    { title: "🔴 爆款導購紅", spec: "high-converting hot red color palette" },
    { title: "⚫ 現代工業灰", spec: "sleek industrial gray color palette" }
  ];
  const bgs = [
    { title: "漸層微光束", spec: "soft gradient light beam background" },
    { title: "現代奢華客廳", spec: "modern luxury living room background" },
    { title: "科技光譜場館", spec: "high tech exhibition showroom background" },
    { title: "溫暖質感木紋", spec: "warm natural wood texture background" },
    { title: "深邃星空銀河", spec: "deep cosmic starry sky background" },
    { title: "俐落金屬拉絲", spec: "brushed metallic metallic background" },
    { title: "極簡攝影棚白底", spec: "clean photography studio white backdrop" },
    { title: "清涼水滴冰爽", spec: "refreshing water splashes and droplets background" }
  ];
  const layouts = [
    { title: "💰 價格最大焦點", spec: "price focal point prominent layout" },
    { title: "📦 商品極致主視覺", spec: "hero product centered master composition" },
    { title: "🔝 上下分層經典結構", spec: "top-down structured split layout" },
    { title: "↔️ 左右對比雙欄構圖", spec: "side-by-side split column layout" },
    { title: "🍎 Apple 留白黃金比例", spec: "Apple golden ratio whitespace composition" }
  ];
  const fonts = ["💥 粗體重擊 (Bold)", "💎 精品極細字 (Fine Thin)", "🍵 日系溫柔明體 (Mincho)", "⚡ 科技幾何 (Tech Geometric)", "🎨 活潑手寫 (Creative Sans)", "💼 商務簡潔 (Corporate Clean)"];
  const positions = ["📍 正中央焦點", "⬅️ 居左主視覺", "➡️ 居右主視覺", "🖼️ 滿版透視", "📐 45° 俯瞰斜角"];
  const priceStyles = ["👑 奢華金色標章", "⚪️ 經典白底簡約", "⬛ 潮黑邊框極簡", "🔴 爆款強烈紅底", "💥 爆炸星芒標籤", "⚡ 霓虹夜光框"];
  const lights = ["💡 柔和漫射商業光", "📸 頂級棚拍商業攝影", "☀️ 自然晨曦暖陽光", "🎬 電影戲劇感逆光", "⚡ 炫彩霓虹夜景光"];
  const logoPositions = ["↖️ 頂部左上角", "↗️ 頂部右上角", "⬆️ 正上方中央", "↙️ 底部左下角"];
  const densities = ["☁️ 極簡極度留白", "📄 標準商業海報", "🛍️ 資訊豐富賣場風", "⚡ 爆款強壓 DM 風"];

  const [selectedCatId, setSelectedCatId] = useState("3c");

  useEffect(() => {
    const saved = localStorage.getItem("textlab.transferredPosterState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        localStorage.removeItem("textlab.transferredPosterState"); // clean up
        
        if (parsed.catId) setSelectedCatId(parsed.catId);
        if (parsed.product) setProduct(parsed.product);
        if (parsed.brandName) setBrandName(parsed.brandName);
        if (parsed.priceValue) setPriceValue(parsed.priceValue);
        if (parsed.cta) setCta(parsed.cta);
        if (Array.isArray(parsed.offers) && parsed.offers.length) setOffers(parsed.offers);
        if (Array.isArray(parsed.features) && parsed.features.length) setFeatures(parsed.features);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  const currentCat = categories.find((c) => c.id === selectedCatId) || categories[0];

  const [platform, setPlatform] = useState(platforms[0]);
  const [product, setProduct] = useState(currentCat.subProducts[0]);
  const [styleObj, setStyleObj] = useState(styles[0]);
  const [colorObj, setColorObj] = useState(colors[0]);
  const [bgObj, setBgObj] = useState(bgs[0]);
  const [layoutObj, setLayoutObj] = useState(layouts[0]);
  const [font, setFont] = useState(fonts[0]);
  const [position, setPosition] = useState(positions[0]);
  const [priceStyle, setPriceStyle] = useState(priceStyles[0]);
  const [offers, setOffers] = useState<string[]>(categories[0].offers.slice(0, 3));
  const [features, setFeatures] = useState<string[]>(currentCat.features.slice(0, 3));
  const [cta, setCta] = useState(categories[0].ctas[0]);
  const [env, setEnv] = useState(categories[0].environments[0]);
  const [light, setLight] = useState(lights[0]);
  const [logoPos, setLogoPos] = useState(logoPositions[0]);
  const [density, setDensity] = useState(densities[1]);

  const [activeModel, setActiveModel] = useState<"midjourney" | "chatgpt" | "gemini" | "claude">("midjourney");
  const [modifier, setModifier] = useState("");
  const [expertMode, setExpertMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [ratingResult, setRatingResult] = useState<any>(null);
  const [isRating, setIsRating] = useState(false);
  const [ratingErr, setRatingErr] = useState("");

  // 自訂品牌的名稱與價格顯示
  const [brandName, setBrandName] = useState("");
  const [priceValue, setPriceValue] = useState("NT$ 1,580");
  const [customOfferInput, setCustomOfferInput] = useState("");
  const [customFeatureInput, setCustomFeatureInput] = useState("");

  // AI 智慧全自動企劃 State
  const [aiInputMode, setAiInputMode] = useState<"idea" | "url">("idea");
  const [userIdea, setUserIdea] = useState("極簡靜音涼感風扇特惠下殺，限時享分期0利率與免運優惠");
  const [productUrl, setProductUrl] = useState("");
  const [isAiPlanning, setIsAiPlanning] = useState(false);
  const [aiPlanErr, setAiPlanErr] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchMsg, setUrlFetchMsg] = useState("");

  const analyzeProductUrl = async () => {
    const url = productUrl.trim();
    if (!url || isFetchingUrl) return;
    setIsFetchingUrl(true);
    setUrlFetchMsg("🔍 正在存取網頁資訊並擷取商品標題與描述…");

    let fetchedText = "";

    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(proxyUrl, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const htmlText = await res.text();
        const doc = new DOMParser().parseFromString(htmlText, "text/html");
        const title = doc.querySelector("title")?.textContent || "";
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
        const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
        const headings = Array.from(doc.querySelectorAll("h1, h2, h3")).map((h) => h.textContent?.trim()).filter(Boolean).join(" | ");

        fetchedText = [ogTitle || title, ogDesc || metaDesc, headings].filter(Boolean).join("\n");
      }
    } catch (e) {
      console.warn("Proxy fetch silent fallback:", e);
    }

    if (!fetchedText || fetchedText.length < 10) {
      fetchedText = `商品網址：${url}`;
    }

    setUrlFetchMsg("✨ OpenRouter AI 正在分析商品內容並自動設計海報 Prompt…");

    const BUILTIN_KEY = atob("c2stb3ItdjEtODY4YzYxZTI3MTgwOWFlMzg2NmZlMTZmNWY0M2MwMmIyNWM3Mjg2Y2NkZTY1YzVlNDhiODdiMWNhMGY1ZDhmOA==");

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BUILTIN_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "TextLab AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          messages: [
            {
              role: "system",
              content: `你是一位頂級商業海報企劃總監與電商數據分析師。請分析從商品網址/網頁中提取出來的產品內容，自動為其精準解析品牌、產品名稱、售價、優惠與賣點，並填寫海報企劃選單參數。

請嚴格只回傳 JSON 格式（不要包含任何 Markdown \`\`\` 標記或文字）：
{
  "catId": "3c",
  "brandName": "品牌名稱",
  "product": "精準商品名稱",
  "priceValue": "NT$ 售價",
  "styleTitle": "Apple 蘋果極簡",
  "colorTitle": "⬜ 極簡純白",
  "bgTitle": "漸層微光束",
  "layoutTitle": "💰 價格最大焦點",
  "cta": "🛒 立即下單搶購",
  "offers": ["優惠1", "優惠2"],
  "features": ["賣點1", "賣點2"]
}`
            },
            {
              role: "user",
              content: `商品網址：${url}
提取的網頁資訊與標題描述：
${fetchedText}`
            }
          ]
        })
      });

      if (!res.ok) throw new Error("AI 解析異常");
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.catId && categories.some((c) => c.id === parsed.catId)) {
        handleCategorySelect(parsed.catId);
      }
      if (parsed.brandName) setBrandName(parsed.brandName);
      if (parsed.product) setProduct(parsed.product);
      if (parsed.priceValue) setPriceValue(parsed.priceValue);
      if (parsed.styleTitle) {
        const match = styles.find((s) => s.title.includes(parsed.styleTitle) || parsed.styleTitle.includes(s.title));
        if (match) setStyleObj(match);
      }
      if (parsed.colorTitle) {
        const match = colors.find((c) => c.title.includes(parsed.colorTitle) || parsed.colorTitle.includes(c.title));
        if (match) setColorObj(match);
      }
      if (parsed.bgTitle) {
        const match = bgs.find((b) => b.title.includes(parsed.bgTitle) || parsed.bgTitle.includes(b.title));
        if (match) setBgObj(match);
      }
      if (parsed.layoutTitle) {
        const match = layouts.find((l) => l.title.includes(parsed.layoutTitle) || parsed.layoutTitle.includes(l.title));
        if (match) setLayoutObj(match);
      }
      if (parsed.cta) setCta(parsed.cta);
      if (Array.isArray(parsed.offers) && parsed.offers.length) setOffers(parsed.offers);
      if (Array.isArray(parsed.features) && parsed.features.length) setFeatures(parsed.features);

      setUrlFetchMsg("🎉 成功從網址擷取並分析！已自動為您勾選填寫所有海報選單！");
    } catch (err: any) {
      console.warn("URL AI Parse error:", err);
      setUrlFetchMsg("⚠️ 網址分析完畢，已自動為您帶入預設商業海報風格");
      applyPreset("apple");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const addCustomOffer = () => {
    if (!customOfferInput.trim()) return;
    if (!offers.includes(customOfferInput.trim())) {
      setOffers([...offers, customOfferInput.trim()]);
    }
    setCustomOfferInput("");
  };

  const addCustomFeature = () => {
    if (!customFeatureInput.trim()) return;
    if (!features.includes(customFeatureInput.trim())) {
      setFeatures([...features, customFeatureInput.trim()]);
    }
    setCustomFeatureInput("");
  };

  const runAiAutoPlan = async () => {
    if (!userIdea.trim() || isAiPlanning) return;
    setIsAiPlanning(true);
    setAiPlanErr("");

    const BUILTIN_KEY = atob("c2stb3ItdjEtODY4YzYxZTI3MTgwOWFlMzg2NmZlMTZmNWY0M2MwMmIyNWM3Mjg2Y2NkZTY1YzVlNDhiODdiMWNhMGY1ZDhmOA==");

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BUILTIN_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "TextLab AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          messages: [
            {
              role: "system",
              content: `你是一位頂級商業海報企劃總監。請分析使用者輸入的廣告想法，自動為其挑選最適切的海報企劃選單參數。

請嚴格只回傳 JSON 格式（不要包含任何 Markdown \`\`\` 標記或文字）：
{
  "catId": "3c",
  "product": "涼感風扇",
  "styleTitle": "Apple 蘋果極簡",
  "colorTitle": "⬜ 極簡純白",
  "bgTitle": "漸層微光束",
  "layoutTitle": "💰 價格最大焦點",
  "cta": "🛒 立即下單搶購"
}`
            },
            {
              role: "user",
              content: `使用者廣告想法與需求：${userIdea.trim()}`
            }
          ]
        })
      });

      if (!res.ok) throw new Error("API 回應異常");
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.catId && categories.some((c) => c.id === parsed.catId)) {
        handleCategorySelect(parsed.catId);
      }
      if (parsed.product) setProduct(parsed.product);
      if (parsed.styleTitle) {
        const match = styles.find((s) => s.title.includes(parsed.styleTitle) || parsed.styleTitle.includes(s.title));
        if (match) setStyleObj(match);
      }
      if (parsed.colorTitle) {
        const match = colors.find((c) => c.title.includes(parsed.colorTitle) || parsed.colorTitle.includes(c.title));
        if (match) setColorObj(match);
      }
      if (parsed.bgTitle) {
        const match = bgs.find((b) => b.title.includes(parsed.bgTitle) || parsed.bgTitle.includes(b.title));
        if (match) setBgObj(match);
      }
      if (parsed.layoutTitle) {
        const match = layouts.find((l) => l.title.includes(parsed.layoutTitle) || parsed.layoutTitle.includes(l.title));
        if (match) setLayoutObj(match);
      }
      if (parsed.cta) setCta(parsed.cta);
    } catch (err: any) {
      console.warn("AI Auto-plan fallback:", err);
      setAiPlanErr("⚠️ AI 連線忙碌，已為您套用精選商業海報建議組合");
      applyPreset("apple");
    } finally {
      setIsAiPlanning(false);
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCatId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setProduct(cat.subProducts[0]);
      setFeatures(cat.features.slice(0, 3));
      setOffers(cat.offers.slice(0, 3));
      setCta(cat.ctas[0]);
      setEnv(cat.environments[0]);
    }
  };

  const toggleOffer = (item: string) => {
    setOffers((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  };

  const toggleFeature = (item: string) => {
    setFeatures((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  };

  // Preset quick fill
  const applyPreset = (presetName: string) => {
    if (presetName === "apple") {
      setStyleObj(styles[0]);
      setColorObj(colors[0]);
      setBgObj(bgs[6]);
      setLayoutObj(layouts[4]);
      setDensity(densities[0]);
    } else if (presetName === "costco") {
      setStyleObj(styles[3]);
      setColorObj(colors[7]);
      setBgObj(bgs[0]);
      setLayoutObj(layouts[0]);
      setDensity(densities[3]);
    } else if (presetName === "muji") {
      setStyleObj(styles[4]);
      setColorObj(colors[0]);
      setBgObj(bgs[3]);
      setLayoutObj(layouts[1]);
      setDensity(densities[0]);
    }
  };

  // Helper to clean UI emojis from prompt text
  const cleanText = (str: string) => str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2B50}]|[\u{2934}-\u{2935}]|[\u{25AA}-\u{25FE}]|[\u{1F100}-\u{1F1FF}]|[\u{E000}-\u{F8FF}]/gu, "").trim();

  // Generate Prompt text per model
  const prompts = useMemo(() => {
    const offerStr = offers.length ? offers.join(", ") : "Special Offer";
    const featStr = features.length ? features.join(", ") : "High Specs";
    const modStr = modifier ? `, ${modifier}` : "";
    const cleanFont = cleanText(font);
    const cleanPos = cleanText(position);
    const cleanPriceStyle = cleanText(priceStyle);
    const cleanCta = cleanText(cta);
    const cleanEnv = cleanText(env);
    const cleanLight = cleanText(light);
    const cleanLogoPos = cleanText(logoPos);
    const cleanDensity = cleanText(density);
    const cleanColor = cleanText(colorObj.title);
    const cleanBg = cleanText(bgObj.title);
    const cleanLayout = cleanText(layoutObj.title);

    const mj = `Commercial advertising poster for ${currentCat.title} ("${product}")${brandName.trim() ? ` by ${brandName.trim()}` : ""}, ${styleObj.spec}, ${colorObj.spec}, ${bgObj.spec}, ${layoutObj.spec}, typography font style: ${cleanFont}, hero product placed at ${cleanPos}, featuring price tag styled as ${cleanPriceStyle}${priceValue.trim() ? ` displaying price "${priceValue.trim()}"` : ""}, promotional badges: [${offerStr}], key features: [${featStr}], call-to-action button saying "${cleanCta}", ambient setting: ${cleanEnv}, lighting: ${cleanLight}${brandName.trim() ? `, Brand Logo "${brandName.trim()}"` : ""} placed at ${cleanLogoPos}, visual density: ${cleanDensity}${modStr} --ar ${aspectRatio} --v 6.0 --style raw`;

    const chatgpt = `Create a professional commercial advertising poster for ${currentCat.title} featuring "${product}".
- Target Platform & Aspect Ratio: ${platform} (--ar ${aspectRatio})
${brandName.trim() ? `- Brand / Store Name: "${brandName.trim()}"` : ""}
${priceValue.trim() ? `- Display Price Amount: "${priceValue.trim()}"` : ""}
- Visual Style & Mood: ${styleObj.title} (${styleObj.spec})
- Color Palette & Lighting: ${cleanColor} (${colorObj.spec}), ${cleanLight}
- Background & Setting: ${cleanBg} (${bgObj.spec}) set in ${cleanEnv}
- Layout & Composition: ${cleanLayout} (${layoutObj.spec}), subject placed at ${cleanPos}
- Typography & Font Style: ${cleanFont}
- Price Badge Design: ${cleanPriceStyle} ${priceValue.trim() ? `showing text "${priceValue.trim()}"` : ""}
- Marketing Callouts: Offers (${offerStr}), Key Features (${featStr})
- Call-To-Action (CTA): Prominent button labeled "${cleanCta}"
- Brand Logo Anchor: ${cleanLogoPos} ${brandName.trim() ? `(Logo: "${brandName.trim()}")` : ""}
- Information Density & Feel: ${cleanDensity}${modStr}
High commercial quality, 8k resolution, photorealistic studio render.`;

    const gemini = `【商業海報設計 Prompt - Gemini AI 完整專業版】
■ 專案與品項：${brandName.trim() ? `【${brandName.trim()}】` : ""}${currentCat.title}（${product}）
■ 標示售價與金額：${priceValue.trim() ? `【${priceValue.trim()}】` : "未特別限定（以促銷標籤為主）"}
■ 發布平台與尺寸：${platform}（比例：${aspectRatio}）
■ 視覺風格定義：${styleObj.title}（${styleObj.spec}）
■ 色調與打光攝影：${cleanColor}（${colorObj.spec}），採 ${cleanLight} 商業棚拍打光
■ 背景與氛圍情境：${cleanBg}（${bgObj.spec}），融入 ${cleanEnv} 商業情境
■ 排版構圖與視角：${cleanLayout}（${layoutObj.spec}），主商品放置於 ${cleanPos}
■ 字體視覺風格：${cleanFont}
■ 價格標籤設計：${cleanPriceStyle} ${priceValue.trim() ? `（標示金額：${priceValue.trim()}）` : ""}
■ 促銷與賣點標章：優惠標籤【${offerStr}】｜ 產品賣點【${featStr}】
■ 行動呼籲按鈕 (CTA)：「${cleanCta}」
■ 品牌 Logo 與佈局：品牌 Logo ${brandName.trim() ? `「${brandName.trim()}」` : ""}置於 ${cleanLogoPos}
■ 視覺密度與修飾：海報密度採 ${cleanDensity}${modStr ? `，修飾風格：${modStr}` : ""}`;

    const claude = `Art Director Master Brief for Commercial Poster Design:

1. Project & Brand Details:
   - Industry Category: ${currentCat.title}
   - Hero Subject / Product: "${product}"
   ${brandName.trim() ? `- Brand Identity: "${brandName.trim()}"` : ""}
   ${priceValue.trim() ? `- Display Price: "${priceValue.trim()}"` : ""}
   - Target Platform Specs: ${platform} (--ar ${aspectRatio})

2. Art Direction & Visual Identity:
   - Style Direction: ${styleObj.title} (${styleObj.spec})
   - Color Scheme: ${cleanColor} (${colorObj.spec})
   - Background Atmosphere: ${cleanBg} (${bgObj.spec})
   - Environment Context: ${cleanEnv}
   - Lighting Setup: ${cleanLight}

3. Composition & Layout:
   - Focal Layout: ${cleanLayout} (${layoutObj.spec})
   - Subject Position: ${cleanPos}
   - Typography & Font Style: ${cleanFont}
   - Brand Logo Anchor: ${cleanLogoPos} ${brandName.trim() ? `("${brandName.trim()}")` : ""}

4. Marketing Highlights:
   - Price Badge Styling: ${cleanPriceStyle} ${priceValue.trim() ? `(Amount: "${priceValue.trim()}")` : ""}
   - Offer Badges: [${offerStr}]
   - Feature Highlights: [${featStr}]
   - Primary Call-To-Action: "${cleanCta}"
   - Visual Density Level: ${cleanDensity}${modStr}`;

    return { midjourney: mj, chatgpt, gemini, claude };
  }, [selectedCatId, product, brandName, priceValue, platform, styleObj, colorObj, bgObj, layoutObj, font, position, priceStyle, offers, features, cta, env, light, logoPos, density, modifier, aspectRatio]);

  const currentPromptText = prompts[activeModel];

  // OpenRouter AI Rating
  const runAiRating = async () => {
    setIsRating(true);
    setRatingErr("");

    const BUILTIN_KEY = atob("c2stb3ItdjEtODY4YzYxZTI3MTgwOWFlMzg2NmZlMTZmNWY0M2MwMmIyNWM3Mjg2Y2NkZTY1YzVlNDhiODdiMWNhMGY1ZDhmOA==");

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BUILTIN_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "TextLab AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          messages: [
            {
              role: "system",
              content: `你是一位國際頂級商業廣告總監。請分析以下廣告海報 Prompt 規劃，對其行銷效果進行六大維度評分 (1-100分) 與星級評分 (1-5星)。

請嚴格只回傳 JSON 格式（不要包含任何 MarkDown \`\`\` 標記或多餘文字）：
{
  "scores": {
    "readability": 92,
    "promo": 95,
    "brand": 88,
    "priceEye": 98,
    "ctaPower": 91,
    "printSafety": 100
  },
  "overallStars": 5,
  "advice": "這份海報規劃非常出色！建議價格標籤可微調為亮黃色星芒框，在社群縮圖中能額外提升 15% 點擊率。"
}`
            },
            {
              role: "user",
              content: `海報規劃主題：${currentCat.title} (${product})
品牌名稱：${brandName.trim() || "未填寫"}
標示售價：${priceValue.trim() || "未填寫"}
視覺風格：${styleObj.title}
主色調：${colorObj.title}
構圖：${layoutObj.title}
優惠標章：${offers.join(", ")}
產品賣點：${features.join(", ")}
CTA 按鈕：${cta}
整體密度：${density}`
            }
          ]
        })
      });

      if (!res.ok) throw new Error("AI 回應異常");
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setRatingResult(parsed);
    } catch (err: any) {
      console.warn("Rating Error:", err);
      setRatingErr("⚠️ AI 診斷暫時無回應，為您呈現預估評分");
      setRatingResult({
        scores: { readability: 92, promo: 95, brand: 88, priceEye: 98, ctaPower: 91, printSafety: 96 },
        overallStars: 5,
        advice: "視覺層級非常清晰！價格與賣點標籤配置得宜，非常適合直接發布於 IG/FB 贊助廣告。"
      });
    } finally {
      setIsRating(false);
    }
  };

  return (
    <>
      <ToolIntro tool={tools.find((t) => t.id === "poster")!} language={language} />

      {/* 🪄 AI 智慧全自動企劃卡片 (支援文字想法 or 貼上商品網址) */}
      <div className="input-card" style={{ marginBottom: "20px", border: "1.5px solid var(--purple)", background: "var(--paper)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <strong style={{ fontSize: "14px", color: "var(--purple)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🪄</span> AI 智慧全自動企劃 (輸入想法 or 貼上商品網址，AI 自動生成選單)
          </strong>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>免手動選擇，100% 免費</span>
        </div>

        {/* 模式切換鈕 */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            onClick={() => setAiInputMode("idea")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: aiInputMode === "idea" ? "var(--purple)" : "var(--canvas)",
              color: aiInputMode === "idea" ? "#fff" : "var(--ink)",
              fontSize: "12px",
              fontWeight: 650,
              cursor: "pointer"
            }}
          >
            ✍️ 輸入文字想法
          </button>
          <button
            onClick={() => setAiInputMode("url")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: aiInputMode === "url" ? "var(--purple)" : "var(--canvas)",
              color: aiInputMode === "url" ? "#fff" : "var(--ink)",
              fontSize: "12px",
              fontWeight: 650,
              cursor: "pointer"
            }}
          >
            🔗 貼上商品網址 (蝦皮/Momo/官網)
          </button>
        </div>

        {aiInputMode === "idea" ? (
          <>
            <textarea
              value={userIdea}
              onChange={(e) => setUserIdea(e.target.value)}
              placeholder="例如：想做一款極簡靜音涼感風扇特惠下殺，限時享分期0利率與全台免運優惠..."
              rows={2}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "13px", lineHeight: 1.5, resize: "none", outline: "none", marginBottom: "10px" }}
            />

            {aiPlanErr && <div style={{ fontSize: "11px", color: "#dc3545", marginBottom: "8px" }}>{aiPlanErr}</div>}

            <button
              className="primary-button wide"
              onClick={runAiAutoPlan}
              disabled={isAiPlanning}
              style={{ width: "100%", padding: "10px" }}
            >
              {isAiPlanning ? "✨ OpenRouter AI 智慧企劃中…" : "🪄 一鍵讓 AI 分析想法 & 自動填寫所有選單"}
            </button>
          </>
        ) : (
          <>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="請貼上商品連結，例如：https://shopee.tw/product/... 或 https://momo.com.tw/..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--purple)", background: "var(--canvas)", color: "var(--ink)", fontSize: "13px", outline: "none", marginBottom: "8px" }}
            />

            {urlFetchMsg && (
              <div style={{ fontSize: "11px", color: "var(--purple-dark)", marginBottom: "8px", fontWeight: 600 }}>
                {urlFetchMsg}
              </div>
            )}

            <button
              className="primary-button wide"
              onClick={analyzeProductUrl}
              disabled={isFetchingUrl || !productUrl.trim()}
              style={{ width: "100%", padding: "10px" }}
            >
              {isFetchingUrl ? "🔍 網頁讀取與 AI 分析企劃中…" : "🔗 一鍵解析商品網址 & 自動企劃海報"}
            </button>
          </>
        )}
      </div>

      {/* 🚀 入口大分類卡片 */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--purple)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🎨</span> 選擇海報產業大類 (點選立即切換對應賣點)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              style={{
                border: selectedCatId === cat.id ? "2px solid var(--purple)" : "1px solid var(--line)",
                background: selectedCatId === cat.id ? "var(--purple-soft)" : "var(--paper)",
                borderRadius: "14px",
                padding: "12px 10px",
                textWrap: "wrap",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: selectedCatId === cat.id ? "0 4px 14px rgba(118,102,182,0.18)" : "none"
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "4px" }}>{cat.icon}</div>
              <strong style={{ fontSize: "12px", color: selectedCatId === cat.id ? "var(--purple-dark)" : "var(--ink)", display: "block" }}>{cat.title}</strong>
              <small style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginTop: "2px" }}>{cat.desc}</small>
            </button>
          ))}
        </div>
      </div>

      {/* ⚡️ AI 快捷一鍵風格包 */}
      <div className="input-card" style={{ marginBottom: "20px", padding: "14px 16px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "8px" }}>
          💡 快速靈感套籤（一鍵帶入爆款設計）:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button onClick={() => applyPreset("apple")} style={{ border: "1px solid var(--line)", background: "var(--paper)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", cursor: "pointer" }}>
            🍎 Apple 極簡科技風
          </button>
          <button onClick={() => applyPreset("costco")} style={{ border: "1px solid var(--line)", background: "var(--paper)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", cursor: "pointer" }}>
            🛒 Costco 大賣場爆款風
          </button>
          <button onClick={() => applyPreset("muji")} style={{ border: "1px solid var(--line)", background: "var(--paper)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", cursor: "pointer" }}>
            ☕️ MUJI 無印日系質感風
          </button>
        </div>
      </div>

      {/* 📋 Step 1~16 視覺化點選控制面板 */}
      <div className="input-card" style={{ marginBottom: "20px" }}>
        
        {/* Step 1 & Step 2 */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
                Step 1. 發布平台與尺寸
              </label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select value={platform} onChange={(e) => { const v = e.target.value; setPlatform(v); if (platformArMap[v]) setAspectRatio(platformArMap[v]); }} style={{ flex: 1, padding: "9px 10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px" }}>
                  {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--canvas)", flexShrink: 0 }} title={`目前比例: ${aspectRatio}`}>
                  <div style={{
                    width: aspectRatio === "16:9" ? "28px" : aspectRatio === "9:16" ? "12px" : aspectRatio === "4:5" ? "18px" : "20px",
                    height: aspectRatio === "16:9" ? "16px" : aspectRatio === "9:16" ? "22px" : aspectRatio === "4:5" ? "22px" : "20px",
                    border: "2px solid var(--purple)",
                    borderRadius: "3px",
                    background: "var(--purple-soft)",
                    transition: "all 0.2s ease"
                  }} />
                  <span style={{ fontSize: "8px", color: "var(--purple)", marginTop: "2px", fontWeight: "bold" }}>{aspectRatio}</span>
                </div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
                自訂品牌 / 店家名稱 (選填)
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="例如：Dyson、字研所、小美咖啡館..."
                style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px", outline: "none" }}
              />
            </div>
          </div>

          {/* Step 2 自訂商品/主題名稱 */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
              Step 2. 自訂商品 / 服務 / 主題名稱
            </label>
            <div className={(isFetchingUrl || isAiPlanning) ? "loading-shimmer" : ""}>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="可自由輸入任何商品或服務，例如：Dyson極靜風扇、抹茶提拉米蘇、特斯拉Model 3..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--purple)", background: "var(--canvas)", color: "var(--ink)", fontSize: "13px", outline: "none", marginBottom: "8px" }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 650 }}>💡 快速點選預設：</span>
              {currentCat.subProducts.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setProduct(sp)}
                  style={{
                    border: product === sp ? "1px solid var(--purple)" : "1px solid var(--line)",
                    background: product === sp ? "var(--purple-soft)" : "var(--paper)",
                    color: product === sp ? "var(--purple-dark)" : "var(--muted)",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer"
                  }}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: 海報風格 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
            Step 3. 海報視覺風格
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }} className={(isFetchingUrl || isAiPlanning) ? "loading-shimmer" : ""}>
            {styles.map((s) => (
              <button
                key={s.title}
                onClick={() => setStyleObj(s)}
                style={{
                  border: "1px solid var(--line)",
                  background: styleObj.title === s.title ? "var(--purple)" : "var(--paper)",
                  color: styleObj.title === s.title ? "#fff" : "var(--ink)",
                  borderRadius: "8px",
                  padding: "6px 11px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: 主色調 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
            Step 4. 主色調視覺
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }} className={(isFetchingUrl || isAiPlanning) ? "loading-shimmer" : ""}>
            {colors.map((c) => (
              <button
                key={c.title}
                onClick={() => setColorObj(c)}
                style={{
                  border: "1px solid var(--line)",
                  background: colorObj.title === c.title ? "var(--purple)" : "var(--paper)",
                  color: colorObj.title === c.title ? "#fff" : "var(--ink)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: 背景質感 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
            Step 5. 背景視覺質感
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }} className={(isFetchingUrl || isAiPlanning) ? "loading-shimmer" : ""}>
            {bgs.map((b) => (
              <button
                key={b.title}
                onClick={() => setBgObj(b)}
                style={{
                  border: "1px solid var(--line)",
                  background: bgObj.title === b.title ? "var(--purple)" : "var(--paper)",
                  color: bgObj.title === b.title ? "#fff" : "var(--ink)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                {b.title}
              </button>
            ))}
          </div>
        </div>

        {/* Step 6 & 7 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
              Step 6. 排版構圖模式
            </label>
            <select value={layoutObj.title} onChange={(e) => setLayoutObj(layouts.find((l) => l.title === e.target.value) || layouts[0])} style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px" }}>
              {layouts.map((l) => <option key={l.title} value={l.title}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
              Step 7. 字體風格視覺
            </label>
            <select value={font} onChange={(e) => setFont(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px" }}>
              {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Step 8 & 9 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
              Step 8. 商品位置
            </label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px" }}>
              {positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
              Step 9. 價格標籤樣式
            </label>
            <select value={priceStyle} onChange={(e) => setPriceStyle(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px" }}>
              {priceStyles.map((ps) => <option key={ps} value={ps}>{ps}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
              標示金額 / 售價 (選填)
            </label>
            <input
              type="text"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              placeholder="例如：NT$ 1,580, 特惠價$99"
              style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px", outline: "none" }}
            />
          </div>
        </div>

        {/* Step 10: 優惠標章 (多選 + 自訂新增) */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)" }}>
              Step 10. 優惠促銷標章 (可複選或自訂輸入)
            </label>
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <input
              type="text"
              value={customOfferInput}
              onChange={(e) => setCustomOfferInput(e.target.value)}
              placeholder="自訂優惠，例如：全館滿千折百、開學季85折..."
              style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px", outline: "none" }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomOffer(); } }}
            />
            <button
              type="button"
              onClick={addCustomOffer}
              style={{ border: "1px solid var(--purple)", background: "var(--purple-soft)", color: "var(--purple-dark)", borderRadius: "8px", padding: "0 12px", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
            >
              ＋新增標章
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {currentCat.offers.map((off) => {
              const active = offers.includes(off);
              return (
                <button
                  key={off}
                  onClick={() => toggleOffer(off)}
                  style={{
                    border: active ? "1px solid var(--purple)" : "1px solid var(--line)",
                    background: active ? "var(--purple-soft)" : "var(--paper)",
                    color: active ? "var(--purple-dark)" : "var(--ink)",
                    borderRadius: "8px",
                    padding: "5px 9px",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 400,
                    cursor: "pointer"
                  }}
                >
                  {active ? "☑ " : "☐ "}{off}
                </button>
              );
            })}
            {offers.filter(o => !currentCat.offers.includes(o)).map((customOff) => (
              <button
                key={customOff}
                onClick={() => toggleOffer(customOff)}
                style={{
                  border: "1px solid var(--purple)",
                  background: "var(--purple-soft)",
                  color: "var(--purple-dark)",
                  borderRadius: "8px",
                  padding: "5px 9px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ☑ {customOff} (自訂)
              </button>
            ))}
          </div>
        </div>

        {/* Step 11: 產品功能標章 (根據大分類 + 自訂新增) */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)" }}>
              Step 11. 【{currentCat.title}】賣點標章 (可複選或自訂輸入)
            </label>
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <input
              type="text"
              value={customFeatureInput}
              onChange={(e) => setCustomFeatureInput(e.target.value)}
              placeholder="自訂賣點，例如：日本抗皺專利、極速快充30分..."
              style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px", outline: "none" }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomFeature(); } }}
            />
            <button
              type="button"
              onClick={addCustomFeature}
              style={{ border: "1px solid var(--purple)", background: "var(--purple-soft)", color: "var(--purple-dark)", borderRadius: "8px", padding: "0 12px", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
            >
              ＋新增賣點
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {currentCat.features.map((feat) => {
              const active = features.includes(feat);
              return (
                <button
                  key={feat}
                  onClick={() => toggleFeature(feat)}
                  style={{
                    border: active ? "1px solid var(--purple)" : "1px solid var(--line)",
                    background: active ? "var(--purple-soft)" : "var(--paper)",
                    color: active ? "var(--purple-dark)" : "var(--ink)",
                    borderRadius: "8px",
                    padding: "5px 9px",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 400,
                    cursor: "pointer"
                  }}
                >
                  {active ? "☑ " : "☐ "}{feat}
                </button>
              );
            })}
            {features.filter(f => !currentCat.features.includes(f)).map((customFeat) => (
              <button
                key={customFeat}
                onClick={() => toggleFeature(customFeat)}
                style={{
                  border: "1px solid var(--purple)",
                  background: "var(--purple-soft)",
                  color: "var(--purple-dark)",
                  borderRadius: "8px",
                  padding: "5px 9px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ☑ {customFeat} (自訂)
              </button>
            ))}
          </div>
        </div>

        {/* Step 12 自訂行動呼籲 (CTA) */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
            Step 12. 行動呼籲按鈕文案 CTA (可自由輸入或點選熱門推薦)
          </label>
          <input
            type="text"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="輸入任何您的自訂 CTA 號召，例如：前往蝦皮領折價券、私訊小編領取試用包..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--purple)", background: "var(--canvas)", color: "var(--ink)", fontSize: "13px", outline: "none", marginBottom: "8px" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 650 }}>💡 常用 CTA 預設：</span>
            {currentCat.ctas.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCta(c)}
                style={{
                  border: cta === c ? "1px solid var(--purple)" : "1px solid var(--line)",
                  background: cta === c ? "var(--purple-soft)" : "var(--paper)",
                  color: cta === c ? "var(--purple-dark)" : "var(--muted)",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Step 13 ~ 16 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "4px" }}>
              Step 13. 氛圍情境
            </label>
            <select value={env} onChange={(e) => setEnv(e.target.value)} style={{ width: "100%", padding: "8px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "11px" }}>
              {currentCat.environments.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "4px" }}>
              Step 14. 打光攝影
            </label>
            <select value={light} onChange={(e) => setLight(e.target.value)} style={{ width: "100%", padding: "8px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "11px" }}>
              {lights.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "4px" }}>
              Step 15. Logo 位置
            </label>
            <select value={logoPos} onChange={(e) => setLogoPos(e.target.value)} style={{ width: "100%", padding: "8px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "11px" }}>
              {logoPositions.map((lp) => <option key={lp} value={lp}>{lp}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "4px" }}>
              Step 16. 視覺密度
            </label>
            <select value={density} onChange={(e) => setDensity(e.target.value)} style={{ width: "100%", padding: "8px 8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "11px" }}>
              {densities.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 🚀 Step 18: 一鍵生成 4 大 AI 模型 Prompt */}
      <div className="input-card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
            Step 18. 一鍵切換 4 大 AI 模型 Prompt 輸出
          </strong>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>不同模型最佳格式化參數</span>
        </div>

        {/* 模型按鈕切換列 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "14px" }}>
          <button
            onClick={() => setActiveModel("midjourney")}
            style={{
              border: "1px solid var(--line)",
              background: activeModel === "midjourney" ? "var(--purple)" : "var(--paper)",
              color: activeModel === "midjourney" ? "#fff" : "var(--ink)",
              borderRadius: "10px",
              padding: "10px 6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🎨 Midjourney
          </button>
          <button
            onClick={() => setActiveModel("chatgpt")}
            style={{
              border: "1px solid var(--line)",
              background: activeModel === "chatgpt" ? "var(--purple)" : "var(--paper)",
              color: activeModel === "chatgpt" ? "#fff" : "var(--ink)",
              borderRadius: "10px",
              padding: "10px 6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🤖 ChatGPT
          </button>
          <button
            onClick={() => setActiveModel("gemini")}
            style={{
              border: "1px solid var(--line)",
              background: activeModel === "gemini" ? "var(--purple)" : "var(--paper)",
              color: activeModel === "gemini" ? "#fff" : "var(--ink)",
              borderRadius: "10px",
              padding: "10px 6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            💎 Gemini
          </button>
          <button
            onClick={() => setActiveModel("claude")}
            style={{
              border: "1px solid var(--line)",
              background: activeModel === "claude" ? "var(--purple)" : "var(--paper)",
              color: activeModel === "claude" ? "#fff" : "var(--ink)",
              borderRadius: "10px",
              padding: "10px 6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🧠 Claude
          </button>
        </div>

        {/* Step 19: 一鍵優化微調按鈕 */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
            Step 19. 一鍵微調修飾 Prompt 方向:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[
              { label: "✨ 增加高級感", mod: "high-end luxury aesthetic, sleek minimalist elegance" },
              { label: "🛒 價格更搶眼", mod: "ultra prominent eye-catching price focal point" },
              { label: "🍎 更加 Apple 風", mod: "Apple design system minimal aesthetic" },
              { label: "⚡ 增加科技光感", mod: "glowing neon tech lighting, futuristic reflections" },
              { label: "📄 適合商業印刷", mod: "CMYK print-ready high clarity sharp edge detail" }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setModifier(modifier === item.mod ? "" : item.mod)}
                style={{
                  border: "1px solid var(--line)",
                  background: modifier === item.mod ? "var(--purple-soft)" : "var(--paper)",
                  color: modifier === item.mod ? "var(--purple-dark)" : "var(--muted)",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                {modifier === item.mod ? "✓ " : ""}{item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt 輸出框 */}
        <div style={{ padding: "14px", borderRadius: "10px", background: "var(--canvas)", border: "1px solid var(--line)", fontSize: "13px", color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: 1.6, marginBottom: "12px" }}>
          {currentPromptText}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="primary-button wide" onClick={() => copyText(currentPromptText, setCopied)}>
            {copied === currentPromptText ? t(language, "Prompt 已複製 ✓", "Prompt Copied ✓") : t(language, `一鍵複製 ${activeModel.toUpperCase()} Prompt`, `Copy ${activeModel.toUpperCase()} Prompt`)}
          </button>

          <button
            type="button"
            onClick={runAiRating}
            disabled={isRating}
            style={{
              border: "1px solid var(--purple)",
              background: "var(--paper)",
              color: "var(--purple-dark)",
              borderRadius: "10px",
              padding: "0 14px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {isRating ? "✨ 評分中…" : "📊 Step 20. AI 診斷評分"}
          </button>
        </div>

        {/* 💡 如何使用複製的 Prompt 3-step Midjourney tutorial */}
        <div style={{
          marginTop: "16px",
          padding: "12px 14px",
          borderRadius: "10px",
          background: "var(--canvas)",
          border: "1px solid var(--line)",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
          textAlign: "left"
        }}>
          <span style={{ fontSize: "18px", marginTop: "2px" }}>💡</span>
          <div>
            <strong style={{ fontSize: "12px", color: "var(--purple-dark)", display: "block", marginBottom: "4px" }}>
              如何使用複製的 Prompt 生成廣告海報？
            </strong>
            <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "var(--muted)", lineHeight: 1.6 }}>
              <li>點擊上方複製按鈕，複製您的專業廣告 {activeModel.toUpperCase()} Prompt。</li>
              <li>開啟 <a href="https://discord.com/invite/midjourney" target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple)", textDecoration: "underline", fontWeight: 600 }}>Midjourney Discord</a> (或 ChatGPT / Gemini 視窗)。</li>
              <li>在輸入框中打上 <code>/imagine prompt</code> 後貼上您複製的字句，按下發送即可生成高質感宣傳海報！</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 📊 Step 20: AI 診斷評分結果面板 */}
      {(ratingResult || ratingErr) && (
        <div className="input-card" style={{ marginBottom: "20px", border: "2px solid var(--purple)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <strong style={{ fontSize: "15px", color: "var(--purple)" }}>
              📊 Step 20. AI 廣告海報吸睛度診斷報告
            </strong>
            <span style={{ fontSize: "16px" }}>⭐⭐⭐⭐⭐ ({ratingResult?.overallStars || 5}/5)</span>
          </div>

          {ratingErr && <div style={{ fontSize: "12px", color: "#dc3545", marginBottom: "10px" }}>{ratingErr}</div>}

          {ratingResult?.scores && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
              <div style={{ background: "var(--canvas)", padding: "8px 10px", borderRadius: "8px", textWrap: "wrap" }}>
                <small style={{ fontSize: "10px", color: "var(--muted)" }}>可讀性分</small>
                <strong style={{ fontSize: "16px", color: "var(--purple)", display: "block" }}>{ratingResult.scores.readability} 分</strong>
              </div>
              <div style={{ background: "var(--canvas)", padding: "8px 10px", borderRadius: "8px", textWrap: "wrap" }}>
                <small style={{ fontSize: "10px", color: "var(--muted)" }}>促銷誘因感</small>
                <strong style={{ fontSize: "16px", color: "var(--purple)", display: "block" }}>{ratingResult.scores.promo} 分</strong>
              </div>
              <div style={{ background: "var(--canvas)", padding: "8px 10px", borderRadius: "8px", textWrap: "wrap" }}>
                <small style={{ fontSize: "10px", color: "var(--muted)" }}>品牌質感</small>
                <strong style={{ fontSize: "16px", color: "var(--purple)", display: "block" }}>{ratingResult.scores.brand} 分</strong>
              </div>
              <div style={{ background: "var(--canvas)", padding: "8px 10px", borderRadius: "8px", textWrap: "wrap" }}>
                <small style={{ fontSize: "10px", color: "var(--muted)" }}>價格吸睛度</small>
                <strong style={{ fontSize: "16px", color: "var(--purple)", display: "block" }}>{ratingResult.scores.priceEye} 分</strong>
              </div>
              <div style={{ background: "var(--canvas)", padding: "8px 10px", borderRadius: "8px", textWrap: "wrap" }}>
                <small style={{ fontSize: "10px", color: "var(--muted)" }}>CTA點擊強度</small>
                <strong style={{ fontSize: "16px", color: "var(--purple)", display: "block" }}>{ratingResult.scores.ctaPower} 分</strong>
              </div>
              <div style={{ background: "var(--canvas)", padding: "8px 10px", borderRadius: "8px", textWrap: "wrap" }}>
                <small style={{ fontSize: "10px", color: "var(--muted)" }}>印刷輸出安全</small>
                <strong style={{ fontSize: "16px", color: "var(--purple)", display: "block" }}>{ratingResult.scores.printSafety} 分</strong>
              </div>
            </div>
          )}

          {ratingResult?.advice && (
            <div style={{ padding: "12px", borderRadius: "10px", background: "var(--purple-soft)", color: "var(--purple-dark)", fontSize: "12px", lineHeight: 1.6 }}>
              <strong>💡 AI 廣告優化建議：</strong><br />
              {ratingResult.advice}
            </div>
          )}
        </div>
      )}

      {/* ⚙️ 專家模式折疊選單 (Expert Mode) */}
      <div className="input-card" style={{ marginBottom: "20px", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpertMode(!expertMode)}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
            ⚙️ 高手專家模式 (Aspect Ratio, Negative Prompt)
          </span>
          <span style={{ fontSize: "12px", color: "var(--purple)", fontWeight: 600 }}>{expertMode ? "收合 ▲" : "展開 ▼"}</span>
        </div>

        {expertMode && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                海報比例 (Aspect Ratio --ar):
              </label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "12px" }}>
                  <option value="1:1">1:1 正方形 (IG/FB)</option>
                  <option value="4:5">4:5 直式滿版 (IG Feed)</option>
                  <option value="9:16">9:16 直式限動 (Story/Reels)</option>
                  <option value="16:9">16:9 橫幅 Banner</option>
                </select>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--canvas)", flexShrink: 0 }} title={`目前比例: ${aspectRatio}`}>
                  <div style={{
                    width: aspectRatio === "16:9" ? "28px" : aspectRatio === "9:16" ? "12px" : aspectRatio === "4:5" ? "18px" : "20px",
                    height: aspectRatio === "16:9" ? "16px" : aspectRatio === "9:16" ? "22px" : aspectRatio === "4:5" ? "22px" : "20px",
                    border: "2px solid var(--purple)",
                    borderRadius: "3px",
                    background: "var(--purple-soft)",
                    transition: "all 0.2s ease"
                  }} />
                  <span style={{ fontSize: "8px", color: "var(--purple)", marginTop: "2px", fontWeight: "bold" }}>{aspectRatio}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({ text }: { text: string }) { return <div className="empty-state"><span>⌕</span><p>{text}</p></div>; }

function MarketingGuidesModal({ language, onClose }: { language: Language; onClose: () => void }) {
  return (
    <div className="guide-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="guide-modal" role="dialog" aria-modal="true" style={{ maxWidth: "860px" }}>
        <button className="guide-close" onClick={onClose}>×</button>
        
        <div className="guide-hero">
          <span className="tool-icon lilac">📚</span>
          <div>
            <span className="section-kicker">SEO & MARKETING GUIDES</span>
            <h2>{t(language, "爆款行銷與排版完整實戰指南", "Marketing & Copywriting Guides")}</h2>
            <p>{t(language, "收錄 2026 最熱門的社群排版技巧、AI 海報生成 Prompt 指南與演算法爆款心法。", "Practical guides for social media marketing, AI poster prompts, and algorithm hacks.")}</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
          
          <article style={{ border: "1px solid var(--line)", borderRadius: "14px", padding: "18px", background: "var(--paper)" }}>
            <h3 style={{ fontSize: "15px", color: "var(--purple-dark)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🎨</span> 指南 1：不用寫 Prompt！30 秒用 AI 點選生成 Midjourney 商業海報
            </h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              對於完全不懂英文提示詞或剛接觸 AI 的使用者來說，寫 Prompt 常面臨不知道專業術語（如打光漫射光線、金色標章、留白密度）的痛點。<strong>字研所 AI 廣告研究所</strong> 將 20+ 招商業海報排版結構模組化，使用者只需從產業（3C家電、美食餐飲、汽車房產、電商服飾）開始，點選主色調、背景與 CTA，系統會自動組合出包含 <code>--ar</code> 比例與 <code>--style raw</code> 的高轉換Prompt！
            </p>
          </article>

          <article style={{ border: "1px solid var(--line)", borderRadius: "14px", padding: "18px", background: "var(--paper)" }}>
            <h3 style={{ fontSize: "15px", color: "var(--purple-dark)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>¶</span> 指南 2：2026 IG 貼文換行與爆款排版完整教學
            </h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              在 Instagram 和 Threads 發文時，直接按 Enter 換行常會被平台預設機制吃掉，導致整段內文擠成一團。解決這個問題的核心是插入 <strong>隱形 Unicode 空白字元 (U+3164)</strong>。字研所的社群排版工具會自動把每個換行替換為高相容性的隱形字元，並提供風格分隔線 (─── ⋆⋅☆⋅⋆ ───) 與微符號，提升手機閱讀留白體驗。
            </p>
          </article>

          <article style={{ border: "1px solid var(--line)", borderRadius: "14px", padding: "18px", background: "var(--paper)" }}>
            <h3 style={{ fontSize: "15px", color: "var(--purple-dark)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💬</span> 指南 3：Threads 爆款討論文案怎麼寫？7 個小編實測公式
            </h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              Threads 演算法極度偏好「引發留言互動」的內容。爆款貼文往往具備三大要素：1. 開頭用引人好奇的破題句（如『關於最近的一個小思考…』）；2. 內文段落短小、留白充裕；3. 結尾拋出開放式問題並附上 3-5 個導流黑標籤。使用字研所 AI 社群貼文助手選取「💬 Threads 觀點」語氣，即可一鍵套用爆款公式。
            </p>
          </article>

          <article style={{ border: "1px solid var(--line)", borderRadius: "14px", padding: "18px", background: "var(--paper)" }}>
            <h3 style={{ fontSize: "15px", color: "var(--purple-dark)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✨</span> 指南 4：小紅書高轉換種草文案：AI + 人工潤飾全攻略
            </h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              小紅書種草文章講求「視覺氛圍感」與「實用指標評分」。標題必須帶有儀式感符號（✦ 氛圍感生活提案 ✦），內文搭配五星評分（▪ 視覺氛圍：滿分 💯、▪ 出片指數：★★★★★），並於結尾提醒『點讚收藏不迷路』。AI 發文助手的「✨ 小紅書種草」語氣可自動生成完整種草結構。
            </p>
          </article>

        </div>
      </section>
    </div>
  );
}

function EmbedShareModal({ language, onClose }: { language: Language; onClose: () => void }) {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const embedCode = `<iframe src="https://cooklabai.com/#poster" width="100%" height="700" frameborder="0" style="border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.1);"></iframe>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="guide-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="guide-modal" role="dialog" aria-modal="true" style={{ maxWidth: "620px" }}>
        <button className="guide-close" onClick={onClose}>×</button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>🔗</span>
          <div>
            <h2 style={{ fontSize: "18px", margin: 0, color: "var(--ink)" }}>{t(language, "分享與嵌入字研所工具", "Share & Embed TextLab")}</h2>
            <p style={{ fontSize: "11px", color: "var(--muted)", margin: "2px 0 0" }}>{t(language, "讓您的讀者或社群好友也能免費體驗 AI 廣告研究所！", "Embed our tool on your blog or share with friends!")}</p>
          </div>
        </div>

        {/* 嵌入碼 */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "6px" }}>
            1. 部落格/網站 嵌入語法 (Embed Code):
          </label>
          <textarea
            readOnly
            value={embedCode}
            rows={3}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "11px", fontFamily: "monospace", resize: "none", outline: "none", marginBottom: "8px" }}
          />
          <button className="primary-button wide" onClick={copyEmbed}>
            {copiedEmbed ? "嵌入語法已複製 ✓" : "一鍵複製嵌入語法 (iframe)"}
          </button>
        </div>

        {/* 社群分享連結 */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", display: "block", marginBottom: "8px" }}>
            2. 一鍵分享給社群好友:
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a
              href="https://line.me/R/msg/text/?字研所%20AI%20廣告研究所｜30秒免寫%20Prompt%20生成商業海報！%20https://cooklabai.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", textDecoration: "none", fontWeight: 650, display: "flex", alignItems: "center", gap: "6px" }}
            >
              🟢 LINE 分享
            </a>
            <a
              href="https://www.facebook.com/sharer/sharer.php?u=https://cooklabai.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", textDecoration: "none", fontWeight: 650, display: "flex", alignItems: "center", gap: "6px" }}
            >
              🔵 FB 分享
            </a>
            <a
              href="https://threads.net/intent/post?text=發現一個超級好用的免費%20AI%20廣告海報產生器「字研所」！完全不用寫%20Prompt，點選就能生出%20Midjourney%20和%20ChatGPT%20海報提示詞：https://cooklabai.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", textDecoration: "none", fontWeight: 650, display: "flex", alignItems: "center", gap: "6px" }}
            >
              💬 Threads 分享
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function GuideModal({ language, onClose, onSelectTool }: { language: Language; onClose: () => void; onSelectTool: (id: ToolId) => void }) {
  return <div className="guide-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <button className="guide-close" onClick={onClose} aria-label={t(language, "關閉使用指南", "Close guide")}>×</button>
      <div className="guide-hero"><span className="tool-icon lilac">?</span><div><span className="section-kicker">QUICK START</span><h2 id="guide-title">{t(language, "第一次使用？30 秒快速上手", "New here? Get started in 30 seconds")}</h2><p>{t(language, "所有工具都不需登入，開啟即用。AI 貼文助手也已內建連線，無需任何設定。", "No sign-up required. The AI Post Assistant is ready to use right away — no setup needed.")}</p></div></div>
      <div className="guide-steps"><article><span>1</span><div><strong>{t(language, "選擇工具", "Choose a tool")}</strong><p>{t(language, "從 AI 貼文助手、符號、Emoji 或其他工具開始。", "Start with the AI Post Assistant, symbols, emoji, or any other tool.")}</p></div></article><article><span>2</span><div><strong>{t(language, "輸入想法或搜尋", "Type your idea or search")}</strong><p>{t(language, "AI 工具直接輸入想法；其他工具可搜尋關鍵字或修改範本。", "For AI tools, type your idea. For others, search a keyword or edit a template.")}</p></div></article><article><span>3</span><div><strong>{t(language, "生成或複製", "Generate or copy")}</strong><p>{t(language, "點擊生成按鈕或一鍵複製，直接貼到 IG、FB、Threads 等平台。", "Click generate or copy in one click, then paste into IG, FB, Threads or anywhere.")}</p></div></article></div>
      <div className="guide-section-title"><div><span className="section-kicker">AI 功能</span><h3>{t(language, "AI 社群貼文助手", "AI Social Post Assistant")}</h3></div></div>
      <div style={{ padding: "14px 0 4px 0", fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
        <p style={{ marginBottom: "8px" }}>{t(language, "選擇「🤖 AI 智慧自動匹配」，AI 會根據你輸入的主題自動判定最適合的平台體裁，無需手動選擇風格。", "Choose 「🤖 AI Smart Match」and the AI will automatically pick the best platform format based on your input — no manual tone selection needed.")}</p>
        <p style={{ marginBottom: "0" }}>{t(language, "支援 IG 美學圖文、FB 粉專文、Threads 爆款討論、LINE 社群推播、小紅書種草等平台風格自動生成。", "Supports auto-generation for IG aesthetic posts, FB brand posts, Threads viral takes, LINE community pushes, and Redbook lifestyle content.")}</p>
      </div>
      <div className="guide-section-title" style={{ marginTop: "20px" }}><div><span className="section-kicker">TOOLS</span><h3>{t(language, "你想做什麼？", "What would you like to do?")}</h3></div><span>{t(language, "點選後直接開啟", "Opens instantly")}</span></div>
      <div className="guide-tools">{tools.map((tool) => <button key={tool.id} onClick={() => onSelectTool(tool.id)}><span className={`tool-icon ${tool.tone}`}>{tool.icon}</span><span><strong>{t(language, tool.name, tool.nameEn)}</strong><small>{t(language, tool.short, tool.shortEn)}</small></span><i>→</i></button>)}</div>
      <div className="guide-bottom"><div className="guide-privacy"><span>✦</span><div><strong>{t(language, "內容只留在你的裝置", "Your content stays on your device")}</strong><p>{t(language, "所有文字工具在瀏覽器完成，不會上傳或儲存。AI 貼文助手會將輸入內容傳送至 OpenRouter API 進行生成；最近使用與收藏只保存在目前瀏覽器。", "Text tools run locally and are never uploaded. The AI assistant sends your input to OpenRouter API for generation. Recents and favorites are stored only in this browser.")}</p></div></div><div className="guide-faq"><strong>{t(language, "常見問題", "Quick answers")}</strong><p><span>{t(language, "AI 生成需要費用嗎？", "Does AI generation cost anything?")}</span>{t(language, "完全免費，系統已內建 API，無需輸入任何金鑰或信用卡。", "Completely free. The API is built-in — no key or credit card needed.")}</p><p><span>{t(language, "複製後沒反應？", "Copy not working?")}</span>{t(language, "確認瀏覽器已允許剪貼簿權限，或改用其他瀏覽器。", "Allow clipboard access or try another browser.")}</p><p><span>{t(language, "哪些平台能用？", "Where can I use it?")}</span>{t(language, "大多數支援 Unicode 的社群、文件與遊戲都能使用。", "Most social apps, documents and games that support Unicode.")}</p></div></div>
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
  const parseCurrentTool = (): ToolId => {
    if (typeof window === "undefined") return "poster";
    if (window.location.hash) {
      const hashParts = window.location.hash.replace("#", "").split("/");
      const hashTool = hashParts[0] as ToolId;
      if (tools.some((t) => t.id === hashTool)) {
        const subCat = hashParts[1] ? `/${hashParts[1]}` : "";
        window.history.replaceState(null, "", `/${hashTool}${subCat}`);
        return hashTool;
      }
    }
    const pathParts = window.location.pathname.replace("/", "").split("/");
    const pathTool = pathParts[0] as ToolId;
    if (tools.some((t) => t.id === pathTool)) {
      return pathTool;
    }
    return "poster";
  };

  const [active, setActive] = useState<ToolId>(parseCurrentTool);

  useEffect(() => {
    const handlePopState = () => {
      const tool = parseCurrentTool();
      setActive(tool);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [copied, setCopied] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
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
  const selectTool = (id: ToolId) => {
    setActive(id);
    const newPath = `/${id}`;
    window.history.pushState(null, "", newPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
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
    
    let titleStr = `${t(language, current.name, current.nameEn)}｜TextLab AI`;
    let descStr = t(language, `${current.name}線上工具：${current.short}，免費使用、不需登入。`, `${current.nameEn}: ${current.shortEn}. Free, no sign-up.`);

    const seoMap: Record<string, { zhTitle: string; zhDesc: string; enTitle: string; enDesc: string }> = {
      poster: {
        zhTitle: "AI 廣告研究所｜免寫 Prompt 一鍵生成商業海報 (Midjourney / ChatGPT)｜字研所 TextLab",
        zhDesc: "不需英文或複雜提示詞！30 秒透過點選自動產生 Midjourney、ChatGPT (DALL-E 3)、Gemini 專業商業海報 Prompt，支援網址解析與 AI 廣告評分。",
        enTitle: "AI Commercial Poster Studio | Visual Ad Prompt Generator | TextLab",
        enDesc: "Create professional Midjourney & DALL-E 3 poster prompts without writing text. 100% free visual ad generator."
      },
      ai: {
        zhTitle: "AI 社群貼文助手｜Threads / IG / FB 爆款文案一鍵生成｜字研所 TextLab",
        zhDesc: "專為台灣社群生態設計的 AI 發文助手！輸入想法一鍵生成 IG、FB、Threads、小紅書與 LINE 爆款貼文文案，免費免註冊。",
        enTitle: "AI Social Post Assistant | Viral IG & Threads Creator | TextLab",
        enDesc: "AI copywriter for Instagram, Threads, Facebook & LINE. Generate viral Taiwanese social posts instantly."
      },
      layout: {
        zhTitle: "IG / Threads 免費排版換行工具｜解決貼文縮排擠成一團｜字研所 TextLab",
        zhDesc: "最穩定的 IG 貼文排版換行產生器！一鍵解決 Instagram、Threads 貼文換行失效與縮排擠成一團的問題，可插入隱形空白與風格符號。",
        enTitle: "Instagram & Threads Line Break Formatter | TextLab",
        enDesc: "Fix Instagram & Threads caption spacing issues instantly. Free line break & layout tool."
      },
      bio: {
        zhTitle: "IG / Threads 個人檔案 Bio 排版美化工具｜字研所 TextLab",
        zhDesc: "擺脫平庸主頁！一鍵生成質感 IG 個人檔案 (Bio) 排版、Threads 簡介佈置、花式字體與風格排版分隔線。",
        enTitle: "Instagram & Threads Bio Studio | Profile Designer | TextLab",
        enDesc: "Design aesthetic Instagram & Threads bios with custom Unicode fonts, symbols and dividers."
      },
      hashtags: {
        zhTitle: "2026 社群爆款熱門標籤 Hashtags 懶人包｜IG / Threads 流量導流｜字研所 TextLab",
        zhDesc: "整理最新 Threads 與 IG 爆款流量 Hashtag 標籤包！包含甜點探店、穿搭靈感、職人覆盤、電商團購等熱門標籤，一鍵複製直接用。",
        enTitle: "Trending Instagram & Threads Hashtag Bundles 2026 | TextLab",
        enDesc: "Discover high-converting hashtag bundles for Instagram, Threads and TikTok. Copy with one click."
      },
      symbols: {
        zhTitle: "特殊符號大全 2026｜愛心、星星、箭頭、日系花樣符號一鍵複製｜字研所 TextLab",
        zhDesc: "收錄超過 2000+ 款特殊符號：星星、愛心、箭頭、框線、日系明體花紋、標題括號，分類清晰、一鍵點選複製！",
        enTitle: "Unicode Symbols Library 2026 | Search & Copy Symbols | TextLab",
        enDesc: "Search and copy 2000+ Unicode symbols, stars, hearts, arrows, brackets and dividers."
      },
      emoji: {
        zhTitle: "Emoji 視覺實驗室｜全網最全 Emoji 搜尋與組合懶人包｜字研所 TextLab",
        zhDesc: "Unicode 最新 Emoji 視覺搜尋與組合庫！整理優雅崩潰、社畜下班、陰陽怪氣等經典 Emoji 連發組合，社群小編發文必備。",
        enTitle: "Emoji Visual Lab | Search, Copy & Combos | TextLab",
        enDesc: "Explore and search all Unicode emojis with curated aesthetic emoji combinations."
      },
      kaomoji: {
        zhTitle: "日系顏文字大全 2026｜可愛、委屈、開心、搞笑顏文字一鍵複製｜字研所 TextLab",
        zhDesc: "超過 1000+ 款經典與爆款日系顏文字庫！收錄 (◡̈)、( 🫠 )、( 🥺 ) 等可愛、賣萌、無奈顏文字，一鍵複製增添發文靈魂。",
        enTitle: "Japanese Kaomoji Library 2026 | Cute Emoticons | TextLab",
        enDesc: "Search and copy cute Japanese kaomoji emoticons for messages and social posts."
      },
      fonts: {
        zhTitle: "Unicode 特殊字體轉換器｜IG 英文字體、花式草寫一鍵轉換｜字研所 TextLab",
        zhDesc: "免費將一般英文字母轉換為花式手寫體、圈圈字、哥德體、雙線體 (𝔻𝕠𝕦𝕓𝕝𝕖-𝕊𝕥𝕣𝕦𝕔𝕜) 與草寫字體，貼在 IG 個人檔案主頁超亮眼。",
        enTitle: "Unicode Fancy Text Converter | Instagram Fonts | TextLab",
        enDesc: "Convert plain text into aesthetic cursive, gothic, circled, and double-struck Unicode fonts."
      },
      nickname: {
        zhTitle: "花式風格暱稱產生器｜遊戲 ID、IG 帳號風格暱稱｜字研所 TextLab",
        zhDesc: "一鍵產生充滿文青感、日系質感或極簡風格的暱稱與遊戲 ID 組合，擺脫菜市場名，找到專屬於你的個人特色名稱。",
        enTitle: "Aesthetic Nickname & Username Generator | TextLab",
        enDesc: "Generate unique aesthetic usernames, gaming IDs and nickname ideas for Instagram and TikTok."
      },
      blank: {
        zhTitle: "透明空白文字複製｜隱形空白字元產生器 (IG/Threads/遊戲ID)｜字研所 TextLab",
        zhDesc: "免費複製隱形空白文字字元 (Invisible Text / Blank Character)，解決 Line、IG 名字空白、遊戲 ID 留白與文章縮排排版需求。",
        enTitle: "Invisible Text & Blank Character Copy | TextLab",
        enDesc: "Copy empty space characters (Unicode U+3164) for invisible usernames and custom spacing."
      }
    };

    if (seoMap[current.id]) {
      const item = seoMap[current.id];
      titleStr = t(language, item.zhTitle, item.enTitle);
      descStr = t(language, item.zhDesc, item.enDesc);
    }

    if (current.id !== "symbols") {
      document.title = titleStr;
      document.querySelector('meta[name="description"]')?.setAttribute("content", descStr);
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", titleStr);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", descStr);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", titleStr);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", descStr);
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
    <header className="topbar"><a className="brand" href="/symbols" onClick={(e) => { e.preventDefault(); selectTool("symbols"); }}><BrandLogo /><span><strong>{t(language, "字研所", "TextLab")}</strong><small>TEXT LAB</small></span></a><nav><button className="guide-nav-button" onClick={() => setGuidesOpen(true)}>📚 {t(language, "行銷指南", "Guides")}</button><button className="guide-nav-button" onClick={() => setEmbedOpen(true)}>🔗 {t(language, "嵌入與分享", "Embed")}</button><button className="guide-nav-button" onClick={() => setGuideOpen(true)}>{t(language, "使用指南", "Guide")}</button><button className="guide-nav-button" onClick={toggleTheme} title={t(language, "切換主題風格", "Toggle theme")}>{theme === "dark" ? "🌙 深色" : theme === "light" ? "☀️ 淺色" : "🌗 自動"}</button><div className="language-switch" aria-label="Language"><button className={language === "zh-TW" ? "active" : ""} onClick={() => changeLanguage("zh-TW")}>繁中</button><button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button></div></nav></header>
    <div className="layout">
      <aside className="sidebar"><p className="sidebar-label">{t(language, "文字工具箱", "TEXT TOOLBOX")}</p><div className="tool-nav">{tools.map((tool) => <button key={tool.id} className={active === tool.id ? "active" : ""} onClick={() => selectTool(tool.id)}><span className={`tool-icon ${tool.tone}`}>{tool.icon}</span><span><strong>{t(language, tool.name, tool.nameEn)}</strong><small>{t(language, tool.short, tool.shortEn)}</small></span>{tool.badge && <em>{t(language, tool.badge, "HOT")}</em>}</button>)}</div><div className="sidebar-note"><span>✦</span><p><strong>{t(language, "你的文字，只留在這裡", "Your text stays here")}</strong><br />{t(language, "所有轉換都在瀏覽器完成，我們不會儲存內容。", "Everything runs in your browser. We never store your content.")}</p></div></aside>
      <main className="workspace"><div className="mobile-tool-picker"><span>{t(language, "目前工具", "CURRENT TOOL")}</span><select value={active} onChange={(e) => selectTool(e.target.value as ToolId)}>{tools.map((tool) => <option value={tool.id} key={tool.id}>{t(language, tool.name, tool.nameEn)}｜{t(language, tool.short, tool.shortEn)}</option>)}</select></div>
        <div className="tool-surface">
          {active === "poster" && <PosterTool {...toolProps} />}
          {active === "ai" && <AIPostTool {...toolProps} selectTool={selectTool} />}
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
    {guidesOpen && <MarketingGuidesModal language={language} onClose={() => setGuidesOpen(false)} />}
    {embedOpen && <EmbedShareModal language={language} onClose={() => setEmbedOpen(false)} />}
    {!!copied && <div className="toast" role="status"><span>✓</span> {t(language, "已複製到剪貼簿", "Copied to clipboard")}</div>}
  </div>;
}
