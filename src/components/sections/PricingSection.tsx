import React, { FormEvent } from "react";
import { PricingPlan } from "../../types/cooklab";

interface PricingSectionProps {
  pricingPlans: PricingPlan[];
  email: string;
  status: "idle" | "error" | "success";
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function PricingSection({
  pricingPlans,
  email,
  status,
  onEmailChange,
  onSubmit,
}: PricingSectionProps) {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-heading pricing-heading">
          <p className="section-kicker">Monetization architecture</p>
          <h2>Design the product around repeat paid value.</h2>
          <p>
            Launch narrative: Taiwan market beta now, global household planning platform next.
            Pricing is framed in USD because this needs to work beyond one geography.
          </p>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article
              className={plan.featured ? "pricing-card pricing-card-featured" : "pricing-card"}
              key={plan.id}
            >
              <div>
                <p className="card-label">{plan.audience}</p>
                <h3>{plan.name}</h3>
                <div className="price-row">
                  <strong>{plan.priceLabel}</strong>
                  <span>{plan.billingNote}</span>
                </div>
                <p>{plan.description}</p>
              </div>

              <ul className="feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button type="button" className={plan.featured ? "button button-primary full-width" : "button button-secondary full-width"}>
                {plan.cta}
              </button>
            </article>
          ))}
        </div>

        <div className="panel waitlist-panel">
          <div className="section-heading compact-heading">
            <p className="section-kicker">Launch CTA</p>
            <h2>Collect revenue intent before the global data layer is complete.</h2>
            <p>
              This waitlist form is where discovery, pricing, and product demand meet. It should be
              visible before the backend is finished.
            </p>
          </div>

          <form className="waitlist-form" onSubmit={onSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="founder@creator.com"
              aria-label="Email"
            />
            <button type="submit" className="button button-primary">
              Join paid beta
            </button>
          </form>

          {status === "success" && (
            <p className="feedback feedback-success">
              Waitlist captured. Next step would be payment intent + onboarding.
            </p>
          )}
          {status === "error" && (
            <p className="feedback feedback-error">Enter a valid email address.</p>
          )}
        </div>
      </div>
    </section>
  );
}
