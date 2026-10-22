/**
 * 逐字稿清理器（規則式，保守處理）：
 * - 只移除標點相鄰、語意明確的贅詞（嗯、呃、就是說、那個＋逗號、重複的對對對等）
 * - 指示詞的那個（那個報告）、語氣詞的啊（句尾）等有語意的一律保留
 * - 依長度與轉折詞分段、長句補逗號、段末補句號
 * 規則式清理效果有限，這是設計上的誠實邊界，重要稿件仍需人工校對。
 */

export interface TranscriptResult {
  output: string;
  removedFillers: number;
  fillerBreakdown: { word: string; count: number }[];
  addedPunct: number;
  paragraphs: number;
}

const TERMINAL = "。！？…";
const CONJUNCTIONS = ["但是", "可是", "所以", "然後", "因為", "結果", "不過", "接著"];
const PARA_STARTERS = ["然後", "所以", "不過", "接著", "後來", "再來", "最後"];

function countEvents(map: Map<string, number>, key: string, n: number) {
  map.set(key, (map.get(key) ?? 0) + n);
}

function replaceCounted(text: string, re: RegExp, repl: string, map: Map<string, number>, key: string): string {
  return text.replace(re, (...args) => {
    countEvents(map, key, 1);
    const m = args[0];
    return typeof repl === "string" ? repl.replace("$1", args[1] ?? "") : m;
  });
}

export function cleanTranscript(input: string): TranscriptResult {
  const fillerMap = new Map<string, number>();
  let addedPunct = 0;

  // 以既有空行分塊，逐塊處理（保留使用者原本的分段意圖）
  const blocks = input.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const outParagraphs: string[] = [];

  for (const rawBlock of blocks) {
    let text = rawBlock.replace(/\n/g, "");

    // 0) ASR 常見的中文字間空白：只移除兩側都是中文字／全形標點的空格
    text = text.replace(/([\u3400-\u4DBF\u4E00-\u9FFF，。！？；：、]) +(?=[\u3400-\u4DBF\u4E00-\u9FFF，。！？；：、])/g, "$1");

    // 1) 重複語氣詞收成一個（對對對→對、好好好→好、是是是→是、嗯嗯嗯→嗯）
    text = replaceCounted(text, /(對|好|是|嗯){3,}/g, "$1", fillerMap, "重複詞");

    // 2) 就是說：只清標點相鄰的（句首、逗號前後），「我就是說你錯了」這種有主詞的保留
    text = replaceCounted(text, /(^|[，。！？；])就是說，?/g, "$1", fillerMap, "就是說");
    text = replaceCounted(text, /，就是說，/g, "，", fillerMap, "就是說");
    text = replaceCounted(text, /，就是說(?=$)/g, "", fillerMap, "就是說");

    // 3) 那個：那個那個（口吃）、標點相鄰的那個，（停頓填充）才清；那個＋名詞保留
    text = replaceCounted(text, /那個(那個)+/g, "", fillerMap, "那個");
    text = replaceCounted(text, /(^|[，。！？；])那個，/g, "$1", fillerMap, "那個");
    text = replaceCounted(text, /，那個，/g, "，", fillerMap, "那個");

    // 4) 嗯／呃：句首或標點相鄰的獨立語氣詞
    text = replaceCounted(text, /(^|[，。！？；])嗯+，?/g, "$1", fillerMap, "嗯");
    text = replaceCounted(text, /(^|[，。！？；])呃+，?/g, "$1", fillerMap, "呃");
    text = replaceCounted(text, /，(嗯|呃)+，/g, "，", fillerMap, "嗯呃");

    // 5) 啊：只清標點夾住的獨立「啊」，句尾語氣詞保留
    text = replaceCounted(text, /，啊，/g, "，", fillerMap, "啊");
    text = replaceCounted(text, /(^|[。！？；])啊，/g, "$1", fillerMap, "啊");

    // 6) 清理贅詞移除後的殘留標點
    text = text.replace(/，{2,}/g, "，");
    text = text.replace(/^，+/, "");
    text = text.replace(/，([。！？；])/g, "$1");

    // 7) 長子句補逗號：切成子句，超過 30 字且無逗號的子句，在轉折詞前補一個
    const sentences = splitSentences(text);
    const fixedSentences = sentences.map((s) => addCommasToLongClauses(s, () => { addedPunct += 1; }));

    // 8) 分段：累積長度與轉折開頭
    let para = "";
    for (const s of fixedSentences) {
      const startsWithConj = PARA_STARTERS.some((w) => s.startsWith(w));
      if (para && ((para.length >= 60 && para.length + s.length > 150) || (startsWithConj && para.length >= 60))) {
        outParagraphs.push(ensureTerminal(para, () => { addedPunct += 1; }));
        para = "";
      }
      para += s;
    }
    if (para) outParagraphs.push(ensureTerminal(para, () => { addedPunct += 1; }));
  }

  const breakdown = [...fillerMap.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  return {
    output: outParagraphs.join("\n\n"),
    removedFillers: breakdown.reduce((sum, b) => sum + b.count, 0),
    fillerBreakdown: breakdown,
    addedPunct,
    paragraphs: outParagraphs.length,
  };
}

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const ch of text) {
    cur += ch;
    if (TERMINAL.includes(ch)) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

function addCommasToLongClauses(sentence: string, onAdd: () => void): string {
  // 子句以「，、；」切開，逐段檢查
  const parts = sentence.split(/(?<=，|、|；)/);
  const fixed = parts.map((part) => {
    let p = part;
    // 一個子句最多補一個逗號，避免規則把句子切碎
    if (p.length > 30) {
      for (const w of CONJUNCTIONS) {
        const idx = p.indexOf(w);
        if (idx >= 10) {
          p = p.slice(0, idx) + "，" + p.slice(idx);
          onAdd();
          break;
        }
      }
    }
    return p;
  });
  return fixed.join("");
}

function ensureTerminal(para: string, onAdd: () => void): string {
  const last = para[para.length - 1];
  if (last && !TERMINAL.includes(last) && last !== "」" && last !== "』" && last !== "）") {
    onAdd();
    return para + "。";
  }
  return para;
}
