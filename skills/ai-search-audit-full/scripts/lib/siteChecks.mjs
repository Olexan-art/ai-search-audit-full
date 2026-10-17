// Checks only a set of pages can make: one page cannot know another page's title, who links to
// it, or where its canonical leads. They run over the readings of a site audit, measure only the
// pages that were audited (never the whole site), and say so; each check that could not run says
// why (too few pages, no home page in the set), so nothing reads as checked when it was not.

import { samePage } from "../vendor/vectorscope/technical.mjs";

/** Below this many audited pages, the link graph checks say nothing (one or two pages are not a graph). */
export const GRAPH_MIN_PAGES = 3;
/** A page far deeper than this many clicks from the home page (within the set) is flagged. */
export const LINK_DEPTH_MAX = 3;
/** A page with fewer words than this share of the site's median is thin for the site. */
export const THIN_SHARE = 0.3;
export const THIN_MIN_PAGES = 4;

export const SITE_CODES = {
  site_title_duplicate: { severity: "medium", owner: "content" },
  site_description_duplicate: { severity: "low", owner: "content" },
  site_h1_duplicate: { severity: "low", owner: "content" },
  site_orphan_page: { severity: "medium", owner: "seo" },
  site_link_depth: { severity: "low", owner: "seo" },
  site_hreflang_not_reciprocal: { severity: "high", owner: "dev" },
  site_canonical_chain: { severity: "medium", owner: "seo" },
  site_internal_redirect: { severity: "low", owner: "dev" },
  site_thin_page: { severity: "low", owner: "content" },
};

