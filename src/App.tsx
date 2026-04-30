import React, { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applianceOptions,
  brandPositioning,
  defaultProfile,
  experiments,
  goalOptions,
  menuItems,
  pantryOptions,
  pricingPlans,
  quickPresets,
  reports,
  shortSlogans,
  skillOptions,
  weekOnePlan,
} from "./data/cooklab";
import { HeroSection } from "./components/sections/HeroSection";
import { FridgeSection } from "./components/sections/FridgeSection";
import { PlannerSection } from "./components/sections/PlannerSection";
import { MenuWorkbenchSection } from "./components/sections/MenuWorkbenchSection";
import { ExperimentSection } from "./components/sections/ExperimentSection";
import { SupportSection } from "./components/sections/SupportSection";
import { PricingSection } from "./components/sections/PricingSection";
import { AuthSection } from "./components/sections/AuthSection";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useAuth } from "./hooks/useAuth";
import {
  buildBudgetSummary,
  buildFridgeInsights,
  buildNutritionSummary,
  buildRescueFeed,
  buildShoppingList,
  formatLocalCurrency,
  getExperimentAdvice,
  normalizeIngredientToken,
  scoreMenus,
} from "./lib/planner";
import { Appliance, QuickPreset, UserProfile } from "./types/cooklab";

const defaultSelectedMenuIds = scoreMenus(menuItems, defaultProfile)
  .filter((menu) => menu.eligible)
  .slice(0, defaultProfile.cookingDays)
  .map((menu) => menu.id);

