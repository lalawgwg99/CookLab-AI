/**
 * 字幕台灣用語校正：簡體字轉台灣繁體＋中國用語換台灣用法。
 * SRT 時間碼行與序號行原樣保留，只轉文字行。
 * 純前端、規則式；一簡多繁採最常見對應，歧義字走詞組層處理。
 */

export interface TermHit {
  from: string;
  to: string;
  count: number;
}

export interface SubtitleTwResult {
  output: string;
  isSrt: boolean;
  hits: TermHit[];
  totalTermFixes: number;
  charFixes: number;
  timecodeLines: number;
  textLines: number;
}

/** 詞組詞典：from（簡／繁形）→ 台灣用法。長詞優先套用，避免被短詞截斷。 */
const PHRASES: [string, string][] = [
  // 影音／科技
  ["視頻會議", "視訊會議"], ["视频会议", "視訊會議"],
  ["視頻", "影片"], ["视频", "影片"],
  ["軟件", "軟體"], ["软件", "軟體"],
  ["硬件", "硬體"],
  ["質量", "品質"], ["质量", "品質"],
  ["信息", "資訊"],
  ["網絡", "網路"], ["网络", "網路"],
  ["屏幕", "螢幕"],
  ["打印機", "印表機"], ["打印机", "印表機"],
  ["打印", "列印"],
  ["鏈接", "連結"], ["链接", "連結"],
  ["內存", "記憶體"], ["内存", "記憶體"],
  ["硬盤", "硬碟"], ["硬盘", "硬碟"],
  ["隨身碟", "隨身碟"], ["U盘", "隨身碟"], ["U盤", "隨身碟"], ["优盘", "隨身碟"],
  ["充電寶", "行動電源"], ["充电宝", "行動電源"],
  ["默認", "預設"], ["默认", "預設"],
  ["登錄", "登入"], ["登录", "登入"],
  ["博客", "部落格"],
  ["短信", "簡訊"],
  ["寬帶", "寬頻"], ["宽带", "寬頻"],
  ["複印", "影印"], ["复印", "影印"],
  ["文件夾", "資料夾"], ["文件夹", "資料夾"],
  ["拷貝", "拷貝"], ["拷贝", "拷貝"],
  ["點讚", "按讚"], ["点赞", "按讚"],
  ["高清", "高畫質"],
  ["性價比", "CP值"], ["性价比", "CP值"],
  // 生活
  ["外賣", "外送"], ["外卖", "外送"],
  ["盒飯", "便當"], ["盒饭", "便當"],
  ["方便麵", "泡麵"], ["方便面", "泡麵"],
  ["麵條", "麵條"], ["面条", "麵條"],
  ["麵包", "麵包"], ["面包", "麵包"],
  ["頭髮", "頭髮"], ["头发", "頭髮"],
  ["理髮", "理髮"], ["理发", "理髮"],
  ["髮型", "髮型"], ["发型", "髮型"],
  ["沙發", "沙發"], ["沙发", "沙發"],
  ["手錶", "手錶"], ["手表", "手錶"],
  ["鬧鐘", "鬧鐘"], ["闹钟", "鬧鐘"],
  ["時鐘", "時鐘"], ["时钟", "時鐘"],
  // 商務／日常用語
  ["項目", "專案"], ["项目", "專案"],
  ["立馬", "立刻"], ["立马", "立刻"],
  ["立項", "啟動"], ["立项", "啟動"],
  ["網紅", "KOL"], ["网红", "KOL"],
  ["雙肩包", "後背包"], ["双肩包", "後背包"],
  ["衛衣", "帽T"], ["卫衣", "帽T"],
  ["親們", "各位"], ["亲们", "各位"],
  ["衝鴨", "衝啊"], ["冲鸭", "衝啊"],
  ["忽悠", "糊弄"],
  ["貓膩", "蹊蹺"], ["猫腻", "蹊蹺"],
  ["接地氣", "在地親民"], ["接地气", "在地親民"],
  ["打call", "支持"],
  ["種草", "被燒到"], ["种草", "被燒到"],
  ["拔草", "退坑"],
  ["走心", "用心"],
  ["很給力", "很罩"], ["很给力", "很罩"],
  ["給力", "罩"], ["给力", "罩"],
  ["老闆", "老闆"], ["老板", "老闆"],
  ["僱傭", "僱傭"], ["雇佣", "僱傭"],
  ["大夥", "大夥"], ["大伙", "大夥"],
  // 一簡多繁：詞組層先定版，避免字元層誤轉
  ["關係", "關係"], ["关系", "關係"],
  ["乾淨", "乾淨"], ["干净", "乾淨"],
  ["乾燥", "乾燥"], ["干燥", "乾燥"],
  ["乾杯", "乾杯"], ["干杯", "乾杯"],
  ["幹嘛", "幹嘛"], ["干嘛", "幹嘛"],
  ["以後", "以後"], ["以后", "以後"],
  ["後來", "後來"], ["后来", "後來"],
  ["後面", "後面"], ["后面", "後面"],
  ["最後", "最後"], ["最后", "最後"],
  ["後天", "後天"], ["后天", "後天"],
  ["後悔", "後悔"], ["后悔", "後悔"],
  ["然後", "然後"], ["然后", "然後"],
  ["這裡", "這裡"], ["这里", "這裡"],
  ["那裡", "那裡"], ["那里", "那裡"],
  ["哪裡", "哪裡"], ["哪里", "哪裡"],
  ["家裡", "家裡"], ["家里", "家裡"],
  ["心裡", "心裡"], ["心里", "心裡"],
  ["裡面", "裡面"], ["里面", "裡面"],
  ["歷史", "歷史"], ["历史", "歷史"],
  ["日曆", "日曆"], ["日历", "日曆"],
  ["經歷", "經歷"], ["经历", "經歷"],
  ["複雜", "複雜"], ["复杂", "複雜"],
  ["恢復", "恢復"], ["恢复", "恢復"],
  ["重複", "重複"], ["重复", "重複"],
  ["複習", "複習"], ["复习", "複習"],
  ["製作", "製作"], ["制作", "製作"],
  ["製造", "製造"], ["制造", "製造"],
  ["憂鬱", "憂鬱"], ["忧郁", "憂鬱"],
  ["衝動", "衝動"], ["冲动", "衝動"],
  ["衝突", "衝突"], ["冲突", "衝突"],
  ["欄杆", "欄杆"], ["栏杆", "欄杆"],
  ["旗桿", "旗桿"], ["旗杆", "旗桿"],
  ["奮鬥", "奮鬥"], ["奋斗", "奮鬥"],
  ["戰鬥", "戰鬥"], ["战斗", "戰鬥"],
  ["雲南", "雲南"], ["云南", "雲南"],
  ["放鬆", "放鬆"], ["放松", "放鬆"],
  ["輕鬆", "輕鬆"], ["轻松", "輕鬆"],
  ["儘管", "儘管"], ["尽管", "儘管"],
];

