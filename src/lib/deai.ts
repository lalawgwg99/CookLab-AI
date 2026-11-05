/**
 * 去 AI 味檢查器（規則式，純前端）：
 * 掃描 AI 生成中文常見的寫作壞習慣——破折號濫用、罐頭連接詞、
 * 套式開場與結尾、三連排比、評價空話等，逐處標註並給改寫建議。
 * 注意：這是規則比對，不是 AI 偵測模型；常見寫法也可能命中，
 * 結果只是提醒，分數是命中密度換算，僅供參考。
 */

export interface DeaiRule {
  id: string;
  label: string;
  labelEn: string;
  suggestion: string;
  suggestionEn: string;
  weight: number;
  /** 可安全刪除：套用建議改寫時直接刪掉命中片段（連同緊接的頓號） */
  safeDelete?: boolean;
}

export interface DeaiFinding {
  ruleId: string;
  label: string;
  labelEn: string;
  start: number;
  end: number;
  text: string;
  suggestion: string;
  suggestionEn: string;
  safeDelete: boolean;
}

export interface DeaiPerRule {
  ruleId: string;
  label: string;
  labelEn: string;
  count: number;
}

export interface DeaiResult {
  /** 去重後的命中清單（按出現位置排序） */
  findings: DeaiFinding[];
  /** 原始命中數（未去重） */
  rawCount: number;
  /** 加權命中數（破折號、套式句型權重 2） */
  total: number;
  /** 0–100 的 AI 味分數：加權命中密度換算，僅供參考 */
  score: number;
  perRule: DeaiPerRule[];
  /** 套用安全刪除後的文字 */
  cleaned: string;
  /** 套用了幾處安全刪除 */
  appliedDeletions: number;
}

interface RuleDef extends DeaiRule {
  pattern: RegExp;
  /** 僅在命中數達到門檻時才成立（例如破折號需 2 處以上才算濫用） */
  minCount?: number;
}

const RULES: RuleDef[] = [
  {
    id: "dash",
    label: "破折號濫用",
    labelEn: "Em-dash overuse",
    suggestion: "留一處就好，其餘改用逗號、句號斷句，或改成括號補充。",
    suggestionEn: "Keep at most one; replace the rest with commas, periods, or parentheses.",
    weight: 2,
    pattern: /——|—/g,
    minCount: 2,
  },
  {
    id: "bujin",
    label: "「不僅…更是…」套式",
    labelEn: "“Not only… but also…” formula",
    suggestion: "刪掉套式，直接寫結論：把「更是」後面的重點提前當第一句。",
    suggestionEn: "Drop the formula and lead with the point after “更是”.",
    weight: 2,
    pattern: /不僅[^。；\n]{0,30}更(?:是|加|為)/g,
  },
  {
    id: "zhide",
    label: "「值得一提的是」",
    labelEn: "“Worth mentioning”",
    suggestion: "刪掉，直接寫重點。",
    suggestionEn: "Delete it and state the point directly.",
    weight: 2,
    pattern: /值得一提的是/g,
    safeDelete: true,
  },
  {
    id: "zongyan",
    label: "「總而言之」式結尾",
    labelEn: "“In conclusion” cliché",
    suggestion: "刪掉，或改寫成一句你自己的結論。",
    suggestionEn: "Delete it, or rewrite the conclusion in your own words.",
    weight: 1,
    pattern: /(總而言之|綜上所述|總的來說|總之)/g,
    safeDelete: true,
  },
  {
    id: "sanlian",
    label: "三連排比",
    labelEn: "Triple parallelism",
    suggestion: "留一組最有力的，刪掉另外兩組；三組都留只會互相抵消。",
    suggestionEn: "Keep the strongest line and cut the other two.",
    weight: 2,
    pattern: /(?:也|更|還)[^，；。]{1,15}[，；](?:也|更|還)[^，；。]{1,15}[，；](?:也|更|還)[^，；。]{1,15}|不僅[^。；\n]{1,40}而且[^。；\n]{1,40}還/g,
  },
  {
    id: "shenru",
    label: "「深入探討」空話",
    labelEn: "“Deep dive” filler",
    suggestion: "寫出具體做了什麼，例如「比較了三種做法」而不是「深入探討」。",
    suggestionEn: "Say concretely what was done, e.g. “compared three approaches”.",
    weight: 1,
    pattern: /深入(探討|了解|分析|挖掘)/g,
  },
  {
    id: "suizhe",
    label: "「隨著…的發展」開場",
    labelEn: "“With the development of…” opener",
    suggestion: "刪掉開場套話，直接進主題。",
    suggestionEn: "Delete the stock opener and start with the topic.",
    weight: 1,
    pattern: /隨著[^，。；\n]{1,20}(的發展|的到來|的推進|的普及)/g,
    safeDelete: true,
  },
  {
    id: "dangjin",
    label: "「在當今…時代」開場",
    labelEn: "“In today's era” opener",
    suggestion: "刪掉。",
    suggestionEn: "Delete it.",
    weight: 1,
    pattern: /在(當今|這個|如今)[^，。；\n]{0,12}時代/g,
    safeDelete: true,
  },
  {
    id: "wuyi",
    label: "「毫無疑問」斷言",
    labelEn: "“Undoubtedly” assertion",
    suggestion: "刪掉，讓論點自己說話。",
    suggestionEn: "Delete it and let the argument speak for itself.",
    weight: 1,
    pattern: /(毫無疑問|不可否認的是|毋庸置疑)/g,
    safeDelete: true,
  },
  {
    id: "shouxian",
    label: "「首先…其次…最後」列舉",
    labelEn: "“Firstly… secondly… finally” listing",
    suggestion: "刪掉序號詞，改用小標或直接分段。",
    suggestionEn: "Drop the numbering words; use subheadings or paragraphs instead.",
    weight: 1,
    pattern: /(首先|其次|最後)/g,
  },
  {
    id: "huanyan",
    label: "「換句話說」",
    labelEn: "“In other words”",
    suggestion: "刪掉，直接說。",
    suggestionEn: "Delete it and say it directly.",
    weight: 1,
    pattern: /(換句話說|從某種意義上(說|來講)|某種程度上)/g,
    safeDelete: true,
  },
  {
    id: "zhongyao",
    label: "「至關重要」評價空話",
    labelEn: "“Crucially important” filler",
    suggestion: "寫出具體影響，少用評價詞。",
    suggestionEn: "Describe the concrete impact instead of praising it.",
    weight: 1,
    pattern: /(發揮(了)?重要作用|至關重要|具有重要意義|起到了?關鍵作用)/g,
  },
  {
    id: "rangwomen",
    label: "「讓我們一起…」",
    labelEn: "“Let's take a look”",
    suggestion: "刪掉，直接寫內容。",
    suggestionEn: "Delete it and write the content directly.",
    weight: 1,
    pattern: /讓我們一起[^，。；\n]{0,12}/g,
    safeDelete: true,
  },
  {
    id: "benwen",
    label: "「本文將…」開場白",
    labelEn: "“This article will…” opener",
    suggestion: "刪掉開場白，直接進主題。",
    suggestionEn: "Delete the preamble and start with the topic.",
    weight: 1,
    pattern: /(在)?本文(中)?(將|會)?(探討|分析|介紹|討論)/g,
    safeDelete: true,
  },
];