const defaultVariantMap = Object.fromEntries(
  experiments.map((experiment) => [experiment.id, experiment.variants[0].id])
);

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, signIn, signUp, signOut, hasConfig } = useAuth();
  const [profile, setProfile] = useLocalStorageState<UserProfile>(
    "cooklab.global-profile",
    defaultProfile
  );
  const [selectedMenuIds, setSelectedMenuIds] = useLocalStorageState<string[]>(
    "cooklab.selected-menu-ids",
    defaultSelectedMenuIds
  );
  const [variantMap, setVariantMap] = useState<Record<string, string>>(defaultVariantMap);
  const [activeExperimentId, setActiveExperimentId] = useState(experiments[0].id);
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "error" | "success">("idle");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "error">("idle");
  const currencyLocale = i18n.language === "zh-TW" ? "zh-TW" : "en";

  const normalizedProfile = useMemo<UserProfile>(
    () => ({
      ...defaultProfile,
      ...profile,
      appliances: profile.appliances ?? defaultProfile.appliances,
      pantry: profile.pantry ?? defaultProfile.pantry,
      fridgeItems: profile.fridgeItems ?? defaultProfile.fridgeItems,
    }),
    [profile]
  );

  const scoredMenus = useMemo(() => scoreMenus(menuItems, normalizedProfile), [normalizedProfile]);
  const recommendedMenus = useMemo(
    () => scoredMenus.filter((menu) => menu.eligible).slice(0, Math.max(normalizedProfile.cookingDays, 3)),
    [normalizedProfile.cookingDays, scoredMenus]
  );
  const fridgeTopMatches = useMemo(
    () =>
      scoredMenus
        .filter((menu) => menu.eligible)
        .sort((left, right) => right.fridgeHits - left.fridgeHits || right.score - left.score)
        .slice(0, 3),
    [scoredMenus]
  );
  const selectedMenus = useMemo(
    () => scoredMenus.filter((menu) => selectedMenuIds.includes(menu.id)),
    [scoredMenus, selectedMenuIds]
  );
  const budgetSummary = useMemo(
    () => buildBudgetSummary(selectedMenus, normalizedProfile),
    [normalizedProfile, selectedMenus]
  );
  const shoppingGroups = useMemo(
    () => buildShoppingList(selectedMenus, normalizedProfile),
    [normalizedProfile, selectedMenus]
  );
  const nutritionSummary = useMemo(
    () => buildNutritionSummary(selectedMenus),
    [selectedMenus]
  );
  const fridgeInsights = useMemo(
    () => buildFridgeInsights(selectedMenus, scoredMenus, normalizedProfile),
    [normalizedProfile, scoredMenus, selectedMenus]
  );
  const rescueFeed = useMemo(() => buildRescueFeed(selectedMenus).slice(0, 6), [selectedMenus]);
  const activeExperiment =
    experiments.find((experiment) => experiment.id === activeExperimentId) ?? experiments[0];
  const advice = useMemo(
    () => getExperimentAdvice(activeExperiment, normalizedProfile),
    [activeExperiment, normalizedProfile]
  );
  const activeVariantId = variantMap[activeExperiment.id] ?? advice.variant.id;

  const patchProfile = (patch: Partial<UserProfile>): void => {
    setProfile((current) => ({
      ...current,
      ...patch,
    }));
  };

  const toggleMenu = (menuId: string): void => {
    setSelectedMenuIds((current) =>
      current.includes(menuId)
        ? current.filter((id) => id !== menuId)
        : [...current, menuId]
    );
  };

  const togglePantry = (ingredientKey: string): void => {
    setProfile((current) => ({
      ...current,
      pantry: (current.pantry ?? []).includes(ingredientKey)
        ? (current.pantry ?? []).filter((key) => key !== ingredientKey)
        : [...(current.pantry ?? []), ingredientKey],
    }));
  };

  const addFridgeItems = (items: string[]): void => {
    if (items.length === 0) {
      return;
    }

    setProfile((current) => {
      const currentFridge = current.fridgeItems ?? [];
      const seen = new Set(currentFridge.map((entry) => normalizeIngredientToken(entry)));
      const nextItems: string[] = [];

      items.forEach((item) => {
        const cleaned = item.trim();
        if (!cleaned) {
          return;
        }
        const token = normalizeIngredientToken(cleaned);
        if (!token || seen.has(token)) {
          return;
        }
        seen.add(token);
        nextItems.push(cleaned);
      });

      if (nextItems.length === 0) {
        return current;
      }

      return {
        ...current,
        fridgeItems: [...currentFridge, ...nextItems],
      };
    });
  };

  const removeFridgeItem = (item: string): void => {
    const normalized = normalizeIngredientToken(item);
    setProfile((current) => ({
      ...current,
      fridgeItems: (current.fridgeItems ?? []).filter(
        (entry) => normalizeIngredientToken(entry) !== normalized
      ),
    }));
  };

  const toggleAppliance = (appliance: Appliance): void => {
    setProfile((current) => ({
      ...current,
      appliances: (current.appliances ?? []).includes(appliance)
        ? (current.appliances ?? []).filter((item) => item !== appliance)
        : [...(current.appliances ?? []), appliance],
    }));
  };

  const applyPreset = (preset: QuickPreset): void => {
    const nextProfile = {
      ...normalizedProfile,
      ...preset.profile,
    };
    setProfile(nextProfile);
    setSelectedMenuIds(
      scoreMenus(menuItems, nextProfile)
        .filter((menu) => menu.eligible)
        .slice(0, Math.max(nextProfile.cookingDays, 3))
        .map((menu) => menu.id)
    );
  };

  const applyRecommendations = (): void => {
    setSelectedMenuIds(recommendedMenus.slice(0, normalizedProfile.cookingDays).map((menu) => menu.id));
  };

  const handleVariantSelect = (experimentId: string, variantId: string): void => {
    setVariantMap((current) => ({
      ...current,
      [experimentId]: variantId,
    }));
  };

  const handleWaitlistSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setWaitlistStatus("error");
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/waitlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            locale: i18n.language,
            source: "landing",
            userId: user?.id ?? null,
            planId: "pro",
          }),
        });

        if (!response.ok) {
          throw new Error("waitlist_failed");
        }

        setWaitlistStatus("success");
        setEmail("");
      } catch {
        setWaitlistStatus("error");
      }
    })();
  };

  const handleCheckout = (checkoutKey?: string): void => {
    if (!checkoutKey) {
      return;
    }

    setCheckoutStatus("idle");
    void (async () => {
      try {
        const normalizedEmail =
          user?.email ?? (email.trim().toLowerCase() || undefined);

        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checkoutKey,
            email: normalizedEmail,
            userId: user?.id ?? null,
            locale: i18n.language,
          }),
        });

        if (!response.ok) {
          throw new Error("checkout_failed");
        }

        const data = (await response.json()) as { url?: string };
        if (!data.url) {
          throw new Error("missing_checkout_url");
        }

        window.location.href = data.url;
      } catch {
        setCheckoutStatus("error");
      }
    })();
  };

  return (
    <div className="site-shell">
      <header className="top-nav">
        <div className="container nav-row">
          <a className="brand-lockup" href="#top">
            <span className="brand-orb" />
            <span>CookLab AI</span>
          </a>
          <span className="beta-pill">{t("common.betaFree")}</span>
          <nav className="nav-links">
            <a href="#fridge">{t("nav.fridge")}</a>
            <a href="#planner">{t("nav.planner")}</a>
            <a href="#menus">{t("nav.workbench")}</a>
            <a href="#lab">{t("nav.experiment")}</a>
            <a href="#support">{t("nav.support")}</a>
            <a href="#pricing">{t("nav.pricing")}</a>
            <button
              type="button"
              className={i18n.language === "zh-TW" ? "chip chip-active nav-lang" : "chip nav-lang"}
              onClick={() => {
                void i18n.changeLanguage("zh-TW");
              }}
            >
              {t("common.chinese")}
            </button>
            <button
              type="button"
              className={i18n.language === "en" ? "chip chip-active nav-lang" : "chip nav-lang"}
              onClick={() => {
                void i18n.changeLanguage("en");
              }}
            >
              {t("common.english")}
            </button>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection
          brandPositioning={brandPositioning}
          shortSlogans={shortSlogans}
          suggestedMenu={recommendedMenus[0]}
          plannedSavingsLabel={formatLocalCurrency(budgetSummary.savings, currencyLocale)}
          selectedCount={budgetSummary.selectedCount}
        />

        <FridgeSection
          fridgeItems={normalizedProfile.fridgeItems}
          suggestions={[
            "chicken breast",
            "eggs",
            "greek yogurt",
            "tofu",
            "oats",
            "rice",
          ]}
          topMatches={fridgeTopMatches}
          insights={fridgeInsights}
          currencyLocale={currencyLocale}
          onAddItems={addFridgeItems}
          onRemoveItem={removeFridgeItem}
        />

        <PlannerSection
          profile={normalizedProfile}
          presets={quickPresets}
          skillOptions={skillOptions}
          goalOptions={goalOptions}
          applianceOptions={applianceOptions}
          pantryOptions={pantryOptions}
          recommendedMenus={recommendedMenus}
          currencyLocale={currencyLocale}
          onApplyPreset={applyPreset}
          onPatchProfile={patchProfile}
          onToggleAppliance={toggleAppliance}
          onTogglePantry={togglePantry}
          onApplyRecommendations={applyRecommendations}
        />

        <MenuWorkbenchSection
          menus={scoredMenus}
          selectedMenuIds={selectedMenuIds}
          shoppingGroups={shoppingGroups}
          budgetSummary={budgetSummary}
          nutritionSummary={nutritionSummary}
          currencyLocale={currencyLocale}
          onToggleMenu={toggleMenu}
        />

        <ExperimentSection
          experiments={experiments}
          activeExperimentId={activeExperimentId}
          activeVariantId={activeVariantId}
          advice={advice}
          currencyLocale={currencyLocale}
          onSelectExperiment={setActiveExperimentId}
          onSelectVariant={handleVariantSelect}
        />

        <AuthSection
          user={user}
          loading={authLoading}
          hasConfig={hasConfig}
          onSignIn={signIn}
          onSignUp={signUp}
          onSignOut={signOut}
        />

        <SupportSection rescueFeed={rescueFeed} reports={reports} contentPlans={weekOnePlan} />

        <PricingSection
          pricingPlans={pricingPlans}
          email={email}
          status={waitlistStatus}
          checkoutStatus={checkoutStatus}
          onEmailChange={(value) => {
            setEmail(value);
            if (waitlistStatus !== "idle") {
              setWaitlistStatus("idle");
            }
            if (checkoutStatus !== "idle") {
              setCheckoutStatus("idle");
            }
          }}
          onSubmit={handleWaitlistSubmit}
          onCheckout={handleCheckout}
        />
      </main>

      <footer className="footer">
        <div className="container footer-row">
          <strong>CookLab AI</strong>
          <span>{brandPositioning}</span>
        </div>
      </footer>
    </div>
  );
}