/** 保護詞：簡繁同形、但字元層會誤轉，轉換期間以佔位符保護 */
const PROTECTED = ["茶几", "占卜", "北斗", "粘膜", "摩托"];

/**
 * 簡→繁字元表（單一字元對應，只收歧義低的高頻字）。
 * 歧義字（發、干、后、里、面、系、只、云、松、表、制、卷、扎、托等）不在此表，
 * 由詞組層或保護詞處理。
 */
const CHAR_PAIRS =
  "这這么麼们們个個为為来來对對时時还還过過进進远遠运運达達迟遲选選逊遜遥遙辽遼迈邁适適语語译譯词詞汇匯说說读讀写寫听聽讲講论論议議设設证證识識谢謝诚誠谣謠" +
  "谨謹谦謙让讓计計订訂认認讨討训訓讯訊记記访訪许許诉訴讼訟诊診诅詛诈詐试試该該详詳诧詫诡詭询詢谅諒谈談谊誼谍諜谎謊谚諺谛諦谜謎谐諧谬謬谴譴谶讖贝貝贞貞负負" +
  "贡貢财財责責贤賢败敗账帳货貨质質贩販贪貪贫貧贬貶购購贮貯贯貫贰貳贱賤贴貼贵貴贷貸贸貿费費贺賀贼賊赂賂赃贓资資赈賑赊賒赋賦赌賭赎贖赏賞赐賜赔賠赖賴赚賺赛賽" +
  "赢贏赣贛车車轧軋轨軌轩軒转轉轮輪软軟轴軸轶軼轻輕载載轿轎辈輩辉輝辑輯辖轄辗輾辙轍边邊迁遷违違连連迩邇迳逕逻邏邓鄧邝鄺邹鄒邻鄰郑鄭郁鬱郐鄶郓鄆郧鄖郸鄲国國" +
  "团團园園圆圓圣聖场場坛壇坞塢坟墳垒壘垦墾垫墊堕墮墙牆壮壯声聲壳殼壶壺处處备備够夠头頭夸誇夹夾夺奪奋奮妆妝姗姍广廣庆慶乐樂书書买買卖賣乱亂争爭产產亲親会會" +
  "众眾优優传傳伤傷伦倫伪偽体體兑兌兰蘭关關兴興养養内內册冊军軍农農决決况況冻凍净淨凉涼减減凑湊凤鳳凭憑凯凱击擊凿鑿刘劉则則刚剛创創删刪别別剂劑剑劍剥剝剧劇" +
  "劝勸办辦务務动動励勵劲勁劳勞势勢医醫华華协協单單占佔卢盧卤滷卧臥厂廠厅廳厕廁厦廈厨廚县縣参參双雙变變叙敘叠疊号號叹嘆叶葉吓嚇吕呂吗嗎呕嘔员員呛嗆呜嗚咙嚨" +
  "哑啞哟喲开開并並张張弯彎弹彈强強当當录錄彻徹径徑忆憶忧憂怀懷态態怜憐总總恋戀恒恆恳懇惧懼惨慘惩懲惯慣愤憤愿願懒懶戏戲户戶扑撲扫掃扬揚扰擾抚撫抛拋抠摳抢搶" +
  "护護报報拧擰拨撥择擇挤擠挥揮捞撈损損换換捣搗掳擄掺摻揽攬搀攙搁擱搅攪摆擺摇搖摊攤撑撐攒攢敌敵敛斂数數斋齋斗鬥斩斬断斷无無旧舊旷曠昙曇昼晝显顯晋晉晒曬晓曉" +
  "晕暈晖暉暂暫暧曖嚣囂术術机機杀殺杂雜权權条條杰傑极極构構枭梟枫楓柜櫃柠檸栅柵标標栈棧栋棟栏欄树樹栖棲样樣栾欒桨槳桩樁检檢棱稜椭橢槟檳樯檣樱櫻横橫橱櫥檐簷" +
  "欢歡欧歐歼殲残殘殒殞殓殮殚殫殡殯殴毆毁毀毕畢毙斃毡氈气氣氢氫汉漢污汙汤湯汹洶沤漚没沒泪淚泞濘泻瀉泼潑泽澤泾涇洒灑浃浹浅淺浆漿浇澆浊濁测測济濟浏瀏浔潯浒滸" +
  "涂塗涌湧笔筆笼籠笋筍筑築签簽简簡篮籃篱籬类類粘黏粤粵纠糾纪紀纬緯纯純纱紗纲綱纳納纵縱纷紛纸紙纹紋纺紡纽紐线線练練组組绅紳细細织織终終绊絆绍紹绎繹经經绑綁" +
  "绒絨结結绕繞绘繪给給绚絢络絡绝絕绞絞统統聂聶聋聾职職联聯聪聰肃肅肠腸肤膚肾腎肿腫胀脹胁脅恼惱惊驚庐廬应應请請稳穩";

