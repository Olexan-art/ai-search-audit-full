// History on this machine and before/after: a snapshot per run under <dir>/<host>/<path>/<ISO>.json,
// rerunning the same reading rewrites the same file, the timeline (capped and saying so), the
// drift (title, description, canonical, h1, words, schema types, bots, hreflang, passages), and
// --compare's fixed / new / unchanged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildModel } from "../scripts/lib/model.mjs";
import { buildExport } from "../scripts/lib/outputs.mjs";
import { renderReport } from "../scripts/lib/report.mjs";
import { compareFindings, drift, history, pageHistoryDir, saveSnapshot, snapshotName, TIMELINE_CAP } from "../scripts/lib/history.mjs";
import { page, readingOf, section } from "./helpers.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "asa-history-"));
async function exportOf(html, at) {
  const r = await readingOf(html);
  r.createdAt = at;
  const m = buildModel(r);
  return { m, x: buildExport(m) };
}
const v1 = page({ title: "The first title of this page", body: section("Alpha") + section("Beta") });
const v2 = page({ title: "A second title for this page", omit: ["description"], head: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"X"}</script>', body: section("Alpha") + section("Gamma") });

test("the snapshot path: host, then the path as a slug, then the ISO date with no colons", () => {
  assert.equal(pageHistoryDir("h", "https://www.Example.org/uk/Vectorscope?x=1"), join("h", "www.example.org", "uk-vectorscope-x-1"));
  assert.equal(pageHistoryDir("h", "https://example.org/"), join("h", "example.org", "root"));
  assert.equal(snapshotName("2026-10-17T09:00:00.000Z"), "2026-10-17T09-00-00.000Z.json");
});

test("every run saves its export; the same reading again rewrites the same file", async () => {
  const dir = tmp();
  const { x } = await exportOf(v1, "2026-10-16T08:00:00.000Z");
  saveSnapshot(dir, x);
  saveSnapshot(dir, x);
  assert.deepEqual(readdirSync(pageHistoryDir(dir, x.page.url)), ["2026-10-16T08-00-00.000Z.json"]);
});

test("the first run has a timeline of one and no drift", async () => {
  const dir = tmp();
  const { x } = await exportOf(v1, "2026-10-16T08:00:00.000Z");
  const h = history(dir, x);
  assert.equal(h.total, 1);
  assert.equal(h.runs[0].current, true);
  assert.equal(h.drift, null);
});

test("drift since the last run: the head, schema types, passages new and lost, findings fixed and new", async () => {
  const dir = tmp();
  const a = await exportOf(v1, "2026-10-16T08:00:00.000Z");
  saveSnapshot(dir, a.x);
  const b = await exportOf(v2, "2026-10-17T08:00:00.000Z");
  const h = history(dir, b.x);
  assert.equal(h.total, 2);
  assert.equal(h.previous.createdAt, "2026-10-16T08:00:00.000Z");
  const fields = h.drift.fields.map((f) => f.field);
  for (const k of ["title", "description", "schemaTypes"]) assert.ok(fields.includes(k), k);
  assert.ok(!fields.includes("h1"));
  assert.ok(h.drift.passages.added >= 1 && h.drift.passages.lost >= 1, "Gamma came, Beta went");
  assert.ok(h.drift.passages.addedItems.some((p) => /Gamma/.test(p.heading || p.head)));
  assert.ok(h.drift.findings.new.some((f) => f.code === "meta_description_missing"));
  assert.ok(h.drift.changed > 0);
  const m = b.m;
  m.history = h;
  const out = renderReport(m);
  assert.ok(out.includes('id="history"') && out.includes('id="timeline"'));
  assert.ok(out.includes("What changed since the last run"));
  assert.ok(out.includes("Nothing is uploaded"));
});

test("bots and hreflang changes are drift too", () => {
  const base = { createdAt: "2026-10-16T00:00:00Z", findings: [], state: { title: "t", description: null, canonical: null, h1: [], wordCount: 10, schemaTypes: [], robots: { status: "ok", bots: { GPTBot: true, ClaudeBot: true } }, hreflang: ["en https://e.org/"], passages: [], saved: false } };
  const now = { ...base, createdAt: "2026-10-17T00:00:00Z", state: { ...base.state, robots: { status: "ok", bots: { GPTBot: false, ClaudeBot: true } }, hreflang: ["en https://e.org/", "uk https://e.org/uk/"] } };
  const d = drift(base, now);
  assert.deepEqual(d.bots, [{ token: "GPTBot", before: true, after: false }]);
  assert.deepEqual(d.hreflang.added, ["uk https://e.org/uk/"]);
  const old = drift({ createdAt: "x", findings: [] }, now);
  assert.equal(old.comparable, false);
  assert.ok(old.notCompared.includes("passages"), "an older snapshot without a state says what it could not compare");
});

test("the timeline is capped at 20 runs and says how many older ones it left out", async () => {
  const dir = tmp();
  const { x } = await exportOf(v1, "2026-10-17T08:00:00.000Z");
  const folder = pageHistoryDir(dir, x.page.url);
  mkdirSync(folder, { recursive: true });
  for (let i = 0; i < TIMELINE_CAP + 4; i++) {
    const at = new Date(Date.UTC(2026, 8, 1 + i)).toISOString();
    writeFileSync(join(folder, snapshotName(at)), JSON.stringify({ ...x, createdAt: at }));
  }
  const h = history(dir, x);
  assert.equal(h.runs.length, TIMELINE_CAP);
  assert.equal(h.total, TIMELINE_CAP + 5);
  assert.equal(h.older, 5);
  assert.equal(h.runs.at(-1).current, true);
});

test("compare: fixed, new and unchanged, matched by finding id", async () => {
  const a = await exportOf(v1, "2026-10-16T08:00:00.000Z");
  const b = await exportOf(v2, "2026-10-17T08:00:00.000Z");
  const c = compareFindings(a.x, b.x);
  assert.equal(c.counts.fixed + c.counts.unchanged, a.x.findings.length);
  assert.equal(c.counts.new + c.counts.unchanged, b.x.findings.length);
  assert.ok(c.new.some((f) => f.code === "meta_description_missing"));
  const self = compareFindings(b.x, b.x);
  assert.deepEqual([self.counts.fixed, self.counts.new], [0, 0]);
  b.m.compare = { before: { createdAt: a.x.createdAt, url: a.x.page.url }, sameUrl: true, ...c };
  const out = renderReport(b.m);
  assert.ok(out.includes('id="compare"') && out.includes("Before and after"));
});

test("a passage changed in place shows where its text changed", async () => {
  const { changedAt } = await import("../scripts/lib/history.mjs");
  const c = changedAt("Plans start at 9 euros a month for one seat.", "Plans start at 12 euros a month for one seat.");
  assert.equal(c.at, 15);
  assert.match(c.before, /9 euros/);
  assert.match(c.after, /12 euros/);
  assert.equal(changedAt(undefined, "x"), null);
});
