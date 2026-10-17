// The checks only a set of pages can make, over the audited pages only: duplicate titles,
// descriptions and h1s within a language, orphans and link depth in the set's link graph,
// hreflang pairs, canonical chains, internal links through a redirect, thin pages against the
// median. Each one that could not run says why. And their words: every site code described,
// with a verified quote or this skill's rule carrying no link.
import { test } from "node:test";
import assert from "node:assert/strict";
import { siteFindings, SITE_CODES } from "../scripts/lib/siteChecks.mjs";
import { SITE_EXPLAIN } from "../scripts/lib/siteExplain.mjs";
import { SOURCES } from "../scripts/lib/rules.mjs";
import { page, readingOf, section } from "./helpers.mjs";

const at = (path, opts = {}, patch = {}) => readingOf(page({ body: section("One") + section("Two"), ...opts }), patch, { url: `https://example.org${path}` }).then((reading) => ({ slug: path.replace(/\W+/g, "-") || "home", reading }));
const link = (href) => `<p><a href="${href}">to ${href}</a></p>`;

test("duplicates within one language; a translation with the same brand title does not count", async () => {
  const a = await at("/a", { title: "Shared title for two pages" });
  const b = await at("/b", { title: "Shared title for two pages" });
  const c = await at("/c", { title: "Shared title for two pages", lang: "uk" });
  const { findings } = siteFindings([a, b, c]);
  const t = findings.find((f) => f.code === "site_title_duplicate");
  assert.deepEqual(t.slugs.sort(), [a.slug, b.slug].sort());
  assert.ok(findings.some((f) => f.code === "site_description_duplicate"));
  assert.ok(findings.some((f) => f.code === "site_h1_duplicate"));
});

test("orphans and link depth in the set's link graph; too few pages or no home page is reported, not guessed", async () => {
  const home = await at("/", { title: "Home page title here", body: link("/a") });
  const a = await at("/a", { title: "Page A title here", body: link("/b") });
  const b = await at("/b", { title: "Page B title here", body: link("/c") });
  const c = await at("/c", { title: "Page C title here", body: link("/d") });
  const d = await at("/d", { title: "Page D title here" });
  const o = await at("/orphan", { title: "Orphan title here" });
  const { findings } = siteFindings([home, a, b, c, d, o]);
  assert.deepEqual(findings.find((f) => f.code === "site_orphan_page").slugs, [o.slug]);
  const deep = findings.find((f) => f.code === "site_link_depth");
  assert.deepEqual(deep.slugs.sort(), [d.slug, o.slug].sort(), "/d is 4 clicks away, the orphan unreachable");
  assert.deepEqual(siteFindings([a, b]).notChecked.map((n) => n.code).sort(), ["site_link_depth", "site_orphan_page", "site_thin_page"]);
  assert.ok(siteFindings([a, b, c]).notChecked.some((n) => n.code === "site_link_depth" && n.reason === "no_home_page"));
});

test("hreflang pairs that do not point back, between audited pages", async () => {
  const hl = (pairs) => pairs.map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="https://example.org${u}">`).join("");
  const en = await at("/en", { head: hl([["en", "/en"], ["uk", "/uk"]]) });
  const ukp = await at("/uk", { lang: "uk", head: hl([["uk", "/uk"]]) });
  const f = siteFindings([en, ukp]).findings.find((x) => x.code === "site_hreflang_not_reciprocal");
  assert.deepEqual(f.evidence.pairs, [{ from: en.slug, to: ukp.slug, hreflang: "uk" }]);
});

test("a canonical that leads to a page whose canonical leads on again", async () => {
  const a = await at("/a", { canonical: "https://example.org/b" });
  const b = await at("/b", { canonical: "https://example.org/c" });
  const c = await at("/c", { canonical: "https://example.org/c" });
  const f = siteFindings([a, b, c]).findings.find((x) => x.code === "site_canonical_chain");
  assert.deepEqual(f.evidence.chains, [{ from: a.slug, via: b.slug, to: "https://example.org/c" }]);
});

test("internal links that reach an audited page only through a redirect", async () => {
  const a = await at("/a", {}, { links: { total: 1, checked: 1, unchecked: 0, cap: 30, results: [{ url: "https://example.org/old-b", status: 200, verdict: "ok", finalUrl: "https://example.org/b" }] } });
  const b = await at("/b");
  const f = siteFindings([a, b]).findings.find((x) => x.code === "site_internal_redirect");
  assert.equal(f.evidence.links[0].to, b.slug);
});

test("thin against the site's median, from four pages", async () => {
  const long = (p) => at(p, { body: section("A", null, 30) + section("B", null, 30) });
  const pages = [await long("/1"), await long("/2"), await long("/3"), await at("/4", { body: "" })];
  const f = siteFindings(pages).findings.find((x) => x.code === "site_thin_page");
  assert.deepEqual(f.slugs, [pages[3].slug]);
});

test("every site code is described in both languages, with a verified quote or an unlinked rule of this skill", () => {
  for (const code of Object.keys(SITE_CODES)) {
    const e = SITE_EXPLAIN[code];
    assert.ok(e, code);
    for (const k of ["t", "d", "x"]) assert.ok(e[k][0] && e[k][1] && !/[\u044b\u044a\u044d\u0451]/i.test(e[k][1]), `${code}.${k}`);
    if (e.r.kind === "quote") {
      assert.ok(SOURCES[e.r.src], code);
      assert.match(e.r.checked, /^\d{4}-\d{2}-\d{2}$/);
    } else assert.equal(e.r.fullOnly, true, `${code}: a Full-only rule carries no link`);
  }
  assert.deepEqual(Object.keys(SITE_EXPLAIN).sort(), Object.keys(SITE_CODES).sort());
});
