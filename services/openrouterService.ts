import { SearchState, Recipe, TrendReport, User } from "../types";
import { calculateTotalNutrition } from "./nutritionService";
import { RecipeSchema } from "../schemas/recipe";
import { z } from "zod";

// OpenRouter API (OpenAI-compatible, free tier)
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const FREE_MODEL = "qwen/qwen3-next-80b-a3b-instruct:free"; // Qwen3 80B - 阿里出品，中文最強
const CHAT_MODEL = "qwen/qwen3-next-80b-a3b-instruct:free";

const getHeaders = () => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("API 密鑰未設定，請在 .env.local 設定 VITE_OPENROUTER_API_KEY");
  }
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://cooklabai.com",
    "X-Title": "饗味食光 SavorChef"
  };
};

const chatCompletion = async (
  systemPrompt: string,
  userPrompt: string,
  model = FREE_MODEL
): Promise<string> => {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API 錯誤: ${res.status} ${err}`);
  }

  const data = await res.json();
  // Qwen3 思考 token 清除
  const raw = data.choices?.[0]?.message?.content || "{}";
  return raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
};

const chatText = async (
  systemPrompt: string,
  userPrompt: string,
  model = CHAT_MODEL
): Promise<string> => {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API 錯誤: ${res.status} ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  return raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
};

const RECIPE_JSON_SPEC = `請回傳嚴格符合以下格式的 JSON 陣列（不要有任何多餘文字）：
[{
  "id": "唯一ID字串",
  "name": "食譜名稱",
  "description": "簡短描述",
  "matchScore": 數字0-100,
  "matchReason": "推薦原因",
  "calories": 數字,
  "timeMinutes": 數字,
  "tags": ["標籤1","標籤2"],
  "ingredients": ["食材1","食材2"],
  "instructions": ["步驟1","步驟2"],
  "macros": { "protein": "25g", "carbs": "40g", "fat": "10g" },
  "healthTip": "營養建議"
}]`;

const SINGLE_RECIPE_SPEC = `請回傳嚴格符合以下格式的 JSON 物件：
{
  "id": "唯一ID字串",
  "name": "食譜名稱",
  "description": "簡短描述",
  "matchScore": 數字0-100,
  "matchReason": "推薦原因",
  "calories": 數字,
  "timeMinutes": 數字,
  "tags": ["標籤1"],
  "ingredients": ["食材1"],
  "instructions": ["步驟1"],
  "macros": { "protein": "25g", "carbs": "40g", "fat": "10g" },
  "healthTip": "營養建議"
}`;

// 根據食材/條件生成食譜
export const generateRecipes = async (state: SearchState, user?: User | null): Promise<Recipe[]> => {
  let userProfileContext = "";
  if (user?.stats?.tasteDNA) {
    const dnaStr = user.stats.tasteDNA.map(dna => `${dna.label}: ${dna.value}%`).join(", ");
    userProfileContext = `使用者的味覺 DNA：${dnaStr}。請微調食譜風味與工序複雜度以符合偏好。`;
  }

  const userPrompt = `請根據以下條件生成 3 道精緻食譜：
輸入條件/食材：${state.ingredients.length > 0 ? state.ingredients.join(", ") : "由主廚發揮"}
目標：${state.goal || "均衡"}
菜系：${state.cuisine}
場合：${state.occasion || "一般"}
${userProfileContext}

重要規則：
1. 優先遵守自然語言限制（如「只有微波爐」、「不吃牛肉」）
2. 必須包含詳細 macros 與微量元素分析

${RECIPE_JSON_SPEC}`;

  const raw = await chatCompletion(
    "你是一位具備 30 年經驗的米其林三星主廚，同時也是持照運動營養師。擅長台灣在地料理（滷肉飯、蚵仔煎、大腸麵線、肉圓、割包等）。語言：台灣繁體中文。",
    userPrompt
  );

  let recipes: Recipe[];
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : parsed.recipes || [];
    recipes = z.array(RecipeSchema).parse(arr);
  } catch {
    console.error("Recipe parse failed, raw:", raw.slice(0, 200));
    recipes = [];
  }

  // 補充 USDA 營養數據
  return Promise.all(recipes.map(async (recipe) => {
    try {
      if (recipe.ingredients?.length > 0) {
        const nutrition = await calculateTotalNutrition(recipe.ingredients);
        recipe.calories = nutrition.calories;
        recipe.macros = {
          protein: `${nutrition.protein}g`,
          carbs: `${nutrition.carbohydrates}g`,
          fat: `${nutrition.fat}g`
        };
        if (nutrition.source === "USDA") recipe.matchReason += " (營養數據：USDA)";
      }
    } catch { /* 靜默失敗 */ }
    return recipe;
  }));
};

// 二廚問答
export const askSousChef = async (recipe: Recipe, question: string): Promise<string> => {
  const recipeContext = `食譜：${recipe.name}\n食材：${recipe.ingredients.join("、")}\n步驟：${recipe.instructions.join(" → ")}\n時間：${recipe.timeMinutes} 分鐘\n熱量：${recipe.calories} kcal`;
  const text = await chatText(
    "你是「饗味食光」的二廚小饗，請用溫暖親切的語氣回答料理問題，不超過 150 字，語言：台灣繁體中文。",
    `${recipeContext}\n\n使用者問：${question}`
  );
  return text || "主廚現在有點忙，請稍後再試。";
};

// 探索頁隨機食譜
export const fetchDiscoveryFeed = async (): Promise<Recipe[]> => {
  const userPrompt = `隨機生成 6 道食譜，其中至少 3 道必須是台灣道地美食（滷肉飯、蚵仔煎、珍珠奶茶、鹹酥雞、牛肉麵、肉圓、割包、大腸麵線、古早味蛋糕、甜不辣等）。${RECIPE_JSON_SPEC}`;

  const raw = await chatCompletion(
    "你是追蹤全球美食趨勢的社群主編，熱愛台灣在地美食文化。語言：台灣繁體中文。",
    userPrompt
  );

  let recipes: Recipe[] = [];
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : parsed.recipes || [];
    recipes = z.array(RecipeSchema).parse(arr);
  } catch {
    console.error("Discovery feed parse failed");
  }

  return Promise.all(recipes.map(async (recipe) => {
    try {
      if (recipe.ingredients?.length > 0) {
        const nutrition = await calculateTotalNutrition(recipe.ingredients);
        recipe.calories = nutrition.calories;
        recipe.macros = {
          protein: `${nutrition.protein}g`,
          carbs: `${nutrition.carbohydrates}g`,
          fat: `${nutrition.fat}g`
        };
      }
    } catch { /* 靜默失敗 */ }
    return recipe;
  }));
};

// 市場趨勢報告
export const fetchMarketTrends = async (): Promise<TrendReport> => {
  const userPrompt = `分析目前餐飲市場大數據，產出本季流行食材、擺盤趨勢與市場動向的報告，回傳 JSON：
{
  "seasonTitle": "季節標題",
  "topIngredients": ["食材1","食材2"],
  "platingTrend": "擺盤趨勢描述",
  "globalInsight": "全球洞察",
  "marketTrends": [
    { "title": "趨勢名稱", "popularity": 數字0-100, "description": "描述", "tag": "標籤" }
  ]
}`;

  const raw = await chatCompletion(
    "你是頂尖餐飲市場分析師，提供精確且具前瞻性的見解。語言：台灣繁體中文。",
    userPrompt
  );

  try {
    return JSON.parse(raw);
  } catch {
    return {
      seasonTitle: "2026 春季美食趨勢",
      topIngredients: ["台灣高山茶葉", "在地野菜", "發酵食品"],
      platingTrend: "極簡日式擺盤融合台式色彩",
      globalInsight: "發酵與植物性蛋白持續主導全球餐飲市場",
      marketTrends: []
    };
  }
};

// 從文字描述建立食譜（替代拍照功能）
export const createRecipeFromText = async (description: string, author: string): Promise<Recipe> => {
  const userPrompt = `根據以下描述整理成一份專業食譜 JSON：「${description}」\n\n${SINGLE_RECIPE_SPEC}`;

  const raw = await chatCompletion(
    "你是專業食譜編輯，請將使用者描述的料理整理成結構化食譜。語言：台灣繁體中文。",
    userPrompt
  );

  const recipe = JSON.parse(raw) as Recipe;
  recipe.id = `user-${Date.now()}`;
  recipe.author = author;
  recipe.isUserCreated = true;

  if (recipe.ingredients?.length > 0) {
    try {
      const nutrition = await calculateTotalNutrition(recipe.ingredients);
      recipe.calories = nutrition.calories;
      recipe.macros = {
        protein: `${nutrition.protein}g`,
        carbs: `${nutrition.carbohydrates}g`,
        fat: `${nutrition.fat}g`
      };
    } catch { /* 靜默失敗 */ }
  }

  return recipe;
};
