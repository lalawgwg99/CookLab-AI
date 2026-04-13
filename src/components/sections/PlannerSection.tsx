import React from "react";
import {
  Appliance,
  GoalTag,
  OptionItem,
  QuickPreset,
  ScoredMenu,
  SkillLevel,
  UserProfile,
} from "../../types/cooklab";
import { formatLocalCurrency } from "../../lib/planner";

interface PlannerSectionProps {
  profile: UserProfile;
  presets: QuickPreset[];
  skillOptions: SkillLevel[];
  goalOptions: GoalTag[];
  applianceOptions: Appliance[];
  pantryOptions: OptionItem[];
  recommendedMenus: ScoredMenu[];
  onApplyPreset: (preset: QuickPreset) => void;
  onPatchProfile: (patch: Partial<UserProfile>) => void;
  onToggleAppliance: (appliance: Appliance) => void;
  onTogglePantry: (ingredientKey: string) => void;
  onApplyRecommendations: () => void;
}

export function PlannerSection({
  profile,
  presets,
  skillOptions,
  goalOptions,
  applianceOptions,
  pantryOptions,
  recommendedMenus,
  onApplyPreset,
  onPatchProfile,
  onToggleAppliance,
  onTogglePantry,
  onApplyRecommendations,
}: PlannerSectionProps) {
  const topMenus = recommendedMenus.slice(0, Math.max(3, profile.cookingDays));

  return (
    <section className="section section-surface" id="planner">
      <div className="container grid-2">
        <div className="panel planner-panel">
          <div className="section-heading">
            <p className="section-kicker">Human-centered planning</p>
            <h2>Start from real household constraints, not idealized recipe dreams.</h2>
            <p>
              This is the part people pay for: the planner remembers budget, time, skill, tools,
              and pantry reality, then turns that into a weekly answer.
            </p>
          </div>

          <div className="preset-grid">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="preset-card"
                onClick={() => onApplyPreset(preset)}
              >
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>

          <div className="control-grid">
            <label className="control-card">
              <span className="control-top">
                <span>Household size</span>
                <strong>{profile.householdSize} people</strong>
              </span>
              <input
                type="range"
                min="1"
                max="5"
                value={profile.householdSize}
                onChange={(event) =>
                  onPatchProfile({ householdSize: Number(event.target.value) })
                }
              />
            </label>

            <label className="control-card">
              <span className="control-top">
                <span>Weekly budget</span>
                <strong>{formatLocalCurrency(profile.weeklyBudget)}</strong>
              </span>
              <input
                type="range"
                min="500"
                max="1800"
                step="50"
                value={profile.weeklyBudget}
                onChange={(event) =>
                  onPatchProfile({ weeklyBudget: Number(event.target.value) })
                }
              />
            </label>

            <label className="control-card">
              <span className="control-top">
                <span>Time ceiling per dish</span>
                <strong>{profile.maxCookMinutes} min</strong>
              </span>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={profile.maxCookMinutes}
                onChange={(event) =>
                  onPatchProfile({ maxCookMinutes: Number(event.target.value) })
                }
              />
            </label>

            <label className="control-card">
              <span className="control-top">
                <span>Cooking days</span>
                <strong>{profile.cookingDays} days</strong>
              </span>
              <input
                type="range"
                min="3"
                max="5"
                value={profile.cookingDays}
                onChange={(event) =>
                  onPatchProfile({ cookingDays: Number(event.target.value) })
                }
              />
            </label>
          </div>

          <div className="selector-group">
            <div>
              <p className="selector-title">Primary goal</p>
              <div className="chip-row">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    className={profile.mainGoal === goal ? "chip chip-active" : "chip"}
                    onClick={() => onPatchProfile({ mainGoal: goal })}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="selector-title">Skill level</p>
              <div className="chip-row">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className={profile.skillLevel === skill ? "chip chip-active" : "chip"}
                    onClick={() => onPatchProfile({ skillLevel: skill })}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="selector-title">Owned tools</p>
              <div className="chip-row">
                {applianceOptions.map((appliance) => (
                  <button
                    key={appliance}
                    type="button"
                    className={
                      profile.appliances.includes(appliance) ? "chip chip-active" : "chip"
                    }
                    onClick={() => onToggleAppliance(appliance)}
                  >
                    {appliance}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="selector-title">Already in pantry</p>
              <div className="chip-row">
                {pantryOptions.map((ingredient) => (
                  <button
                    key={ingredient.key}
                    type="button"
                    className={
                      profile.pantry.includes(ingredient.key) ? "chip chip-active" : "chip"
                    }
                    onClick={() => onTogglePantry(ingredient.key)}
                  >
                    {ingredient.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="panel recommendation-panel">
          <div className="section-heading">
            <p className="section-kicker">What the user sees</p>
            <h2>CookLab's recommended weekly stack</h2>
            <p>
              These are scored against budget, time, appliances, pantry matches, and your chosen
              goal. This is the core retention loop.
            </p>
          </div>

          <div className="recommendation-list">
            {topMenus.map((menu, index) => (
              <article className="recommendation-card" key={menu.id}>
                <div className="recommendation-head">
                  <span className="index-pill">{index + 1}</span>
                  <div>
                    <h3>{menu.title}</h3>
                    <p>{menu.description}</p>
                  </div>
                </div>

                <div className="mini-stat-row">
                  <span>{formatLocalCurrency(menu.adjustedCost)}</span>
                  <span>{menu.adjustedMinutes} min</span>
                  <span>score {menu.score}</span>
                </div>

                <div className="reason-list">
                  {menu.why.map((reason) => (
                    <span className="reason-pill" key={reason}>
                      {reason}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <button type="button" className="button button-primary full-width" onClick={onApplyRecommendations}>
            Apply this weekly stack
          </button>
        </aside>
      </div>
    </section>
  );
}
