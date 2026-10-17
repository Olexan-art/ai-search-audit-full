// Several pages of one site in one audit: the list of pages (a file of URLs, or a sitemap), the
// 50-page cap, robots.txt for this skill's own crawler, and the pages read one after another with
// a pause between them. Every page left out is listed with its reason, and the counts are
// reported as evaluated / total, so a capped site never reads as complete.

import { judgeRequestedUrl } from "../vendor/vectorscope/guards.mjs";
import { CRAWLER_UA } from "../vendor/vectorscope/fetchPage.mjs";
import { judgePath, parseRobots, pathOf, rulesFor } from "../vendor/vectorscope/robots.mjs";
import { guardedFetch, requestCacheStats, useRequestCache } from "./net.mjs";
import { parseSitemap, SITEMAP_CHILD_CAP, SITEMAP_MAX_BYTES } from "./collect.mjs";
import { readAudit, robotsOnce } from "./reading.mjs";
import { gunzipSync } from "node:zlib";

/** At most this many pages per site audit; the rest are listed as left out. */
export const SITE_PAGE_CAP = 50;
/** The pause between two pages, so the site never sees this audit as a burst. */
export const SITE_DELAY_MS = 1000;
/** A robots.txt Crawl-delay is honoured up to this many seconds; a longer one is reported and capped. */
export const CRAWL_DELAY_MAX_S = 10;
/** The left-out list keeps this many URLs; the count is always the full one. */
export const LEFT_OUT_LIST_CAP = 200;
/** The product token this skill's crawler answers to in robots.txt (its User-Agent starts with it). */
export const CRAWLER_TOKEN = CRAWLER_UA.split("/")[0];

export const SITE_READING_SCHEMA = "getlooploop/ai-search-audit-site-reading@1";

/** A page's file name: its host and path in lowercase letters, digits and hyphens. */
export function pageSlug(url) {
  const u = new URL(url);
  const raw = `${u.hostname.replace(/^www\./, "")}${u.pathname}${u.search}`;
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return slug || "page";
}

/** The URL list file: one URL per line, blank lines and # comments ignored. */
export function parseUrlList(text) {
  return String(text ?? "")
    .split(/\r\n|\r|\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);
}

/**
 * The candidate pages, in order, with duplicates and unusable entries set aside.
 * Returns { pages: [url], rejected: [{ url, reason }] }.
 */
export function candidates(urls) {
  const seen = new Set();
  const pages = [];
  const rejected = [];
  for (const raw of urls) {
    const v = judgeRequestedUrl(raw);
    if (!v.ok) {
      rejected.push({ url: raw, reason: v.reason });
      continue;
    }
    const key = v.url.replace(/#.*$/, "");
    if (seen.has(key)) {
      rejected.push({ url: raw, reason: "duplicate" });
      continue;
    }
    seen.add(key);
    pages.push(key);
  }
  return { pages, rejected };
}

/**
 * The URLs a sitemap lists, following an index into at most SITEMAP_CHILD_CAP children, same host
 * only. Returns { urls, fetched, children: { total, read, unread, cap }, offHost }.
 */
export async function sitemapUrls(sitemapUrl) {
  const host = new URL(sitemapUrl).hostname.replace(/^www\./, "");
  const sameHost = (u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "") === host;
    } catch {
      return false;
    }
  };
  const fetched = [];
  const read = async (url) => {
    const r = await guardedFetch(url, { accept: "application/xml,text/xml;q=0.9,*/*;q=0.5", maxBytes: SITEMAP_MAX_BYTES, binary: true });
    if (!r.ok || r.status !== 200) {
      fetched.push({ url, status: r.status ?? null, reason: r.ok ? "http_error" : r.reason });
      return null;
    }
    let text;
    try {
      text = r.body[0] === 0x1f && r.body[1] === 0x8b ? gunzipSync(r.body, { maxOutputLength: SITEMAP_MAX_BYTES }).toString("utf8") : r.body.toString("utf8");
    } catch {
      fetched.push({ url, status: r.status, reason: "unreadable" });
      return null;
    }
    const parsed = parseSitemap(text);
    fetched.push({ url, status: r.status, kind: parsed.kind, count: parsed.locs.length });
    return parsed;
  };
  const top = await read(sitemapUrl);
  const urls = [];
  const offHost = [];
  const children = { total: 0, read: 0, unread: 0, cap: SITEMAP_CHILD_CAP };
  if (!top) return { urls, fetched, children, offHost, ok: false };
  const take = (locs) => {
    for (const u of locs) (sameHost(u) ? urls : offHost).push(u);
  };
  if (top.kind === "sitemapindex") {
    const kids = top.locs.filter(sameHost);
    children.total = kids.length;
    for (const kid of kids.slice(0, SITEMAP_CHILD_CAP)) {
      children.read++;
      const parsed = await read(kid);
      if (parsed?.kind === "urlset") take(parsed.locs);
    }
    children.unread = Math.max(0, kids.length - children.read);
  } else if (top.kind === "urlset") take(top.locs);
  return { urls, fetched, children, offHost, ok: top.kind !== "unknown" };
}

