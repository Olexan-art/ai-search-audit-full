// History: every audit writes its export as a snapshot, and the report reads the snapshots of the
// same page back to draw a timeline (finding counts per run) and to say what changed since the run
// before (drift). Nothing is uploaded: no server.
//
//   <dir>/<host>/<path-slug>/<ISO>.json
//
// The file is named by the reading's date (colons as hyphens, so Windows can store it). Auditing
// the same reading again rewrites the same file, so a rerun never passes for a new run.
//
// 2.110: the history outlives the session it was made in, and the version that made it.
//   - The folder is the user's own (~/.ai-search-audit/history, or $AI_SEARCH_AUDIT_HISTORY), never
//     the working directory and never inside the skill's folder, which an update replaces.
//   - The old default, ./.ai-search-audit/history in the working directory, is read and copied in,
//     so updating does not lose it.
//   - Every report carries every run it knew, compactly, in a JSON block of its own. A sandbox that
//     forgets its disk between chats (claude.ai, Cowork) gets its history back from an earlier report
//     passed with --history-from, whichever page or site that report was about.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { EXPORT_SCHEMA } from "./version.mjs";

/** The pre-2.110 default, relative to the working directory: read and copied in, never written. */
export const DEFAULT_HISTORY_DIR = join(".ai-search-audit", "history");
/** Set it to put the history somewhere else, for every run, without passing --history. */
export const HISTORY_ENV = "AI_SEARCH_AUDIT_HISTORY";
/** The JSON block a report carries its history in, and the shape of it. */
export const PACK_ID = "ai-search-audit-history";
export const PACK_SCHEMA = "getlooploop/ai-search-audit-history@1";
/** A report carries at most this many runs, newest first kept; the rest are counted, and the report says so. */
export const PACK_CAP = 300;
/** The timeline shows at most this many runs, newest last; older ones are counted, not drawn. */
export const TIMELINE_CAP = 20;
/** Passages added or lost are listed up to this many each; the counts are complete. */
export const DRIFT_PASSAGE_CAP = 8;
/** Each snapshot keeps this much of every passage, so a changed passage can show where it changed. */
export const PASSAGE_TEXT_KEPT = 2000;

/** Where two passage texts first differ, as a short excerpt of each (or null when one is missing). */
export function changedAt(before, after) {
  if (typeof before !== "string" || typeof after !== "string") return null;
  let i = 0;
  while (i < before.length && i < after.length && before[i] === after[i]) i++;
  const from = Math.max(0, before.lastIndexOf(" ", Math.max(0, i - 40)));
  const cut = (s) => `${from ? "…" : ""}${s.slice(from, from + 110).trim()}${s.length > from + 110 ? "…" : ""}`;
  return { at: i, before: cut(before), after: cut(after) };
}

const fold = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const hash = (s) => createHash("sha256").update(fold(s).toLowerCase()).digest("hex").slice(0, 16);

