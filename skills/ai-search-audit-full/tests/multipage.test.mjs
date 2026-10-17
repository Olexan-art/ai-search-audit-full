// Several pages: the URL list, the 50-page cap reported as evaluated / total with what was left
// out, robots.txt for this skill's own crawler, the sitemap as a source, one page at a time, and
// the site report that groups problems repeated across pages as "N pages".
import { test } from "node:test";
import assert from "node:assert/strict";
import { candidates, crawlDelay, crawlerVerdict, pageSlug, parseUrlList, readSite, sitemapUrls, SITE_PAGE_CAP, CRAWLER_TOKEN } from "../scripts/lib/site.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { buildSiteExport, buildSiteModel, renderSiteReport } from "../scripts/lib/siteReport.mjs";
import { renderReport } from "../scripts/lib/report.mjs";
import { page, section, withFetch } from "./helpers.mjs";

const html = (h) => page({ body: section(h) + section(`${h} two`) });
const r = {};
const fast = { delayMs: 0, fetchRobotsFor: async () => ({ status: "none" }) };

test("the URL list: comments and blanks ignored, duplicates and non-addresses set aside", () => {
  const list = parseUrlList("https://example.org/a\n\n# comment\nhttps://example.org/b # trailing\nhttps://example.org/a\nnot a url\n");
  assert.deepEqual(list, ["https://example.org/a", "https://example.org/b", "https://example.org/a", "not a url"]);
  const c = candidates(list);
  assert.deepEqual(c.pages, ["https://example.org/a", "https://example.org/b"]);
  assert.deepEqual(c.rejected.map((r) => r.reason).sort(), ["duplicate", "invalid_url"]);
});

test("page slugs are stable, readable and safe as file names", () => {
  assert.equal(pageSlug("https://www.getlooploop.com/uk/vectorscope"), "getlooploop-com-uk-vectorscope");
  assert.equal(pageSlug("https://example.org/"), "example-org");
  assert.match(pageSlug("https://example.org/a?b=1&c=Ä"), /^[a-z0-9-]+$/);
});

test("robots.txt for this crawler: its own group, else *, longest match; unreachable means nothing is fetched", () => {
  const text = `User-agent: *\nDisallow: /private\n\nUser-agent: ${CRAWLER_TOKEN}\nDisallow: /no\nAllow: /no/yes\nCrawl-delay: 3\n`;
  const ok = { status: "ok", text };
  assert.equal(crawlerVerdict(ok, "https://example.org/no/x").allowed, false);
  assert.equal(crawlerVerdict(ok, "https://example.org/no/yes").allowed, true);
  assert.equal(crawlerVerdict(ok, "https://example.org/private").allowed, true, "its own group replaces *");
  assert.equal(crawlerVerdict({ status: "none" }, "https://example.org/x").allowed, true);
  assert.equal(crawlerVerdict({ status: "unreachable" }, "https://example.org/x").why, "robots_unreachable");
  assert.equal(crawlDelay(text), 3);
  assert.equal(crawlDelay("User-agent: *\nCrawl-delay: 7\n"), 7);
  assert.equal(crawlDelay("User-agent: *\nDisallow:\n"), null);
});

test("the cap: at most 50 pages, the rest listed as left out, and evaluated / total reported", async () => {
  const urls = Array.from({ length: SITE_PAGE_CAP + 7 }, (_, i) => `https://example.org/p${i}`);
  const routes = Object.fromEntries(urls.map((u) => [u, { body: html(u) }]));
  const order = [];
  const m = await withFetch(routes, () => readSite({ list: urls, source: { kind: "urls", input: "t" }, ...fast, onPage: (r) => order.push(r.fetch.finalUrl) }));
  assert.equal(m.cap, SITE_PAGE_CAP);
  assert.equal(m.total, SITE_PAGE_CAP + 7);
  assert.equal(m.evaluated, SITE_PAGE_CAP);
  assert.equal(m.leftOut.count, 7);
  assert.deepEqual(m.leftOut.byReason, { cap: 7 });
  assert.deepEqual(m.leftOut.items.map((x) => x.url), urls.slice(SITE_PAGE_CAP));
  assert.deepEqual(order, urls.slice(0, SITE_PAGE_CAP), "pages are read in list order, one at a time");
});

test("a lower --max is a cap too, and pages closed by robots.txt are left out with the reason", async () => {
  const urls = ["https://example.org/a", "https://example.org/secret/b", "https://example.org/c", "https://example.org/d"];
  const routes = Object.fromEntries(urls.map((u) => [u, { body: html(u) }]));
  const robots = async () => ({ status: "ok", text: "User-agent: *\nDisallow: /secret\n" });
  const m = await withFetch(routes, () => readSite({ list: urls, source: { kind: "urls", input: "t" }, max: 2, delayMs: 0, fetchRobotsFor: robots }));
  assert.equal(m.evaluated, 2);
  assert.deepEqual(m.pages.map((p) => p.url), ["https://example.org/a", "https://example.org/c"]);
  assert.deepEqual(m.leftOut.byReason, { robots_disallowed: 1, cap: 1 });
  assert.equal(m.leftOut.items.find((x) => x.reason === "robots_disallowed").rule, "Disallow: /secret");
});

