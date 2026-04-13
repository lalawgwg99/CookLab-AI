import React from "react";
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

  return (
    <section className="section" id="support">
      <div className="container support-grid">
        <div className="panel">
          <div className="section-heading compact-heading">
            <p className="section-kicker">Human rescue layer</p>
            <h2>People stay when the product helps them recover from mistakes.</h2>
          </div>

          <div className="rescue-list">
            {rescueFeed.map((item) => (
              <article className="rescue-card" key={`${item.menuId}-${item.scenario.id}`}>
                <p className="card-label">{item.menuTitle}</p>
                <h3>{item.scenario.title}</h3>
                <p>
                  <strong>Symptom:</strong> {item.scenario.symptom}
                </p>
                <p>
                  <strong>Fix now:</strong> {item.scenario.fix}
                </p>
                <p>
                  <strong>Prevent next time:</strong> {item.scenario.prevention}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="support-column">
          <div className="panel">
            <div className="section-heading compact-heading">
              <p className="section-kicker">Credibility assets</p>
              <h2>Reports that convert trust into paid retention.</h2>
            </div>

            <div className="report-list">
              {reports.map((report) => (
                <article className="report-card" key={report.title}>
                  <span className="report-confidence">{report.confidence}% confidence</span>
                  <h3>{report.title}</h3>
                  <p>{report.summary}</p>
                  <div className="report-finding">{report.keyFinding}</div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading compact-heading">
              <p className="section-kicker">Growth flywheel</p>
              <h2>Content roadmap that feeds SEO, email, and paid conversion.</h2>
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