/** The folder of one page's snapshots: host, then the path (and query) as a slug. */
export function pageHistoryDir(dir, url) {
  const u = new URL(url);
  const host = u.hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
  const path = `${u.pathname}${u.search}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return join(dir, host, path || "root");
}

/** A snapshot's file name from an ISO date. */
export const snapshotName = (iso) => `${new Date(iso).toISOString().replace(/:/g, "-")}.json`;
const isoOfName = (name) => name.replace(/\.json$/, "").replace(/T(\d{2})-(\d{2})-(\d{2})/, "T$1:$2:$3");

/**
 * What the drift compares, taken from the reading: the head, the h1, the word count, the
 * structured data types, robots.txt for each bot, the hreflang set, and every passage as a hash
 * with its heading and first words.
 */
export function pageState(reading) {
  const h = reading.facts.head;
  const types = [...new Set([...reading.facts.structured.jsonLd.flatMap((b) => b.types), ...reading.facts.structured.microdata, ...reading.facts.structured.rdfa])].sort();
  return {
    title: h.title || null,
    description: h.metaDescriptions[0] || null,
    canonical: reading.vs.technical?.canonical?.present ? reading.vs.technical.canonical.resolved || reading.vs.technical.canonical.href : null,
    h1: (reading.vs.page.h1 || []).map(fold).filter(Boolean),
    wordCount: reading.vs.page.wordCount ?? null,
    schemaTypes: types,
    robots: { status: reading.robots.status, bots: Object.fromEntries((reading.robots.bots || []).map((b) => [b.token, b.allowed])) },
    hreflang: h.hreflang.map((x) => `${x.hreflang} ${x.href}`).sort(),
    passages: reading.vs.passages.map((p) => ({ index: p.index, heading: p.heading || null, hash: hash(p.text), head: fold(p.text).slice(0, 90), text: fold(p.text).slice(0, PASSAGE_TEXT_KEPT) })),
    saved: Boolean(reading.fetch.saved),
  };
}

/** Write one export as this page's snapshot; returns the file path. */
export function saveSnapshot(dir, exp) {
  const folder = pageHistoryDir(dir, exp.page.url);
  mkdirSync(folder, { recursive: true });
  const file = join(folder, snapshotName(exp.createdAt));
  writeFileSync(file, JSON.stringify(exp, null, 2));
  return file;
}

/** Every snapshot of a page, oldest first: [{ file, createdAt, export }]. Unreadable files are listed as such. */
export function loadSnapshots(dir, url) {
  const folder = pageHistoryDir(dir, url);
  if (!existsSync(folder)) return { folder, runs: [], unreadable: [] };
  const runs = [];
  const unreadable = [];
  for (const name of readdirSync(folder).filter((n) => n.endsWith(".json")).sort()) {
    try {
      const x = JSON.parse(readFileSync(join(folder, name), "utf8"));
      if (x.schema !== EXPORT_SCHEMA || x.refused) {
        if (x.refused) runs.push({ file: name, createdAt: x.createdAt || isoOfName(name), export: x });
        else unreadable.push(name);
        continue;
      }
      runs.push({ file: name, createdAt: x.createdAt || isoOfName(name), export: x });
    } catch {
      unreadable.push(name);
    }
  }
  runs.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return { folder, runs, unreadable };
}

/** The timeline row of one run. */
function row(run, current) {
  const x = run.export;
  if (x.refused) return { createdAt: run.createdAt, refused: x.reasonCode, current };
  return { createdAt: run.createdAt, total: x.counts?.total ?? 0, blocking: x.counts?.blocking ?? 0, high: x.counts?.high ?? 0, medium: x.counts?.medium ?? 0, low: x.counts?.low ?? 0, saved: Boolean(x.page?.saved), edition: x.edition || null, current };
}

/**
 * The page's history as of the current export: the runs (capped, oldest dropped first), the
 * previous run, and the drift since it. The current run is always in the timeline, whether or not
 * it was saved.
 */
export function history(dir, current) {
  const { folder, runs, unreadable } = loadSnapshots(dir, current.page.url);
  const others = runs.filter((r) => r.createdAt !== current.createdAt);
  const all = [...others, { file: null, createdAt: current.createdAt, export: current }].sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  const shown = all.slice(-TIMELINE_CAP);
  const prev = [...others].reverse().find((r) => r.createdAt < current.createdAt && !r.export.refused) || null;
  return {
    folder,
    runs: shown.map((r) => row(r, r.export === current)),
    older: all.length - shown.length,
    total: all.length,
    unreadable,
    previous: prev ? { createdAt: prev.createdAt, file: prev.file } : null,
    drift: prev ? drift(prev.export, current) : null,
    later: all.some((r) => r.createdAt > current.createdAt),
  };
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * What changed between two exports of the same page: each field as before / after, the bots whose
 * verdict changed, the hreflang lines added and removed, the passages new and lost (by the hash of
 * their text), and the findings fixed, new and unchanged. An export without a state (an older
 * edition) says which fields could not be compared.
 */
export function drift(before, after) {
  const a = before.state;
  const b = after.state;
  const out = { since: before.createdAt, comparable: Boolean(a && b), fields: [], bots: [], hreflang: { added: [], removed: [] }, passages: null, findings: compareFindings(before, after), notCompared: [] };
  if (!a || !b) {
    out.notCompared = ["title", "description", "canonical", "h1", "wordCount", "schemaTypes", "robots", "hreflang", "passages"];
    return out;
  }
  for (const k of ["title", "description", "canonical", "h1", "wordCount", "schemaTypes"]) if (!same(a[k], b[k])) out.fields.push({ field: k, before: a[k], after: b[k] });
  if (a.robots.status !== b.robots.status) out.fields.push({ field: "robotsStatus", before: a.robots.status, after: b.robots.status });
  for (const token of new Set([...Object.keys(a.robots.bots || {}), ...Object.keys(b.robots.bots || {})])) {
    const x = a.robots.bots?.[token];
    const y = b.robots.bots?.[token];
    if (x !== y) out.bots.push({ token, before: x ?? null, after: y ?? null });
  }
  out.hreflang.added = b.hreflang.filter((l) => !a.hreflang.includes(l));
  out.hreflang.removed = a.hreflang.filter((l) => !b.hreflang.includes(l));
  const had = new Set(a.passages.map((p) => p.hash));
  const has = new Set(b.passages.map((p) => p.hash));
  const added = b.passages.filter((p) => !had.has(p.hash));
  const lost = a.passages.filter((p) => !has.has(p.hash));
  // A passage new at an index where one was lost is a changed passage: show where its text changed.
  const slim = ({ text, ...p }) => p;
  const changed = added.map((p) => ({ p, q: lost.find((x) => x.index === p.index) })).filter((x) => x.q).map(({ p, q }) => ({ index: p.index, heading: p.heading, ...changedAt(q.text, p.text) })).filter((x) => x.before !== undefined);
  out.passages = { before: a.passages.length, after: b.passages.length, added: added.length, lost: lost.length, unchanged: b.passages.length - added.length, addedItems: added.slice(0, DRIFT_PASSAGE_CAP).map(slim), lostItems: lost.slice(0, DRIFT_PASSAGE_CAP).map(slim), changedItems: changed.slice(0, DRIFT_PASSAGE_CAP), listCap: DRIFT_PASSAGE_CAP };
  if (a.saved !== b.saved) out.fields.push({ field: "source", before: a.saved ? "saved copy" : "live", after: b.saved ? "saved copy" : "live" });
  out.changed = out.fields.length + out.bots.length + out.hreflang.added.length + out.hreflang.removed.length + out.passages.added + out.passages.lost;
  return out;
}

/** Findings of two exports of one page matched by id: fixed (only before), new (only now), unchanged (both). */
export function compareFindings(before, after) {
  const key = (f) => f.id || f.code;
  const old = new Map((before.findings || []).map((f) => [key(f), f]));
  const now = new Map((after.findings || []).map((f) => [key(f), f]));
  const brief = (f) => ({ id: key(f), code: f.code, severity: f.severity, label: f.label || null, where: f.where ?? null });
  const fixed = [...old.values()].filter((f) => !now.has(key(f))).map(brief);
  const added = [...now.values()].filter((f) => !old.has(key(f))).map(brief);
  const unchanged = [...now.values()].filter((f) => old.has(key(f))).map((f) => ({ ...brief(f), severityBefore: old.get(key(f)).severity }));
  return { fixed, new: added, unchanged, counts: { fixed: fixed.length, new: added.length, unchanged: unchanged.length } };
}

// ── 2.110: where the history lives, and how it travels ───────────────────────

/** The user's history folder: $AI_SEARCH_AUDIT_HISTORY, else ~/.ai-search-audit/history. */
export function historyHome(env = process.env) {
  return env[HISTORY_ENV] ? resolve(env[HISTORY_ENV]) : join(homedir(), ".ai-search-audit", "history");
}

const inside = (parent, child) => {
  const rel = relative(resolve(parent), resolve(child));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

/**
 * The folder this run keeps its history in. --history wins, unless it points inside the skill's
 * own folder: an update replaces that folder, and the history with it, so it goes to the user's
 * folder instead and the run says why (`moved`).
 */
export function resolveHistoryDir(arg, { skillDir = null, cwd = process.cwd(), env = process.env } = {}) {
  const home = historyHome(env);
  if (!arg) return { dir: home, moved: null };
  const dir = resolve(cwd, arg);
  if (skillDir && inside(skillDir, dir)) return { dir: home, moved: "inside_skill" };
  return { dir, moved: null };
}

/** Grouping key for a page: scheme and host in lower case, no fragment, no trailing slash past the root. */
export function urlKey(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : u.pathname;
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}`;
  } catch {
    return String(url ?? "");
  }
}

