import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const siteUrl = "https://cooklabai.com";
const pages = JSON.parse(await readFile(path.join(rootDir, "src/data/seo-pages.json"), "utf8"));
const failures = [];

for (const id of Object.keys(pages)) {
  for (const language of ["zh-TW", "en"]) {
    const file = path.join(distDir, language === "en" ? "en" : "", `${id}.html`);
    const html = await readFile(file, "utf8");
    const route = `${language === "en" ? "/en" : ""}/${id}`;
    const expectedCanonical = `${siteUrl}${route}`;
    if (!html.includes(`<html lang="${language}">`)) failures.push(`${route}: incorrect lang`);
    if (!html.includes(`<link rel="canonical" href="${expectedCanonical}" />`)) failures.push(`${route}: incorrect canonical`);
    if (!html.includes(`hreflang="zh-Hant" href="${siteUrl}/${id}"`)) failures.push(`${route}: missing zh-Hant alternate`);
    if (!html.includes(`hreflang="en" href="${siteUrl}/en/${id}"`)) failures.push(`${route}: missing English alternate`);
    if (!html.includes("<h1>")) failures.push(`${route}: missing fallback H1`);
    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    if (!jsonLd) failures.push(`${route}: missing JSON-LD`);
    else {
      try { JSON.parse(jsonLd); } catch { failures.push(`${route}: invalid JSON-LD`); }
    }
  }
}

const sitemap = await readFile(path.join(distDir, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== Object.keys(pages).length * 2) failures.push(`sitemap: expected ${Object.keys(pages).length * 2} URLs, found ${sitemapUrls.length}`);
for (const id of Object.keys(pages)) {
  for (const url of [`${siteUrl}/${id}`, `${siteUrl}/en/${id}`]) {
    if (!sitemapUrls.includes(url)) failures.push(`sitemap: missing ${url}`);
  }
}

const notFound = await readFile(path.join(distDir, "404.html"), "utf8");
if (!notFound.includes('name="robots" content="noindex"')) failures.push("404.html: missing noindex");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`SEO verification passed: ${sitemapUrls.length} indexable localized URLs and a noindex 404 page`);
