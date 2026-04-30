import {
  Experiment,
  ExperimentAdvice,
  ExperimentVariant,
  FridgeInsights,
  GoalTag,
  IngredientLine,
  IngredientSection,
  MenuItem,
  NutritionSummary,
  RescueFeedItem,
  ScoredMenu,
  ShoppingListGroup,
  ShoppingListItem,
  SkillLevel,
  UserProfile,
  WasteRisk,
} from "../types/cooklab";

const skillRank: Record<SkillLevel, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

const sectionOrder: IngredientSection[] = [
  "Produce",
  "Protein",
  "Frozen",
  "Carbs",
  "Pantry",
];

const aliasByToken: Record<string, string> = {
  "chicken": "chicken breast",
  "chicken breast": "chicken breast",
  "chicken breasts": "chicken breast",
  "雞胸肉": "chicken breast",
  "雞胸": "chicken breast",
  "ground turkey": "ground turkey",
  "turkey mince": "ground turkey",
  "火雞絞肉": "ground turkey",
  "bell peppers": "bell pepper",
  "彩椒": "bell pepper",
  "青椒": "bell pepper",
  "broccolis": "broccoli",
  "花椰菜": "broccoli",
  "mushroom": "mushrooms",
  "蘑菇": "mushrooms",
  "eggs": "egg",
  "雞蛋": "egg",
  "soy sauce": "soy sauce",
  "醬油": "soy sauce",
  "tofu": "tofu",
  "豆腐": "tofu",
  "salmon fillet": "salmon",
  "鮭魚": "salmon",
  "greek yogurt": "yogurt",
  "優格": "yogurt",
};

interface NutritionEstimate {
  calories: number;
  protein: number;
}

const nutritionByIngredient: Record<string, NutritionEstimate> = {
  rice: { calories: 410, protein: 8 },
  egg: { calories: 210, protein: 18 },
  "chicken-breast": { calories: 364, protein: 68 },
  broccoli: { calories: 42, protein: 4 },
  "soy-sauce": { calories: 10, protein: 1 },
  salmon: { calories: 625, protein: 60 },
  zucchini: { calories: 24, protein: 2 },
  "bell-pepper": { calories: 25, protein: 1 },
  "olive-oil": { calories: 120, protein: 0 },
  "black-pepper": { calories: 6, protein: 0 },
  chickpeas: { calories: 270, protein: 14 },
  cucumber: { calories: 8, protein: 0 },
  tomato: { calories: 22, protein: 1 },
  yogurt: { calories: 108, protein: 12 },
  "chili-flakes": { calories: 4, protein: 0 },
  "ground-turkey": { calories: 510, protein: 73 },
  pasta: { calories: 875, protein: 30 },
  onion: { calories: 44, protein: 1 },
  garlic: { calories: 16, protein: 1 },
  "tomato-sauce": { calories: 70, protein: 3 },
  oats: { calories: 1220, protein: 42 },
  banana: { calories: 210, protein: 2 },
  "frozen-berries": { calories: 96, protein: 1 },
  tofu: { calories: 250, protein: 24 },
  mushrooms: { calories: 33, protein: 4 },
};

const fallbackNutritionBySection: Record<IngredientSection, NutritionEstimate> = {
  Produce: { calories: 35, protein: 2 },
  Protein: { calories: 190, protein: 18 },
  Frozen: { calories: 110, protein: 3 },
  Carbs: { calories: 260, protein: 8 },
  Pantry: { calories: 90, protein: 2 },
};

interface InventorySets {
  fridgeTokens: Set<string>;
  pantryTokens: Set<string>;
}

