import React from "react";
import { ScoredMenu, ShoppingListGroup } from "../../types/cooklab";
import { formatLocalCurrency } from "../../lib/planner";

interface MenuWorkbenchSectionProps {
  menus: ScoredMenu[];
  selectedMenuIds: string[];
  shoppingGroups: ShoppingListGroup[];
  budgetSummary: {
    plannedCost: number;
    marketCost: number;
    savings: number;
    remainingBudget: number;
    selectedCount: number;
  };
  onToggleMenu: (menuId: string) => void;
}

export function MenuWorkbenchSection({
  menus,
  selectedMenuIds,
  shoppingGroups,
  budgetSummary,
  onToggleMenu,
}: MenuWorkbenchSectionProps) {
  return (
    <section className="section" id="menus">
      <div className="container workbench-grid">
        <div className="panel">
          <div className="section-heading">
            <p className="section-kicker">Plan workbench</p>
            <h2>Let users edit the stack without destroying the recommendation logic.</h2>
            <p>
              A paid tool needs control. The user can override the plan, but CookLab still keeps
              budget, time, and rescue context in sync.
            </p>
          </div>

          <div className="commercial-strip">
            <strong>Pro conversion hook</strong>
            <span>
              Save pantry memory, regenerate the week in one tap, and export the shopping list to
              messaging apps.
            </span>
          </div>

          <div className="menu-grid">
            {menus.map((menu) => {
              const selected = selectedMenuIds.includes(menu.id);

              return (
                <article
                  className={
                    selected
                      ? "menu-card menu-card-selected"
                      : menu.eligible
                        ? "menu-card"
                        : "menu-card menu-card-disabled"
                  }
                  key={menu.id}
                >
                  <div className="menu-card-top">
                    <div>
                      <h3>{menu.title}</h3>
                      <p>{menu.description}</p>
                    </div>
                    <span className={menu.eligible ? "status-pill" : "status-pill status-pill-warn"}>
                      {menu.eligible ? "Ready" : `Needs ${menu.missingAppliances.join(" / ")}`}
                    </span>
                  </div>

                  <div className="mini-stat-row">
                    <span>{formatLocalCurrency(menu.adjustedCost)}</span>
                    <span>{menu.adjustedMinutes} min</span>
                    <span>stability {menu.stabilityScore}</span>
                  </div>

                  <p className="menu-note">{menu.heroNote}</p>
                  <p className="menu-leftover">Leftover logic: {menu.leftoverPlan}</p>

                  <div className="reason-list">
                    {menu.why.map((reason) => (
                      <span className="reason-pill" key={reason}>
                        {reason}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={selected ? "button button-secondary full-width" : "button button-ghost full-width"}
                    onClick={() => onToggleMenu(menu.id)}
                  >
                    {selected ? "Remove from week" : "Add to week"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="panel aside-panel">
          <div className="summary-stack">
            <article className="summary-tile">
              <span>Planned cost</span>
              <strong>{formatLocalCurrency(budgetSummary.plannedCost)}</strong>
            </article>
            <article className="summary-tile">
              <span>Market cost</span>
              <strong>{formatLocalCurrency(budgetSummary.marketCost)}</strong>
            </article>
            <article className="summary-tile">
              <span>Savings</span>
              <strong>{formatLocalCurrency(budgetSummary.savings)}</strong>
            </article>
            <article
              className={
                budgetSummary.remainingBudget >= 0
                  ? "summary-tile summary-tile-positive"
                  : "summary-tile summary-tile-negative"
              }
            >
              <span>Budget left</span>
              <strong>{formatLocalCurrency(budgetSummary.remainingBudget)}</strong>
            </article>
          </div>

          <div className="shopping-panel">
            <div className="section-heading compact-heading">
              <p className="section-kicker">Auto-built shopping list</p>
              <h2>Shopping list stays synced with the plan.</h2>
            </div>

            {shoppingGroups.map((group) => (
              <div className="shopping-group" key={group.section}>
                <h3>{group.section}</h3>
                <div className="shopping-items">
                  {group.items.map((item) => (
                    <article className="shopping-item" key={item.key}>
                      <div className="shopping-head">
                        <strong>{item.name}</strong>
                        <span>{item.fromPantry ? "From pantry" : formatLocalCurrency(item.totalCost)}</span>
                      </div>
                      <p>{item.amounts.join(" / ")}</p>
                      <p className="shopping-meta">Used in {item.menus.join("、")}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
