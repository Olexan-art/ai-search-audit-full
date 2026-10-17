// Every text and UI colour pair of the report passes WCAG AA in both themes (tools/contrast.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { measure, LITE_PAIRS } from "../tools/contrast.mjs";
import { CSS, CSS_EXTRA } from "../scripts/lib/css.mjs";

test("WCAG AA contrast for every token pair, light and dark", () => {
  const rows = measure(CSS + CSS_EXTRA, LITE_PAIRS);
  assert.ok(rows.length > 100);
  const bad = rows.filter((r) => !r.ok).map((r) => `${r.theme} ${r.fg} on ${r.bg} ${r.ratio}:1 < ${r.need}`);
  assert.deepEqual(bad, []);
});

test("light by default whatever the system prefers; dark only from the toggle or #theme=dark", () => {
  assert.ok(!(CSS + CSS_EXTRA).includes("prefers-color-scheme"));
  assert.match(/:root\{([^}]*)\}/.exec(CSS)[1], /color-scheme:light/);
  assert.match(CSS, /:root\[data-theme="dark"\]\{[^}]*color-scheme:dark/);
});

// The Full layers draw with the same tokens: no colour of their own, every token they use defined
// in both themes, and the pairs they add (labels in faint on the code panels, chips on panels)
// held to AA like the rest.
import { CSS_FULL } from "../scripts/lib/cssFull.mjs";
import { themes } from "../tools/contrast.mjs";

test("the Full layers: AA for their pairs, tokens only, light by default", () => {
  const rows = measure(CSS + CSS_EXTRA + CSS_FULL, [...LITE_PAIRS, ["faint", "bg-2", 4.5], ["muted", "bg-2", 4.5], ["accent", "panel-2", 4.5], ["pin-low", "bg-2", 4.5], ["text", "bg-2", 4.5]]);
  const bad = rows.filter((r) => !r.ok).map((r) => `${r.theme} ${r.fg} on ${r.bg} ${r.ratio}:1 < ${r.need}`);
  assert.deepEqual(bad, []);
  assert.ok(!CSS_FULL.includes("prefers-color-scheme"));
  assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(CSS_FULL), "no colour literals in the Full layers");
  const t = themes(CSS + CSS_EXTRA);
  for (const name of new Set([...CSS_FULL.matchAll(/var\(--([\w-]+)\)/g)].map((m) => m[1]))) {
    const local = CSS_FULL.includes(`--${name}:`);
    assert.ok(local || t.light[name] !== undefined || (CSS + CSS_EXTRA).includes(`--${name}:`), `--${name} in the light theme`);
    assert.ok(local || t.dark[name] !== undefined || (CSS + CSS_EXTRA).includes(`--${name}:`), `--${name} in the dark theme`);
  }
  assert.ok(!/opacity:\s*\.\d/.test(CSS_FULL), "no severity told by a faded colour");
});
