/**
* 中文排版自動校正（規則式）：
* - 中英／中數之間加空格（pangu）
* - 中文語境的半形標點轉全形
* - 連續空白、全形空格、多餘空行清理
* 保護：反引號程式碼片段、縮排程式碼行、``` 圍欄區塊不處理；
* 英文句點（小數、網域、縮寫）與英文句子內部不更動。
*/

export interface TypesetChange {
rule: string;
count: number;
}

export interface TypesetResult {
output: string;
total: number;
changes: TypesetChange[];
}

const CJK_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const FULLWIDTH_PUNCT = new Set("，。！？；：、「」『』（）《》〈〉…—·～".split(""));
const isCjkContext = (ch: string | undefined) =>!!ch && (CJK_RE.test(ch) || FULLWIDTH_PUNCT.has(ch));
const isAlnum = (ch: string | undefined) =>!!ch && /[A-Za-z0-9]/.test(ch);

interface Counts {
pangu: number;
punct: number;
whitespace: number;
}

/** pangu：CJK 與英數字之間補空格 */
function panguLine(line: string, counts: Counts): string {
let out = "";
for (let i = 0; i < line.length; i++) {
const ch = line[i];
const prev = out[out.length - 1];
if (prev && ((CJK_RE.test(prev) && isAlnum(ch)) || (isAlnum(prev) && CJK_RE.test(ch)))) {
out += " ";
counts.pangu += 1;
}
out += ch;
}
return out;
}

/** 標點：中文語境半形轉全形（逐字掃描，用前後文判斷） */
function punctLine(line: string, counts: Counts): string {
let out = "";
let i = 0;
while (i < line.length) {
const ch = line[i];
const prev = out[out.length - 1];
const next = line[i + 1];
const nextNonSpace = line.slice(i + 1).match(/\S/)?.[0];

// 省略號...（前文是中文語境才轉）
if (ch === "." && next === "." && line[i + 2] === "." && isCjkContext(prev)) {
out += "……";
counts.punct += 1;
i += 3;
continue;
}
if (ch === "," && (isCjkContext(prev) || isCjkContext(nextNonSpace))) {
out += "，"; counts.punct += 1; i += 1; continue;
}
if (ch === ";" && (isCjkContext(prev) || isCjkContext(nextNonSpace))) {
out += "；"; counts.punct += 1; i += 1; continue;
}
if (ch === ":" && isCjkContext(prev)) {
out += "："; counts.punct += 1; i += 1; continue;
}
if (ch === "?" && (isCjkContext(prev) || isCjkContext(nextNonSpace))) {
out += "？"; counts.punct += 1; i += 1; continue;
}
if (ch === "!" && (isCjkContext(prev) || isCjkContext(nextNonSpace))) {
out += "！"; counts.punct += 1; i += 1; continue;
}
// 句點：前文中文、後文不是英數字（避開小數、網域、縮寫、英文句）
if (ch === "." && isCjkContext(prev) &&!isAlnum(next)) {
out += "。"; counts.punct += 1; i += 1; continue;
}
if (ch === "(" && (isCjkContext(next) || isCjkContext(prev))) {
out += "（"; counts.punct += 1; i += 1; continue;
}
if (ch === ")" && (isCjkContext(prev) || isCjkContext(next))) {
out += "）"; counts.punct += 1; i += 1; continue;
}
out += ch;
i += 1;
}
// 引號配對：內容或外側含中文才換成「」『』
out = out.replace(/"([^"\n]*)"/g, (m, inner: string, offset: number, whole: string) => {
const before = whole[offset - 1];
const after = whole[offset + m.length];
if (CJK_RE.test(inner) || isCjkContext(before) || isCjkContext(after)) {
counts.punct += 2;
return `「${inner}」`;
}
return m;
});
out = out.replace(/'([^'\n]*)'/g, (m, inner: string) => {
if (CJK_RE.test(inner)) {
counts.punct += 2;
return `『${inner}』`;
}
return m;
});
return out;
}

/** 空白清理：全形空格、連續空白、全形標點旁的空格、行尾空白 */
function whitespaceLine(line: string, counts: Counts): string {
let out = line;
// 全形空格：夾在中文之間直接移除，否則換半形
out = out.replace(/　/g, (m, offset: number, whole: string) => {
counts.whitespace += 1;
const before = whole[offset - 1];
const after = whole[offset + 1];
return CJK_RE.test(before?? "") && CJK_RE.test(after?? "")? "": " ";
});
// 連續空白（半形空格與 tab）收成一個
out = out.replace(/[ \t]{2,}/g, () => {
counts.whitespace += 1;
return " ";
});
// 全形標點前後的空格移除（後方僅限接中文時）
out = out.replace(/ ([，。！？；：、」』）】》〉])/g, (m, p1: string) => {
counts.whitespace += 1;
return p1;
});
out = out.replace(/([（【「『《〈]) (?=[\u3400-\u4DBF\u4E00-\u9FFF])/g, (m, p1: string) => {
counts.whitespace += 1;
return p1;
});
out = out.replace(/([，。！？；：、]) (?=[\u3400-\u4DBF\u4E00-\u9FFF])/g, (m, p1: string) => {
counts.whitespace += 1;
return p1;
});
// 行尾空白
if (/[ \t]+$/.test(out)) {
out = out.replace(/[ \t]+$/, "");
counts.whitespace += 1;
}
return out;
}

const CODE_LINE_RE = /^(\t| {4,})/;
const INLINE_CODE_RE = /`[^`\n]*`/g;

function processLine(line: string, counts: Counts): string {
if (CODE_LINE_RE.test(line)) return line;
// 保護行內程式碼
const spans: string[] = [];
let protectedLine = line.replace(INLINE_CODE_RE, (m) => {
spans.push(m);
return `\uE000${spans.length - 1}\uE001`;
});
protectedLine = whitespaceLine(protectedLine, counts);
protectedLine = panguLine(protectedLine, counts);
protectedLine = punctLine(protectedLine, counts);
// 標點轉全形後再清一次：半形標點旁的空格在轉換前清不到
protectedLine = whitespaceLine(protectedLine, counts);
// 還原程式碼
protectedLine = protectedLine.replace(/\uE000(\d+)\uE001/g, (m, idx: string) => spans[Number(idx)]?? m);
return protectedLine;
}

export function fixTypesetting(input: string): TypesetResult {
const counts: Counts = { pangu: 0, punct: 0, whitespace: 0};
const lines = input.split("\n");
const outLines: string[] = [];
let inFence = false;
for (const line of lines) {
if (/^\s*```/.test(line)) {
inFence =!inFence;
outLines.push(line);
continue;
}
if (inFence) {
outLines.push(line);
continue;
}
outLines.push(processLine(line, counts));
}
let output = outLines.join("\n");
// 多餘空行：3+ 換行收成 2（段落間最多一個空行）
output = output.replace(/\n{3,}/g, () => {
counts.whitespace += 1;
return "\n\n";
});

const changes: TypesetChange[] = [
{ rule: "中英／中數空格", count: counts.pangu},
{ rule: "半形標點轉全形", count: counts.punct},
{ rule: "空白與空行清理", count: counts.whitespace},
].filter((c) => c.count > 0);
return {
output,
total: counts.pangu + counts.punct + counts.whitespace,
changes,
};
}
