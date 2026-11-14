// The Full layers, for every code the checks can raise: a title, a plain description and a fix
// direction in English and Ukrainian, and "What the rule says" as either a quote from a named
// source with a checked date, or "This skill's rule" with no quote attributed to anyone.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CODES } from "../scripts/lib/checks.mjs";
import { EXPLAIN, explain, foldQuoteText, RULES_CHECKED } from "../scripts/lib/explain.mjs";
import { SOURCES } from "../scripts/lib/rules.mjs";

const RU_ONLY = /[\u044b\u044a\u044d\u0451\u042b\u042a\u042d\u0401]/;
const CYR = /[Ѐ-ӿ]/;

test("every code has an explanation, and every explanation a code", () => {
  for (const code of Object.keys(CODES)) assert.ok(EXPLAIN[code], `no explanation for ${code}`);
  for (const code of Object.keys(EXPLAIN)) assert.ok(CODES[code], `explanation for an unknown code ${code}`);
  assert.throws(() => explain("no_such_code"));
});

test("title, description and fix direction in English, Ukrainian and Polish, with no Russian-only letters", () => {
  for (const [code, e] of Object.entries(EXPLAIN)) {
    for (const k of ["t", "d", "x"]) {
      assert.ok(Array.isArray(e[k]) && e[k].length === 3, `${code}.${k}`);
      const [en, uk, pl] = e[k];
      assert.ok(en.trim() && uk.trim() && pl.trim(), `${code}.${k} empty`);
      assert.ok(!CYR.test(pl), `${code}.${k} Polish holds Cyrillic`);
      assert.ok(!CYR.test(en), `${code}.${k} English holds Cyrillic`);
      assert.ok(CYR.test(uk) || k === "t", `${code}.${k} Ukrainian is not Ukrainian`);
      assert.ok(!RU_ONLY.test(uk), `${code}.${k} holds a Russian-only letter`);
    }
  }
});

test("the plain description gives no advice", () => {
  const ADVICE = /\b(should|must add|add a|add the|make sure|we recommend|fix it|you need to|consider)\b/i;
  for (const [code, e] of Object.entries(EXPLAIN)) assert.ok(!ADVICE.test(e.d[0]), `${code}: the description advises: ${e.d[0]}`);
});

test("every rule is a quote from a known source with a checked date, or this skill's rule", () => {
  let quotes = 0;
  let skill = 0;
  for (const [code, e] of Object.entries(EXPLAIN)) {
    if (e.r.kind === "quote") {
      quotes++;
      assert.ok(SOURCES[e.r.src], `${code}: unknown source ${e.r.src}`);
      assert.ok(SOURCES[e.r.src][1].startsWith("https://"), `${code}: source url`);
      assert.notEqual(e.r.src, "skill", `${code}: a quote cannot be attributed to this skill`);
      assert.match(e.r.checked, /^\d{4}-\d{2}-\d{2}$/, `${code}: checked date`);
      assert.ok(e.r.quote.length >= 20 && e.r.quote.length <= 260, `${code}: a short quote`);
      assert.ok(!CYR.test(e.r.quote), `${code}: the quote is the source's own English`);
      assert.equal(foldQuoteText(e.r.quote), foldQuoteText(foldQuoteText(e.r.quote)), `${code}: quote folds stably`);
    } else {
      skill++;
      assert.equal(e.r.kind, "skill", code);
      const [en, uk] = e.r.text;
      assert.ok(en && uk && !RU_ONLY.test(uk), `${code}: skill rule in both languages`);
      assert.ok(/this skill|PatternScope|Brandscope|Vectorscope|agent/i.test(en), `${code}: says whose rule it is`);
    }
  }
  assert.ok(quotes >= 60, `${quotes} quotes`);
  assert.equal(quotes + skill, Object.keys(CODES).length);
  assert.match(RULES_CHECKED, /^\d{4}-\d{2}-\d{2}$/);
});

test("the quote check folds HTML leftovers the way stripped pages produce them", () => {
  assert.equal(foldQuoteText("in the  <title>  element ."), "in the <title> element.");
  assert.equal(foldQuoteText("rank 1 ( &lt;h1&gt; ), the"), "rank 1 (<h1>), the");
  assert.equal(foldQuoteText("don&#39;t &ldquo;both&rdquo;"), `don't "both"`);
});

test("an also quote is a short English quote from a known source, never this skill, and a modern-web-guidance link is pinned to a commit", () => {
  let n = 0;
  for (const [code, e] of Object.entries(EXPLAIN)) {
    if (e.also === undefined) continue;
    assert.ok(Array.isArray(e.also) && e.also.length, `${code}: also is a list`);
    for (const q of e.also) {
      n++;
      assert.equal(q.kind, "quote", code);
      assert.ok(SOURCES[q.src], `${code}: unknown source ${q.src}`);
      assert.notEqual(q.src, "skill", code);
      assert.notEqual(q.src, e.r.src, `${code}: also repeats the main source`);
      assert.match(q.checked, /^\d{4}-\d{2}-\d{2}$/, code);
      assert.ok(q.quote.length >= 20 && q.quote.length <= 260, `${code}: a short quote`);
      assert.ok(!CYR.test(q.quote), code);
    }
  }
  assert.ok(n >= 5, `${n} also quotes`);
  for (const [key, [name, url]] of Object.entries(SOURCES)) {
    if (!key.startsWith("mwg")) continue;
    assert.match(url, /^https:\/\/github\.com\/GoogleChrome\/modern-web-guidance\/blob\/[0-9a-f]{40}\/skills\/modern-web-guidance\/guides\/[a-z-]+\/[a-z-]+\.md$/, key);
    assert.match(name, /^modern-web-guidance: /, key);
    assert.doesNotMatch(name, /Google Search|Chrome recommends/i, `${key}: not a search rule, not an endorsement`);
  }
});
