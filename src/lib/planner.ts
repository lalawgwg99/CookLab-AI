import {
  Experiment,
  ExperimentAdvice,
  ExperimentVariant,
  GoalTag,
  IngredientSection,
  MenuItem,
  RescueFeedItem,
  ScoredMenu,
  ShoppingListGroup,
  ShoppingListItem,
  SkillLevel,
  UserProfile,
} from "../types/cooklab";

const skillRank: Record<SkillLevel, number> = {
  新手: 1,
  普通: 2,
  熟手: 3,
};

const sectionOrder: IngredientSection[] = ["蔬菜", "蛋白質", "冷凍", "主食", "乾貨調味"];

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
  return `${amount} × ${normalizedRatio}`;
}

function goalBoost(goal: GoalTag, menu: MenuItem): number {
  return menu.goalTags.includes(goal) ? 22 : 0;
}

function skillDelta(userSkill: SkillLevel, recipeSkill: SkillLevel): number {
  return skillRank[userSkill] - skillRank[recipeSkill];
}

export function scoreMenus(menus: MenuItem[], profile: UserProfile): ScoredMenu[] {
  return menus
    .map((menu) => {
      const adjustedCost = scaleCost(menu.baseCost, menu.baseServings, profile.householdSize);
      const adjustedMarketCost = scaleCost(menu.marketCost, menu.baseServings, profile.householdSize);
      const adjustedMinutes = scaleMinutes(
        menu.prepMinutes + menu.cookMinutes,
        menu.baseServings,
        profile.householdSize
      );
      const estimatedSavings = adjustedMarketCost - adjustedCost;
      const pantryHits = menu.ingredients.filter(
        (ingredient) => ingredient.pantryEligible && profile.pantry.includes(ingredient.key)
      ).length;
      const missingAppliances = menu.appliances.filter(
        (appliance) => !profile.appliances.includes(appliance)
      );
      const eligible = missingAppliances.length === 0;
      const timeBudget = Math.round(profile.weeklyBudget / Math.max(profile.cookingDays, 1));
      const timeGap = profile.maxCookMinutes - adjustedMinutes;
      const skillGap = skillDelta(profile.skillLevel, menu.difficulty);

      let score = menu.seasonalFit * 0.35 + menu.stabilityScore * 0.4;
      score += goalBoost(profile.mainGoal, menu);
      score += pantryHits * 6;
      score += estimatedSavings / 6;
      score += adjustedCost <= timeBudget ? 18 : Math.max(-20, (timeBudget - adjustedCost) / 4);
      score += timeGap >= 0 ? Math.max(6, 20 - adjustedMinutes / 4) : Math.max(-28, timeGap);
      score += skillGap >= 0 ? 14 + skillGap * 4 : skillGap * 16;

      if (!eligible) {
        score -= 120;
      }

      const why: string[] = [];
      if (menu.goalTags.includes(profile.mainGoal)) {
        why.push(`對齊你的「${profile.mainGoal}」目標`);
      }
      if (adjustedMinutes <= profile.maxCookMinutes) {
        why.push(`${adjustedMinutes} 分鐘內可完成`);
      }
      if (pantryHits > 0) {
        why.push(`可直接吃掉 ${pantryHits} 項現有常備品`);
      }
      if (estimatedSavings >= 50) {
        why.push(`比市場平均省下 ${estimatedSavings} 元`);
      }
      if (menu.stabilityScore >= 86) {
        why.push("流程穩定，失敗率相對低");
      }
      if (!eligible) {
        why.push(`缺少器材：${missingAppliances.join("、")}`);
      }

      return {
        ...menu,
        adjustedCost,
        adjustedMarketCost,
        adjustedMinutes,
        estimatedSavings,
        pantryHits,
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

export function buildShoppingList(
  selectedMenus: ScoredMenu[],
  profile: UserProfile
): ShoppingListGroup[] {
  const map = new Map<string, ShoppingListItem>();

  selectedMenus.forEach((menu) => {
    menu.ingredients.forEach((ingredient) => {
      const fromPantry = ingredient.pantryEligible && profile.pantry.includes(ingredient.key);
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
        .sort((left, right) => Number(left.fromPantry) - Number(right.fromPantry) || right.totalCost - left.totalCost);

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

function scoreVariant(variant: ExperimentVariant, experiment: Experiment, profile: UserProfile): number {
  const skillGap = skillDelta(profile.skillLevel, variant.requiredSkill);
  let score = variant.successRate * 0.5 + variant.stabilityScore * 0.35 + variant.textureScore * 0.15;
  score += variant.cookMinutes <= profile.maxCookMinutes ? 15 : profile.maxCookMinutes - variant.cookMinutes;
  score += skillGap >= 0 ? 10 + skillGap * 4 : skillGap * 18;

  if (profile.mainGoal === "快速上桌") {
    score += Math.max(0, 22 - variant.cookMinutes);
  }
  if (profile.mainGoal === "少失敗優先") {
    score += variant.successRate * 0.2 + variant.stabilityScore * 0.2;
  }
  if (profile.mainGoal === "想練技巧") {
    score += variant.textureScore * 0.3;
  }
  if (profile.mainGoal === "省錢優先") {
    score += Math.max(0, 24 - variant.estimatedCost / 8);
  }

  if (experiment.title.includes("麻油雞") && profile.mainGoal === "少失敗優先") {
    score += 8;
  }

  return score;
}

export function getExperimentAdvice(
  experiment: Experiment,
  profile: UserProfile
): ExperimentAdvice {
  const variant = [...experiment.variants].sort(
    (left, right) => scoreVariant(right, experiment, profile) - scoreVariant(left, experiment, profile)
  )[0];

  let reason = `${variant.label} 比較符合你現在的 ${profile.maxCookMinutes} 分鐘時間上限。`;

  if (profile.mainGoal === "少失敗優先") {
    reason = `${variant.label} 的穩定度與成功率更高，對目前這週目標最合理。`;
  } else if (profile.mainGoal === "快速上桌") {
    reason = `${variant.label} 能在較短流程內保留可接受的成功率，適合工作日晚餐。`;
  } else if (profile.mainGoal === "想練技巧") {
    reason = `${variant.label} 留下更多手感與口感差異，適合拿來練火候判斷。`;
  } else if (profile.mainGoal === "省錢優先") {
    reason = `${variant.label} 的單次成本較可控，失敗時的浪費也比較低。`;
  }

  return { variant, reason };
}

export function formatLocalCurrency(value: number): string {
  return `NT$ ${value.toLocaleString("zh-TW")}`;
}
