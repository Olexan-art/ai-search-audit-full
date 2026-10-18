// The command line end to end, offline: audit.mjs saves a snapshot per run (and the same reading
// again rewrites it), shows the drift on the next run, takes --compare, and --no-history saves
// nothing. read.mjs refuses a --delay that would not be polite.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { page, readingOf, section } from "./helpers.mjs";

const AUDIT = fileURLToPath(new URL("../scripts/audit.mjs", import.meta.url));
const READ = fileURLToPath(new URL("../scripts/read.mjs", import.meta.url));

async function writeReading(dir, name, html, at) {
  const r = await readingOf(html);
  r.createdAt = at;
  const file = join(dir, name);
  writeFileSync(file, JSON.stringify(r));
  return file;
}

test("history, drift and compare through the command line", async () => {
  const dir = mkdtempSync(join(tmpdir(), "asa-cli-"));
  const hist = join(dir, "hist");
  const a = await writeReading(dir, "a.json", page({ body: section("Alpha") + section("Beta") }), "2026-10-16T08:00:00.000Z");
  const b = await writeReading(dir, "b.json", page({ omit: ["description"], body: section("Alpha") + section("Gamma") }), "2026-10-17T08:00:00.000Z");
  const run = (...args) => execFileSync(process.execPath, [AUDIT, ...args], { cwd: dir, encoding: "utf8" });
  const o1 = run(a, "--json", join(dir, "a-export.json"), "--html", join(dir, "a.html"), "--history", hist);
  assert.match(o1, /history {3}1 run in .* · first run/);
  run(a, "--json", join(dir, "a-export.json"), "--history", hist);
  const o2 = run(b, "--json", join(dir, "b-export.json"), "--html", join(dir, "b.html"), "--md", join(dir, "b.md"), "--history", hist, "--compare", join(dir, "a-export.json"));
  assert.match(o2, /history {3}2 runs in .* since 2026-10-16T08:00:00.000Z: \d+ changes/);
  assert.match(o2, /compare {3}since 2026-10-16T08:00:00.000Z: \d+ fixed · [1-9]\d* new · \d+ unchanged/);
  const folder = join(hist, "example.org", "page");
  assert.deepEqual(readdirSync(folder).sort(), ["2026-10-16T08-00-00.000Z.json", "2026-10-17T08-00-00.000Z.json"], "the rerun of a.json did not add a run");
  const x = JSON.parse(readFileSync(join(dir, "b-export.json"), "utf8"));
  assert.equal(x.history.total, 2);
  assert.ok(x.history.drift.fields.some((f) => f.field === "description"));
  assert.ok(x.compare.new.some((f) => f.code === "meta_description_missing"));
  const html = readFileSync(join(dir, "b.html"), "utf8");
  assert.ok(html.includes('id="history"') && html.includes('id="compare"'));
  assert.ok(readFileSync(join(dir, "b.md"), "utf8").includes("## History (2 runs"));
  const o3 = run(b, "--json", join(dir, "c.json"), "--history", join(dir, "none"), "--no-history");
  assert.match(o3, /not saved \(--no-history\)/);
  assert.ok(!existsSync(join(dir, "none")));
});

test("--compare refuses a file that is not an export", async () => {
  const dir = mkdtempSync(join(tmpdir(), "asa-cli-"));
  const a = await writeReading(dir, "a.json", page({ body: section("Alpha") }), "2026-10-16T08:00:00.000Z");
  const r = spawnSync(process.execPath, [AUDIT, a, "--json", join(dir, "x.json"), "--no-history", "--compare", a], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /REFUSED .* is not an ai-search-audit export/);
});

test("read.mjs: a site run is polite or it does not start", () => {
  const r = spawnSync(process.execPath, [READ, "--urls", "nowhere.txt", "--delay", "10"], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--delay .* at least 500/);
  const m = spawnSync(process.execPath, [READ, "--urls", "nowhere.txt", "--max", "0"], { encoding: "utf8" });
  assert.equal(m.status, 1);
});

