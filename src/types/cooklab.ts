export type Trend = "上升" | "下降" | "持平";

export type SkillLevel = "新手" | "普通" | "熟手";

export type GoalTag =
  | "省錢優先"
  | "少失敗優先"
  | "快速上桌"
  | "便當備餐"
  | "想練技巧";

export type Appliance = "氣炸鍋" | "平底鍋" | "湯鍋" | "電鍋" | "烤箱";

export type IngredientSection = "蔬菜" | "蛋白質" | "乾貨調味" | "冷凍" | "主食";

export interface ExperimentVariant {
  id: string;
  label: string;
  cookMinutes: number;
  successRate: number;
  textureScore: number;
  stabilityScore: number;
  estimatedCost: number;
  requiredSkill: SkillLevel;
  bestFor: string;
  note: string;
  quickFix: string;
}

export interface Experiment {
  id: string;
  title: string;
  question: string;
  variants: ExperimentVariant[];
}

export interface IngredientLine {
  key: string;
  name: string;
  amount: string;
  section: IngredientSection;
  estimatedCost: number;
  pantryEligible: boolean;
}

export interface RescueScenario {
  id: string;
  title: string;
  symptom: string;
  fix: string;
  prevention: string;
}

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  baseServings: number;
  baseCost: number;
  marketCost: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: SkillLevel;
  appliances: Appliance[];
  goalTags: GoalTag[];
  seasonalFit: number;
  stabilityScore: number;
  heroNote: string;
  leftoverPlan: string;
  ingredients: IngredientLine[];
  rescueScenarios: RescueScenario[];
}

export interface SeasonalSignal {
  ingredient: string;
  trend: Trend;
  range: string;
  action: string;
}

export interface Report {
  title: string;
  summary: string;
  confidence: number;
  keyFinding: string;
}

export interface ContentPlan {
  title: string;
  outline: string[];
}

export interface UserProfile {
  householdSize: number;
  weeklyBudget: number;
  maxCookMinutes: number;
  cookingDays: number;
  skillLevel: SkillLevel;
  mainGoal: GoalTag;
  appliances: Appliance[];
  pantry: string[];
}

export interface QuickPreset {
  id: string;
  label: string;
  description: string;
  profile: Partial<UserProfile>;
}

export interface PricingPlan {
  id: string;
  name: string;
  priceLabel: string;
  billingNote: string;
  audience: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

export interface OptionItem {
  key: string;
  label: string;
}

export interface ScoredMenu extends MenuItem {
  adjustedCost: number;
  adjustedMarketCost: number;
  adjustedMinutes: number;
  estimatedSavings: number;
  pantryHits: number;
  missingAppliances: Appliance[];
  eligible: boolean;
  score: number;
  why: string[];
}

export interface ShoppingListItem {
  key: string;
  name: string;
  section: IngredientSection;
  amounts: string[];
  totalCost: number;
  fromPantry: boolean;
  menus: string[];
}

export interface ShoppingListGroup {
  section: IngredientSection;
  items: ShoppingListItem[];
}

export interface RescueFeedItem {
  menuId: string;
  menuTitle: string;
  scenario: RescueScenario;
}

export interface ExperimentAdvice {
  variant: ExperimentVariant;
  reason: string;
}