/** Crawl-delay for this skill's group (else the * group), in seconds, or null. */
export function crawlDelay(robotsText) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of String(robotsText ?? "").split(/\r\n|\r|\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) groups.push((current = { agents: [], delay: null }));
      current.agents.push(value.split("/")[0].trim().toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (key === "crawl-delay" && current) {
        const n = Number(value);
        if (Number.isFinite(n) && n >= 0) current.delay = n;
      }
    }
  }
  const own = groups.find((g) => g.agents.includes(CRAWLER_TOKEN.toLowerCase()) && g.delay !== null);
  const any = groups.find((g) => g.agents.includes("*") && g.delay !== null);
  return (own || any)?.delay ?? null;
}

/** Whether robots.txt lets this skill's crawler fetch a URL. A 5xx or no answer: nothing is fetched (RFC 9309). */
export function crawlerVerdict(robotsFetched, url) {
  if (robotsFetched.status === "none") return { allowed: true, rule: null, why: "no_robots" };
  if (robotsFetched.status !== "ok") return { allowed: false, rule: null, why: "robots_unreachable" };
  const { rules, group } = rulesFor(parseRobots(robotsFetched.text), CRAWLER_TOKEN);
  const v = judgePath(rules, pathOf(url));
  return { allowed: v.allowed, rule: v.rule, group, why: v.allowed ? "allowed" : "robots_disallowed" };
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Read a site: `list` is the candidate URLs in order (from a file or a sitemap). Reads pages one
 * at a time, up to `max` (at most SITE_PAGE_CAP), skipping pages robots.txt closes to this
 * crawler, pausing `delayMs` (or the site's Crawl-delay, if longer) between pages. Calls
 * `onPage(reading, slug)` for each page read. Returns the manifest (without file paths).
 */
export async function readSite({ list, source, max = SITE_PAGE_CAP, delayMs = SITE_DELAY_MS, render = false, onPage, onProgress = () => {}, fetchRobotsFor = robotsOnce }) {
  const cap = Math.max(1, Math.min(SITE_PAGE_CAP, Number(max) || SITE_PAGE_CAP));
  const { pages: urls, rejected } = candidates(list);
  const robotsCache = new Map();
  const leftOut = rejected.map((r) => ({ ...r }));
  const pages = [];
  const slugs = new Set();
  const delays = new Map();
  useRequestCache(true);
  let evaluated = 0;
  let i = 0;
  for (; i < urls.length && evaluated < cap; i++) {
    const url = urls[i];
    const robots = await fetchRobotsFor(url, robotsCache);
    const verdict = crawlerVerdict(robots, url);
    if (!verdict.allowed) {
      leftOut.push({ url, reason: verdict.why, rule: verdict.rule });
      onProgress({ url, skipped: verdict.why });
      continue;
    }
    const origin = new URL(url).origin;
    if (!delays.has(origin)) delays.set(origin, robots.status === "ok" ? crawlDelay(robots.text) : null);
    if (evaluated > 0) {
      const site = delays.get(origin);
      await pause(Math.max(delayMs, site === null ? 0 : Math.min(site, CRAWL_DELAY_MAX_S) * 1000));
    }
    let slug = pageSlug(url);
    for (let n = 2; slugs.has(slug); n++) slug = `${pageSlug(url)}-${n}`;
    slugs.add(slug);
    const reading = await readAudit({ url, render, robotsCache });
    evaluated++;
    pages.push({ url, slug, ok: reading.ok, reasonCode: reading.reasonCode, finalUrl: reading.fetch?.finalUrl || reading.page?.url || null });
    if (onPage) await onPage(reading, slug);
    onProgress({ url, slug, ok: reading.ok, reasonCode: reading.reasonCode });
  }
  for (; i < urls.length; i++) leftOut.push({ url: urls[i], reason: "cap" });
  const stats = requestCacheStats();
  useRequestCache(false);
  const longDelays = [...delays.entries()].filter(([, d]) => d !== null && d > CRAWL_DELAY_MAX_S).map(([o, d]) => ({ origin: o, crawlDelay: d, used: CRAWL_DELAY_MAX_S }));
  return {
    schema: SITE_READING_SCHEMA,
    createdAt: new Date().toISOString(),
    source,
    cap,
    // total: distinct usable URLs; evaluated + skipped by robots + past the cap = total.
    total: urls.length,
    rejected: rejected.length,
    evaluated,
    pages,
    leftOut: { count: leftOut.length, byReason: countBy(leftOut, "reason"), items: leftOut.slice(0, LEFT_OUT_LIST_CAP), listCap: LEFT_OUT_LIST_CAP, listed: Math.min(leftOut.length, LEFT_OUT_LIST_CAP) },
    politeness: { sequential: true, delayMs, crawlDelay: Object.fromEntries([...delays.entries()].filter(([, d]) => d !== null)), crawlDelayCappedAt: CRAWL_DELAY_MAX_S, longDelays, crawler: CRAWLER_TOKEN, requestCache: stats },
  };
}

const countBy = (items, key) => items.reduce((acc, x) => ({ ...acc, [x[key]]: (acc[x[key]] || 0) + 1 }), {});