const fold = (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const same = (a, b) => Boolean(a && b) && (a === b || samePage(a, b));

function groupsBy(pages, valueOf) {
  const m = new Map();
  for (const p of pages) {
    const v = fold(valueOf(p));
    if (!v) continue;
    m.set(v, [...(m.get(v) || []), p]);
  }
  return [...m.entries()].filter(([, ps]) => ps.length >= 2).map(([value, ps]) => ({ value, slugs: ps.map((p) => p.slug) }));
}

/**
 * The site-wide findings. `pages`: [{ slug, reading }] for the readings that are ok. Returns
 * { findings: [{ code, severity, owner, slugs, evidence }], notChecked: [{ code, reason }] }.
 */
export function siteFindings(pages) {
  const out = [];
  const notChecked = [];
  const P = pages.map((p) => ({ slug: p.slug, r: p.reading, url: p.reading.fetch.finalUrl, lang: p.reading.facts.head.lang || "" }));
  const push = (code, slugs, evidence) => out.push({ code, ...SITE_CODES[code], slugs: [...new Set(slugs)], evidence });

  // Duplicates: compared within one language, so translations that keep a brand name do not count twice.
  const byLang = (fn) => {
    const groups = [];
    for (const lang of new Set(P.map((p) => p.lang.split("-")[0].toLowerCase()))) groups.push(...groupsBy(P.filter((p) => p.lang.split("-")[0].toLowerCase() === lang), fn));
    return groups;
  };
  for (const [code, fn] of [
    ["site_title_duplicate", (p) => p.r.facts.head.title],
    ["site_description_duplicate", (p) => p.r.facts.head.metaDescriptions[0]],
    ["site_h1_duplicate", (p) => (p.r.vs.page.h1 || [])[0]],
  ]) {
    const groups = byLang(fn);
    if (groups.length) push(code, groups.flatMap((g) => g.slugs), { groups: groups.slice(0, 8), count: groups.length });
  }

  // The link graph between the audited pages.
  const linksOf = (p) => (p.r.facts.links || []).filter((l) => l.internal && !l.self).map((l) => l.url);
  const target = (url) => P.find((q) => same(q.url, url) || same(q.r.fetch.requestedUrl, url));
  if (P.length < GRAPH_MIN_PAGES) {
    notChecked.push({ code: "site_orphan_page", reason: "fewer_pages", min: GRAPH_MIN_PAGES });
    notChecked.push({ code: "site_link_depth", reason: "fewer_pages", min: GRAPH_MIN_PAGES });
  } else {
    const linkedFrom = new Map(P.map((p) => [p.slug, new Set()]));
    for (const p of P) for (const u of linksOf(p)) {
      const q = target(u);
      if (q && q.slug !== p.slug) linkedFrom.get(q.slug).add(p.slug);
    }
    const home = P.find((p) => new URL(p.url).pathname === "/");
    const orphans = P.filter((p) => p !== home && !linkedFrom.get(p.slug).size);
    if (orphans.length) push("site_orphan_page", orphans.map((p) => p.slug), { pages: orphans.length, of: P.length, note: "linked from no other audited page" });
    if (!home) notChecked.push({ code: "site_link_depth", reason: "no_home_page" });
    else {
      const depth = new Map([[home.slug, 0]]);
      const queue = [home];
      while (queue.length) {
        const p = queue.shift();
        for (const u of linksOf(p)) {
          const q = target(u);
          if (q && !depth.has(q.slug)) {
            depth.set(q.slug, depth.get(p.slug) + 1);
            queue.push(q);
          }
        }
      }
      const deep = P.filter((p) => !depth.has(p.slug) || depth.get(p.slug) > LINK_DEPTH_MAX);
      if (deep.length) push("site_link_depth", deep.map((p) => p.slug), { max: LINK_DEPTH_MAX, items: deep.map((p) => ({ slug: p.slug, depth: depth.get(p.slug) ?? null })) });
    }
  }

  // hreflang between audited pages: A names B, B does not name A.
  const pairs = [];
  for (const a of P) for (const h of a.r.facts.head.hreflang || []) {
    const b = target(h.href);
    if (!b || b.slug === a.slug) continue;
    const back = (b.r.facts.head.hreflang || []).some((x) => same(x.href, a.url));
    if (!back) pairs.push({ from: a.slug, to: b.slug, hreflang: h.hreflang });
  }
  if (pairs.length) push("site_hreflang_not_reciprocal", pairs.flatMap((x) => [x.from, x.to]), { pairs: pairs.slice(0, 12), count: pairs.length });

  // Canonicals that lead to an audited page whose own canonical leads elsewhere again.
  const chains = [];
  for (const a of P) {
    const c = a.r.vs.technical?.canonical;
    if (!c?.present || c.self || !c.resolved) continue;
    const b = target(c.resolved);
    if (!b || b.slug === a.slug) continue;
    const cb = b.r.vs.technical?.canonical;
    if (cb?.present && !cb.self && cb.resolved && !same(cb.resolved, b.url)) chains.push({ from: a.slug, via: b.slug, to: cb.resolved });
  }
  if (chains.length) push("site_canonical_chain", chains.flatMap((x) => [x.from, x.via]), { chains: chains.slice(0, 8), count: chains.length });

  // Internal links that land on an audited page only after a redirect.
  const redirected = [];
  for (const p of P) {
    for (const res of p.r.links?.results || []) {
      if (!res.finalUrl || same(res.finalUrl, res.url)) continue;
      const q = target(res.finalUrl);
      if (q && q.slug !== p.slug) redirected.push({ from: p.slug, url: res.url, to: q.slug });
    }
  }
  if (redirected.length) push("site_internal_redirect", redirected.map((x) => x.from), { links: redirected.slice(0, 10), count: redirected.length, note: "among the links each page's check followed (30 per page)" });

  // Thin for the site: far below the median word count of the audited pages.
  if (P.length < THIN_MIN_PAGES) notChecked.push({ code: "site_thin_page", reason: "fewer_pages", min: THIN_MIN_PAGES });
  else {
    const words = P.map((p) => p.r.vs.page.wordCount || 0).sort((a, b) => a - b);
    const median = words.length % 2 ? words[(words.length - 1) / 2] : (words[words.length / 2 - 1] + words[words.length / 2]) / 2;
    const thin = P.filter((p) => (p.r.vs.page.wordCount || 0) < median * THIN_SHARE);
    if (thin.length) push("site_thin_page", thin.map((p) => p.slug), { median, share: THIN_SHARE, items: thin.map((p) => ({ slug: p.slug, words: p.r.vs.page.wordCount })) });
  }
  const rank = { blocking: 4, high: 3, medium: 2, low: 1 };
  out.sort((a, b) => rank[b.severity] - rank[a.severity] || b.slugs.length - a.slugs.length);
  return { findings: out, notChecked };
}
