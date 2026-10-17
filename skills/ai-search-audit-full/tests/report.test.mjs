// The HTML report: self-contained (a CSP that blocks the network, nothing loaded from outside),
// page text escaped, both languages present, the Full layout's sections in order, and the Full
// layers where they belong: a description and "What the rule says" on every problem, the fix
// direction only inside the collapsed details for specialists. The Markdown and the JSON come
// from the same model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildModel } from "../scripts/lib/model.mjs";
import { renderReport } from "../scripts/lib/report.mjs";
import { buildExport, renderMarkdown } from "../scripts/lib/outputs.mjs";
import { EXPORT_SCHEMA } from "../scripts/lib/version.mjs";
import { explain } from "../scripts/lib/explain.mjs";
import { page, readingOf, section } from "./helpers.mjs";

const EVIL = `<img src=x onerror="alert(1)">`;
const html = page({ title: `Title ${EVIL}`, body: section(`Heading ${EVIL}`) + '<img src="a.png">' + section("Second") });

async function report() {
  const r = await readingOf(html);
  const m = buildModel(r);
  return { r, m, out: renderReport(m) };
}

test("a CSP that blocks every network request, and nothing loaded from outside", async () => {
  const { out } = await report();
  assert.match(out, /<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">/);
  for (const m of out.matchAll(/\ssrc="([^"]*)"/g)) assert.ok(m[1].startsWith("data:"), `src ${m[1].slice(0, 40)}`);
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(out));
  assert.ok(!/<script[^>]+src=/.test(out));
});

test("page text is escaped wherever it appears", async () => {
  const { out } = await report();
  assert.ok(!out.includes(EVIL));
  assert.ok(out.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
});

test("the Full layout: verdict, tiles, map, biggest, charts, all problems, how it was checked, cannot see, footer", async () => {
  const { out } = await report();
  const order = ['id="verdict"', 'id="status"', 'id="page-map"', 'id="biggest"', 'id="lc-severity"', 'id="lc-text"', 'id="lc-bots"', 'id="lc-classic"', 'id="lc-langs"', 'id="all-problems"', 'id="how-checked"', 'id="cannot-see"', 'class="foot"'];
  let at = -1;
  for (const id of order) {
    const i = out.indexOf(id);
    assert.ok(i > at, `${id} out of order`);
    at = i;
  }
  assert.equal((out.match(/<li class="tile /g) || []).length, 6);
  for (const q of ["Shown well in search?", "AI finds it?", "AI reads all of it?", "AI quotes it right?", "AI gets the brand right?", "Languages in order?"]) assert.ok(out.includes(q), q);
  assert.ok(out.includes('id="tile-brand"') && out.includes("no brand.json or reviews.json"), "the brand tile says it was not checked");
  assert.equal((out.match(/id="cg-/g) || []).length, 35);
  assert.ok(out.includes('href="https://www.getlooploop.com"'));
  assert.ok(!out.includes('id="full-link"') && !/Full version from GetLoopLoop|Full report with explanations/.test(out), "no line pointing at a full version");
  assert.ok(!out.includes('id="map-key"'), "the Full map points at All problems instead of a key list");
});

test("every problem has its description and rule; the fix direction sits only inside the closed details", async () => {
  const { m, out } = await report();
  assert.ok(m.findings.length > 3);
  for (const f of m.findings) {
    const row = out.slice(out.indexOf(`<li id="p-${f.id}"`));
    const end = row.indexOf("</li>", row.indexOf("</details>"));
    const li = row.slice(0, end);
    assert.ok(li.includes(explain(f.code).d[0].replace(/'/g, "&#39;").slice(0, 30)) || li.includes(explain(f.code).d[0].slice(0, 30)), `${f.code}: description`);
    assert.ok(li.includes("What the rule says"), `${f.code}: rule`);
    const plain = li.slice(0, li.indexOf('<details class="spec"'));
    assert.ok(!plain.includes("Fix direction"), `${f.code}: no fix direction outside the details`);
    const details = li.slice(li.indexOf('<details class="spec"'));
    assert.ok(/^<details class="spec" id="[^"]+">/.test(details), `${f.code}: details closed by default`);
    assert.ok(details.includes("Fix direction"), `${f.code}: fix direction in the details`);
  }
  // Outside the details for specialists, the words of the fix directions never appear.
  const stripped = out.replace(/<details class="spec"[\s\S]*?<\/details>/g, "");
  assert.ok(!stripped.includes("Fix direction · for specialists"));
  for (const f of m.findings) assert.ok(!stripped.includes(explain(f.code).x[0].slice(0, 40)), `${f.code}: fix text leaked`);
});

test("both languages are in the file", async () => {
  const { out } = await report();
  assert.ok(out.includes('class="l-uk" lang="uk"'));
  for (const t of ["Мапа сторінки", "Що каже правило", "Подробиці для фахівців", "Усі проблеми"]) assert.ok(out.includes(t), t);
});

test("the export: the schema id, every finding with its rules and Full layers, the same pins as the report", async () => {
  const { m, out } = await report();
  const x = buildExport(m);
  assert.equal(x.schema, EXPORT_SCHEMA);
  assert.equal(x.edition, "full");
  assert.equal(x.findings.length, m.findings.length);
  for (const f of x.findings) {
    assert.ok(f.rules.length && f.rules.every((s) => s.url.startsWith("https://")), f.code);
    assert.ok(f.label.en && f.label.uk, f.code);
    assert.ok(f.explanation.description.en && f.explanation.description.uk, f.code);
    assert.ok(f.explanation.fixDirection.en && f.explanation.fixDirection.uk, f.code);
    assert.ok(["quote", "skill"].includes(f.explanation.rule.kind), f.code);
  }
  assert.ok(x.state && Array.isArray(x.state.passages), "the page state the drift compares");
  for (const f of m.findings) assert.ok(out.includes(`id="${f.big ? "big" : "p"}-${f.id}"`), f.id);
  const md = renderMarkdown(m);
  assert.ok(md.startsWith("# AI Search Audit Full: https://example.org/page"));
  for (const f of m.findings) assert.ok(md.includes(`\`${f.code}\``), f.code);
  assert.ok(md.includes("What the rule says") && md.includes("Fix direction, for specialists"));
});

test("light by default whatever the system prefers; dark only from the toggle or #theme=dark", async () => {
  const { out } = await report();
  assert.ok(!out.includes("prefers-color-scheme"), "the system preference does not pick the theme");
  assert.match(/:root\{([^}]*)\}/.exec(out)[1], /color-scheme:light/);
  assert.match(out, /:root\[data-theme="dark"\]\{[^}]*color-scheme:dark/);
  assert.ok(out.includes("theme=(dark|light)"), "#theme= still works");
  assert.match(out, /data-set-theme="dark" aria-pressed="false"/);
  assert.match(out, /data-set-theme="light" aria-pressed="true"/);
  assert.match(out, /prefers-reduced-motion:reduce/);
  assert.match(out, /:focus-visible/);
});

test("severity carries a shape and a word, not colour alone", async () => {
  const { out } = await report();
  // Every marker in a key, a chip or a bar row is a severity shape, and a severity word sits beside it.
  const pins = [...out.matchAll(/<svg class="pi pin (blocking|high|medium|low)"[^>]*>(<polygon|<circle|<rect)/g)];
  assert.ok(pins.length > 0);
  for (const m of out.matchAll(/<li class="bchip (\w+)"[\s\S]*?<\/li>/g)) assert.match(m[0], /class="sevw /, m[0].slice(0, 60));
});
