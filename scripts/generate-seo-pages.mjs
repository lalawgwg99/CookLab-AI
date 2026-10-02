import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const siteUrl = "https://cooklabai.com";
const seoPages = JSON.parse(await readFile(path.join(rootDir, "src/data/seo-pages.json"), "utf8"));
const baseHtml = await readFile(path.join(distDir, "index.html"), "utf8");
const toolIds = Object.keys(seoPages);

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const replaceMeta = (html, selector, value) => {
  const escapedValue = escapeHtml(value);
  return html.replace(selector, (match) => match.replace(/content="[^"]*"/, `content="${escapedValue}"`));
};

const navigationHtml = (language) => {
  const prefix = language === "en" ? "/en" : "";
  const links = toolIds.map((id) => {
    const item = seoPages[id];
    const label = language === "en" ? item.nameEn : item.nameZh;
    return `<a href="${prefix}/${id}">${escapeHtml(label)}</a>`;
  }).join(" · ");
  return `<nav aria-label="${language === "en" ? "TextLab tools" : "字研所工具"}">${links}</nav>`;
};

const structuredData = (id, language, canonical, item) => {
  const isEnglish = language === "en";
  const faq = isEnglish ? item.faqEn : item.faqZh;
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: "字研所 TextLab",
      inLanguage: ["zh-TW", "en"]
    },
    {
      "@type": "WebApplication",
      "@id": `${canonical}#app`,
      url: canonical,
      name: isEnglish ? item.nameEn : item.nameZh,
      description: isEnglish ? item.descriptionEn : item.descriptionZh,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      inLanguage: language,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: isEnglish ? "USD" : "TWD"
      }
    }
  ];
  if (faq && faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      inLanguage: language,
      mainEntity: faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a }
      }))
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
};

const guideSectionHtml = (isEnglish, item) => {
  const guide = isEnglish ? item.guideEn : item.guideZh;
  if (!guide || !guide.length) return "";
  const blocks = guide
    .map((s) => `<h3>${escapeHtml(s.h)}</h3><p>${escapeHtml(s.p)}</p>`)
    .join("");
  return `<section aria-label="${isEnglish ? "How to use" : "使用指南"}"><h2>${isEnglish ? "How to use" : "使用指南"}</h2>${blocks}</section>`;
};

const faqSectionHtml = (isEnglish, item) => {
  const faq = isEnglish ? item.faqEn : item.faqZh;
  if (!faq || !faq.length) return "";
  const blocks = faq
    .map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`)
    .join("");
  return `<section aria-label="${isEnglish ? "FAQ" : "常見問題"}"><h2>${isEnglish ? "FAQ" : "常見問題"}</h2>${blocks}</section>`;
};

const buildPage = (id, language) => {
  const item = seoPages[id];
  const isEnglish = language === "en";
  const route = isEnglish ? `/en/${id}` : `/${id}`;
  const canonical = `${siteUrl}${route}`;
  const zhUrl = `${siteUrl}/${id}`;
  const enUrl = `${siteUrl}/en/${id}`;
  const title = isEnglish ? item.titleEn : item.titleZh;
  const description = isEnglish ? item.descriptionEn : item.descriptionZh;
  const heading = isEnglish ? item.nameEn : item.nameZh;
  const fallback = `<main class="seo-fallback"><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p>${guideSectionHtml(isEnglish, item)}${faqSectionHtml(isEnglish, item)}<h2>${isEnglish ? "Free TextLab tools" : "更多免費字研所工具"}</h2>${navigationHtml(language)}</main>`;

  let html = baseHtml
    .replace(/<html lang="[^"]+">/, `<html lang="${language}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]+" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<link rel="alternate" hreflang="zh-Hant" href="[^"]+" \/>/, `<link rel="alternate" hreflang="zh-Hant" href="${zhUrl}" />`)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]+" \/>/, `<link rel="alternate" hreflang="en" href="${enUrl}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]+" \/>/, `<link rel="alternate" hreflang="x-default" href="${zhUrl}" />`)
    .replace(/<div id="root">/, `<div id="root">${fallback}`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(structuredData(id, language, canonical, item))}</script>`);

  html = replaceMeta(html, /<meta name="description"[^>]*>/, description);
  html = replaceMeta(html, /<meta property="og:title"[^>]*>/, title);
  html = replaceMeta(html, /<meta property="og:description"[^>]*>/, description);
  html = replaceMeta(html, /<meta property="og:url"[^>]*>/, canonical);
  html = replaceMeta(html, /<meta property="og:locale"[^>]*>/, isEnglish ? "en_US" : "zh_TW");
  html = replaceMeta(html, /<meta name="twitter:title"[^>]*>/, title);
  html = replaceMeta(html, /<meta name="twitter:description"[^>]*>/, description);
  return html;
};

const buildHome = (language) => {
  const localized = buildPage("layout", language);
  const isEnglish = language === "en";
  const homeUrl = `${siteUrl}${isEnglish ? "/en" : "/"}`;
  const zhUrl = `${siteUrl}/`;
  const enUrl = `${siteUrl}/en`;
  return localized
    .replaceAll(`${siteUrl}${isEnglish ? "/en/layout" : "/layout"}`, homeUrl)
    .replaceAll(`href="${zhUrl}layout"`, `href="${zhUrl}"`)
    .replaceAll(`href="${enUrl}/layout"`, `href="${enUrl}"`);
};

for (const id of toolIds) {
  for (const language of ["zh-TW", "en"]) {
    const outputDir = language === "en" ? path.join(distDir, "en") : distDir;
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, `${id}.html`), buildPage(id, language));
  }
}

await mkdir(path.join(distDir, "en"), { recursive: true });
await writeFile(path.join(distDir, "index.html"), buildHome("zh-TW"));
await writeFile(path.join(distDir, "en", "index.html"), buildHome("en"));

const lastmod = new Date().toISOString().slice(0, 10);
const sitemapUrls = toolIds.flatMap((id) => {
  const zhUrl = `${siteUrl}/${id}`;
  const enUrl = `${siteUrl}/en/${id}`;
  const alternates = `<xhtml:link rel="alternate" hreflang="zh-Hant" href="${zhUrl}"/><xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/><xhtml:link rel="alternate" hreflang="x-default" href="${zhUrl}"/>`;
  return [`<url><loc>${zhUrl}</loc><lastmod>${lastmod}</lastmod>${alternates}</url>`, `<url><loc>${enUrl}</loc><lastmod>${lastmod}</lastmod>${alternates}</url>`];
});
const homeEntries = [`<url><loc>${siteUrl}/</loc><lastmod>${lastmod}</lastmod><xhtml:link rel="alternate" hreflang="zh-Hant" href="${siteUrl}/"/><xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en"/><xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/"/></url>`, `<url><loc>${siteUrl}/en</loc><lastmod>${lastmod}</lastmod><xhtml:link rel="alternate" hreflang="zh-Hant" href="${siteUrl}/"/><xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en"/><xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/"/></url>`];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...homeEntries, ...sitemapUrls].map((entry) => `  ${entry}`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(distDir, "sitemap.xml"), sitemap);

const notFound = `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>找不到頁面｜字研所 TextLab</title></head><body><main><h1>找不到這個頁面</h1><p><a href="/layout">返回 IG／Threads 排版工具</a></p></main></body></html>`;
await writeFile(path.join(distDir, "404.html"), notFound);

console.log(`Generated ${toolIds.length * 2 + 2} localized SEO pages and sitemap.xml`);
