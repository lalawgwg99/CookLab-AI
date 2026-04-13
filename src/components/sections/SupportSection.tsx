import React from "react";
import { useTranslation } from "react-i18next";
import { ContentPlan, Report, RescueFeedItem } from "../../types/cooklab";

interface SupportSectionProps {
  rescueFeed: RescueFeedItem[];
  reports: Report[];
  contentPlans: ContentPlan[];
}

export function SupportSection({
  rescueFeed,
  reports,
  contentPlans,
}: SupportSectionProps) {
  const topPlans = contentPlans.slice(0, 3);
  const { t } = useTranslation();

  return (
    <section className="section" id="support">
      <div className="container support-grid">
        <div className="panel">
          <div className="section-heading compact-heading">
            <p className="section-kicker">{t("support.kicker")}</p>
            <h2>{t("support.title")}</h2>
            <span className="sample-chip">{t("support.sampleData")}</span>
          </div>

          <div className="rescue-list">
            {rescueFeed.map((item) => (
              <article className="rescue-card" key={`${item.menuId}-${item.scenario.id}`}>
                <p className="card-label">{item.menuTitle}</p>
                <h3>{item.scenario.title}</h3>
                <p>
                  <strong>{t("support.symptom")} </strong> {item.scenario.symptom}
                </p>
                <p>
                  <strong>{t("support.fix")} </strong> {item.scenario.fix}
                </p>
                <p>
                  <strong>{t("support.prevent")} </strong> {item.scenario.prevention}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="support-column">
          <div className="panel">
            <div className="section-heading compact-heading">
              <p className="section-kicker">{t("support.reportKicker")}</p>
              <h2>{t("support.reportTitle")}</h2>
              <span className="sample-chip">{t("support.sampleData")}</span>
            </div>

            <div className="report-list">
              {reports.map((report) => (
                <article className="report-card" key={report.title}>
                  <span className="report-confidence">{t("support.confidence", { confidence: report.confidence })}</span>
                  <h3>{report.title}</h3>
                  <p>{report.summary}</p>
                  <div className="report-finding">{report.keyFinding}</div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading compact-heading">
              <p className="section-kicker">{t("support.roadmapKicker")}</p>
              <h2>{t("support.roadmapTitle")}</h2>
              <span className="sample-chip">{t("support.sampleData")}</span>
            </div>

            <div className="content-roadmap">
              {topPlans.map((plan) => (
                <article className="roadmap-card" key={plan.title}>
                  <h3>{plan.title}</h3>
                  <ul>
                    {plan.outline.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