test("pages are never read in parallel: one page fetch at a time", async () => {
  const urls = ["https://example.org/a", "https://example.org/b", "https://example.org/c"];
  let inFlight = 0;
  let most = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const isPage = urls.includes(String(url)) && (init.method || "GET") === "GET" && String(init.headers?.Accept || "").startsWith("text/html");
    if (isPage) most = Math.max(most, ++inFlight);
    await new Promise((r) => setTimeout(r, 5));
    if (isPage) inFlight--;
    return new Response(urls.includes(String(url)) ? html(String(url)) : "nf", { status: urls.includes(String(url)) ? 200 : 404, headers: { "content-type": "text/html" } });
  };
  try {
    const m = await readSite({ list: urls, source: { kind: "urls", input: "t" }, ...fast });
    assert.equal(m.evaluated, 3);
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(most, 1);
});

test("a sitemap as the source: same-host URLs, an index followed into at most 5 children, the rest counted", async () => {
  const kids = Array.from({ length: 7 }, (_, i) => `https://example.org/s${i}.xml`);
  const routes = {
    "https://example.org/sitemap.xml": { body: `<sitemapindex>${kids.map((k) => `<sitemap><loc>${k}</loc></sitemap>`).join("")}</sitemapindex>`, headers: { "content-type": "application/xml" } },
    ...Object.fromEntries(kids.map((k, i) => [k, { body: `<urlset><url><loc>https://example.org/p${i}</loc></url><url><loc>https://other.example/x</loc></url></urlset>`, headers: { "content-type": "application/xml" } }])),
  };
  const s = await withFetch(routes, () => sitemapUrls("https://example.org/sitemap.xml"));
  assert.equal(s.ok, true);
  assert.deepEqual(s.children, { total: 7, read: 5, unread: 2, cap: 5 });
  assert.deepEqual(s.urls, ["https://example.org/p0", "https://example.org/p1", "https://example.org/p2", "https://example.org/p3", "https://example.org/p4"]);
  assert.equal(s.offHost.length, 5);
});

test("the site report: repeated problems grouped as N pages, the grid, the left-out list, links to every page", async () => {
  const urls = ["https://example.org/a", "https://example.org/b", "https://example.org/c"];
  const bodies = {
    "https://example.org/a": page({ omit: ["description"], body: section("A one") + section("A two") }),
    "https://example.org/b": page({ omit: ["description"], body: section("B one") + section("B two") }),
    "https://example.org/c": page({ omit: ["h1"], body: section("C one") + section("C two") }),
  };
  const readings = [];
  const manifest = await withFetch(Object.fromEntries(urls.map((u) => [u, { body: bodies[u] }])), () =>
    readSite({ list: [...urls, "https://example.org/a"], source: { kind: "urls", input: "urls.txt" }, ...fast, onPage: (r, slug) => readings.push({ slug, url: r.fetch.finalUrl, reading: r }) }),
  );
  const entries = readings.map((e) => ({ ...e, model: buildModel(e.reading) }));
  const sm = buildSiteModel(manifest, entries);
  const rep = sm.repeated.find((c) => c.code === "meta_description_missing");
  assert.equal(rep.pages.size, 2);
  assert.ok(sm.single.some((c) => c.code === "h1_missing"));
  const out = renderSiteReport(sm);
  assert.match(out, /id="rep-meta_description_missing"/);
  assert.ok(out.includes("on 2 pages"));
  assert.ok(out.includes("3 of 3 pages evaluated"));
  assert.ok(out.includes("listed twice"), "the duplicate is listed as left out");
  for (const e of entries) assert.ok(out.includes(`href="pages/${e.slug}.html"`), e.slug);
  assert.match(out, /<table class="mx">/);
  for (const m of out.matchAll(/\ssrc="([^"]*)"/g)) assert.ok(m[1].startsWith("data:"));
  const x = buildSiteExport(sm, entries);
  assert.equal(x.schema, "getlooploop/ai-search-audit-site@1");
  assert.equal(x.evaluated, 3);
  assert.equal(x.leftOut.count, 1);
  assert.deepEqual(x.repeated.find((c) => c.code === "meta_description_missing").pages.length, 2);
});

test("each page's report links to the other pages and back to the site report", async () => {
  const got = await withFetch({ "https://example.org/a": { body: html("a") } }, () => readSite({ list: ["https://example.org/a"], source: { kind: "urls", input: "t" }, ...fast, onPage: (x) => (r.reading = x) }).then(() => r));
  const model = buildModel(got.reading);
  model.site = { current: "example-org-a", evaluated: 2, total: 3, leftOut: 1, pages: [{ slug: "example-org-a", path: "/a", ok: true, total: 3 }, { slug: "example-org-b", path: "/b", ok: true, total: 5 }] };
  const out = renderReport(model);
  assert.ok(out.includes('href="../index.html"'));
  assert.ok(out.includes('href="example-org-b.html"'));
  assert.ok(out.includes('aria-current="page"'));
  assert.ok(out.includes("2 of 3 pages evaluated") && out.includes("1 left out"));
});