const CHAR_MAP = new Map<string, string>();
for (let i = 0; i + 1 < CHAR_PAIRS.length; i += 2) {
  const from = CHAR_PAIRS[i];
  const to = CHAR_PAIRS[i + 1];
  if (from !== to && !CHAR_MAP.has(from)) CHAR_MAP.set(from, to);
}
// 「發」由詞組層先處理頭髮／理髮／髮型／沙發後，其餘「发」多為「發」
CHAR_MAP.set("发", "發");

const TIMECODE_RE = /^\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/;
const INDEX_RE = /^\d+$/;

const SORTED_PHRASES = [...PHRASES].sort((a, b) => b[0].length - a[0].length);

function convertTextLine(line: string, hitCounts: Map<string, { to: string; count: number }>): { text: string; charFixes: number } {
  let text = line;
  // 保護詞佔位
  const placeholders: string[] = [];
  for (const word of PROTECTED) {
    if (text.includes(word)) {
      const token = `\uE000${placeholders.length}\uE001`;
      placeholders.push(word);
      text = text.split(word).join(token);
    }
  }
  // 詞組層
  for (const [from, to] of SORTED_PHRASES) {
    if (from === to) continue;
    let count = 0;
    let idx = text.indexOf(from);
    while (idx !== -1) {
      count += 1;
      idx = text.indexOf(from, idx + 1);
    }
    if (count > 0) {
      text = text.split(from).join(to);
      const prev = hitCounts.get(from);
      hitCounts.set(from, { to, count: (prev?.count ?? 0) + count });
    }
  }
  // 字元層
  let charFixes = 0;
  let out = "";
  for (const ch of text) {
    const mapped = CHAR_MAP.get(ch);
    if (mapped) {
      out += mapped;
      charFixes += 1;
    } else {
      out += ch;
    }
  }
  text = out;
  // 還原保護詞
  placeholders.forEach((word, i) => {
    text = text.split(`\uE000${i}\uE001`).join(word);
  });
  return { text, charFixes };
}

