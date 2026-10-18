#!/usr/bin/env node
// Step 1 of the AI Search Audit (Full): fetch the page and everything the checks need, and write
// one reading. All the network is here: the page, its robots.txt, its sitemap, its llms.txt, its
// hreflang alternates, a HEAD (or GET) of up to 30 of its links and 20 of its images, and one
// request each for the favicon, a path that does not exist, up to 3 URL variants, a Markdown copy,
// ai-catalog.json and a declared IndexNow key; before the page, one DNS lookup of its host and one
// RDAP request to rdap.org with its IP address, for the hosting country. Each list has a cap and the reading says how much
// of it went unchecked. An empty single-page-app shell is rendered on its own when a browser is found.
//
// One page:
//   node scripts/read.mjs <url> [--out reading.json] [--render] [--save-html page.html]
//   node scripts/read.mjs <url> --html saved.html [--final-url <url>] [--robots saved-robots.txt] [--network] [--saved-at <ISO>]
// Several pages of a site (at most 50, one at a time, robots.txt respected):
//   node scripts/read.mjs --urls urls.txt [--out-dir readings] [--max 50] [--delay 1000] [--render]
//   node scripts/read.mjs --sitemap https://example.com/sitemap.xml [--out-dir readings] [--max 50] [--delay 1000]
// A refusal still writes its reading, with ok:false and the code, and exits with code 2 (one page).

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname as dirOf, join as joinPath } from "node:path";
import { reviewsTemplate } from "./lib/reviews.mjs";
import { join } from "node:path";
import { readAudit } from "./lib/reading.mjs";
import { findBrowser } from "./vendor/vectorscope/render.mjs";
import { isRefusalCode, refusalReason } from "./vendor/vectorscope/refusal.mjs";
import { CRAWLER_TOKEN, parseUrlList, readSite, sitemapUrls, SITE_DELAY_MS, SITE_PAGE_CAP } from "./lib/site.mjs";
import { judgeRequestedUrl } from "./vendor/vectorscope/guards.mjs";

const USAGE = [
  "Usage: node scripts/read.mjs <url> [--out reading.json] [--render] [--save-html page.html]",
  "       node scripts/read.mjs <url> --html saved.html [--final-url <url>] [--robots saved-robots.txt] [--network] [--saved-at <ISO>]",
  `       node scripts/read.mjs --urls urls.txt | --sitemap <url> [--out-dir readings] [--max ${SITE_PAGE_CAP}] [--delay ${SITE_DELAY_MS}] [--render]`,
].join("\n");

