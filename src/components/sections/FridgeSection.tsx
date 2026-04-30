import React, { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { FridgeInsights, ScoredMenu } from "../../types/cooklab";
import { formatLocalCurrency } from "../../lib/planner";

interface FridgeSectionProps {
  fridgeItems: string[];
  suggestions: string[];
  topMatches: ScoredMenu[];
  insights: FridgeInsights;
  currencyLocale: string;
  onAddItems: (items: string[]) => void;
  onRemoveItem: (item: string) => void;
}

export function FridgeSection({
  fridgeItems,
  suggestions,
  topMatches,
  insights,
  currencyLocale,
  onAddItems,
  onRemoveItem,
}: FridgeSectionProps) {
  const [input, setInput] = useState("");
  const { t } = useTranslation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedItems = input
      .split(/[\n,，;/]+/g)
      .map((item) => item.trim())
      .filter(Boolean);

    if (parsedItems.length === 0) {
      return;
    }
    onAddItems(parsedItems);
    setInput("");
  };

  return (
    <section className="section" id="fridge">
      <div className="container grid-2">
        <div className="panel">
          <div className="section-heading">
            <p className="section-kicker">{t("fridge.kicker")}</p>
            <h2>{t("fridge.title")}</h2>
            <p>{t("fridge.desc")}</p>
          </div>

          <form className="waitlist-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("fridge.placeholder")}
              aria-label="Add food"
            />
            <button type="submit" className="button button-primary">
              {t("fridge.add")}
            </button>
          </form>

          <div className="selector-group">
            <div>
              <p className="selector-title">{t("fridge.quickAdd")}</p>
              <div className="chip-row">
                {suggestions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="chip"
                    onClick={() => onAddItems([item])}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="selector-title">{t("fridge.inventory")}</p>
              <div className="chip-row">
                {fridgeItems.length === 0 && <span className="empty-note">{t("fridge.empty")}</span>}
                {fridgeItems.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="chip chip-active"
                    onClick={() => onRemoveItem(item)}
                    title="Remove"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            </div>

            <div className="fridge-insight-grid">
              <article className="fridge-insight-card">
                <span>{t("fridge.coverage")}</span>
                <strong>{Math.round(insights.coverageRate * 100)}%</strong>
                <p>{t("fridge.coverageDesc", { covered: insights.coveredIngredients, total: insights.totalIngredients })}</p>
              </article>
              <article className="fridge-insight-card">
                <span>{t("fridge.waste")}</span>
                <strong>{insights.wasteRisk}</strong>
                <p>
                  {insights.unusedItems.length === 0
                    ? t("fridge.wasteNone")
                    : t("fridge.wasteCount", { count: insights.unusedItems.length })}
                </p>
              </article>
            </div>

            {insights.recoveryIdeas.length > 0 && (
              <div>
                <p className="selector-title">{t("fridge.recoveryTitle")}</p>
                <div className="recovery-list">
                  {insights.recoveryIdeas.map((idea) => (
                    <article key={idea.item} className="recovery-item">
                      <strong>{idea.item}</strong>
                      <p>{idea.menuTitles.join(" / ")}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="panel recommendation-panel">
          <div className="section-heading compact-heading">
            <p className="section-kicker">{t("fridge.resultsKicker")}</p>
            <h2>{t("fridge.resultsTitle")}</h2>
          </div>

          <div className="recommendation-list">
            {topMatches.length === 0 && (
              <article className="recommendation-card">
                <h3>{t("fridge.noMatchesTitle")}</h3>
                <p>{t("fridge.noMatchesDesc")}</p>
              </article>
            )}
            {topMatches.map((menu) => (
              <article className="recommendation-card" key={menu.id}>
                <h3>{menu.title}</h3>
                <p>{menu.description}</p>
                <div className="mini-stat-row">
                  <span>{t("fridge.fitCount", { count: menu.fridgeHits })}</span>
                  <span>{menu.adjustedMinutes} min</span>
                  <span>{formatLocalCurrency(menu.adjustedCost, currencyLocale)}</span>
                  <span>{menu.adjustedProtein} g protein</span>
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
        </aside>
      </div>
    </section>
  );
}
