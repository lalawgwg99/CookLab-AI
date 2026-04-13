import React, { FormEvent, useMemo, useState } from "react";
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
import { PlannerSection } from "./components/sections/PlannerSection";
import { MenuWorkbenchSection } from "./components/sections/MenuWorkbenchSection";
import { ExperimentSection } from "./components/sections/ExperimentSection";
import { SupportSection } from "./components/sections/SupportSection";
import { PricingSection } from "./components/sections/PricingSection";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import {
  buildBudgetSummary,
  buildRescueFeed,
  buildShoppingList,
  formatLocalCurrency,
  getExperimentAdvice,
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

  const scoredMenus = useMemo(() => scoreMenus(menuItems, profile), [profile]);
  const recommendedMenus = useMemo(
    () => scoredMenus.filter((menu) => menu.eligible).slice(0, Math.max(profile.cookingDays, 3)),
    [profile.cookingDays, scoredMenus]
  );
  const selectedMenus = useMemo(
    () => scoredMenus.filter((menu) => selectedMenuIds.includes(menu.id)),
    [scoredMenus, selectedMenuIds]
  );
  const budgetSummary = useMemo(
    () => buildBudgetSummary(selectedMenus, profile),
    [profile, selectedMenus]
  );
  const shoppingGroups = useMemo(
    () => buildShoppingList(selectedMenus, profile),
    [profile, selectedMenus]
  );
  const rescueFeed = useMemo(() => buildRescueFeed(selectedMenus).slice(0, 6), [selectedMenus]);
  const activeExperiment =
    experiments.find((experiment) => experiment.id === activeExperimentId) ?? experiments[0];
  const advice = useMemo(
    () => getExperimentAdvice(activeExperiment, profile),
    [activeExperiment, profile]
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
      pantry: current.pantry.includes(ingredientKey)
        ? current.pantry.filter((key) => key !== ingredientKey)
        : [...current.pantry, ingredientKey],
    }));
  };

  const toggleAppliance = (appliance: Appliance): void => {
    setProfile((current) => ({
      ...current,
      appliances: current.appliances.includes(appliance)
        ? current.appliances.filter((item) => item !== appliance)
        : [...current.appliances, appliance],
    }));
  };

  const applyPreset = (preset: QuickPreset): void => {
    const nextProfile = {
      ...profile,
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
    setSelectedMenuIds(recommendedMenus.slice(0, profile.cookingDays).map((menu) => menu.id));
  };

  const handleVariantSelect = (experimentId: string, variantId: string): void => {
    setVariantMap((current) => ({
      ...current,
      [experimentId]: variantId,
    }));
  };

  const handleWaitlistSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!isValidEmail) {
      setWaitlistStatus("error");
      return;
    }

    setWaitlistStatus("success");
    setEmail("");
  };

  return (
    <div className="site-shell">
      <header className="top-nav">
        <div className="container nav-row">
          <a className="brand-lockup" href="#top">
            <span className="brand-orb" />
            <span>CookLab AI</span>
          </a>
          <nav className="nav-links">
            <a href="#planner">Planner</a>
            <a href="#menus">Workbench</a>
            <a href="#lab">Experiment</a>
            <a href="#support">Support</a>
            <a href="#pricing">Pricing</a>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection
          brandPositioning={brandPositioning}
          shortSlogans={shortSlogans}
          suggestedMenu={recommendedMenus[0]}
          plannedSavingsLabel={formatLocalCurrency(budgetSummary.savings)}
          selectedCount={budgetSummary.selectedCount}
        />

        <PlannerSection
          profile={profile}
          presets={quickPresets}
          skillOptions={skillOptions}
          goalOptions={goalOptions}
          applianceOptions={applianceOptions}
          pantryOptions={pantryOptions}
          recommendedMenus={recommendedMenus}
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
          onToggleMenu={toggleMenu}
        />

        <ExperimentSection
          experiments={experiments}
          activeExperimentId={activeExperimentId}
          activeVariantId={activeVariantId}
          advice={advice}
          onSelectExperiment={setActiveExperimentId}
          onSelectVariant={handleVariantSelect}
        />

        <SupportSection rescueFeed={rescueFeed} reports={reports} contentPlans={weekOnePlan} />

        <PricingSection
          pricingPlans={pricingPlans}
          email={email}
          status={waitlistStatus}
          onEmailChange={(value) => {
            setEmail(value);
            if (waitlistStatus !== "idle") {
              setWaitlistStatus("idle");
            }
          }}
          onSubmit={handleWaitlistSubmit}
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
