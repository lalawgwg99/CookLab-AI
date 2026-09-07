import { useEffect, useMemo, useRef, useState } from "react";
import { trackPageView, trackCopyAction, fetchLiveStats, LiveStatsData } from "./services/analytics";
import { getEntitlements, verifyLicenseKey, checkDailyAiLimit, incrementDailyAiUsage, UserEntitlements } from "./services/subscription";
import { popularSymbols, symbolGroups, totalSymbolCount } from "./data/symbols";
import { allEmoji, emojiAliases, emojiCategories } from "./data/emoji";
import seoPages from "./data/seo-pages.json";

type ToolId = "layout" | "ai" | "deal" | "swipe" | "localize" | "hook" | "title" | "bio" | "symbols" | "emoji" | "kaomoji" | "fonts" | "hashtags" | "blank" | "nickname";
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
};

const tools: Tool[] = [
  { id: "layout", name: "社群排版換行", nameEn: "Social Formatter", short: "IG／Threads 換行與縮排", shortEn: "Instagram / Threads spacing", icon: "¶" },
  { id: "swipe", name: "實戰爆款文案庫", nameEn: "Viral Swipe File", short: "破萬讚模板直接抄", shortEn: "Proven viral templates", icon: "📚" },
  { id: "localize", name: "台灣用語與法規避雷", nameEn: "Taiwan Voice Sanitizer", short: "去大陸支語・衛福部防罰", shortEn: "Localize phrasing & safety", icon: "🇹🇼" },
  { id: "deal", name: "電商開團爆單機", nameEn: "Group-Buy Deal Studio", short: "團購帶貨與防客訴規格", shortEn: "High-converting sales copy", icon: "🛒" },
  { id: "ai", name: "AI 發文助手", nameEn: "AI Post Assistant", short: "智慧生成社群貼文", shortEn: "Social copywriting assistant", icon: "🪄" },
  { id: "hook", name: "爆款 Hook 產生器", nameEn: "Viral Hook Studio", short: "吸引點擊的開頭第一句", shortEn: "Caption hook formulas", icon: "⚡" },
  { id: "title", name: "風格花邊標題", nameEn: "Title Frame Studio", short: "日系風格標題邊框", shortEn: "Aesthetic header frames", icon: "✦" },
  { id: "bio", name: "個人檔案 Bio", nameEn: "Bio Designer", short: "IG / Threads 簡介排版", shortEn: "Profile intro builder", icon: "📇" },
  { id: "symbols", name: "特殊符號", nameEn: "Symbols", short: "分類搜尋與一鍵複製", shortEn: "Search and copy symbols", icon: "✦" },
  { id: "emoji", name: "Emoji 實驗室", nameEn: "Emoji Lab", short: "分類與經典情境連發", shortEn: "Browse & emoji combos", icon: "☺" },
  { id: "kaomoji", name: "日系顏文字", nameEn: "Kaomoji", short: "精選日系顏文字庫", shortEn: "Japanese emoticons", icon: "◡̈" },
  { id: "fonts", name: "特殊字體", nameEn: "Fancy Text", short: "Unicode 特殊字體轉換", shortEn: "Unicode font converter", icon: "Aa" },
  { id: "hashtags", name: "熱門標籤", nameEn: "Hashtags", short: "Threads / IG 導流標籤", shortEn: "Trending hashtag sets", icon: "#" },
  { id: "blank", name: "空白文字", nameEn: "Invisible Text", short: "隱形空白字元複製", shortEn: "Invisible blank character", icon: "□" },
  { id: "nickname", name: "風格暱稱產生器", nameEn: "Nickname Generator", short: "快速找到專屬風格", shortEn: "Find your online style", icon: "@" },
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

let currentActiveTool = "layout";

function copyText(value: string, onCopied: (value: string) => void) {
  const done = () => {
    onCopied(value);
    trackCopyAction(currentActiveTool);
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
  const privacyNote = tool.id === "ai"
    ? t(language, "輸入想法，整理成可直接發布的社群貼文。", "Turn an idea into a ready-to-post social caption.")
    : t(language, tool.short, tool.shortEn);
  return <div className="tool-heading">
    <span className="tool-icon hero-icon">{tool.icon}</span>
    <div><h1>{t(language, tool.name, tool.nameEn)}</h1><p>{privacyNote}</p></div>
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
  const initialCategory = (window.location.hash.split("/")[1] || new URLSearchParams(window.location.search).get("category") || window.location.pathname.split("/")[2] || "all");
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
    const baseSeo = seoPages.symbols;
    document.title = activeGroup ? `${t(language, activeGroup.name, translatedGroup?.name || activeGroup.name)}｜TextLab` : t(language, baseSeo.titleZh, baseSeo.titleEn);
    const description = activeGroup ? t(language, activeGroup.description, translatedGroup?.description || activeGroup.description) : t(language, baseSeo.descriptionZh, baseSeo.descriptionEn);
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [activeGroup, language]);

  const setCategory = (id: string) => {
    setCategoryState(id);
    setQuery("");
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", id);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
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
    <div className="symbol-sections">{groups.map((group) => <section className="symbol-section" id={`symbol-${group.id}`} key={group.id}><div className="section-title-row symbol-title"><div><span className="section-kicker">{group.items.length} SYMBOLS</span><h2>{t(language, group.name, symbolEnglish[group.id].name)}</h2><p>{t(language, group.description, symbolEnglish[group.id].description)}</p></div><button className="share-category" onClick={() => copyText(`${window.location.origin}${language === "en" ? "/en" : ""}/symbols?category=${group.id}`, setCopied)}>⌁ {t(language, "複製分類連結", "Copy category link")}</button></div><SymbolTiles items={group.items} favorites={favorites} copied={copied} onCopy={choose} onFavorite={toggleFavorite} /></section>)}</div>
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

function HookTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const [topic, setTopic] = useState("把心態放慢之後，工作效率反而變高了");
  const [activeCategory, setActiveCategory] = useState("all");

  const hookCategories = [
    {
      id: "curiosity",
      name: "🔥 好奇反常識",
      templates: [
        (t: string) => `🔥【千萬別再這樣做！】${t}`,
        (t: string) => `💡【大家都以為錯了...】${t}`,
        (t: string) => `⚠️【90% 的人都不知道的秘密：】${t}`,
        (t: string) => `改了 5 版草稿之後，我終於悟出了一個道理：${t}`
      ]
    },
    {
      id: "perspective",
      name: "💡 觀點思考",
      templates: [
        (t: string) => `💡【關於最近的一個小思考...】${t}`,
        (t: string) => `工作第 5 年，我最慶幸自己做對的選擇是：${t}`,
        (t: string) => `✦【今天想聊聊這個體悟：】${t}`,
        (t: string) => `如果你也在思考這件事，請花 1 分鐘看完：${t}`
      ]
    },
    {
      id: "empathy",
      name: "💖 共鳴情感",
      templates: [
        (t: string) => `✨【如果你也在經歷這個階段...】${t}`,
        (t: string) => `致每一個深夜還在咬牙堅持的你：${t}`,
        (t: string) => `☁️【給正在迷惘的你一封信：】${t}`,
        (t: string) => `🫠【優雅崩潰日常：】${t}`
      ]
    },
    {
      id: "sales",
      name: "🛍️ 導購促銷",
      templates: [
        (t: string) => `🛒【爆款限定開團｜獨家優惠】${t}`,
        (t: string) => `⏰【最後倒數！賣爆的理由是：】${t}`,
        (t: string) => `🎁【小編私心強烈推薦：】${t}`,
        (t: string) => `🔥【獨家社群限定價！錯過不再：】${t}`
      ]
    }
  ];

  const filteredCategories = activeCategory === "all"
    ? hookCategories
    : hookCategories.filter((c) => c.id === activeCategory);

  return (
    <>
      <ToolIntro tool={tools.find((t) => t.id === "hook")!} language={language} />

      <div className="input-card" style={{ marginBottom: "20px" }}>
        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
            {t(language, "輸入您的發文主題或核心文案", "Type your post topic or core message")}
          </strong>
        </div>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t(language, "例如：把心態放慢之後，工作效率反而變高了", "e.g. Slowing down increased my productivity")}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "14px", outline: "none", marginBottom: "12px" }}
        />

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setActiveCategory("all")} style={{ border: "1px solid var(--line)", background: activeCategory === "all" ? "var(--purple)" : "var(--paper)", color: activeCategory === "all" ? "#fff" : "var(--ink)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", fontWeight: 650 }}>
            全部分類 (All)
          </button>
          {hookCategories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ border: "1px solid var(--line)", background: activeCategory === cat.id ? "var(--purple)" : "var(--paper)", color: activeCategory === cat.id ? "#fff" : "var(--ink)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", fontWeight: 650 }}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        {filteredCategories.map((cat) => (
          <section key={cat.id} className="input-card">
            <h3 style={{ fontSize: "14px", margin: "0 0 12px", color: "var(--purple-dark)" }}>{cat.name}</h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {cat.templates.map((tplFn, idx) => {
                const textResult = tplFn(topic);
                return (
                  <div key={idx} style={{ padding: "12px 14px", borderRadius: "10px", background: "var(--canvas)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 550, lineHeight: 1.5, wordBreak: "break-all" }}>{textResult}</span>
                    <button onClick={() => copyText(textResult, setCopied)} style={{ border: "1px solid var(--purple)", background: "var(--paper)", color: "var(--purple-dark)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", fontWeight: 650, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {copied === textResult ? t(language, "已複製 ✓", "Copied ✓") : t(language, "一鍵複製", "Copy")}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function TitleTool({ copied, setCopied, language }: { copied: string; setCopied: (v: string) => void; language: Language }) {
  const [titleText, setTitleText] = useState("MY DAILY LOG");

  const patterns = [
    { name: "✦ 星閃雙邊", build: (t: string) => `✦ ─── ${t} ─── ✦` },
    { name: "♡ 愛心對稱", build: (t: string) => `♡ ┈┈ ${t} ┈┈ ♡` },
    { name: "౨ৎ 日系蝴蝶結", build: (t: string) => `౨ৎ  ${t}  ౨ৎ` },
    { name: "⋆⋅☆⋅⋆ 璀璨星光", build: (t: string) => `⋆⋅☆⋅⋆  ${t}  ⋆⋅☆⋅⋆` },
    { name: "『 』角括號", build: (t: string) => `『 ${t} 』` },
    { name: "【 】黑大括號", build: (t: string) => `【 ${t} 】` },
    { name: "〰︎ 波浪紋", build: (t: string) => `〰︎ ${t} 〰︎` },
    { name: "•✦ 雙星線條", build: (t: string) => `•✦───── ${t} ─────✦•` },
    { name: "*̣̥☆ 奢華星光", build: (t: string) => `*̣̥☆·͙̥‧ ${t} ‧·͙̥̣☆*̣̥` },
    { name: "୨୧ 夢幻蕾絲", build: (t: string) => `୨୧ ${t} ୨୧` },
    { name: "[ ] 日系方括號", build: (t: string) => `[ ${t} ]` },
    { name: "::: 復古三點", build: (t: string) => `::: ${t} :::` }
  ];

  return (
    <>
      <ToolIntro tool={tools.find((t) => t.id === "title")!} language={language} />

      <div className="input-card" style={{ marginBottom: "20px" }}>
        <div className="field-label">
          <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
            {t(language, "輸入您的標題或主題文字", "Type your header or title text")}
          </strong>
        </div>

        <input
          type="text"
          value={titleText}
          onChange={(e) => setTitleText(e.target.value)}
          placeholder={t(language, "例如：MY DAILY LOG、今日社畜日記...", "e.g. MY DAILY LOG, WEEKEND VIBES...")}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", fontSize: "14px", outline: "none" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
        {patterns.map((p) => {
          const formatted = p.build(titleText);
          return (
            <div key={p.name} className="input-card" style={{ padding: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>{p.name}</span>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--purple-dark)", background: "var(--canvas)", padding: "10px", borderRadius: "8px", textAlign: "center", wordBreak: "break-all" }}>
                {formatted}
              </div>
              <button onClick={() => copyText(formatted, setCopied)} className="primary-button wide" style={{ padding: "8px", fontSize: "11px" }}>
                {copied === formatted ? t(language, "標題已複製 ✓", "Copied ✓") : t(language, "複製標題邊框", "Copy Frame Title")}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

interface BrandPersona {
  enabled: boolean;
  brandName: string;
  targetAudience: string;
  customSlogan: string;
  customHashtags: string;
}

function CarouselModal({ text, language, onClose, onCopy }: { text: string; language: Language; onClose: () => void; onCopy: (v: string) => void }) {
  const slides = useMemo(() => {
    if (!text.trim()) return [];
    // Split by double newlines or sentences, target 70-130 chars per slide
    const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const rawSlides: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
      if ((currentChunk + "\n\n" + p).length > 140 && currentChunk) {
        rawSlides.push(currentChunk.trim());
        currentChunk = p;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${p}` : p;
      }
    }
    if (currentChunk) rawSlides.push(currentChunk.trim());

    const total = Math.max(rawSlides.length, 1);
    return rawSlides.map((s, idx) => {
      const pageNum = `[ ${idx + 1} / ${total} ]`;
      const footerHint = idx < total - 1 ? "（滑動看更多 ➔）" : "（歡迎收藏與分享 ✦）";
      return `${pageNum}\n\n${s}\n\n${footerHint}`;
    });
  }, [text]);

  const copyAll = () => {
    const combined = slides.join("\n\n───────────────\n\n");
    onCopy(combined);
  };

  return (
    <div className="guide-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="guide-modal" role="dialog" aria-modal="true" style={{ maxWidth: "600px" }}>
        <button className="guide-close" onClick={onClose}>×</button>
        <div className="guide-hero">
          <span className="tool-icon">📑</span>
          <div>
            <span className="section-kicker">CAROUSEL SLIDES</span>
            <h2>{t(language, "IG 輪播字卡分頁器", "Instagram Carousel Formatter")}</h2>
            <p>{t(language, `已自動切分為 ${slides.length} 張簡報式字卡，可直接複製貼入設計軟體或圖文。`, `Formatted into ${slides.length} slide-ready text cards.`)}</p>
          </div>
        </div>

        <div style={{ margin: "16px 0", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button className="primary-button" onClick={copyAll} style={{ fontSize: "12px", padding: "8px 14px" }}>
            📋 {t(language, "一鍵複製全部字卡", "Copy All Slides")}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
          {slides.map((slide, idx) => (
            <div key={idx} style={{ padding: "14px", borderRadius: "12px", background: "var(--canvas)", border: "1px solid var(--line)", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "12px", color: "var(--purple)" }}>Slide {idx + 1}</strong>
                <button
                  onClick={() => onCopy(slide)}
                  style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}
                >
                  複製此卡
                </button>
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--ink)" }}>
                {slide}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProPaywallModal({ language, onClose, onRedeemSuccess }: { language: Language; onClose: () => void; onRedeemSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const handleVerifyLicense = () => {
    if (!code.trim()) return;
    const res = verifyLicenseKey(code);
    setIsError(!res.success);
    setMsg(res.message);
    if (res.success) {
      setTimeout(() => {
        onRedeemSuccess();
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="guide-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="guide-modal" role="dialog" aria-modal="true" style={{ maxWidth: "500px", textAlign: "center" }}>
        <button className="guide-close" onClick={onClose}>×</button>
        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, var(--purple), var(--purple-dark))", color: "#ffffff", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          👑
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>
          {t(language, "解鎖 TextLab Pro 商業專屬特權", "Unlock TextLab Pro Pass")}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 18px" }}>
          {t(language, "省下 40,000 元衛生局法規罰單、杜絕大陸支語爭議、現成爆款直接抄！", "Save $40,000 regulatory fines, cleanse mainland buzzwords, swipe viral posts.")}
        </p>

        {/* 核心專業特權清單 */}
        <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px", background: "var(--canvas)", padding: "16px", borderRadius: "14px", border: "1px solid var(--line)" }}>
          {[
            { icon: "🛡️", title: "衛福部廣告法規避雷針", desc: "自動掃描食安法/化粧品法違規詞，一鍵替換合法合規詞，免遭 4~40 萬罰鍰" },
            { icon: "🇹🇼", title: "台灣在地用語一鍵過濾器", desc: "自動將視頻、質量、立馬等大陸用語轉為正統台灣繁體質感，杜絕社群公關災難" },
            { icon: "📚", title: "實戰爆款文案庫 (直接抄作業)", desc: "Threads 破萬愛心熱門架構、團購開團破百萬催購模板，點擊直接套用" },
            { icon: "🛒", title: "電商開團爆單機與私訊轉單腳本", desc: "即時折扣試算、防客訴售後條款、IG/Threads 留言「+1」3 步驟轉單腳本" }
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "15px" }}>{item.icon}</span>
              <div>
                <strong style={{ fontSize: "12px", color: "var(--ink)", display: "block" }}>{item.title}</strong>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 方案選擇按鈕（早鳥終身買斷 NT$ 399 與年繳 NT$ 499） */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
          <button
            type="button"
            className="primary-button"
            style={{ width: "100%", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: 700, borderRadius: "12px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer" }}
            onClick={() => {
              alert(t(language, "即將前往綠界 / Stripe 結帳頁面（早鳥終身買斷 NT$ 399）。一次付費，永久免費享用未來所有商業爆款更新！", "Redirecting to checkout (Early Bird Lifetime NT$ 399). Pay once, own forever!"));
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>👑 早鳥終身買斷方案</span>
              <span style={{ fontSize: "10px", background: "#f59e0b", color: "#fff", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>限量前200名</span>
            </div>
            <span>NT$ 399 終身買斷 ➔</span>
          </button>

          <button
            type="button"
            style={{ width: "100%", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: 650, borderRadius: "12px", border: "1px solid var(--line)", background: "var(--canvas)", color: "var(--ink)", cursor: "pointer" }}
            onClick={() => {
              alert(t(language, "即將前往綠界 / Stripe 結帳頁面（年度暢通方案 NT$ 499 / 年）。平均一天不到 1.4 元！", "Redirecting to checkout (Annual Pass NT$ 499 / year). Less than NT$ 1.4 / day!"));
            }}
          >
            <span>🌟 年度暢通方案</span>
            <span>NT$ 499 / 年 ➔</span>
          </button>
        </div>

        {/* 授權序號驗證區 */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
            {t(language, "付款完成後請輸入訂單授權序號直接開通（如 LIFETIME-399）：", "Enter your purchased license key to activate:")}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例: LIFETIME-399 或 TL-8888-9999"
              style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "12px", color: "var(--ink)" }}
            />
            <button
              onClick={handleVerifyLicense}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--purple)", background: "var(--purple-soft)", color: "var(--purple)", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
            >
              {t(language, "驗證開通", "Activate")}
            </button>
          </div>
          {!!msg && (
            <div style={{ marginTop: "8px", fontSize: "11px", color: isError ? "#e5484d" : "var(--purple)", fontWeight: 600 }}>
              {msg}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


const LEGAL_RISKS: { term: string; risk: string; replace: string; law: string }[] = [
  { term: "消炎", risk: "宣稱醫療效能", replace: "舒緩修護、安撫敏弱", law: "化粧品衛生安全法 §10" },
  { term: "抗敏", risk: "宣稱醫療效能", replace: "穩定敏弱膚況", law: "化粧品衛生安全法 §10" },
  { term: "排毒", risk: "涉及改變生理機能", replace: "促進新陳代謝、排便順暢", law: "食品安全衛生管理法 §28" },
  { term: "瘦身", risk: "宣稱減肥減脂", replace: "維持窈窕體態、促進代謝", law: "食品安全衛生管理法 §28 (最高罰400萬)" },
  { term: "減肥", risk: "宣稱減肥減脂", replace: "輕盈順暢、調節生理機能", law: "食品安全衛生管理法 §28" },
  { term: "燃脂", risk: "涉及醫療減脂效能", replace: "運動好幫手、活力代謝", law: "食品安全衛生管理法 §28" },
  { term: "生髮", risk: "宣稱毛囊再生", replace: "強韌髮根、豐盈亮麗", law: "化粧品衛生安全法 §10" },
  { term: "保證見效", risk: "誇大不實/絕對化", replace: "眾多好評熱烈推薦", law: "公平交易法 §21" },
  { term: "消除疲勞", risk: "涉及生理機能宣稱", replace: "精神旺盛、滋補強身", law: "食品安全衛生管理法 §28" },
  { term: "根治", risk: "醫療療效宣稱", replace: "全面溫和調理", law: "醫療法 §84" },
  { term: "美白淡斑", risk: "特定宣稱限制", replace: "勻亮暗沉、展現透亮光澤", law: "化粧品衛生安全法 §10" },
];

function DealTool({
  copied,
  setCopied,
  language,
  isPro,
  onRequirePro
}: {
  copied: string;
  setCopied: (v: string) => void;
  language: Language;
  isPro: boolean;
  onRequirePro: () => void;
}) {
  const [productName, setProductName] = useState(t(language, "日本極輕量便攜靜音無線風扇", "Ultralight Quiet Cordless Fan"));
  const [originalPrice, setOriginalPrice] = useState("1680");
  const [dealPrice, setDealPrice] = useState("990");
  const [shippingBonus, setShippingBonus] = useState(t(language, "全館滿 $1,500 即享免運，首日前 50 名下單加贈專用收納絨布袋", "Free shipping over $1,500. First 50 orders get a free storage pouch"));
  const [sellingPoints, setSellingPoints] = useState(t(language, "1. 僅 195g 超輕量便攜無負擔\n2. 24 小時長效續航出遊必備\n3. 嬰兒級極致靜音無擾風感", "1. Only 195g ultralight\n2. 24h long-lasting battery\n3. Whisper-quiet baby sleep breeze"));
  const [urgency, setUrgency] = useState(t(language, "限量現貨 100 組，限時開團 3 天，搶完即關閉賣場不再追加", "Limited stock: 100 units. 3-day flash deal. Form closes once sold out"));
  const [disputeChecks, setDisputeChecks] = useState({
    shippingDays: true,
    hygienePolicy: true,
    warranty: true,
    unboxingVideo: true,
  });

  const [activeTab, setActiveTab] = useState<"line" | "ig" | "fb" | "dm">("line");

  const orig = parseInt(originalPrice, 10) || 0;
  const deal = parseInt(dealPrice, 10) || 0;
  const savings = Math.max(0, orig - deal);
  const discountPct = orig > 0 && deal < orig ? Math.round(((orig - deal) / orig) * 100) : 0;

  // 台灣廣告法規避雷掃描
  const detectedRisks = useMemo(() => {
    const fullText = `${productName} ${sellingPoints}`;
    return LEGAL_RISKS.filter((r) => fullText.includes(r.term));
  }, [productName, sellingPoints]);

  const handleAutoFixRisks = () => {
    let fixedName = productName;
    let fixedPoints = sellingPoints;
    for (const r of detectedRisks) {
      fixedName = fixedName.split(r.term).join(r.replace);
      fixedPoints = fixedPoints.split(r.term).join(r.replace);
    }
    setProductName(fixedName);
    setSellingPoints(fixedPoints);
  };

  const generatedCopy = useMemo(() => {
    const pointsFormatted = sellingPoints
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `▪ ${p}`)
      .join("\n");

    const disputeTerms = [
      disputeChecks.shippingDays ? "▪ 出貨時程：現貨訂單將於 3-5 個工作天內依序出貨，請耐心等候。" : "",
      disputeChecks.unboxingVideo ? "▪ 售後保障：為保障彼此權益，包裹拆封請務必「全程錄影」，如有短缺或瑕疵請於 48 小時內聯繫客服。" : "",
      disputeChecks.hygienePolicy ? "▪ 衛生提醒：本商品依消費者保護法屬於涉及個人衛生用品，拆封後恕不接受退貨。" : "",
      disputeChecks.warranty ? "▪ 鑑賞規範：七天猶豫期非試用期，商品經拆封使用非產品本身故障恕無法退換。" : "",
    ].filter(Boolean).join("\n");

    if (activeTab === "line") {
      return `🔥【限時開團｜社群限定團購優惠】\n\n很多人敲碗的「${productName}」終於幫大家談到首波團購價！\n只有社群好友才有的限時優惠，搶完即結單！⚡️\n\n🛒 團購重點整理：\n▪ 市售原價：NT$ ${orig}\n▪ 社群開團價：NT$ ${deal}（現省 $${savings}，直接下殺 ${discountPct}% OFF！）\n▪ 免運贈品：${shippingBonus}\n\n✨ 必買核心亮點：\n${pointsFormatted}\n\n⚠️ 數量與注意事項：\n▪ ${urgency}\n${disputeTerms ? `\n📌 下單須知與售後條款：\n${disputeTerms}\n` : ""}\n👇🏼 點擊下方專屬連結立即搶單：\nhttps://deal.cooklabai.com/order/${encodeURIComponent(productName.slice(0, 10))}\n\n💬 尺寸、規格或下單問題歡迎直接在群裡詢問小編！`;
    }

    if (activeTab === "ig") {
      return `『 找了好久，終於找到這款命定好物 ✨ 』\n\n自從用了【${productName}】，真的完全回不去了！\n這次直接跟廠商爭取到限時獨家團購優惠，比自己去官網買便宜太多 🥹\n\n✦ 為什麼我這麼推薦？\n${pointsFormatted}\n\n💸 粉絲限時福利：\n原價 $${orig} ➔ 這次開團只要 $${deal}（現省 $${savings}！）\n🎁 ${shippingBonus}\n\n⚠️ ${urgency}\n\n🛒 購買方式：\n留言「+1」小盒子自動私訊購買連結，或直接點個人檔案 Bio 連結下單 🔗\n\n─── ⋆⋅☆⋅⋆ ───\n#團購好物 #質感選物 #生活好物推薦 #開團優惠 #限時特賣`;
    }

    if (activeTab === "dm") {
      return `💬【IG / Threads 留言轉單自動私訊腳本 (DM Flow)】\n\n📌 貼文底端引導鉤子（吸引粉絲留言互動）：\n──────────────────────\n想要這檔限時【${productName}】團購現省 $${savings} 專屬優惠？\n在下方留言「+1」，小編在 5 秒內把隱藏折扣碼和下單連結私訊給你！👇🏼\n\n💬 步驟 1：首發自動私訊（秒回增加好感）：\n──────────────────────\n嗨嗨！這是你專屬的【${productName}】團購優惠碼 🎉\n\n▪ 原價：NT$ ${orig} ➔ 團購只要：NT$ ${deal}（🔥現省 $${savings}）\n▪ 滿額優惠：${shippingBonus}\n▪ 專屬下單連結：https://deal.cooklabai.com/order/${encodeURIComponent(productName.slice(0, 10))}\n\n⚠️ ${urgency}，搶完賣場就會提早關閉喔！\n\n⏰ 步驟 2：3 小時後溫馨催單（大幅提升結帳率）：\n──────────────────────\n貼心提醒～【${productName}】現貨庫存倒數中 ⚡️\n很多人已經下單卡位，這批現貨出完就要等下一季預購了，記得在結單前完成下單唷！`;
    }

    return `📢【爆款限時開團｜${productName}】\n\n感謝大家的熱烈敲碗！本次【${productName}】限時團購正式開跑！\n原廠正品保證，全台現貨限量供應，售完即止。\n\n━━━━━━━━━━━━━━\n✦ 團購方案與售價 ✦\n━━━━━━━━━━━━━━\n• 市售建議售價：NT$ ${orig}\n• 本團限定優惠價：NT$ ${deal}（🔥現省 NT$ ${savings}，現折 ${discountPct}%！）\n• 免運優惠門檻：${shippingBonus}\n\n━━━━━━━━━━━━━━\n✦ 產品核心特色 ✦\n━━━━━━━━━━━━━━\n${pointsFormatted}\n\n━━━━━━━━━━━━━━\n✦ 開團時間與數量 ✦\n━━━━━━━━━━━━━━\n• ${urgency}\n\n━━━━━━━━━━━━━━\n✦ 下單守則與防爭議條款 ✦\n━━━━━━━━━━━━━━\n${disputeTerms || "• 下單完成即代表同意本團購之出貨與退換貨規範。"}\n\n🛒 專屬下單賣場：https://deal.cooklabai.com/order/${encodeURIComponent(productName.slice(0, 10))}\n如有任何訂單相關疑問，請隨時私訊粉專小編處理。`;
  }, [productName, orig, deal, savings, discountPct, shippingBonus, sellingPoints, urgency, disputeChecks, activeTab]);

  const handleCopy = () => {
    if (!isPro) {
      onRequirePro();
      return;
    }
    copyText(generatedCopy, setCopied);
    trackCopyAction("deal");
  };

  return (
    <div className="tool-card">
      <div className="tool-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="tool-icon">🛒</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h2>{t(language, "電商團購爆單文案與防客訴規格機", "Group-Buy Deal & Sales Copy Engine")}</h2>
              <span style={{ fontSize: "10px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#ffffff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>PRO</span>
            </div>
            <p>{t(language, "專為電商賣家、團購主打造！自動試算現省折扣、台灣廣告法規避雷審查、私訊轉單腳本與防客訴條款。", "Generate high-converting e-commerce copy, Taiwan legal risk shield, DM conversion flow.")}</p>
          </div>
        </div>
      </div>

      {/* 商業計算看板 (Apple HIG 雙色精緻面板) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", margin: "16px 0", padding: "14px", borderRadius: "12px", background: "var(--canvas)", border: "1px solid var(--line)" }}>
        <div>
          <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>市售原價</span>
          <strong style={{ fontSize: "16px", color: "var(--muted)", textDecoration: "line-through" }}>NT$ {orig.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "var(--purple)", display: "block", marginBottom: "4px", fontWeight: 700 }}>🔥 團購限定特價</span>
          <strong style={{ fontSize: "20px", color: "var(--purple)", fontWeight: 800 }}>NT$ {deal.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#16a34a", display: "block", marginBottom: "4px", fontWeight: 700 }}>現省金額 (折扣)</span>
          <strong style={{ fontSize: "16px", color: "#16a34a", fontWeight: 700 }}>省 ${savings} ({discountPct}% OFF)</strong>
        </div>
      </div>

      {/* 🛡️ 台灣廣告法規避雷審查提示條 */}
      {detectedRisks.length > 0 ? (
        <div style={{ padding: "12px 14px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 700 }}>
              ⚠️ 偵測到 {detectedRisks.length} 處潛在法規違規詞（衛生局開罰風險 NT$ 40,000 起）：
            </span>
            <button
              type="button"
              onClick={handleAutoFixRisks}
              style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #b91c1c", background: "#b91c1c", color: "#fff", fontSize: "11px", fontWeight: 650, cursor: "pointer" }}
            >
              ⚡ 一鍵替換為衛福部安全合規詞
            </button>
          </div>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {detectedRisks.map((r) => (
              <span key={r.term} style={{ fontSize: "11px", background: "#fff", padding: "2px 8px", borderRadius: "4px", border: "1px solid #fca5a5", color: "#991b1b" }}>
                「{r.term}」➔ 建議改為「{r.replace}」（{r.law}）
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>
            ✓ 台灣廣告法規審查通過：未發現療效宣稱或違反食安法、化粧品法之高危險字詞
          </span>
        </div>
      )}

      {/* 填寫開團資料 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600, display: "block", marginBottom: "6px" }}>商品名稱</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)" }}
          />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600, display: "block", marginBottom: "6px" }}>原價 (NT$)</label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", color: "var(--purple)", fontWeight: 700, display: "block", marginBottom: "6px" }}>團購價 (NT$)</label>
            <input
              type="number"
              value={dealPrice}
              onChange={(e) => setDealPrice(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--purple)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)", fontWeight: 700 }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600, display: "block", marginBottom: "6px" }}>滿額贈品與免運門檻</label>
        <input
          type="text"
          value={shippingBonus}
          onChange={(e) => setShippingBonus(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600, display: "block", marginBottom: "6px" }}>三大必買賣點（一行一個）</label>
        <textarea
          rows={3}
          value={sellingPoints}
          onChange={(e) => setSellingPoints(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600, display: "block", marginBottom: "6px" }}>現貨庫存與急迫感文字</label>
        <input
          type="text"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)" }}
        />
      </div>

      {/* 防客訴條款勾選區 */}
      <div style={{ padding: "12px 14px", borderRadius: "10px", background: "var(--paper)", border: "1px solid var(--line)", marginBottom: "16px" }}>
        <span style={{ fontSize: "11px", color: "var(--purple)", fontWeight: 700, display: "block", marginBottom: "8px" }}>
          🛡️ 防客訴與交易保障條款（自動生成至文案末端，杜絕買賣糾紛）：
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
          <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--ink)" }}>
            <input type="checkbox" checked={disputeChecks.shippingDays} onChange={(e) => setDisputeChecks({ ...disputeChecks, shippingDays: e.target.checked })} />
            明確出貨工作天
          </label>
          <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--ink)" }}>
            <input type="checkbox" checked={disputeChecks.unboxingVideo} onChange={(e) => setDisputeChecks({ ...disputeChecks, unboxingVideo: e.target.checked })} />
            開箱全程錄影提醒
          </label>
          <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--ink)" }}>
            <input type="checkbox" checked={disputeChecks.hygienePolicy} onChange={(e) => setDisputeChecks({ ...disputeChecks, hygienePolicy: e.target.checked })} />
            個人衛生拆封規範
          </label>
          <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--ink)" }}>
            <input type="checkbox" checked={disputeChecks.warranty} onChange={(e) => setDisputeChecks({ ...disputeChecks, warranty: e.target.checked })} />
            猶豫期非試用期說明
          </label>
        </div>
      </div>

      {/* 平台切換 Tabs (含全新 DM Flow 轉單腳本) */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("line")}
          style={{ padding: "8px 12px", borderRadius: "8px", border: activeTab === "line" ? "1.5px solid var(--purple)" : "1px solid var(--line)", background: activeTab === "line" ? "var(--purple-soft)" : "var(--canvas)", color: activeTab === "line" ? "var(--purple)" : "var(--ink)", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
        >
          📱 LINE 團購推播版
        </button>
        <button
          onClick={() => setActiveTab("ig")}
          style={{ padding: "8px 12px", borderRadius: "8px", border: activeTab === "ig" ? "1.5px solid var(--purple)" : "1px solid var(--line)", background: activeTab === "ig" ? "var(--purple-soft)" : "var(--canvas)", color: activeTab === "ig" ? "var(--purple)" : "var(--ink)", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
        >
          📸 IG / Threads 帶貨版
        </button>
        <button
          onClick={() => setActiveTab("fb")}
          style={{ padding: "8px 12px", borderRadius: "8px", border: activeTab === "fb" ? "1.5px solid var(--purple)" : "1px solid var(--line)", background: activeTab === "fb" ? "var(--purple-soft)" : "var(--canvas)", color: activeTab === "fb" ? "var(--purple)" : "var(--ink)", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
        >
          📋 FB / 賣場防客訴完整版
        </button>
        <button
          onClick={() => setActiveTab("dm")}
          style={{ padding: "8px 12px", borderRadius: "8px", border: activeTab === "dm" ? "1.5px solid #059669" : "1px solid var(--line)", background: activeTab === "dm" ? "#ecfdf5" : "var(--canvas)", color: activeTab === "dm" ? "#059669" : "var(--ink)", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
        >
          💬 留言轉單私訊腳本 (DM Flow)
        </button>
      </div>

      {/* 產出預覽與一鍵複製 */}
      <div style={{ position: "relative" }}>
        <textarea
          readOnly
          rows={10}
          value={generatedCopy}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)", lineHeight: 1.6, outline: "none", resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
          {!isPro ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--purple)", fontWeight: 600 }}>
              <span>👑 此為 Pro 商業版旗艦工具（電商開團、法規避雷、私訊轉單腳本）</span>
            </div>
          ) : (
            <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>✓ 已開通 Pro 專業商業授權</span>
          )}

          <button
            onClick={handleCopy}
            style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "var(--purple)", color: "#ffffff", fontSize: "13px", fontWeight: 650, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            {isPro ? (copied === generatedCopy ? "✓ 已複製文案" : "⚡ 一鍵複製爆單文案") : "🔒 升級 Pro 一鍵複製"}
          </button>
        </div>
      </div>
    </div>
  );
}


// 實戰爆款庫資料
const SWIPE_TEMPLATES = [
  {
    id: "threads-mindset",
    category: "Threads 破萬讚",
    title: "反常識人生體悟",
    hook: "在職場/生活混了幾年後，我悟出一個很不政治正確的道理：",
    template: "在職場/生活混了幾年後，我悟出一個很不政治正確的道理：\n\n很多人以為「努力」最重要，但實際上：\n01 / 選擇遠比努力重要 10 倍\n02 / 懂得說「不」的人，往往混得比有求必應的人更好\n03 / 內耗最嚴重的時候，通常是因為你把別人的眼光看得比自己的目標重要\n\n生活不是拿來證明給別人看的，而是拿來讓自己舒服的。✨\n\n💬 你的看法呢？你也在哪一刻突然想通了這件事？👇🏼\n\n#Threads日常 #思考隨筆 #個人成長 #職場觀察"
  },
  {
    id: "threads-burnout",
    category: "Threads 破萬讚",
    title: "社畜優雅崩潰共鳴",
    hook: "改了 5 次草稿之後，我終於明白了一個大人的生存法則：",
    template: "改了 5 次草稿之後，我終於明白了一個大人的生存法則：\n\n禮貌微笑，點頭稱是，準時下班。🫠\n\n我們不是沒有熱情，只是把熱情留給真正值得的人事物。今晚麻辣鍋已就位，工作放一邊，快樂第一名！🏃‍♂️💨💼🍻\n\n─── ⋆⋅☆⋅⋆ ───\n#社畜日常 #優雅崩潰 #下班萬歲 #Threads吐嘈"
  },
  {
    id: "groupbuy-urgent",
    category: "團媽開團爆單",
    title: "限時結單緊急倒數（催單神文）",
    hook: "【最後倒數 6 小時】現貨真的快被掃光了！",
    template: "🔥【最後倒數 6 小時｜限量結單公告】\n\n很多人私訊小編問還能不能追加，真的對不起大家！廠商給的這批特惠現貨已經剩下最後個位數 ⚡️\n\n🛒 團購重點最後確認：\n• 市售原價：NT$ {原價}\n• 本團專屬開團價：NT$ {團購價}（現省 ${現省}）\n• 滿額免運：滿 $1,500 即享免運送到家\n\n⚠️ 今晚 23:59 準時關閉賣場，錯過這檔就要等下一季預購了！\n👇🏼 把握最後現貨下單：\nhttps://deal.cooklabai.com/order/now"
  },
  {
    id: "groupbuy-price",
    category: "團媽開團爆單",
    title: "原價 vs 團購價極致對比（算給你看）",
    hook: "算給你看！為什麼這檔團購一定要跟？",
    template: "算給你看！為什麼這檔【{商品品名}】一定要跟？💸\n\n去專櫃/官網單買：NT$ {原價}\n在我們社群跟團：NT$ {團購價}！\n直接現省 NT$ {現省}，相當於打了 {折扣} 折！等於省下一頓大餐的錢 🥹\n\n✨ 3 個必搶理由：\n1. 專利極致輕量，出門無負擔\n2. 經檢驗合格，全台原廠正品保固\n3. 首波下單再加贈專屬收納袋\n\n留言「+1」小編私訊你專屬免運折扣碼！👇🏼"
  },
  {
    id: "ig-cozy",
    category: "IG 氛圍生活",
    title: "私藏好店探店提案",
    hook: "本來私心不想公開的古宅咖啡廳... ☕️",
    template: "☁️ 找一個下午，把靈魂留給這裡。\n\n本來私心不想公開這間藏在大安區巷弄的古宅咖啡廳，但窗邊灑進來的光線真的太溫柔了。✨\n\n▪ 抹茶戚風：甜度剛剛好，茶香濃郁\n▪ 窗邊座位：適合獨處看書，陽光極致治癒\n\n在這個快節奏的城市裡，留給自己一段清空大腦的微光時刻。🌸\n\n─── ♡ ───\n#日常美學 #探店提案 #生活紀錄 #質感隨筆"
  }
];

function SwipeFileTool({ copied, setCopied, language, isPro, onRequirePro }: { copied: string; setCopied: (v: string) => void; language: Language; isPro: boolean; onRequirePro: () => void }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(SWIPE_TEMPLATES[0]);

  const categories = ["all", "Threads 破萬讚", "團媽開團爆單", "IG 氛圍生活"];
  const filtered = activeCategory === "all" ? SWIPE_TEMPLATES : SWIPE_TEMPLATES.filter(t => t.category === activeCategory);

  const handleCopy = (text: string) => {
    if (!isPro) {
      onRequirePro();
      return;
    }
    copyText(text, setCopied);
    trackCopyAction("swipe");
  };

  return (
    <div className="tool-card">
      <div className="tool-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="tool-icon">📚</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h2>{t(language, "實戰爆款文案庫（直接抄作業）", "Viral Social Swipe File")}</h2>
              <span style={{ fontSize: "10px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#ffffff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>PRO</span>
            </div>
            <p>{t(language, "精選台灣 Threads 破萬愛心熱門架構、團購破百萬爆單模板，不需從零發想，一鍵直接套用！", "Proven viral copy templates for Threads, Instagram, and group-buys.")}</p>
          </div>
        </div>
      </div>

      {/* 分類篩選 */}
      <div style={{ display: "flex", gap: "8px", margin: "14px 0", flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            style={{ padding: "6px 12px", borderRadius: "8px", border: activeCategory === c ? "1.5px solid var(--purple)" : "1px solid var(--line)", background: activeCategory === c ? "var(--purple-soft)" : "var(--canvas)", color: activeCategory === c ? "var(--purple)" : "var(--ink)", fontSize: "12px", fontWeight: 650, cursor: "pointer" }}
          >
            {c === "all" ? "全部精選" : c}
          </button>
        ))}
      </div>

      {/* 模板網格與預覽 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedTemplate(item)}
            style={{ padding: "14px", borderRadius: "12px", background: selectedTemplate.id === item.id ? "var(--purple-soft)" : "var(--canvas)", border: selectedTemplate.id === item.id ? "1.5px solid var(--purple)" : "1px solid var(--line)", cursor: "pointer", transition: "all 0.15s ease" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", color: "var(--purple)", fontWeight: 700, background: "var(--paper)", padding: "2px 6px", borderRadius: "4px" }}>{item.category}</span>
            </div>
            <strong style={{ fontSize: "13px", color: "var(--ink)", display: "block", marginBottom: "4px" }}>{item.title}</strong>
            <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, lineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>
              {item.hook}
            </p>
          </div>
        ))}
      </div>

      {/* 展開編輯與套用 */}
      <div style={{ padding: "16px", borderRadius: "14px", background: "var(--paper)", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <strong style={{ fontSize: "13px", color: "var(--ink)" }}>📋 目前選擇：{selectedTemplate.title}</strong>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>可直接複製或替換主詞後發文</span>
        </div>
        <textarea
          rows={9}
          value={selectedTemplate.template}
          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, template: e.target.value })}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)", lineHeight: 1.6, resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
          {!isPro ? (
            <span style={{ fontSize: "12px", color: "var(--purple)", fontWeight: 600 }}>👑 Pro 商業版解鎖完整爆款庫一鍵複製</span>
          ) : (
            <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>✓ 已開通 Pro 授權</span>
          )}
          <button
            onClick={() => handleCopy(selectedTemplate.template)}
            style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "var(--purple)", color: "#fff", fontSize: "13px", fontWeight: 650, cursor: "pointer" }}
          >
            {isPro ? (copied === selectedTemplate.template ? "✓ 已複製到剪貼簿" : "⚡ 一鍵複製爆款文案") : "🔒 升級 Pro 一鍵複製"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 台灣在地用語與法規避雷器
const MAINLAND_WORDS: { from: string; to: string; note: string }[] = [
  { from: "視頻", to: "影片", note: "台灣慣用「影片 / 短影音」" },
  { from: "質量", to: "品質", note: "台灣物體特質慣用「品質 / 質感」" },
  { from: "立馬", to: "立刻", note: "台灣慣用「立刻 / 馬上」" },
  { from: "走心", to: "用心", note: "台灣慣用「用心 / 觸動人心」" },
  { from: "給力", to: "很罩", note: "台灣慣用「很棒 / 超罩」" },
  { from: "網紅", to: "KOL", note: "台灣社群多用「創作者 / KOL」" },
  { from: "忽悠", to: "糊弄", note: "台灣慣用「糊弄 / 欺騙」" },
  { from: "打call", to: "支持", note: "台灣慣用「大力支持 / 加油」" },
  { from: "拔草", to: "退坑", note: "台灣慣用「滅火 / 滅坑」" },
  { from: "種草", to: "被燒到", note: "台灣慣用「被推坑 / 被燒到」" },
  { from: "接地氣", to: "在地親民", note: "台灣慣用「親民 / 在地」" },
  { from: "貓膩", to: "蹊蹺", note: "台灣慣用「蹊蹺 / 古怪」" },
  { from: "軟件", to: "軟體", note: "台灣科技用語「軟體」" },
  { from: "硬件", to: "硬體", note: "台灣科技用語「硬體」" },
  { from: "高清", to: "高畫質", note: "台灣影音用語「高畫質 / HD」" },
  { from: "硬盤", to: "硬碟", note: "台灣用語「硬碟」" },
  { from: "屏幕", to: "螢幕", note: "台灣用語「螢幕」" },
  { from: "鏈接", to: "連結", note: "台灣網址用語「連結」" },
  { from: "打印", to: "列印", note: "台灣辦公用語「列印」" },
  { from: "信息", to: "訊息", note: "台灣訊息用語「訊息」" },
  { from: "項目", to: "專案", note: "台灣商業用語「專案 / 計畫」" },
  { from: "立項", to: "啟動", note: "台灣商業用語「啟動 / 立案」" },
  { from: "充電寶", to: "行動電源", note: "台灣生活用語「行動電源」" },
  { from: "U盤", to: "隨身碟", note: "台灣生活用語「隨身碟」" },
  { from: "雙肩包", to: "後背包", note: "台灣生活用語「後背包」" },
  { from: "衛衣", to: "帽T", note: "台灣服飾用語「帽T / 大學T」" },
  { from: "外賣", to: "外送", note: "台灣生活用語「外送」" },
  { from: "盒飯", to: "便當", note: "台灣飲食用語「便當」" },
];

function LocalizeTool({ copied, setCopied, language, isPro, onRequirePro }: { copied: string; setCopied: (v: string) => void; language: Language; isPro: boolean; onRequirePro: () => void }) {
  const [input, setInput] = useState("這款質量極佳的視頻神器，立馬讓你的項目走心又給力！保證見效還能排毒瘦身，消炎效果絕頂，鏈接在下方！");
  const [output, setOutput] = useState("");

  const detectedMainland = useMemo(() => {
    return MAINLAND_WORDS.filter(w => input.includes(w.from));
  }, [input]);

  const detectedLegal = useMemo(() => {
    return LEGAL_RISKS.filter(r => input.includes(r.term));
  }, [input]);

  const handleConvert = () => {
    let result = input;
    // Replace mainland terms
    for (const w of MAINLAND_WORDS) {
      result = result.split(w.from).join(w.to);
    }
    // Replace legal risks
    for (const r of LEGAL_RISKS) {
      result = result.split(r.term).join(r.replace);
    }
    setOutput(result);
  };

  const handleCopy = () => {
    if (!isPro) {
      onRequirePro();
      return;
    }
    copyText(output || input, setCopied);
    trackCopyAction("localize");
  };

  return (
    <div className="tool-card">
      <div className="tool-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="tool-icon">🇹🇼</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h2>{t(language, "台灣用語與法規避雷器", "Taiwan Voice & Legal Sanitizer")}</h2>
              <span style={{ fontSize: "10px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#ffffff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>PRO</span>
            </div>
            <p>{t(language, "自動過濾大陸支語（視頻、質量、立馬等），並掃描衛福部食品/化粧品廣告法規違規詞，一鍵轉為 100% 台灣正統繁體美學文案！", "Cleanse mainland buzzwords and illegal advertising terms into natural Taiwanese.")}</p>
          </div>
        </div>
      </div>

      {/* 掃描狀態儀表板 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", margin: "14px 0" }}>
        <div style={{ padding: "12px 14px", borderRadius: "10px", background: detectedMainland.length > 0 ? "#fef3c7" : "var(--canvas)", border: "1px solid var(--line)" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>🇨🇳 大陸用語偵測</span>
          <strong style={{ fontSize: "18px", color: detectedMainland.length > 0 ? "#d97706" : "var(--ink)" }}>
            {detectedMainland.length} 處用語
          </strong>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: "10px", background: detectedLegal.length > 0 ? "#fee2e2" : "var(--canvas)", border: "1px solid var(--line)" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", display: "block" }}>⚠️ 衛福部罰鍰風險詞 (4萬~40萬)</span>
          <strong style={{ fontSize: "18px", color: detectedLegal.length > 0 ? "#dc2626" : "var(--ink)" }}>
            {detectedLegal.length} 處違規風險
          </strong>
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
          貼入待檢測文案（支援 ChatGPT、小紅書或草稿內容）：
        </label>
        <textarea
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="貼上文字，系統將自動標記大陸支語與廣告違法詞彙..."
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}
        />
      </div>

      <button
        onClick={handleConvert}
        style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "var(--purple)", color: "#fff", border: "none", fontSize: "14px", fontWeight: 650, cursor: "pointer", marginBottom: "16px" }}
      >
        ⚡ 一鍵轉為 100% 正統台灣繁體質感合規文案
      </button>

      {/* 成果與一鍵複製 */}
      {!!output && (
        <div style={{ padding: "14px", borderRadius: "12px", background: "var(--paper)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>✓ 轉換完成：已完全消除大陸支語與法規罰款雷區</span>
          </div>
          <textarea
            readOnly
            rows={5}
            value={output}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            {!isPro ? (
              <span style={{ fontSize: "12px", color: "var(--purple)", fontWeight: 600 }}>👑 Pro 商業版解鎖一鍵複製</span>
            ) : (
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>✓ 已開通 Pro 授權</span>
            )}
            <button
              onClick={handleCopy}
              style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "var(--purple)", color: "#fff", fontSize: "13px", fontWeight: 650, cursor: "pointer" }}
            >
              {isPro ? (copied === output ? "✓ 已複製文案" : "⚡ 一鍵複製合規文案") : "🔒 升級 Pro 一鍵複製"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AIPostTool({ copied, setCopied, language, selectTool, isPro = false, onRequirePro }: { copied: string; setCopied: (v: string) => void; language: Language; selectTool?: (id: ToolId) => void; isPro?: boolean; onRequirePro?: () => void }) {
  const tones = [
    {
      id: "auto",
      name: "自動匹配（推薦）",
      nameEn: "Auto match",
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
    { title: "風扇商品開團", titleEn: "Fan product launch", idea: "質感極簡風扇限時開團！雙重涼感極致靜音，原價 $1580 限時優惠折 $200", ideaEn: "A minimalist quiet cooling fan is launching for a limited time, with a practical dual-cooling design and a $200 introductory discount." },
    { title: "古宅咖啡廳探店", titleEn: "Vintage café visit", idea: "今天去大安區古宅咖啡廳，抹茶拿鐵很香，窗邊陽光很美，適合獨處看書", ideaEn: "I visited a vintage café today. The matcha latte was fragrant, the window light was beautiful, and it felt perfect for reading alone." },
    { title: "Threads 思考紀錄", titleEn: "Threads reflection", idea: "最近發現把心態放慢之後，工作效率反而變高了，想聊聊這個體悟", ideaEn: "I have noticed that slowing down mentally has actually made me more productive, and I want to share what changed." },
    { title: "社畜下班吐嘈", titleEn: "After-work humor", idea: "改完第 5 版草稿，終於可以下班去吃麻辣鍋放空了", ideaEn: "After finishing the fifth revision, I can finally log off, get dinner, and let my brain rest." }
  ];

  const viralHooks = [
    { zh: "🔥【千萬別再...】", en: "🔥 Stop doing this if you want to..." },
    { zh: "💡【關於最近的一個小思考...】", en: "💡 A small thought I keep coming back to..." },
    { zh: "✨【如果你也在經歷... 請花 1 分鐘看完】", en: "✨ If you are going through this too, read this..." },
    { zh: "🛒【限時搶購倒數｜獨家優惠】", en: "🛒 Limited-time offer—here is what to know" },
    { zh: "🫠【改了 5 版草稿之後，我悟出了一個道理...】", en: "🫠 After five revisions, I finally realized..." },
    { zh: "✦【今天終於可以分享這個秘密了...】", en: "✦ I can finally share this little secret..." }
  ];

  const [selectedTone, setSelectedTone] = useState("auto");
  const [idea, setIdea] = useState(() => t(language, "今天去大安區古宅咖啡廳，抹茶拿鐵很香，窗邊陽光很美，適合獨處看書", "I visited a vintage café today. The matcha latte was fragrant, the window light was beautiful, and it felt perfect for reading alone."));
  const [output, setOutput] = useState("");
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [persona, setPersona] = useState<BrandPersona>(() => {
    try {
      const raw = localStorage.getItem("textlab.brand_persona");
      return raw ? JSON.parse(raw) : { enabled: false, brandName: "", targetAudience: "", customSlogan: "", customHashtags: "" };
    } catch {
      return { enabled: false, brandName: "", targetAudience: "", customSlogan: "", customHashtags: "" };
    }
  });

  const savePersona = (updated: BrandPersona) => {
    setPersona(updated);
    try {
      localStorage.setItem("textlab.brand_persona", JSON.stringify(updated));
    } catch {}
  };

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

  const generatePost = async () => {
    // 防連點與防空內容鎖定 (Anti-double click & cooldown guard)
    if (!idea.trim() || isGenerating || cooldownSec > 0) return;

    // 免費每日額度檢測 (Free daily limit guard)
    const limitCheck = checkDailyAiLimit();
    if (!limitCheck.allowed) {
      if (onRequirePro) onRequirePro();
      return;
    }

    // 重複請求攔截 (Deduplication Check)
    const currentRequestKey = `${selectedTone}::${language}::${idea.trim()}`;
    if (currentRequestKey === lastRequestKey && output) {
      setErrorMessage(t(language, "💡 內容與風格沒有變更，已保留目前成果，避免重複使用免費額度。", "💡 Your content and style have not changed, so the current result is kept to save the free quota."));
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    // 優先使用 Cloudflare Workers AI 免費額度；失敗或達上限時自動改用本機產生器。
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "post", input: persona.enabled && persona.brandName ? `【品牌設定：${persona.brandName}｜受眾：${persona.targetAudience}｜Slogan：${persona.customSlogan}】\n${idea.trim()}` : idea.trim(), tone: selectedTone, language }),
        signal: controller.signal
      });
      const data: unknown = await response.json();
      if (response.ok && data && typeof data === "object" && "output" in data && typeof data.output === "string" && data.output.trim()) {
        setOutput(data.output.trim());
        incrementDailyAiUsage();
        setLastRequestKey(currentRequestKey);
        setIsGenerating(false);
        setCooldownSec(3);
        return;
      }
      throw new Error(`AI request failed: ${response.status}`);
    } catch {
      setErrorMessage(t(language, "免費 AI 暫時忙碌或今日額度已滿，已自動改用本機產生器，不會產生費用。", "Free AI is busy or today's quota is full. Switched to the local generator automatically—no charge."));
    } finally {
      window.clearTimeout(timeoutId);
    }

    setTimeout(() => {
      let result = "";
      const text = idea.trim() || "紀錄這份當下的美好。";
      const timestampSeed = Date.now();
      const variantIdx = timestampSeed % 3;

      if (language === "en") {
        const englishStyles: Record<string, { hooks: string[]; bridges: string[]; closings: string[]; tags: string }> = {
          auto: {
            hooks: ["✦ A thought worth sharing", "💬 Today’s small discovery", "✨ A moment I wanted to remember"],
            bridges: ["Here’s what stood out to me:", "The detail that made the biggest difference:", "My honest takeaway:"],
            closings: ["What would you add to this?", "Save this for later, and share it with someone who might relate.", "Sometimes the simplest moments leave the strongest impression."],
            tags: "#DailyNotes #CreativeThoughts #LifeInspiration #SocialPost"
          },
          cozy: {
            hooks: ["☁️ A quiet note from today", "🍃 Slow moments, soft thoughts", "✦ Finding beauty in the everyday"],
            bridges: ["A small detail I want to hold onto:", "This was my reminder to slow down:", "Today felt a little softer because of this:"],
            closings: ["Here’s to making room for more gentle moments.", "A little pause can change the whole rhythm of a day.", "Saving this feeling for the days that move too fast."],
            tags: "#SlowLiving #CozyMoments #DailyJournal #SimpleJoy"
          },
          threads: {
            hooks: ["A thought I can’t stop thinking about:", "Hot take—or maybe just an honest observation:", "Something clicked for me today:"],
            bridges: ["The short version:", "Here’s why I think it matters:", "The part nobody talks about enough:"],
            closings: ["Do you agree, or see it differently?", "Curious how this looks from your side.", "What has your experience been?"],
            tags: "#Threads #ConversationStarter #Perspective #CreatorNotes"
          },
          line: {
            hooks: ["📢 Community update", "⚡ Quick announcement", "✨ A helpful update for everyone"],
            bridges: ["Here are the key details:", "What you need to know:", "Quick summary:"],
            closings: ["Reply in the group if you have any questions.", "Please share this update with anyone who may need it.", "Save this message so you can find the details easily."],
            tags: "#CommunityUpdate #Announcement #StayConnected"
          },
          sales: {
            hooks: ["🛍️ A practical find worth a closer look", "✨ Why this stands out", "🔥 A timely pick for anyone who needs this"],
            bridges: ["The value is in the details:", "Three reasons it may be a good fit:", "Here’s the benefit at a glance:"],
            closings: ["Check the verified product details before ordering.", "Save this comparison for when you’re ready to decide.", "Choose based on what genuinely fits your needs."],
            tags: "#ProductFind #SmartShopping #WorthConsidering #BuyerGuide"
          },
          redbook: {
            hooks: ["✨ An aesthetic find I’d genuinely recommend", "✦ A little lifestyle upgrade", "♡ Saved to my inspiration list"],
            bridges: ["What makes it memorable:", "The details I liked most:", "My honest experience:"],
            closings: ["Save this idea for your next inspiration day.", "Would this make your list too?", "A simple idea, but the atmosphere makes all the difference."],
            tags: "#LifestyleInspo #AestheticFinds #DailyDiscovery #Inspiration"
          },
          pro: {
            hooks: ["💡 Professional note", "✦ A lesson from the work", "⚙️ A practical takeaway"],
            bridges: ["The core observation:", "What the experience taught me:", "The principle worth keeping:"],
            closings: ["01 / Clarify the real problem\n02 / Improve one step at a time", "01 / Focus on the useful signal\n02 / Review and refine", "01 / Keep the process simple\n02 / Measure what actually matters"],
            tags: "#ProfessionalGrowth #WorkNotes #PracticalInsight #ContinuousImprovement"
          },
          humor: {
            hooks: ["🫠 Today’s highly professional survival update", "☕ Current status: powered by deadlines", "💼 A small win from the corporate wilderness"],
            bridges: ["The situation, in one sentence:", "Today’s plot twist:", "What happened next was extremely on-brand:"],
            closings: ["Anyway, we survived—and that deserves a snack.", "Logging off before someone discovers another revision.", "Polite smile. Save file. Go home."],
            tags: "#WorkHumor #OfficeLife #Relatable #AfterWork"
          }
        };
        const style = englishStyles[selectedTone] || englishStyles.auto;
        result = `${style.hooks[variantIdx]}\n\n${style.bridges[variantIdx]}\n${text}\n\n${style.closings[variantIdx]} ✨\n\n${style.tags}`;
      } else if (selectedTone === "auto") {
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
            {t(language, "🔥 一鍵套用社群爆款 Hook 勾魂開頭：", "🔥 Add a scroll-stopping hook:")}
          </span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {viralHooks.map((hk) => {
              const hookText = t(language, hk.zh, hk.en);
              return (
              <button
                key={hk.zh}
                type="button"
                onClick={() => setIdea((prev) => `${hookText}\n${prev}`)}
                style={{ border: "1px solid var(--purple-soft)", background: "var(--purple-soft)", color: "var(--purple-dark)", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
              >
                + {hookText}
              </button>
              );
            })}
          </div>
        </div>

        {/* 💼 品牌專屬聲線檔案室 */}
        <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: persona.enabled ? "var(--purple-soft)" : "var(--canvas)", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>💼</span>
            <div>
              <strong style={{ fontSize: "12px", color: persona.enabled ? "var(--purple)" : "var(--ink)", display: "block" }}>
                {t(language, "品牌專屬聲線", "Brand Voice Persona")}: {persona.enabled ? (persona.brandName || t(language, "已啟用", "Enabled")) : t(language, "未啟用 (點擊設定)", "Off (Click to setup)")}
              </strong>
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                {persona.enabled ? t(language, "發文將自動帶入品牌調性、受眾與專屬 Slogan", "Posts adapt to brand tone & audience") : t(language, "設定一次品牌受眾與語氣，AI 發文更有靈魂", "Personalize AI output with your voice")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isPro && onRequirePro) {
                onRequirePro();
                return;
              }
              setPersonaOpen(!personaOpen);
            }}
            style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
          >
            {personaOpen ? t(language, "收合設定", "Collapse") : t(language, "⚙️ 設定品牌聲線", "⚙️ Configure")}
          </button>
        </div>

        {personaOpen && (
          <div style={{ padding: "14px", borderRadius: "12px", background: "var(--paper)", border: "1px solid var(--line)", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <strong style={{ fontSize: "12px", color: "var(--ink)" }}>{t(language, "品牌檔案設定", "Brand Persona Settings")}</strong>
              <label style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={persona.enabled}
                  onChange={(e) => savePersona({ ...persona, enabled: e.target.checked })}
                />
                <span style={{ fontWeight: 600, color: persona.enabled ? "var(--purple)" : "var(--muted)" }}>
                  {t(language, "啟用此品牌聲線", "Enable Brand Persona")}
                </span>
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{t(language, "品牌 / 帳號名稱", "Brand Name")}</label>
                <input
                  type="text"
                  value={persona.brandName}
                  onChange={(e) => savePersona({ ...persona, brandName: e.target.value })}
                  placeholder="例：拾光手作、小編日常"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "12px", color: "var(--ink)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{t(language, "目標受眾群 (Audience)", "Target Audience")}</label>
                <input
                  type="text"
                  value={persona.targetAudience}
                  onChange={(e) => savePersona({ ...persona, targetAudience: e.target.value })}
                  placeholder="例：注重生活儀式感的上班族"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "12px", color: "var(--ink)" }}
                />
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{t(language, "專屬結尾 Slogan 或金句", "Custom Slogan")}</label>
              <input
                type="text"
                value={persona.customSlogan}
                onChange={(e) => savePersona({ ...persona, customSlogan: e.target.value })}
                placeholder="例：生活很難，但文字可以很溫柔。"
                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--canvas)", fontSize: "12px", color: "var(--ink)" }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", width: "100%", fontWeight: 650 }}>
            {t(language, "💡 點選範例快速試用：", "💡 Try a sample idea:")}
          </span>
          {presets.map((p) => (
            <button
              key={p.title}
              onClick={() => { setIdea(t(language, p.idea, p.ideaEn)); }}
              style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--muted)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer" }}
            >
              {t(language, p.title, p.titleEn)}
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
            ? t(language, "正在整理…", "Writing…")
            : cooldownSec > 0
            ? t(language, `⏳ 冷卻保護中 (${cooldownSec}s)`, `⏳ Cooldown (${cooldownSec}s)`)
            : t(language, "產生貼文", "Create post")}
        </button>
      </div>

      {/* 生成結果卡片 */}
      {!!output && (
        <div className="input-card">
          <div className="field-label">
            <strong style={{ fontSize: "14px", color: "var(--purple)" }}>
              {t(language, "貼文成果", "Your post")}
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
                            <button type="button" onClick={() => setCarouselOpen(true)} style={{ border: "1px solid var(--purple)", background: "var(--purple-soft)", color: "var(--purple)", borderRadius: "8px", padding: "5px 9px", fontSize: "11px", cursor: "pointer", fontWeight: 650 }}>
                📑 切為 IG 輪播字卡
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
{carouselOpen && <CarouselModal text={output} language={language} onClose={() => setCarouselOpen(false)} onCopy={(val) => copyText(val, setCopied)} />}
    </>
  );
}

function EmptyState({ text }: { text: string }) { return <div className="empty-state"><span>⌕</span><p>{text}</p></div>; }

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
      <div className="guide-tools">{tools.map((tool) => <button key={tool.id} onClick={() => onSelectTool(tool.id)}><span className="tool-icon">{tool.icon}</span><span><strong>{t(language, tool.name, tool.nameEn)}</strong><small>{t(language, tool.short, tool.shortEn)}</small></span><i>→</i></button>)}</div>
      <div className="guide-bottom"><div className="guide-privacy"><span>✦</span><div><strong>{t(language, "清楚的資料使用方式", "Clear data handling")}</strong><p>{t(language, "一般文字工具都在瀏覽器完成。只有 AI 貼文助手會把你送出的內容交由 Cloudflare Workers AI 處理；本站不儲存該內容。最近使用與收藏只保存在目前瀏覽器。", "Regular text tools run in your browser. Only the AI Post Assistant sends submitted text to Cloudflare Workers AI for processing; this site does not store that content. Recents and favorites stay in this browser.")}</p></div></div><div className="guide-faq"><strong>{t(language, "常見問題", "Quick answers")}</strong><p><span>{t(language, "AI 生成需要費用嗎？", "Does AI generation cost anything?")}</span>{t(language, "訪客完全免費，不需 API 金鑰或信用卡；免費額度不足時會自動切換本機產生器。", "It is free for visitors with no API key or credit card. When the free quota is unavailable, it automatically switches to the local generator.")}</p><p><span>{t(language, "複製後沒反應？", "Copy not working?")}</span>{t(language, "確認瀏覽器已允許剪貼簿權限，或改用其他瀏覽器。", "Allow clipboard access or try another browser.")}</p><p><span>{t(language, "哪些平台能用？", "Where can I use it?")}</span>{t(language, "大多數支援 Unicode 的社群、文件與遊戲都能使用。", "Most social apps, documents and games that support Unicode.")}</p></div></div>
    </section>
  </div>;
}

function StatsModal({ language, onClose }: { language: Language; onClose: () => void }) {
  const [authed, setAuthed] = useState<boolean>(() => {
    return typeof window !== "undefined" && sessionStorage.getItem("textlab.stats_token") === "kiss9988";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<LiveStatsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async (pwd: string) => {
    setLoading(true);
    const res = await fetchLiveStats(pwd);
    if (res.success && res.data) {
      setStats(res.data);
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setAuthed(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) {
      loadData("kiss9988");
    }
  }, [authed]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "kiss9988") {
      sessionStorage.setItem("textlab.stats_token", "kiss9988");
      loadData("kiss9988");
    } else {
      setError(true);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem("textlab.stats_token");
    setAuthed(false);
    setPassword("");
    setStats(null);
  };

  if (!authed) {
    return (
      <div className="guide-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <section className="guide-modal" role="dialog" aria-modal="true" style={{ maxWidth: "380px", textAlign: "center", padding: "32px 24px" }}>
          <button className="guide-close" onClick={onClose} aria-label="Close">×</button>
          <div style={{ width: "52px", height: "52px", borderRadius: "26px", background: "var(--purple-soft)", color: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "22px" }}>
            🔒
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--ink)" }}>
            {t(language, "即時流量數據中心", "Analytics Protected")}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 20px 0", lineHeight: 1.5 }}>
            {t(language, "此為站長專屬管理介面，請輸入安全密碼以檢視即時流量與轉換數據。", "Restricted dashboard. Enter security key to view live traffic.")}
          </p>

          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder={t(language, "輸入密碼", "Enter password")}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: error ? "1.5px solid #e5484d" : "1px solid var(--line)",
                background: "var(--canvas)",
                fontSize: "14px",
                color: "var(--ink)",
                textAlign: "center",
                letterSpacing: "2px",
                outline: "none"
              }}
            />
            {error && (
              <span style={{ fontSize: "12px", color: "#e5484d", fontWeight: 500 }}>
                {t(language, "密碼錯誤，請重新輸入", "Incorrect key, please try again")}
              </span>
            )}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: "var(--purple)",
                color: "#ffffff",
                border: "none",
                fontSize: "14px",
                fontWeight: 650,
                cursor: "pointer",
                marginTop: "4px"
              }}
            >
              {t(language, "解鎖檢視", "Unlock Dashboard")}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="guide-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="stats-title" style={{ maxWidth: "580px" }}>
        <button className="guide-close" onClick={onClose} aria-label="Close">×</button>
        <div className="guide-hero">
          <span className="tool-icon">📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="section-kicker">LIVE TELEMETRY</span>
              <button
                onClick={handleLock}
                style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: "var(--muted)", cursor: "pointer" }}
              >
                🔒 {t(language, "重新鎖定", "Lock")}
              </button>
            </div>
            <h2 id="stats-title">{t(language, "即時流量與使用數據", "Live Traffic & Telemetry")}</h2>
            <p>{t(language, "由 Cloudflare KV 與前端即時紀錄，零延遲反映今日訪客與轉換。", "Real-time metrics from Cloudflare KV and browser telemetry.")}</p>
          </div>
        </div>

        {/* 4 個 Apple HIG 數據卡片 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", margin: "20px 0" }}>
          <div style={{ padding: "16px", borderRadius: "14px", background: "var(--canvas)", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              👤 {t(language, "今日獨立訪客 (UV)", "Unique Visitors")}
            </span>
            <strong style={{ fontSize: "24px", color: "var(--ink)", fontWeight: 700 }}>
              {loading ? "..." : (stats?.uv || 0).toLocaleString()}
            </strong>
          </div>

          <div style={{ padding: "16px", borderRadius: "14px", background: "var(--canvas)", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              👁️ {t(language, "今日頁面瀏覽 (PV)", "Page Views")}
            </span>
            <strong style={{ fontSize: "24px", color: "var(--purple)", fontWeight: 700 }}>
              {loading ? "..." : (stats?.pv || 0).toLocaleString()}
            </strong>
          </div>

          <div style={{ padding: "16px", borderRadius: "14px", background: "var(--canvas)", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              📋 {t(language, "複製轉換次數", "Copy Conversions")}
            </span>
            <strong style={{ fontSize: "24px", color: "var(--ink)", fontWeight: 700 }}>
              {loading ? "..." : (stats?.copies || 0).toLocaleString()}
            </strong>
          </div>

          <div style={{ padding: "16px", borderRadius: "14px", background: "var(--canvas)", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
              ⚡ {t(language, "使用轉換率 (Copy/PV)", "Conversion Rate")}
            </span>
            <strong style={{ fontSize: "24px", color: "var(--purple)", fontWeight: 700 }}>
              {loading ? "..." : (stats?.conversionRate || "0%")}
            </strong>
          </div>
        </div>

        {/* 各工具使用排行 */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <strong style={{ fontSize: "13px", color: "var(--ink)" }}>{t(language, "各工具熱門排行", "Top Tools Usage")}</strong>
            <button onClick={() => loadData("kiss9988")} style={{ border: 0, background: "transparent", color: "var(--purple)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>
              🔄 {t(language, "即時重新整理", "Refresh")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tools.map((tItem) => {
              const count = stats?.tools?.[tItem.id] || 0;
              const maxCount = Math.max(...Object.values(stats?.tools || { a: 1 }), 1);
              const pct = Math.min(100, Math.round((count / maxCount) * 100));

              return (
                <div key={tItem.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                  <span style={{ width: "20px", textAlign: "center" }}>{tItem.icon}</span>
                  <span style={{ width: "105px", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t(language, tItem.name, tItem.nameEn)}
                  </span>
                  <div style={{ flex: 1, height: "8px", background: "var(--canvas)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--line)" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--purple)", borderRadius: "4px", transition: "width 0.3s ease" }} />
                  </div>
                  <span style={{ width: "35px", textAlign: "right", color: "var(--muted)", fontSize: "11px", fontWeight: 600 }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px", marginTop: "14px", fontSize: "11px", color: "var(--subtle)", display: "flex", justifyContent: "space-between" }}>
          <span>{t(language, "紀錄日期：", "Date: ")}{stats?.date || new Date().toISOString().slice(0, 10)}</span>
          <span>{t(language, "💡 亦可在網址後加上 ?stats=1 隨時開啟", "Tip: Append ?stats=1 to URL anytime")}</span>
        </div>
      </section>
    </div>
  );
}

function BrandLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 128 128" style={{ borderRadius: "10px", flexShrink: 0, display: "block" }}>
      <rect width="128" height="128" rx="28" fill="#6d5cac" />
      <text x="64" y="86" textAnchor="middle" fontFamily="'Noto Sans TC', system-ui, sans-serif" fontWeight="900" fontSize="64" fill="#ffffff">字</text>
      <path d="M 96 24 Q 96 32 104 32 Q 96 32 96 40 Q 96 32 88 32 Q 96 32 96 24 Z" fill="#ffd778" />
    </svg>
  );
}

export default function App() {
  const parseCurrentTool = (): ToolId => {
    if (typeof window === "undefined") return "layout";
    if (window.location.hash) {
      const hashParts = window.location.hash.replace("#", "").split("/");
      const hashTool = hashParts[0] as ToolId;
      if (tools.some((t) => t.id === hashTool)) {
        const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
        const prefix = requestedLanguage === "en" ? "/en" : "";
        const category = hashParts[1] ? `?category=${encodeURIComponent(hashParts[1])}` : "";
        window.history.replaceState(null, "", `${prefix}/${hashTool}${category}`);
        return hashTool;
      }
    }
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const pathTool = (pathParts[0] === "en" ? pathParts[1] : pathParts[0]) as ToolId;
    if (tools.some((t) => t.id === pathTool)) {
      return pathTool;
    }
    return "layout";
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
  const [entitlements, setEntitlements] = useState<UserEntitlements>(getEntitlements);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleEntitlementUpdate = () => setEntitlements(getEntitlements());
    window.addEventListener("textlab-entitlement-updated", handleEntitlementUpdate);
    return () => window.removeEventListener("textlab-entitlement-updated", handleEntitlementUpdate);
  }, []);

  const [statsOpen, setStatsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("stats") === "1";
    }
    return false;
  });

  useEffect(() => {
    currentActiveTool = active;
    trackPageView(active);
  }, [active]);
  const [language, setLanguage] = useState<Language>(() => {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "en") return "en";
    if (tools.some((tool) => tool.id === pathParts[0])) return "zh-TW";
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
    const newPath = `${language === "en" ? "/en" : ""}/${id}`;
    window.history.pushState(null, "", newPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeLanguage = (next: Language) => {
    setLanguage(next);
    localStorage.setItem("textlab.language", next);
    const url = new URL(window.location.href);
    const isHome = current.id === "layout" && ["/", "/en", "/en/"].includes(url.pathname);
    url.pathname = isHome ? (next === "en" ? "/en" : "/") : `${next === "en" ? "/en" : ""}/${current.id}`;
    url.searchParams.delete("lang");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    const isHome = current.id === "layout" && ["/", "/en", "/en/"].includes(window.location.pathname);
    const routePath = isHome ? (language === "en" ? "/en" : "/") : `${language === "en" ? "/en" : ""}/${current.id}`;
    const canonicalUrl = `https://cooklabai.com${routePath}`;
    const zhUrl = isHome ? "https://cooklabai.com/" : `https://cooklabai.com/${current.id}`;
    const enUrl = isHome ? "https://cooklabai.com/en" : `https://cooklabai.com/en/${current.id}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    canonical?.setAttribute("href", canonicalUrl);
    document.querySelector('link[rel="alternate"][hreflang="zh-Hant"]')?.setAttribute("href", zhUrl);
    document.querySelector('link[rel="alternate"][hreflang="en"]')?.setAttribute("href", enUrl);
    document.querySelector('link[rel="alternate"][hreflang="x-default"]')?.setAttribute("href", zhUrl);
    document.querySelector('meta[property="og:locale"]')?.setAttribute("content", language === "en" ? "en_US" : "zh_TW");
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
    
    let titleStr = `${t(language, current.name, current.nameEn)}｜TextLab AI`;
    let descStr = t(language, `${current.name}線上工具：${current.short}，免費使用、不需登入。`, `${current.nameEn}: ${current.shortEn}. Free, no sign-up.`);


    const item = seoPages[current.id as keyof typeof seoPages];
    if (item) {
      titleStr = t(language, item.titleZh, item.titleEn);
      descStr = t(language, item.descriptionZh, item.descriptionEn);
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
  const toolProps = { copied, setCopied, language };
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/layout" onClick={(e) => { e.preventDefault(); selectTool("layout"); }}>
        <BrandLogo />
        <span><strong>{t(language, "字研所", "TextLab")}</strong><small>TEXT LAB</small></span>
      </a>

      {/* 桌面端完整導覽列 */}
      <nav className="desktop-nav">
        <button
          className="guide-nav-button pro-nav-btn"
          onClick={() => setPaywallOpen(true)}
          style={entitlements.isPro ? { border: "1px solid var(--purple)", color: "var(--purple)", fontWeight: 700 } : { color: "var(--purple)" }}
        >
          {entitlements.isPro ? "✦ Pro 會員" : "✦ 升級 Pro"}
        </button>
        <button className="guide-nav-button" onClick={() => setStatsOpen(true)}>📊 {t(language, "流量數據", "Stats")}</button>
        <button className="guide-nav-button" onClick={() => setGuideOpen(true)}>{t(language, "使用指南", "Guide")}</button>
        <button className="guide-nav-button" onClick={toggleTheme} title={t(language, "切換主題風格", "Toggle theme")}>
          {theme === "dark" ? "🌙 深色" : theme === "light" ? "☀️ 淺色" : "🌗 自動"}
        </button>
        <div className="language-switch" aria-label="Language">
          <button className={language === "zh-TW" ? "active" : ""} onClick={() => changeLanguage("zh-TW")}>繁中</button>
          <button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button>
        </div>
      </nav>

      {/* 手機端極簡控制項：只有升級按鈕與折疊選單 */}
      <div className="mobile-top-actions">
        <button
          className="mobile-pro-pill"
          onClick={() => setPaywallOpen(true)}
          style={entitlements.isPro ? { background: "var(--purple)", color: "#fff" } : {}}
        >
          {entitlements.isPro ? "✦ Pro" : "✦ 升級"}
        </button>
        <button
          className={`mobile-menu-trigger ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>

    {/* 手機端 Apple 原生毛玻璃折疊抽屜 */}
    {mobileMenuOpen && (
      <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-header">
            <span>{t(language, "系統選單與設定", "Menu & Settings")}</span>
            <button onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>

          <div className="mobile-drawer-section">
            <button
              className="drawer-action-row"
              onClick={() => { setMobileMenuOpen(false); setStatsOpen(true); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="drawer-icon">📊</span>
                <div style={{ textAlign: "left" }}>
                  <strong>{t(language, "即時流量數據中心", "Live Traffic & Telemetry")}</strong>
                  <small style={{ display: "block", color: "var(--muted)", fontSize: "11px" }}>{t(language, "密碼保護，檢視即時 PV / UV", "Password protected stats")}</small>
                </div>
              </div>
              <span style={{ color: "var(--subtle)" }}>➔</span>
            </button>

            <button
              className="drawer-action-row"
              onClick={() => { setMobileMenuOpen(false); setGuideOpen(true); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="drawer-icon">📖</span>
                <div style={{ textAlign: "left" }}>
                  <strong>{t(language, "30 秒快速上手指南", "Quick Start Guide")}</strong>
                  <small style={{ display: "block", color: "var(--muted)", fontSize: "11px" }}>{t(language, "各項社群文字工具使用技巧", "Tips and tutorials")}</small>
                </div>
              </div>
              <span style={{ color: "var(--subtle)" }}>➔</span>
            </button>
          </div>

          <div className="mobile-drawer-section">
            <div className="drawer-control-label">{t(language, "主題外觀", "Appearance")}</div>
            <div className="segmented-control">
              <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>☀️ 淺色</button>
              <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>🌙 深色</button>
              <button className={theme === "system" ? "active" : ""} onClick={() => setTheme("system")}>🌗 自動</button>
            </div>
          </div>

          <div className="mobile-drawer-section">
            <div className="drawer-control-label">{t(language, "顯示語言", "Language")}</div>
            <div className="segmented-control">
              <button className={language === "zh-TW" ? "active" : ""} onClick={() => changeLanguage("zh-TW")}>繁體中文</button>
              <button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>English</button>
            </div>
          </div>
        </div>
      </div>
    )}
    <div className="layout">
      <aside className="sidebar">
        <p className="sidebar-label" style={{ marginBottom: "10px" }}>{t(language, "文字工具箱", "TEXT LAB TOOLS")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            {
              title: "👑 商業與爆款 (PRO)",
              titleEn: "MONETIZATION (PRO)",
              ids: ["swipe", "localize", "deal"] as ToolId[]
            },
            {
              title: "📝 社群創作",
              titleEn: "SOCIAL MEDIA",
              ids: ["layout", "ai", "hook", "title", "bio"] as ToolId[]
            },
            {
              title: "✦ 符號美化",
              titleEn: "SYMBOLS & FONTS",
              ids: ["symbols", "emoji", "kaomoji", "fonts"] as ToolId[]
            },
            {
              title: "🛠️ 實用工具",
              titleEn: "UTILITY TOOLS",
              ids: ["hashtags", "blank", "nickname"] as ToolId[]
            }
          ].map((sec) => (
            <div key={sec.title}>
              <div className="sidebar-section-title">{t(language, sec.title, sec.titleEn)}</div>
              <div className="tool-nav">
                {tools.filter((tItem) => sec.ids.includes(tItem.id)).map((tool) => (
                  <button key={tool.id} className={active === tool.id ? "active" : ""} onClick={() => selectTool(tool.id)}>
                    <span className="tool-icon">{tool.icon}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong>{t(language, tool.name, tool.nameEn)}</strong>
                        {["deal", "swipe", "localize"].includes(tool.id) && (
                          <span style={{ fontSize: "9px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                            PRO
                          </span>
                        )}
                      </span>
                      <small>{t(language, tool.short, tool.shortEn)}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="sidebar-note" style={{ marginTop: "16px" }}>
          <span>✦</span>
          <p>
            <strong>{t(language, "你的文字，只留在這裡", "Your text stays here")}</strong>
            <br />
            {t(language, "所有轉換都在瀏覽器完成，我們不會儲存內容。", "Everything runs in your browser. We never store your content.")}
          </p>
        </div>
      </aside>
      <main className="workspace">
        <div className="mobile-tool-picker">
          <span>{t(language, "目前工具", "CURRENT TOOL")}</span>
          <select value={active} onChange={(e) => selectTool(e.target.value as ToolId)}>
            {tools.map((tool) => (
              <option value={tool.id} key={tool.id}>
                {t(language, tool.name, tool.nameEn)}｜{t(language, tool.short, tool.shortEn)}
              </option>
            ))}
          </select>
        </div>
        <div className="tool-surface">
          {active === "layout" && <LayoutTool {...toolProps} />}
          {active === "swipe" && <SwipeFileTool {...toolProps} isPro={entitlements.isPro} onRequirePro={() => setPaywallOpen(true)} />}
          {active === "localize" && <LocalizeTool {...toolProps} isPro={entitlements.isPro} onRequirePro={() => setPaywallOpen(true)} />}
          {active === "deal" && <DealTool {...toolProps} isPro={entitlements.isPro} onRequirePro={() => setPaywallOpen(true)} />}
          {active === "ai" && <AIPostTool {...toolProps} selectTool={selectTool} isPro={entitlements.isPro} onRequirePro={() => setPaywallOpen(true)} />}
          {active === "hook" && <HookTool {...toolProps} />}
          {active === "title" && <TitleTool {...toolProps} />}
          {active === "bio" && <BioTool {...toolProps} />}
          {active === "symbols" && <SymbolsTool {...toolProps} />}
          {active === "emoji" && <EmojiTool {...toolProps} />}
          {active === "kaomoji" && <KaomojiTool {...toolProps} />}
          {active === "fonts" && <FontsTool {...toolProps} />}
          {active === "hashtags" && <HashtagTool {...toolProps} />}
          {active === "blank" && <BlankTool {...toolProps} />}
          {active === "nickname" && <NicknameTool {...toolProps} />}
        </div>
        <footer>
          <span>{t(language, "字研所", "TEXTLAB")} TEXT LAB</span>
          <p>{t(language, "讓每一段文字，都剛剛好。", "Make every word feel just right.")}</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center", marginTop: "6px" }}>
            <small>© 2026 · Made for everyday expression</small>
            <span style={{ color: "var(--subtle)" }}>·</span>
            <button
              onClick={() => setStatsOpen(true)}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "4px",
                textDecoration: "underline"
              }}
            >
              📊 {t(language, "即時流量與轉換數據", "Live Traffic & Telemetry")}
            </button>
          </div>
        </footer>
      </main>
    </div>

    {guideOpen && <GuideModal language={language} onClose={() => setGuideOpen(false)} onSelectTool={(id) => { selectTool(id); setGuideOpen(false); }} />}
    {statsOpen && <StatsModal language={language} onClose={() => setStatsOpen(false)} />}
    {paywallOpen && <ProPaywallModal language={language} onClose={() => setPaywallOpen(false)} onRedeemSuccess={() => setEntitlements(getEntitlements())} />}
    {!!copied && <div className="toast"  role="status"><span>✓</span> {t(language, "已複製到剪貼簿", "Copied to clipboard")}</div>}
  </div>;
}