// 2.110: the history outlives the chat, the version and the folder it was made in.
test("a new chat with an empty sandbox takes the whole history back from an earlier report, any page", async () => {
  const dir = mkdtempSync(join(tmpdir(), "asa-cli-"));
  const a = await writeReading(dir, "a.json", page({ body: section("Alpha") + section("Beta") }), "2026-10-16T08:00:00.000Z");
  const other = await readingOf(page({ body: section("Gamma") }));
  other.createdAt = "2026-10-17T08:00:00.000Z";
  other.fetch.finalUrl = "https://another.example/pricing";
  other.vs.page.url = other.fetch.finalUrl;
  const b = join(dir, "b.json");
  writeFileSync(b, JSON.stringify(other));
  const run = (...args) => execFileSync(process.execPath, [AUDIT, ...args], { cwd: dir, encoding: "utf8" });
  // Yesterday, in one sandbox: page A, its history in a folder that is gone today.
  run(a, "--html", join(dir, "yesterday.html"), "--history", join(dir, "sandbox-1"));
  // Today, in a new sandbox: another page on another site, with yesterday's report given back.
  const out = run(b, "--html", join(dir, "today.html"), "--json", join(dir, "today.json"), "--history", join(dir, "sandbox-2"), "--history-from", join(dir, "yesterday.html"));
  assert.match(out, /history {3}from 1 file: 1 run added, 0 already here/);
  assert.match(out, /history {3}2 runs of 2 pages on 2 sites carried in the report/);
  const html = readFileSync(join(dir, "today.html"), "utf8");
  assert.ok(html.includes('id="all-audits"'), "the table of every audit");
  assert.ok(html.includes("example.org") && html.includes("another.example/pricing"), "both addresses, one row each");
  assert.ok(html.includes('<script type="application/json" id="ai-search-audit-history">'), "the report carries its history");
  // Giving the same report twice adds nothing twice.
  const again = run(b, "--html", join(dir, "today2.html"), "--history", join(dir, "sandbox-2"), "--history-from", join(dir, "yesterday.html"), "--history-from", join(dir, "today.html"));
  assert.match(again, /2 runs added|0 runs added|1 run added/);
  assert.match(again, /2 runs of 2 pages on 2 sites/);
});

test("the old default in the working directory is copied in, and the skill's own folder is never the history", async () => {
  const dir = mkdtempSync(join(tmpdir(), "asa-cli-"));
  const a = await writeReading(dir, "a.json", page({ body: section("Alpha") }), "2026-10-16T08:00:00.000Z");
  const b = await writeReading(dir, "b.json", page({ body: section("Alpha") + section("Beta") }), "2026-10-17T08:00:00.000Z");
  const home = join(dir, "home-history");
  const env = { ...process.env, AI_SEARCH_AUDIT_HISTORY: home };
  const run = (...args) => execFileSync(process.execPath, [AUDIT, ...args], { cwd: dir, encoding: "utf8", env });
  // A run of an older version wrote ./.ai-search-audit/history in the working directory.
  run(a, "--json", join(dir, "a.json.out"), "--history", join(dir, ".ai-search-audit", "history"));
  const out = run(b, "--json", join(dir, "b.out.json"));
  assert.match(out, /1 run copied in from/);
  assert.match(out, /history {3}2 runs in /);
  const x = JSON.parse(readFileSync(join(dir, "b.out.json"), "utf8"));
  assert.equal(x.history.total, 2);
  // --history inside the skill's folder (which an update replaces) goes to the user's folder instead.
  const skillDir = fileURLToPath(new URL("..", import.meta.url));
  const moved = run(b, "--json", join(dir, "c.out.json"), "--history", join(skillDir, ".ai-search-audit", "history"));
  assert.match(moved, /is inside the skill's folder, which an update replaces; kept in /);
  assert.ok(!existsSync(join(skillDir, ".ai-search-audit")), "nothing written inside the skill");
});
