// `audit.mjs --codes` and `--explain <code>`: the explanation carries the title, description, fix
// direction, the verbatim quotes, the sources and the rubric; an unknown code exits 2. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CODES } from "../scripts/lib/checks.mjs";
import { EXPLAIN } from "../scripts/lib/explain.mjs";
import { codesText, explainText } from "../scripts/lib/explainCli.mjs";

const AUDIT = fileURLToPath(new URL("../scripts/audit.mjs", import.meta.url));
void CODES;
const run = (...args) => spawnSync(process.execPath, [AUDIT, ...args], { encoding: "utf8" });

test("--codes lists every code with its title", () => {
  const r = run("--codes");
  assert.equal(r.status, 0);
  const lines = r.stdout.trim().split("\n");
  assert.equal(lines.length, Object.keys(CODES).length);
  assert.ok(lines.some((l) => l.startsWith("script_render_blocking") && l.includes(EXPLAIN.script_render_blocking.t[0])));
  assert.ok(codesText("pl").includes(EXPLAIN.hidden_headings.t[2]));
});

test("--explain prints the title, severity, every source and the rubric; --lang switches the words", () => {
  const r = run("--explain", "image_lcp_lazy");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^image_lcp_lazy · /);
  assert.ok(r.stdout.includes(EXPLAIN.image_lcp_lazy.t[0]));
  assert.ok(r.stdout.includes("severity: medium"));
  assert.ok(r.stdout.includes("https://web.dev/articles/lcp-lazy-loading"));
  assert.ok(r.stdout.includes("optimize-image-priority.md"));
  assert.ok(r.stdout.includes("dropWhen image_lcp_lazy:drop-1"));
  assert.ok(r.stdout.includes(EXPLAIN.image_lcp_lazy.d[0]) && r.stdout.includes(EXPLAIN.image_lcp_lazy.x[0]), "description and fix direction");
  assert.ok(r.stdout.includes(EXPLAIN.image_lcp_lazy.r.quote) && r.stdout.includes(EXPLAIN.image_lcp_lazy.also[0].quote), "the quote and the also quote, verbatim");
  const uk = run("--explain", "image_lcp_lazy", "--lang", "uk");
  assert.ok(uk.stdout.includes(EXPLAIN.image_lcp_lazy.t[1]));
  assert.ok(!explainText("noindex", "en").includes("dropWhen"), "no rubric, none shown");
});

test("an unknown code or language exits 2 with a short message", () => {
  const r = run("--explain", "no_such_code");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown code: no_such_code/);
  assert.equal(run("--codes", "--lang", "xx").status, 2);
});