function normalizeSpace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeIngredientToken(value: string): string {
  const compacted = normalizeSpace(value.toLowerCase())
    .replace(/[-_/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, "");

  if (!compacted) {
    return "";
  }

  if (aliasByToken[compacted]) {
    return aliasByToken[compacted];
  }

  if (compacted.endsWith("es") && compacted.length > 4) {
    const singular = compacted.slice(0, -2);
    return aliasByToken[singular] ?? singular;
  }

  if (compacted.endsWith("s") && compacted.length > 3 && !compacted.endsWith("ss")) {
    const singular = compacted.slice(0, -1);
    return aliasByToken[singular] ?? singular;
  }

  return compacted;
}

function normalizeIngredientKey(value: string): string {
  return normalizeIngredientToken(value).replace(/\s+/g, "-");
}

function ingredientTokens(ingredient: IngredientLine): string[] {
  return [normalizeIngredientToken(ingredient.key), normalizeIngredientToken(ingredient.name)].filter(
    Boolean
  );
}

function buildInventorySets(profile: UserProfile): InventorySets {
  const pantryTokens = new Set<string>(
    profile.pantry
      .flatMap((item) => [normalizeIngredientToken(item), normalizeIngredientToken(item.replace(/-/g, " "))])
      .filter(Boolean)
  );

  const fridgeTokens = new Set<string>(
    profile.fridgeItems.map((item) => normalizeIngredientToken(item)).filter(Boolean)
  );

  return { fridgeTokens, pantryTokens };
}

function hasInInventory(inventory: InventorySets, ingredient: IngredientLine): boolean {
  const tokens = ingredientTokens(ingredient);
  return tokens.some(
    (token) => inventory.pantryTokens.has(token) || inventory.fridgeTokens.has(token)
  );
}

function scaleRatio(baseServings: number, householdSize: number): number {
  return householdSize / baseServings;
}

function scaleCost(base: number, baseServings: number, householdSize: number): number {
  return Math.round(base * scaleRatio(baseServings, householdSize));
}

function scaleMinutes(totalMinutes: number, baseServings: number, householdSize: number): number {
  const ratio = scaleRatio(baseServings, householdSize);
  const multiplier = ratio > 1 ? 1 + (ratio - 1) * 0.14 : 1;
  return Math.round(totalMinutes * multiplier);
}

function scaleAmount(amount: string, baseServings: number, householdSize: number): string {
  const ratio = scaleRatio(baseServings, householdSize);
  if (ratio === 1) {
    return amount;
  }
  const normalizedRatio = Number.isInteger(ratio) ? ratio.toFixed(0) : ratio.toFixed(1);
  return `${amount} x ${normalizedRatio}`;
}

function goalBoost(goal: GoalTag, menu: MenuItem): number {
  return menu.goalTags.includes(goal) ? 22 : 0;
}

function skillDelta(userSkill: SkillLevel, recipeSkill: SkillLevel): number {
  return skillRank[userSkill] - skillRank[recipeSkill];
}

function fridgeHitsForMenu(menu: MenuItem, inventory: InventorySets): number {
  return menu.ingredients.filter((ingredient) => hasInInventory(inventory, ingredient)).length;
}

function estimateMenuNutrition(menu: MenuItem, householdSize: number): NutritionEstimate {
  const baseNutrition = menu.ingredients.reduce<NutritionEstimate>(
    (sum, ingredient) => {
      const key = normalizeIngredientKey(ingredient.key);
      const nutrition =
        nutritionByIngredient[key] ?? fallbackNutritionBySection[ingredient.section];
      return {
        calories: sum.calories + nutrition.calories,
        protein: sum.protein + nutrition.protein,
      };
    },
    { calories: 0, protein: 0 }
  );

  const ratio = scaleRatio(menu.baseServings, householdSize);
  return {
    calories: Math.round(baseNutrition.calories * ratio),
    protein: Math.round(baseNutrition.protein * ratio),
  };
}

function goalSpecificScore(profile: UserProfile, menu: MenuItem): number {
  if (profile.mainGoal === "Quick Meals") {
    return Math.max(0, 24 - (menu.prepMinutes + menu.cookMinutes) / 2);
  }
  if (profile.mainGoal === "Budget Smart") {
    return Math.max(0, 18 - menu.baseCost / 15);
  }
  if (profile.mainGoal === "Weight Loss") {
    return menu.goalTags.includes("Weight Loss") ? 18 : 0;
  }
  if (profile.mainGoal === "High Protein") {
    return menu.goalTags.includes("High Protein") ? 18 : 0;
  }
  if (profile.mainGoal === "Family Prep") {
    return menu.goalTags.includes("Family Prep") ? 18 : 0;
  }
  if (profile.mainGoal === "Skill Building") {
    return menu.goalTags.includes("Skill Building") ? 16 : 0;
  }
  return 0;
}

export function scoreMenus(menus: MenuItem[], profile: UserProfile): ScoredMenu[] {
  const inventory = buildInventorySets(profile);

  return menus
    .map((menu) => {
      const adjustedCost = scaleCost(menu.baseCost, menu.baseServings, profile.householdSize);
      const adjustedMarketCost = scaleCost(menu.marketCost, menu.baseServings, profile.householdSize);
      const adjustedMinutes = scaleMinutes(
        menu.prepMinutes + menu.cookMinutes,
        menu.baseServings,
        profile.householdSize
      );
      const nutrition = estimateMenuNutrition(menu, profile.householdSize);
      const estimatedSavings = adjustedMarketCost - adjustedCost;
      const fridgeHits = fridgeHitsForMenu(menu, inventory);
      const missingAppliances = menu.appliances.filter(
        (appliance) => !profile.appliances.includes(appliance)
      );
      const eligible = missingAppliances.length === 0;
      const weeklySlotBudget = Math.round(profile.weeklyBudget / Math.max(profile.cookingDays, 1));
      const timeGap = profile.maxCookMinutes - adjustedMinutes;
      const skillGap = skillDelta(profile.skillLevel, menu.difficulty);

      let score = menu.seasonalFit * 0.32 + menu.stabilityScore * 0.34;
      score += goalBoost(profile.mainGoal, menu);
      score += goalSpecificScore(profile, menu);
      score += fridgeHits * 12;
      score += estimatedSavings / 6;
      score += nutrition.protein * 0.35;
      score += profile.mainGoal === "Weight Loss" ? Math.max(-16, 42 - nutrition.calories / 20) : 0;
      score += profile.mainGoal === "High Protein" ? Math.min(22, nutrition.protein / 2) : 0;
      score += adjustedCost <= weeklySlotBudget ? 16 : Math.max(-20, (weeklySlotBudget - adjustedCost) / 3);
      score += timeGap >= 0 ? Math.max(6, 18 - adjustedMinutes / 4) : Math.max(-30, timeGap);
      score += skillGap >= 0 ? 12 + skillGap * 4 : skillGap * 14;

      if (!eligible) {
        score -= 100;
      }

      const why: string[] = [];
      if (fridgeHits >= 2) {
        why.push(`uses ${fridgeHits} foods you listed`);
      }
      if (menu.goalTags.includes(profile.mainGoal)) {
        why.push(`aligned with your goal: ${profile.mainGoal}`);
      }
      if (adjustedMinutes <= profile.maxCookMinutes) {
        why.push(`fits your ${profile.maxCookMinutes}-minute time limit`);
      }
      if (nutrition.protein >= 28) {
        why.push(`provides about ${nutrition.protein} g protein per meal`);
      }
      if (estimatedSavings >= 60) {
        why.push("beats typical market spend for this meal type");
      }
      if (!eligible) {
        why.push(`requires missing gear: ${missingAppliances.join(", ")}`);
      }

      return {
        ...menu,
        adjustedCost,
        adjustedMarketCost,
        adjustedMinutes,
        adjustedCalories: nutrition.calories,
        adjustedProtein: nutrition.protein,
        estimatedSavings,
        fridgeHits,
        missingAppliances,
        eligible,
        score: Math.round(score),
        why: why.slice(0, 3),
      };
    })
    .sort((left, right) => right.score - left.score || left.adjustedCost - right.adjustedCost);
}

export function buildBudgetSummary(selectedMenus: ScoredMenu[], profile: UserProfile) {
  const plannedCost = selectedMenus.reduce((sum, menu) => sum + menu.adjustedCost, 0);
  const marketCost = selectedMenus.reduce((sum, menu) => sum + menu.adjustedMarketCost, 0);
  const savings = marketCost - plannedCost;
  const remainingBudget = profile.weeklyBudget - plannedCost;

  return {
    plannedCost,
    marketCost,
    savings,
    remainingBudget,
    selectedCount: selectedMenus.length,
  };
}

export function buildNutritionSummary(selectedMenus: ScoredMenu[]): NutritionSummary {
  if (selectedMenus.length === 0) {
    return {
      weeklyCalories: 0,
      avgCaloriesPerMeal: 0,
      weeklyProtein: 0,
      avgProteinPerMeal: 0,
    };
  }

  const weeklyCalories = selectedMenus.reduce((sum, menu) => sum + menu.adjustedCalories, 0);
  const weeklyProtein = selectedMenus.reduce((sum, menu) => sum + menu.adjustedProtein, 0);

  return {
    weeklyCalories,
    avgCaloriesPerMeal: Math.round(weeklyCalories / selectedMenus.length),
    weeklyProtein,
    avgProteinPerMeal: Math.round(weeklyProtein / selectedMenus.length),
  };
}

function inferWasteRisk(coverageRate: number, unusedItems: string[]): WasteRisk {
  if (unusedItems.length === 0 || coverageRate >= 0.72) {
    return "Low";
  }
  if (unusedItems.length <= 2 || coverageRate >= 0.52) {
    return "Medium";
  }
  return "High";
}

export function buildFridgeInsights(
  selectedMenus: ScoredMenu[],
  scoredMenus: ScoredMenu[],
  profile: UserProfile
): FridgeInsights {
  const inventory = buildInventorySets(profile);
  const selectedIngredients = selectedMenus.flatMap((menu) => menu.ingredients);
  const totalIngredients = selectedIngredients.length;
  const coveredIngredients = selectedIngredients.filter((ingredient) =>
    hasInInventory(inventory, ingredient)
  ).length;
  const coverageRate = totalIngredients > 0 ? coveredIngredients / totalIngredients : 0;

  const unusedItems = profile.fridgeItems.filter((item) => {
    const token = normalizeIngredientToken(item);
    return !selectedIngredients.some((ingredient) => ingredientTokens(ingredient).includes(token));
  });

  const recoveryIdeas = unusedItems
    .map((item) => {
      const token = normalizeIngredientToken(item);
      const menuTitles = scoredMenus
        .filter((menu) =>
          menu.ingredients.some((ingredient) => ingredientTokens(ingredient).includes(token))
        )
        .slice(0, 2)
        .map((menu) => menu.title);
      return {
        item,
        menuTitles,
      };
    })
    .filter((idea) => idea.menuTitles.length > 0)
    .slice(0, 3);

  return {
    coverageRate,
    coveredIngredients,
    totalIngredients,
    unusedItems: unusedItems.slice(0, 6),
    wasteRisk: inferWasteRisk(coverageRate, unusedItems),
    recoveryIdeas,
  };
}

export function buildShoppingList(
  selectedMenus: ScoredMenu[],
  profile: UserProfile
): ShoppingListGroup[] {
  const map = new Map<string, ShoppingListItem>();
  const inventory = buildInventorySets(profile);

  selectedMenus.forEach((menu) => {
    menu.ingredients.forEach((ingredient) => {
      const fromPantry = hasInInventory(inventory, ingredient);
      const amount = scaleAmount(ingredient.amount, menu.baseServings, profile.householdSize);
      const totalCost = fromPantry
        ? 0
        : scaleCost(ingredient.estimatedCost, menu.baseServings, profile.householdSize);

      const existing = map.get(ingredient.key);
      if (existing) {
        existing.amounts.push(amount);
        existing.totalCost += totalCost;
        existing.fromPantry = existing.fromPantry && fromPantry;
        existing.menus.push(menu.title);
        return;
      }

      map.set(ingredient.key, {
        key: ingredient.key,
        name: ingredient.name,
        section: ingredient.section,
        amounts: [amount],
        totalCost,
        fromPantry,
        menus: [menu.title],
      });
    });
  });

  return sectionOrder
    .map((section) => {
      const items = Array.from(map.values())
        .filter((item) => item.section === section)
        .sort(
          (left, right) =>
            Number(left.fromPantry) - Number(right.fromPantry) || right.totalCost - left.totalCost
        );
      return { section, items };
    })
    .filter((group) => group.items.length > 0);
}

export function buildRescueFeed(selectedMenus: ScoredMenu[]): RescueFeedItem[] {
  return selectedMenus.flatMap((menu) =>
    menu.rescueScenarios.map((scenario) => ({
      menuId: menu.id,
      menuTitle: menu.title,
      scenario,
    }))
  );
}

function scoreVariant(variant: ExperimentVariant, profile: UserProfile): number {
  const skillGap = skillDelta(profile.skillLevel, variant.requiredSkill);
  let score = variant.successRate * 0.52 + variant.stabilityScore * 0.32 + variant.textureScore * 0.16;
  score += variant.cookMinutes <= profile.maxCookMinutes ? 12 : profile.maxCookMinutes - variant.cookMinutes;
  score += skillGap >= 0 ? 10 + skillGap * 4 : skillGap * 16;

  if (profile.mainGoal === "Quick Meals") {
    score += Math.max(0, 20 - variant.cookMinutes);
  }
  if (profile.mainGoal === "Budget Smart") {
    score += Math.max(0, 18 - variant.estimatedCost / 8);
  }
  if (profile.mainGoal === "Weight Loss") {
    score += variant.stabilityScore * 0.12;
  }
  if (profile.mainGoal === "High Protein") {
    score += variant.successRate * 0.1;
  }
  if (profile.mainGoal === "Skill Building") {
    score += variant.textureScore * 0.22;
  }

  return score;
}

export function getExperimentAdvice(
  experiment: Experiment,
  profile: UserProfile
): ExperimentAdvice {
  const variant = [...experiment.variants].sort(
    (left, right) => scoreVariant(right, profile) - scoreVariant(left, profile)
  )[0];

  let reason = `${variant.label} best fits your ${profile.maxCookMinutes}-minute session limit.`;
  if (profile.mainGoal === "Quick Meals") {
    reason = `${variant.label} keeps the workflow fastest while preserving acceptable consistency.`;
  } else if (profile.mainGoal === "Budget Smart") {
    reason = `${variant.label} has lower waste risk and more cost control for weekly repeats.`;
  } else if (profile.mainGoal === "High Protein") {
    reason = `${variant.label} gives the most stable prep quality for protein-focused planning.`;
  } else if (profile.mainGoal === "Weight Loss") {
    reason = `${variant.label} is easiest to repeat consistently without added calories from fixes.`;
  } else if (profile.mainGoal === "Skill Building") {
    reason = `${variant.label} gives stronger texture signals for technique training.`;
  }

  return { variant, reason };
}

export function formatLocalCurrency(valueTwd: number, locale = "en"): string {
  const isTraditionalChinese = locale === "zh-TW";
  const currency = isTraditionalChinese ? "TWD" : "USD";
  const localeCode = isTraditionalChinese ? "zh-TW" : "en-US";
  const convertedValue = isTraditionalChinese ? valueTwd : valueTwd / 31.5;

  return new Intl.NumberFormat(localeCode, {
    style: "currency",
    currency,
    maximumFractionDigits: isTraditionalChinese ? 0 : 2,
  }).format(convertedValue);
}