export const DEAI_RULES: DeaiRule[] = RULES.map(
  ({ id, label, labelEn, suggestion, suggestionEn, weight, safeDelete }) => ({
    id,
    label,
    labelEn,
    suggestion,
    suggestionEn,
    weight,
    safeDelete,
  }),
);

export function scoreBand(score: number): { zh: string; en: string } {
  if (score <= 20) return { zh: "輕微", en: "Mild" };
  if (score <= 50) return { zh: "明顯", en: "Noticeable" };
  if (score <= 80) return { zh: "濃厚", en: "Strong" };
  return { zh: "非常濃厚", en: "Very strong" };
}

export function analyzeDeai(input: string): DeaiResult {
  const raw: DeaiFinding[] = [];
  let rawCount = 0;
  let total = 0;

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    const matches = [...input.matchAll(rule.pattern)];
    if (rule.minCount !== undefined && matches.length < rule.minCount) continue;
    rawCount += matches.length;
    total += matches.length * rule.weight;
    for (const m of matches) {
      const start = m.index ?? 0;
      raw.push({
        ruleId: rule.id,
        label: rule.label,
        labelEn: rule.labelEn,
        start,
        end: start + m[0].length,
        text: m[0],
        suggestion: rule.suggestion,
        suggestionEn: rule.suggestionEn,
        safeDelete: !!rule.safeDelete,
      });
    }
  }

  // 去重：按位置排序，重疊的命中只留先出現（較長）的一條
  raw.sort((a, b) => a.start - b.start || b.end - a.end || b.text.length - a.text.length);
  const findings: DeaiFinding[] = [];
  let cursor = -1;
  for (const f of raw) {
    if (f.start < cursor) continue;
    findings.push(f);
    cursor = f.end;
  }

  const perRuleMap = new Map<string, DeaiPerRule>();
  for (const f of findings) {
    const existing = perRuleMap.get(f.ruleId);
    if (existing) existing.count += 1;
    else perRuleMap.set(f.ruleId, { ruleId: f.ruleId, label: f.label, labelEn: f.labelEn, count: 1 });
  }
  const perRule = [...perRuleMap.values()].sort((a, b) => b.count - a.count);

  // 分數：加權命中密度（每千字）× 4，上限 100。
  // 字數以 300 字為下限，避免短文因分母太小被灌爆分數。
  const chars = Math.max(input.length, 300);
  const score = Math.min(100, Math.round(((total * 1000) / chars) * 4));

  // 套用安全刪除：刪掉命中片段，連同緊接的頓號一起清掉
  let cleaned = input;
  let appliedDeletions = 0;
  const deletions = findings
    .filter((f) => f.safeDelete)
    .sort((a, b) => b.start - a.start);
  for (const f of deletions) {
    let end = f.end;
    if (cleaned[end] === "，" || cleaned[end] === "、") end += 1;
    cleaned = cleaned.slice(0, f.start) + cleaned.slice(end);
    appliedDeletions += 1;
  }

  return { findings, rawCount, total, score, perRule, cleaned, appliedDeletions };
}