/** Every snapshot under a history folder, any page and any site: [{ url, createdAt, export }]. */
export function loadAllSnapshots(dir) {
  const out = [];
  let unreadable = 0;
  if (!dir || !existsSync(dir)) return { runs: out, unreadable };
  for (const host of readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    for (const page of readdirSync(join(dir, host.name), { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const folder = join(dir, host.name, page.name);
      for (const name of readdirSync(folder).filter((n) => n.endsWith(".json"))) {
        try {
          const x = JSON.parse(readFileSync(join(folder, name), "utf8"));
          if (x.schema !== EXPORT_SCHEMA || !x.page?.url) {
            unreadable += 1;
            continue;
          }
          out.push({ url: x.page.url, createdAt: x.createdAt || isoOfName(name), export: x });
        } catch {
          unreadable += 1;
        }
      }
    }
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return { runs: out, unreadable };
}

/**
 * One run as a report carries it: enough for the timeline, the list of every page, and (for the
 * newest run of each page, `full`) the drift the next run computes against it. Not the whole export.
 */
export function compactRun(x, { full = false } = {}) {
  const base = {
    schema: EXPORT_SCHEMA,
    compact: true,
    edition: x.edition || null,
    skillVersion: x.skillVersion || null,
    createdAt: x.createdAt,
    page: { url: x.page?.url, title: x.page?.title ?? null, saved: Boolean(x.page?.saved) },
  };
  if (x.refused) return { ...base, refused: true, reasonCode: x.reasonCode || null };
  const counts = x.counts ? { total: x.counts.total ?? 0, blocking: x.counts.blocking ?? 0, high: x.counts.high ?? 0, medium: x.counts.medium ?? 0, low: x.counts.low ?? 0 } : null;
  const findings = (x.findings || []).map((f) => (full ? { id: f.id || f.code, code: f.code, severity: f.severity, label: f.label ?? null, where: f.where ?? null } : { id: f.id || f.code, code: f.code, severity: f.severity }));
  let state = null;
  if (x.state) {
    const { passages, ...rest } = x.state;
    state = full ? x.state : { ...rest, passages: (passages || []).map(({ text, ...p }) => p) };
  }
  return { ...base, counts, findings, state };
}

/**
 * The history a report carries: every run the folder holds (and the current one), newest kept
 * first up to PACK_CAP, the newest run of each page in full. `dropped` counts what did not fit.
 */
export function historyPack(dir, current = null) {
  const { runs } = loadAllSnapshots(dir);
  const all = current && !runs.some((r) => urlKey(r.url) === urlKey(current.page.url) && r.createdAt === current.createdAt) ? [...runs, { url: current.page.url, createdAt: current.createdAt, export: current }] : runs;
  const newest = new Map();
  for (const r of all) {
    const k = urlKey(r.url);
    if (!newest.has(k) || newest.get(k).createdAt < r.createdAt) newest.set(k, r);
  }
  const ordered = [...all].sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
  const kept = ordered.slice(0, PACK_CAP);
  return {
    schema: PACK_SCHEMA,
    runs: kept.map((r) => compactRun(r.export, { full: newest.get(urlKey(r.url)) === r })),
    dropped: ordered.length - kept.length,
  };
}

/** The JSON block for a report; `<` is escaped so no page text can close the script element. */
export function packScript(pack) {
  return `<script type="application/json" id="${PACK_ID}">${JSON.stringify(pack).replace(/</g, "\\u003c")}</script>`;
}

/** The pack inside a report's HTML, or null. */
export function packFromHtml(html) {
  const m = new RegExp(`<script type="application/json" id="${PACK_ID}">([\\s\\S]*?)</script>`).exec(html);
  if (!m) return null;
  try {
    const pack = JSON.parse(m[1]);
    return pack?.schema === PACK_SCHEMA && Array.isArray(pack.runs) ? pack : null;
  } catch {
    return null;
  }
}

/** Runs found in one file: a report (.html), an export, a site export or a pack (.json). */
function runsInFile(path) {
  const text = readFileSync(path, "utf8");
  if (/\.html?$/i.test(path)) {
    const pack = packFromHtml(text);
    return pack ? pack.runs : null;
  }
  const x = JSON.parse(text);
  if (x?.schema === PACK_SCHEMA) return x.runs;
  if (x?.schema === EXPORT_SCHEMA && x.page?.url) return [x];
  if (Array.isArray(x?.pages)) return x.pages.filter((p) => p?.schema === EXPORT_SCHEMA && p.page?.url);
  return null;
}

/**
 * Copies the runs in earlier reports, exports or history folders into this history folder. A run
 * the folder already has is left alone (a full snapshot is never replaced by a compact one).
 * Returns { imported, already, files, unreadable } so the run can say what it took and what not.
 */
export function importHistory(dir, paths) {
  const out = { imported: 0, already: 0, files: 0, unreadable: [] };
  const files = [];
  const walk = (p) => {
    if (!existsSync(p)) {
      out.unreadable.push(p);
      return;
    }
    if (statSync(p).isDirectory()) {
      for (const e of readdirSync(p, { withFileTypes: true })) {
        if (e.name === "node_modules" || e.name.startsWith(".git")) continue;
        const q = join(p, e.name);
        if (e.isDirectory()) walk(q);
        else if (/\.(html?|json)$/i.test(e.name)) files.push(q);
      }
    } else files.push(p);
  };
  for (const p of paths) walk(p);
  for (const f of files) {
    let runs = null;
    try {
      runs = runsInFile(f);
    } catch {
      runs = null;
    }
    if (!runs) {
      // Inside a folder, other files are expected; a file named on its own must be readable.
      if (paths.includes(f)) out.unreadable.push(f);
      continue;
    }
    out.files += 1;
    for (const x of runs) {
      if (!x?.page?.url || !x.createdAt) continue;
      const file = join(pageHistoryDir(dir, x.page.url), snapshotName(x.createdAt));
      if (existsSync(file)) {
        out.already += 1;
        continue;
      }
      saveSnapshot(dir, x);
      out.imported += 1;
    }
  }
  return out;
}

/**
 * Every page in the history, grouped by URL: how many runs, the first and the last, the last run's
 * counts, and the totals in order for a small trend. The current page first, then by last run.
 */
export function historyIndex(dir, current = null, pack = null) {
  const runs = pack ? pack.runs.map((x) => ({ url: x.page.url, createdAt: x.createdAt, export: x })) : loadAllSnapshots(dir).runs;
  const groups = new Map();
  for (const r of runs) {
    const k = urlKey(r.url);
    const g = groups.get(k) ?? { key: k, url: r.url, runs: [] };
    g.runs.push(r);
    groups.set(k, g);
  }
  const currentKey = current ? urlKey(current.page.url) : null;
  const list = [...groups.values()].map((g) => {
    g.runs.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    const last = g.runs[g.runs.length - 1];
    return {
      url: last.url,
      host: (() => {
        try {
          return new URL(last.url).host.toLowerCase();
        } catch {
          return "";
        }
      })(),
      current: g.key === currentKey,
      runs: g.runs.length,
      first: g.runs[0].createdAt,
      last: last.createdAt,
      lastCounts: last.export.refused ? null : last.export.counts ?? null,
      refused: Boolean(last.export.refused),
      trend: g.runs.slice(-12).map((r) => (r.export.refused ? null : r.export.counts?.total ?? null)),
    };
  });
  list.sort((a, b) => (a.current !== b.current ? (a.current ? -1 : 1) : a.last < b.last ? 1 : a.last > b.last ? -1 : 0));
  return { pages: list, sites: new Set(list.map((p) => p.host)).size, runs: runs.length, dropped: pack?.dropped ?? 0 };
}