function parseArgs(argv) {
  const out = { urls: [], out: "reading.json", html: null, finalUrl: null, robots: null, render: false, saveHtml: null, network: false, savedAt: null, urlList: null, sitemap: null, outDir: "readings", max: SITE_PAGE_CAP, delay: SITE_DELAY_MS };
  const takes = { "--out": "out", "--html": "html", "--final-url": "finalUrl", "--robots": "robots", "--save-html": "saveHtml", "--saved-at": "savedAt", "--urls": "urlList", "--sitemap": "sitemap", "--out-dir": "outDir", "--max": "max", "--delay": "delay" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (takes[arg]) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} needs a value`);
      out[takes[arg]] = v;
    } else if (arg === "--render") out.render = true;
    else if (arg === "--network") out.network = true;
    else if (arg === "-h" || arg === "--help") out.help = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else out.urls.push(arg);
  }
  return out;
}

const fmt = (n) => Number(n ?? 0).toLocaleString("en-US");

function summarise(r, file) {
  if (!r.ok) {
    console.log(`REFUSED   ${r.reasonCode}${r.status ? ` (HTTP ${r.status})` : ""}`);
    if (isRefusalCode(r.reasonCode)) console.log(`reason    ${refusalReason(r.reasonCode, "en").replace(/^Why: /, "")} Nothing of the page was kept. Run audit.mjs on this reading to write the report that says why.`);
    console.log(`reading   ${file}`);
    return;
  }
  const { fetch, facts, vs, robots, sitemap, llms, alternates, links, render } = r;
  console.log(`url       ${fetch.finalUrl}${fetch.finalUrl !== fetch.requestedUrl ? `  (asked for ${fetch.requestedUrl})` : ""}`);
  if (fetch.chain.length > 1) console.log(`redirects ${fetch.chain.map((c) => c.status).join(" → ")}`);
  console.log(`title     ${facts.head.title || "(none)"}`);
  console.log(`page      ${fmt(facts.htmlBytes)} bytes of HTML · ${facts.head.scripts.total} scripts · ${facts.headings.length} headings · ${facts.images.length} images · ${facts.links.length} links · ${facts.zones.length} zones on the map`);
  console.log(`passages  ${vs.passages.length}/${vs.page.chunkCap} · ${fmt(vs.losses?.waterfall?.pastCap ?? 0)} chars past the cap`);
  const blocked = robots.bots.filter((b) => !b.allowed).map((b) => b.token);
  console.log(`robots    ${robots.status}${robots.status === "ok" || robots.status === "none" ? ` · blocked: ${blocked.length ? blocked.join(", ") : "none"}` : ""}`);
  if (sitemap) console.log(`sitemap   ${sitemap.found ? `found · lists the page: ${sitemap.listsPage === null ? "not measured" : sitemap.listsPage ? "yes" : "no"}` : "not found"}${sitemap.children.unread && sitemap.listsPage !== true ? ` · ${sitemap.children.unread} child sitemaps not read (cap ${sitemap.children.cap})` : ""}`);
  if (llms) console.log(`llms.txt  ${llms.present ? `present · ${llms.links} links` : `none (HTTP ${llms.status ?? llms.reason})`}`);
  if (alternates) console.log(`hreflang  ${facts.head.hreflang.length} declared · ${alternates.checked} alternates read${alternates.unchecked.length ? ` · ${alternates.unchecked.length} not read (cap ${alternates.cap})` : ""}`);
  if (links) console.log(`links     ${links.checked} of ${links.total} checked${links.unchecked ? ` · ${links.unchecked} not checked (cap ${links.cap})` : ""} · broken ${links.results.filter((x) => x.verdict === "broken").length} · unverified ${links.results.filter((x) => x.verdict === "unverified").length}`);
  if (r.images) console.log(`images    ${r.images.checked} of ${r.images.total} sized${r.images.unchecked ? ` · ${r.images.unchecked} not checked (cap ${r.images.cap})` : ""}`);
  if (r.site) console.log(`site      favicon ${r.site.favicon.ok ? "ok" : r.site.favicon.status ?? r.site.favicon.reason} · missing path ${r.site.soft404.status ?? r.site.soft404.reason} · variants ${r.site.variants.map((v) => `${v.kind} ${v.ends ? "ok" : v.status ?? v.reason}`).join(", ")} · markdown ${r.site.markdown.ok ? "yes" : "no"} · ai-catalog ${r.site.aiCatalog?.present ? (r.site.aiCatalog.valid ? "valid" : "invalid") : "none"}${r.site.indexnow ? ` · IndexNow key ${r.site.indexnow.ok ? "ok" : "missing"}` : ""}`);
  if (r.shell?.detected) console.log(`app shell ${r.shell.roots.join(", ")} · ${r.shell.words} words without JavaScript · ${r.render ? (r.render.ok ? "rendered automatically" : `not rendered: ${r.render.reason}`) : "not rendered (saved page)"}`);
  if (r.hosting) console.log(`hosting   ${r.hosting.status === "checked" ? `${r.hosting.country} (${r.hosting.ip}, RDAP)` : r.hosting.status === "not_determined" ? "not determined (DNS or RDAP gave no country)" : "not checked (saved page)"}`);
  if (fetch.saved) console.log(r.robots.status === "not_checked" ? "network   none: a saved page was read; robots.txt, sitemap, llms.txt, alternates and links are not measured" : `network   a saved page${fetch.savedAt ? ` (taken ${fetch.savedAt})` : ""}, with the site checks fetched live (--network)`);
  if (render) console.log(render.ok ? `render    with JS ${fmt(render.wordCount)} words · ${render.passages} passages (without JS ${fmt(vs.page.wordCount)} · ${vs.passages.length}) · ${render.jsZones.length} sections only with JS` : `render    not done: ${render.reason === "no_browser" ? "no Chrome or Chromium found (set CHROME_PATH)" : render.reason}`);
  console.log(`reading   ${file}`);
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(USAGE);
  process.exit(1);
}
const siteMode = Boolean(args.urlList || args.sitemap);
if (args.help || (!siteMode && args.urls.length !== 1) || (siteMode && (args.urls.length || (args.urlList && args.sitemap)))) {
  console.error(!siteMode && args.urls.length > 1 ? "One URL per page audit; for several pages use --urls <file> or --sitemap <url>." : "");
  console.error(USAGE);
  process.exit(args.help ? 0 : 1);
}
if (args.savedAt && !args.html) {
  console.error("--saved-at needs --html: it dates a saved copy.");
  process.exit(1);
}
if (args.render && !findBrowser()) console.log("render    no Chrome or Chromium found (set CHROME_PATH); continuing with the plain fetch only");

if (!siteMode) {
  const reading = await readAudit({
    url: args.urls[0],
    html: args.html ? readFileSync(args.html, "utf8") : undefined,
    finalUrl: args.finalUrl || undefined,
    robotsText: args.robots ? readFileSync(args.robots, "utf8") : undefined,
    network: args.html ? args.network : undefined,
    savedAt: args.savedAt || null,
    render: args.render,
    onHtml: args.saveHtml ? (source) => writeFileSync(args.saveHtml, source) : undefined,
  });
  writeFileSync(args.out, JSON.stringify(reading, null, 2));
  // The reviews.json to fill in: every platform, this site's control among them, unnamed.
  if (reading.ok) writeFileSync(joinPath(dirOf(args.out), "reviews.template.json"), JSON.stringify(reviewsTemplate(reading.fetch.finalUrl), null, 2));
  summarise(reading, args.out);
  process.exit(reading.ok ? 0 : 2);
}

// ── several pages ─────────────────────────────────────────────────────────────
const max = Number(args.max);
const delay = Number(args.delay);
if (!Number.isInteger(max) || max < 1) {
  console.error(`--max must be a whole number from 1 to ${SITE_PAGE_CAP}`);
  process.exit(1);
}
if (!Number.isFinite(delay) || delay < 500) {
  console.error("--delay is in milliseconds and must be at least 500: the pages are read politely, one at a time.");
  process.exit(1);
}
if (max > SITE_PAGE_CAP) console.log(`cap       --max ${max} is over the cap; ${SITE_PAGE_CAP} pages at most`);

let list;
let source;
if (args.urlList) {
  list = parseUrlList(readFileSync(args.urlList, "utf8"));
  source = { kind: "urls", input: args.urlList, listed: list.length };
} else {
  const v = judgeRequestedUrl(args.sitemap);
  if (!v.ok) {
    console.log(`REFUSED   ${v.reason}: ${args.sitemap}`);
    process.exit(2);
  }
  const sm = await sitemapUrls(v.url);
  if (!sm.ok) {
    console.log(`REFUSED   sitemap not readable: ${sm.fetched.map((f) => `${f.status ?? f.reason} ${f.url}`).join(", ")}`);
    process.exit(2);
  }
  list = sm.urls;
  source = { kind: "sitemap", input: v.url, listed: sm.urls.length, children: sm.children, offHost: sm.offHost.length, fetched: sm.fetched };
}
mkdirSync(args.outDir, { recursive: true });
const cap = Math.min(max, SITE_PAGE_CAP);
console.log(`pages     ${list.length} listed · cap ${cap} · one at a time, ${delay} ms apart · robots.txt respected for ${CRAWLER_TOKEN}`);
const manifest = await readSite({
  list,
  source,
  max: cap,
  delayMs: delay,
  render: args.render,
  onPage: (reading, slug) => writeFileSync(join(args.outDir, `${slug}.json`), JSON.stringify(reading, null, 2)),
  onProgress: (p) => console.log(p.refused ? `  REFUSED ${p.refused} ${p.url}  (the site; nothing fetched)` : p.skipped ? `  skipped ${p.url}  (${p.skipped})` : `  ${p.ok ? "read   " : `REFUSED ${p.reasonCode}`} ${p.url}  → ${p.slug}.json`),
});
for (const p of manifest.pages) p.reading = `${p.slug}.json`;
// A refused site keeps nothing of its pages: the readings written before the refusal are deleted.
for (const slug of manifest.discarded || []) rmSync(join(args.outDir, `${slug}.json`), { force: true });
const file = join(args.outDir, "site.json");
writeFileSync(file, JSON.stringify(manifest, null, 2));
// One reviews.json for the whole site: every platform, the site's control among them, unnamed.
if (!manifest.refused && list.length) writeFileSync(joinPath(args.outDir, "reviews.template.json"), JSON.stringify(reviewsTemplate(list[0]), null, 2));
console.log(`evaluated ${manifest.evaluated} of ${manifest.total} pages${manifest.leftOut.count ? ` · left out ${manifest.leftOut.count}: ${Object.entries(manifest.leftOut.byReason).map(([r, n]) => `${n} ${r}`).join(", ")}` : ""}`);
if (source.children?.unread) console.log(`not done  ${source.children.unread} child sitemaps not read (cap ${source.children.cap})`);
if (manifest.politeness.requestCache?.hits) console.log(`requests  ${manifest.politeness.requestCache.hits} repeated requests answered from this run's memory`);
console.log(`site      ${file}`);
if (manifest.refused) {
  console.log(`REFUSED   ${manifest.refused.reasonCode}: ${refusalReason(manifest.refused.reasonCode, "en").replace(/^Why: /, "")} The site run stopped at ${manifest.refused.url}${manifest.discarded.length ? `; ${manifest.discarded.length} reading(s) written before it were deleted` : ""}. Run audit.mjs --site on site.json to write the report that says why.`);
  process.exit(2);
}
process.exit(0);
