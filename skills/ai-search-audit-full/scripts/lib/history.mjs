// History on this machine only: every audit writes its export as a snapshot, and the report reads
// the snapshots of the same page back to draw a timeline (finding counts per run) and to say what
// changed since the run before (drift). Nothing leaves the machine: no server, no upload.
//
//   <dir>/<host>/<path-slug>/<ISO>.json      dir defaults to ./.ai-search-audit/history
//
// The file is named by the reading's date (colons as hyphens, so Windows can store it). Auditing
// the same reading again rewrites the same file, so a rerun never passes for a new run.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { EXPORT_SCHEMA } from "./version.mjs";

export const DEFAULT_HISTORY_DIR = join(".ai-search-audit", "history");
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