export function convertSubtitles(input: string): SubtitleTwResult {
  const isSrt = input.includes("-->");
  const lines = input.split("\n");
  const hitCounts = new Map<string, { to: string; count: number }>();
  let charFixes = 0;
  let timecodeLines = 0;
  let textLines = 0;

  const outLines = lines.map((rawLine) => {
    const line = rawLine.replace(/\r$/, "");
    if (TIMECODE_RE.test(line) || INDEX_RE.test(line.trim())) {
      if (TIMECODE_RE.test(line)) timecodeLines += 1;
      return rawLine;
    }
    if (!line.trim()) return rawLine;
    textLines += 1;
    const { text, charFixes: cf } = convertTextLine(line, hitCounts);
    charFixes += cf;
    return rawLine.endsWith("\r") ? text + "\r" : text;
  });

  const hits: TermHit[] = [...hitCounts.entries()]
    .map(([from, v]) => ({ from, to: v.to, count: v.count }))
    .sort((a, b) => b.count - a.count);
  return {
    output: outLines.join("\n"),
    isSrt,
    hits,
    totalTermFixes: hits.reduce((sum, h) => sum + h.count, 0),
    charFixes,
    timecodeLines,
    textLines,
  };
}

/** 輸入階段的即時偵測：用語命中數＋簡體字數（不含時間碼行） */
export function detectSubtitles(input: string): { termKinds: number; simpChars: number; isSrt: boolean } {
  const isSrt = input.includes("-->");
  let termKinds = 0;
  let simpChars = 0;
  for (const rawLine of input.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (TIMECODE_RE.test(line) || INDEX_RE.test(line.trim()) || !line.trim()) continue;
    for (const ch of line) if (CHAR_MAP.has(ch)) simpChars += 1;
  }
  const seen = new Set<string>();
  for (const [from, to] of SORTED_PHRASES) {
    if (from !== to && input.includes(from)) seen.add(from);
  }
  termKinds = seen.size;
  return { termKinds, simpChars, isSrt };
}
