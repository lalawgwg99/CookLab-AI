/**
 * 刪除重複行／文字去重（純前端、規則式）：
 * - 以整行為單位比對，保留首次出現順序，後面重複的行刪除（不排序、不改字）
 * - ignoreCase：比對時不分英文字母大小寫；輸出仍保留首次出現的原文寫法
 * - trim：比對與輸出都先去除每行前後空白（開關關閉時，原文空白如實保留）
 * - 空白行視為一般行：連續多個空白行只留一個，單一空白行保留
 * - 換行統一輸出為 \n；輸入結尾有無換行會如實反映在輸出（split 語意）
 * 不做語意判斷：全形／半形、簡繁差異皆視為不同行。
 * 行數以 split 計：空字串計為 1 行（1 個空行），與輸出 join 後的 split 計數一致。
 */

export interface DedupOptions {
  ignoreCase: boolean;
  trim: boolean;
}

export interface DedupResult {
  output: string;
  originalLines: number;
  resultLines: number;
  removedLines: number;
}

export function dedupLines(input: string, options: DedupOptions): DedupResult {
  const lines = input.split(/\r\n|\r|\n/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const cleaned = options.trim ? raw.trim() : raw;
    const key = options.ignoreCase ? cleaned.toLowerCase() : cleaned;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return {
    output: out.join("\n"),
    originalLines: lines.length,
    resultLines: out.length,
    removedLines: lines.length - out.length,
  };
}
