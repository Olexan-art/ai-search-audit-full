// 2.108: the site-level refusals, through the audit's own read: a Russian domain zone and hosting
// in Russia refuse before the page is fetched, a Russian-language version of the site after it.
// The rules are the Vectorscope's (vendor/vectorscope/russianSite.mjs); this checks the wiring,
// the reading and the report. No network: fetch, DNS and RDAP are stubbed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readAudit } from "../scripts/lib/reading.mjs";
import { renderRefusal } from "../scripts/lib/report.mjs";
import { buildRefusalExport, renderRefusalMarkdown } from "../scripts/lib/outputs.mjs";
import { esc } from "../scripts/vendor/vectorscope/html.mjs";
import { REFUSAL_CODES, REFUSAL_REASON } from "../scripts/vendor/vectorscope/refusal.mjs";
import { hostingDeps, page, section, withFetch } from "./helpers.mjs";
import { readSite } from "../scripts/lib/site.mjs";
import { buildSiteRefusalExport, renderSiteRefusal, renderSiteRefusalMarkdown } from "../scripts/lib/siteReport.mjs";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SECRET = "A sentence that only this page carries, and the report must never show.";
const noDeps = { lookup: async () => assert.fail("DNS must not be asked"), fetch: async () => assert.fail("RDAP must not be asked") };

test("a .ru address is refused before any request: no page, no DNS, no RDAP", async () => {
  const calls = await withFetch({}, async (c) => {
    const r = await readAudit({ url: "https://shop.example.ru/page", deps: noDeps });
    assert.equal(r.ok, false);
    assert.equal(r.reasonCode, "refused_ru_domain");
    assert.deepEqual([r.refusal.signal, r.refusal.zone], ["domain", "ru"]);
    return c;
  });
  assert.equal(calls.length, 0);
  for (const url of ["https://a.su/", "https://пример.рф/", "https://a.moscow/", "https://сайт.москва/"]) {
    assert.equal((await readAudit({ url, deps: noDeps })).reasonCode, "refused_ru_domain", url);
  }
});

test("a site hosted in Russia is refused before its page is fetched", async () => {
  const seen = [];
  const calls = await withFetch({ "https://example.org/page": { body: page({ body: `<p>${SECRET}</p>` }) } }, async (c) => {
    const r = await readAudit({ url: "https://example.org/page", deps: hostingDeps("RU", seen) });
    assert.equal(r.reasonCode, "refused_ru_hosting");
    assert.deepEqual(r.hosting, { status: "checked", country: "RU", ip: "192.0.2.10" });
    return c;
  });
  assert.equal(calls.length, 0, "the page itself is not fetched");
  assert.deepEqual(seen, [{ dns: "example.org" }, { rdap: "https://rdap.org/ip/192.0.2.10" }]);
});

test("a Russian-language version of the site refuses after the fetch; nothing of the page is kept", async () => {
  const cases = [
    [{ head: '<link rel="alternate" hreflang="ru" href="https://example.org/ru/page">' }, {}, "hreflang"],
    [{ head: '<meta property="og:locale:alternate" content="ru_RU">' }, {}, "og_locale"],
    [{ body: `<p>${SECRET}</p>` }, { "content-language": "ru-RU" }, "content_language"],
  ];
  for (const [parts, headers, kind] of cases) {
    const r = await withFetch({ "https://example.org/page": { body: page({ body: `<p>${SECRET}</p>`, ...parts }), headers } }, () => readAudit({ url: "https://example.org/page", deps: hostingDeps("US") }));
    assert.equal(r.reasonCode, "refused_ru_audience", kind);
    assert.equal(r.refusal.signals[0].kind, kind);
    assert.equal(r.hosting.country, "US");
    assert.ok(!JSON.stringify(r).includes(SECRET), kind);
  }
});

