import React, { FormEvent } from "react";
import { PricingPlan } from "../../types/cooklab";
import { useTranslation } from "react-i18next";

interface PricingSectionProps {
  pricingPlans: PricingPlan[];
  email: string;
  status: "idle" | "error" | "success";
  checkoutStatus: "idle" | "error";
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCheckout: (checkoutKey?: string) => void;
}

export function PricingSection({
  pricingPlans,
  email,
  status,
  checkoutStatus,
  onEmailChange,
  onSubmit,
  onCheckout,
}: PricingSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-heading pricing-heading">
          <p className="section-kicker">{t("pricing.kicker")}</p>
          <h2>{t("pricing.title")}</h2>
          <p>{t("pricing.desc")}</p>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => {
            const baseKey = `pricing.plans.${plan.id}`;
            const audience = t(`${baseKey}.audience`, { defaultValue: plan.audience });
            const name = t(`${baseKey}.name`, { defaultValue: plan.name });
            const billingNote = t(`${baseKey}.billingNote`, { defaultValue: plan.billingNote });
            const description = t(`${baseKey}.description`, { defaultValue: plan.description });
            const cta = t(`${baseKey}.cta`, { defaultValue: plan.cta });
            const features = t(`${baseKey}.features`, {
              returnObjects: true,
              defaultValue: plan.features,
            }) as string[];

            return (
              <article
                className={plan.featured ? "pricing-card pricing-card-featured" : "pricing-card"}
                key={plan.id}
              >
                <div>
                  <p className="card-label">{audience}</p>
                  <h3>{name}</h3>
                  <div className="price-row">
                    <strong>{plan.priceLabel}</strong>
                    <span>{billingNote}</span>
                  </div>
                  <p>{description}</p>
                </div>

                <ul className="feature-list">
                  {features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={plan.featured ? "button button-primary full-width" : "button button-secondary full-width"}
                  onClick={() => onCheckout(plan.checkoutKey)}
                >
                  {cta}
                </button>
              </article>
            );
          })}
        </div>

        <div className="panel waitlist-panel">
          <div className="section-heading compact-heading">
            <p className="section-kicker">{t("pricing.launchKicker")}</p>
            <h2>{t("pricing.launchTitle")}</h2>
            <p>{t("pricing.launchDesc")}</p>
          </div>

          <form className="waitlist-form" onSubmit={onSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={t("pricing.waitlistPlaceholder")}
              aria-label="Email"
            />
            <button type="submit" className="button button-primary">
              {t("pricing.waitlistCta")}
            </button>
          </form>

          {status === "success" && (
            <p className="feedback feedback-success">
              {t("pricing.waitlistSuccess")}
            </p>
          )}
          {status === "error" && (
            <p className="feedback feedback-error">{t("pricing.waitlistError")}</p>
          )}
          {checkoutStatus === "error" && (
            <p className="feedback feedback-error">{t("pricing.checkoutError")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
