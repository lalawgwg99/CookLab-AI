import React from "react";
import { Experiment, ExperimentAdvice } from "../../types/cooklab";
import { formatLocalCurrency } from "../../lib/planner";

interface ExperimentSectionProps {
  experiments: Experiment[];
  activeExperimentId: string;
  activeVariantId: string;
  advice: ExperimentAdvice;
  onSelectExperiment: (experimentId: string) => void;
  onSelectVariant: (experimentId: string, variantId: string) => void;
}

export function ExperimentSection({
  experiments,
  activeExperimentId,
  activeVariantId,
  advice,
  onSelectExperiment,
  onSelectVariant,
}: ExperimentSectionProps) {
  const activeExperiment =
    experiments.find((experiment) => experiment.id === activeExperimentId) ?? experiments[0];

  return (
    <section className="section section-surface" id="lab">
      <div className="container">
        <div className="section-heading">
          <p className="section-kicker">Trust engine</p>
          <h2>Experiments justify the subscription.</h2>
          <p>
            Users do not pay for recipes. They pay for reduced uncertainty. The experiment layer is
            what makes the planner defensible.
          </p>
        </div>

        <div className="experiment-tabs">
          {experiments.map((experiment) => (
            <button
              key={experiment.id}
              type="button"
              className={experiment.id === activeExperiment.id ? "chip chip-active" : "chip"}
              onClick={() => onSelectExperiment(experiment.id)}
            >
              {experiment.title}
            </button>
          ))}
        </div>

        <div className="experiment-banner">
          <strong>CookLab recommendation</strong>
          <p>{advice.reason}</p>
        </div>

        <div className="experiment-grid">
          {activeExperiment.variants.map((variant) => {
            const selected = variant.id === activeVariantId;
            const recommended = variant.id === advice.variant.id;

            return (
              <article
                key={variant.id}
                className={
                  selected
                    ? "experiment-card experiment-card-selected"
                    : recommended
                      ? "experiment-card experiment-card-recommended"
                      : "experiment-card"
                }
              >
                <div className="experiment-card-top">
                  <div>
                    <h3>{variant.label}</h3>
                    <p>{variant.note}</p>
                  </div>
                  <div className="badge-stack">
                    {recommended && <span className="status-pill">Recommended</span>}
                    {selected && <span className="status-pill status-pill-dark">Inspecting</span>}
                  </div>
                </div>

                <div className="metric-list">
                  <div className="metric-line">
                    <span>Success rate</span>
                    <strong>{variant.successRate}%</strong>
                  </div>
                  <div className="meter">
                    <span style={{ width: `${variant.successRate}%` }} />
                  </div>
                  <div className="metric-line">
                    <span>Stability</span>
                    <strong>{variant.stabilityScore}/100</strong>
                  </div>
                  <div className="meter meter-alt">
                    <span style={{ width: `${variant.stabilityScore}%` }} />
                  </div>
                  <div className="metric-line">
                    <span>Texture</span>
                    <strong>{variant.textureScore}/100</strong>
                  </div>
                  <div className="meter meter-alt-2">
                    <span style={{ width: `${variant.textureScore}%` }} />
                  </div>
                </div>

                <div className="experiment-meta">
                  <span>{variant.cookMinutes} min</span>
                  <span>{formatLocalCurrency(variant.estimatedCost)}</span>
                  <span>{variant.requiredSkill}</span>
                </div>

                <p className="experiment-callout">
                  <strong>Best for:</strong> {variant.bestFor}
                </p>
                <p className="experiment-callout">
                  <strong>Quick fix:</strong> {variant.quickFix}
                </p>

                <button
                  type="button"
                  className={selected ? "button button-secondary full-width" : "button button-ghost full-width"}
                  onClick={() => onSelectVariant(activeExperiment.id, variant.id)}
                >
                  {selected ? "Selected for inspection" : "Inspect this variant"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