test("links to a Russian version are not a declaration: a switcher to /ru, a ru. subdomain, <a lang=\"ru\"> do not refuse", async () => {
  for (const link of ['<nav><a href="/ru/page">RU</a></nav>', '<a href="https://ru.example.org/">RU</a>', '<a href="/x" lang="ru" hreflang="ru">x</a>']) {
    const r = await withFetch({ "https://example.org/page": { body: page({ body: `<p>${"Words here. ".repeat(40)}</p>${link}` }) } }, () => readAudit({ url: "https://example.org/page", network: false, deps: hostingDeps("US") }));
    assert.equal(r.ok, true, link);
  }
});

test("hosting not determined does not refuse, and the reading says so; a saved page is not checked", async () => {
  const r = await withFetch({ "https://example.org/page": { body: page({ body: `<p>${"Words here. ".repeat(40)}</p>` }) } }, () => readAudit({ url: "https://example.org/page", network: false, deps: hostingDeps(null) }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.hosting, { status: "not_determined", ip: "192.0.2.10" });
  const saved = await readAudit({ url: "https://example.org/page", html: page({ body: "<p>Saved.</p>" }), finalUrl: "https://example.org/page", deps: noDeps });
  assert.deepEqual(saved.hosting, { status: "not_checked" });
});

test("the report: the same refusal block with one reason line, EN and UK, and no other-language line", () => {
  for (const code of REFUSAL_CODES) {
    const reading = { ok: false, reasonCode: code, refusal: { reasonCode: code, signal: "x" }, requestedInput: "https://example.org/x", page: { url: "https://example.org/x", requestedUrl: "https://example.org/x" } };
    const html = renderRefusal(reading);
    assert.ok(html.includes(esc(REFUSAL_REASON[code].en)) && html.includes(esc(REFUSAL_REASON[code].uk)), code);
    assert.ok(html.includes('class="refusal"') && html.includes("This page was not analysed"), code);
    const md = renderRefusalMarkdown(reading);
    assert.ok(md.includes(REFUSAL_REASON[code].en), code);
    for (const text of [html, md]) assert.ok(!/another language|іншою мовою|class="last"/.test(text), code);
    assert.equal(buildRefusalExport(reading).refusal.reasonCode, code);
  }
});

// ── the site audit: a site-level refusal stops the whole run ─────────────────

const READ = fileURLToPath(new URL("../scripts/read.mjs", import.meta.url));
const AUDIT = fileURLToPath(new URL("../scripts/audit.mjs", import.meta.url));
const body = (h) => page({ body: section(h) + section(h + " two") });
const noRobots = async () => assert.fail("robots.txt must not be asked for");
const site = (list, extra) => readSite({ list, source: { kind: "urls", input: "t" }, delayMs: 0, fetchRobotsFor: async () => ({ status: "none" }), ...extra });

test("site: a .ru address stops the run before robots.txt or any page; every page is left out as site_refused", async () => {
  const calls = await withFetch({}, async (c) => {
    const m = await site(["https://example.ru/a", "https://example.ru/b"], { fetchRobotsFor: noRobots, deps: noDeps });
    assert.equal(m.refused.reasonCode, "refused_ru_domain");
    assert.equal(m.refused.url, "https://example.ru/a");
    assert.deepEqual(m.pages, []);
    assert.equal(m.evaluated, 0);
    assert.deepEqual(m.leftOut.byReason, { site_refused: 2 });
    return c;
  });
  assert.equal(calls.length, 0);
});

test("site: hosting in Russia stops the run before robots.txt; the host is asked once", async () => {
  const seen = [];
  const m = await withFetch({}, () => site(["https://example.org/a", "https://example.org/b"], { fetchRobotsFor: noRobots, deps: hostingDeps("RU", seen) }));
  assert.equal(m.refused.reasonCode, "refused_ru_hosting");
  assert.deepEqual(m.refused.hosting, { status: "checked", country: "RU", ip: "192.0.2.10" });
  assert.equal(seen.filter((x) => x.rdap).length, 1);
});

test("site: a Russian-language version on any page stops the run; the readings before it are discarded", async () => {
  const urls = ["https://example.org/a", "https://example.org/b", "https://example.org/c"];
  const routes = {
    "https://example.org/a": { body: body("A") },
    "https://example.org/b": { body: page({ head: '<link rel="alternate" hreflang="ru" href="https://example.org/ru/b">', body: section("B") }) },
    "https://example.org/c": { body: body("C") },
  };
  const seen = [];
  const written = [];
  const m = await withFetch(routes, () => site(urls, { deps: hostingDeps("DE", seen), onPage: (r, slug) => written.push(slug) }));
  assert.equal(m.refused.reasonCode, "refused_ru_audience");
  assert.equal(m.refused.url, "https://example.org/b");
  assert.deepEqual(m.refused.refusal.signals, [{ kind: "hreflang", value: "ru" }]);
  assert.deepEqual(written, ["example-org-a", "example-org-b"]);
  assert.deepEqual(m.discarded, ["example-org-a"]);
  assert.deepEqual(m.pages.map((p) => p.slug), ["example-org-b"]);
  assert.deepEqual(m.leftOut.byReason, { site_refused: 1 });
  assert.equal(seen.filter((x) => x.rdap).length, 1, "one RDAP request for the whole site");
});

test("site report: the refusal block, its reason line and where the run stopped, EN and UK", () => {
  const manifest = { schema: "getlooploop/ai-search-audit-site-reading@1", createdAt: "2026-10-17T09:00:00.000Z", source: { kind: "urls", input: "t" }, total: 3, evaluated: 2, pages: [], discarded: ["example-org-a"], leftOut: { count: 1, byReason: { site_refused: 1 } }, refused: { url: "https://example.org/b", slug: "example-org-b", reasonCode: "refused_ru_audience", refusal: { reasonCode: "refused_ru_audience", signal: "audience" } } };
  const html = renderSiteRefusal(manifest);
  for (const lang of ["en", "uk"]) assert.ok(html.includes(esc(REFUSAL_REASON.refused_ru_audience[lang])), lang);
  assert.ok(html.includes("The site audit stopped at https://example.org/b"));
  assert.ok(html.includes("Перевірку сайту зупинено на https://example.org/b"));
  assert.ok(!/another language|іншою мовою/.test(html));
  const md = renderSiteRefusalMarkdown(manifest);
  assert.ok(md.includes(REFUSAL_REASON.refused_ru_audience.en) && md.includes("read before it and discarded: 1; not read: 1"));
  const x = buildSiteRefusalExport(manifest);
  assert.equal(x.schema, "getlooploop/ai-search-audit-site@1");
  assert.deepEqual([x.refused, x.reasonCode, x.site.stoppedAt], [true, "refused_ru_audience", "https://example.org/b"]);
});

test("site CLI: read.mjs --urls on a .ru site writes a refused site.json and nothing else; audit.mjs --site writes the refusal", () => {
  const dir = mkdtempSync(join(tmpdir(), "audit-ru-site-"));
  try {
    writeFileSync(join(dir, "urls.txt"), "https://example.ru/a\nhttps://example.ru/b\n");
    const r = spawnSync(process.execPath, [READ, "--urls", join(dir, "urls.txt"), "--out-dir", join(dir, "readings"), "--delay", "500"], { encoding: "utf8" });
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stdout, /REFUSED {3}refused_ru_domain/);
    assert.deepEqual(readdirSync(join(dir, "readings")), ["site.json"]);
    const a = spawnSync(process.execPath, [AUDIT, "--site", join(dir, "readings", "site.json"), "--out-dir", join(dir, "report")], { encoding: "utf8" });
    assert.equal(a.status, 2, a.stderr);
    const html = readFileSync(join(dir, "report", "index.html"), "utf8");
    assert.ok(html.includes(esc(REFUSAL_REASON.refused_ru_domain.en)) && html.includes(REFUSAL_REASON.refused_ru_domain.uk));
    assert.deepEqual(readdirSync(join(dir, "report")).sort(), ["index.html", "site.json", "site.md"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
