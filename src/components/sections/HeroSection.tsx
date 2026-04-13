import React from "react";
import { ScoredMenu } from "../../types/cooklab";

interface HeroSectionProps {
  brandPositioning: string;
  shortSlogans: string[];
  suggestedMenu?: ScoredMenu;
  plannedSavingsLabel: string;
  selectedCount: number;
}

export function HeroSection({
  brandPositioning,
  shortSlogans,
  suggestedMenu,
  plannedSavingsLabel,
  selectedCount,
}: HeroSectionProps) {
  return (
    <section className="hero-section" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow-row">
            <span className="eyebrow">Global consumer product</span>
            <span className="eyebrow eyebrow-muted">Taiwan market beta inside</span>
          </div>

          <h1>Build a cooking product people will pay for, not another recipe brochure.</h1>
          <p className="hero-lead">
            CookLab AI turns verified recipes, grocery intelligence, shopping logic, and failure rescue
            into a weekly operating system for home cooks. The planner below uses Taiwan demo pricing,
            while the product structure is built for a global subscription launch.
          </p>
          <p className="hero-positioning">{brandPositioning}</p>

          <div className="hero-actions">
            <a className="button button-primary" href="#planner">
              Rebuild the planner
            </a>
            <a className="button button-secondary" href="#pricing">
              Inspect pricing model
            </a>
          </div>

          <div className="slogan-row">
            {shortSlogans.map((slogan) => (
              <span className="slogan-chip" key={slogan}>
                {slogan}
              </span>
            ))}
          </div>
        </div>

        <aside className="hero-card">
          <p className="card-label">Why this can monetize</p>
          <h2>Weekly planning, rescue guidance, and market-aware grocery logic create repeat value.</h2>
          <div className="hero-stats">
            <article>
              <strong>{selectedCount}</strong>
              <span>meals currently in plan</span>
            </article>
            <article>
              <strong>{plannedSavingsLabel}</strong>
              <span>demo savings with current stack</span>
            </article>
            <article>
              <strong>{suggestedMenu?.adjustedMinutes ?? 0} min</strong>
              <span>for the top suggested dish</span>
            </article>
          </div>

          <div className="hero-card-note">
            <p className="card-label">Tonight's best fit</p>
            <strong>{suggestedMenu?.title ?? "Choose your first market-ready menu"}</strong>
            <p>{suggestedMenu?.heroNote ?? "Once preferences are set, CookLab tells the user what to cook first."}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
